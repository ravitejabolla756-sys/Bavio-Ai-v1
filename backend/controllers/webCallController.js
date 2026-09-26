'use strict';

const db = require('../database/db');
const { webCallSessionManager, logWebCallEvent, calculatePercentiles } = require('../services/webCallSessionManager');
const crypto = require('crypto');

// Secret for signing short-lived WebCall session tokens
const SESSION_SECRET = process.env.JWT_SECRET || 'bavio_webcall_session_secret_2026';

function signSessionToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  if (expected !== sig) return null;
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * POST /api/webcall/session
 * Initiates a new WebCall session with an agent.
 */
async function initiateWebCallSession(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized', message: 'Authentication required to start a WebCall.' });
    }

    const businessId = req.user.business_id || userId;
    const {
      agentId,
      browser = 'Unknown Browser',
      browserVersion,
      os = 'Unknown OS',
      deviceType = 'desktop',
      clientMetadata = {}
    } = req.body || {};

    if (!agentId) {
      return res.status(400).json({ error: 'missing_agent_id', message: 'Agent ID is required.' });
    }

    // 1. Resolve agent & verify workspace ownership (Phase 18)
    const astRes = await db.query(
      `SELECT a.*, p.phone_number as assigned_phone_number
       FROM assistants a
       LEFT JOIN phone_numbers p ON p.assistant_id = a.id AND p.is_active = true
       WHERE a.id = $1 AND (a.business_id = $2 OR a.client_id = $2)
       LIMIT 1`,
      [agentId, businessId]
    );

    if (astRes.rows.length === 0) {
      return res.status(404).json({
        error: 'agent_not_found',
        message: 'The requested agent was not found in your workspace.'
      });
    }

    const assistant = astRes.rows[0];

    // 2. Validate agent readiness
    if (!assistant.name || !assistant.name.trim()) {
      return res.status(400).json({ error: 'missing_name', message: 'Agent name is required before starting a call.' });
    }
    if (!assistant.system_prompt || !assistant.system_prompt.trim()) {
      return res.status(400).json({ error: 'missing_instructions', message: 'Agent instructions are required.' });
    }
    const voice = assistant.voice_id || assistant.voice || 'alloy';
    const language = assistant.language || 'en-US';

    // 3. Idempotency & Active Session check (Phase 22)
    const activeCheck = await db.query(
      `SELECT call_sid, status, created_at
       FROM webcall_sessions
       WHERE agent_id = $1 AND business_id = $2 AND status IN ('requested', 'connecting', 'in_progress')
         AND created_at > NOW() - INTERVAL '5 minutes'
       LIMIT 1`,
      [agentId, businessId]
    );

    if (activeCheck.rows.length > 0) {
      const existing = activeCheck.rows[0];
      const token = signSessionToken({ callSid: existing.call_sid, businessId, agentId });
      return res.status(200).json({
        success: true,
        duplicate: true,
        callSid: existing.call_sid,
        sessionToken: token,
        status: existing.status,
        message: 'Reconnected to existing active WebCall session.'
      });
    }

    // 4. Generate stable unique identifiers (Phase 2)
    const callSid = `webcall_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // 5. Insert into canonical calls table (Phase 2 & Phase 17)
    const callInsert = await db.query(
      `INSERT INTO calls (
         user_id, business_id, client_id, assistant_id, country_code,
         call_sid, provider, from_number, virtual_number, caller_number,
         status, call_status, cost_currency, is_test, created_at, started_at
       ) VALUES (
         $1, $1, $1, $2, 'US',
         $3, 'webcall', 'Browser Client', 'WebCall', 'Browser Client',
         'started', 'connecting', 'USD', false, NOW(), NOW()
       ) RETURNING id`,
      [businessId, agentId, callSid]
    );

    const callDbId = callInsert.rows[0]?.id;

    // 6. Insert into webcall_sessions table (Phase 2)
    const sessionInsert = await db.query(
      `INSERT INTO webcall_sessions (
         call_sid, call_id, business_id, agent_id, user_id,
         session_type, transport, status, started_at,
         browser, browser_version, os, device_type,
         language, voice,
         agent_config_snapshot, created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5,
         'webcall', 'webrtc', 'requested', NOW(),
         $6, $7, $8, $9,
         $10, $11,
         $12, NOW(), NOW()
       ) RETURNING *`,
      [
        callSid, callDbId, businessId, agentId, userId,
        browser, browserVersion || null, os, deviceType,
        language, voice,
        JSON.stringify({
          name: assistant.name,
          language,
          voice,
          system_prompt: assistant.system_prompt,
          first_message: assistant.first_message || assistant.welcome_message
        })
      ]
    );

    const sessionRow = sessionInsert.rows[0];

    // 7. Register session in active session manager
    webCallSessionManager.registerSession(callSid, {
      sessionId: sessionRow.id,
      businessId,
      agentId,
      assistant: {
        id: agentId,
        name: assistant.name,
        system_prompt: assistant.system_prompt,
        voice,
        language,
        first_message: assistant.first_message || assistant.welcome_message
      }
    });

    // 8. Log initial lifecycle event (Phase 14)
    await logWebCallEvent({
      sessionId: sessionRow.id,
      businessId,
      callSid,
      eventType: 'session_created',
      metadata: { browser, os, deviceType, ...clientMetadata }
    });

    // 9. Sign session token for WebSocket authentication
    const sessionToken = signSessionToken({ callSid, businessId, agentId });

    // Determine WebSocket URL
    const wsProtocol = req.protocol === 'https' ? 'wss:' : 'ws:';
    const host = req.get('host') || 'localhost:5000';
    const wsUrl = `${wsProtocol}//${host}/api/webcall/stream?callSid=${callSid}&token=${sessionToken}`;

    return res.status(201).json({
      success: true,
      callSid,
      sessionId: sessionRow.id,
      sessionToken,
      wsUrl,
      agent: {
        id: agentId,
        name: assistant.name,
        voice,
        language,
        firstMessage: assistant.first_message || assistant.welcome_message
      }
    });
  } catch (err) {
    console.error('[WEBCALL SESSION] Initiation error:', err);
    return res.status(500).json({ error: 'internal_error', message: 'Failed to initiate WebCall session.' });
  }
}

/**
 * POST /api/webcall/:callSid/telemetry
 * Records client-side telemetry (microphone permissions, audio metrics, WebRTC stats).
 */
async function recordClientTelemetry(req, res) {
  try {
    const { callSid } = req.params;
    const { events = [], networkMetrics, error } = req.body || {};

    const sessionRes = await db.query(
      "SELECT id, business_id FROM webcall_sessions WHERE call_sid = $1",
      [callSid]
    );

    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ error: 'session_not_found', message: 'WebCall session not found.' });
    }

    const { id: sessionId, business_id: businessId } = sessionRes.rows[0];

    // Ingest events
    for (const evt of events) {
      await logWebCallEvent({
        sessionId,
        businessId,
        callSid,
        turnId: evt.turnId || null,
        eventType: evt.type || evt.eventType,
        occurredAt: evt.occurredAt ? new Date(evt.occurredAt) : new Date(),
        durationMs: evt.durationMs || null,
        metadata: evt.metadata || {}
      });
    }

    // Ingest network metrics (Phase 8)
    if (networkMetrics) {
      await db.query(
        `INSERT INTO webcall_network_metrics (
           session_id, business_id, call_sid, recorded_at, round_trip_time_ms,
           jitter_ms, packet_loss_percent, packets_sent, packets_received, packets_lost,
           audio_level, audio_bytes_sent, audio_bytes_received, metadata
         ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          sessionId, businessId, callSid,
          networkMetrics.rttMs || null, networkMetrics.jitterMs || null, networkMetrics.packetLossPercent || 0,
          networkMetrics.packetsSent || null, networkMetrics.packetsReceived || null, networkMetrics.packetsLost || null,
          networkMetrics.audioLevel || null, networkMetrics.audioBytesSent || null, networkMetrics.audioBytesReceived || null,
          JSON.stringify(networkMetrics.metadata || {})
        ]
      );
    }

    // Ingest client error (Phase 15)
    if (error) {
      await db.query(
        `UPDATE webcall_sessions SET
           error_count = error_count + 1,
           last_error_code = $1,
           last_error_stage = $2,
           failure_reason = $3,
           updated_at = NOW()
         WHERE id = $4`,
        [error.code || 'client_error', error.stage || 'frontend', error.message || 'Client error reported', sessionId]
      );
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[WEBCALL TELEMETRY] Ingest error:', err.message);
    return res.status(500).json({ error: 'internal_error', message: 'Failed to record telemetry.' });
  }
}

/**
 * POST /api/webcall/:callSid/end
 * Gracefully finalizes a WebCall session.
 */
async function endWebCallSession(req, res) {
  try {
    const { callSid } = req.params;
    const { reason = 'user_hangup' } = req.body || {};

    const result = await webCallSessionManager.finalizeSession(callSid, reason);
    if (!result) {
      return res.status(404).json({ error: 'session_not_found', message: 'WebCall session not found.' });
    }

    return res.status(200).json({
      success: true,
      callSid,
      durationMs: result.durationMs,
      durationSeconds: result.durationSeconds,
      userTurnCount: result.userTurnCount,
      turnsCount: result.turnsCount,
      userSpeechTotalMs: result.userSpeechTotalMs,
      assistantSpeechTotalMs: result.assistantSpeechTotalMs,
      interruptionsCount: result.interruptionsCount,
      avgLatencyMs: result.avgLatencyMs,
      p95LatencyMs: result.p95LatencyMs,
      percentiles: result.percentiles
    });
  } catch (err) {
    console.error('[WEBCALL END] Error:', err);
    return res.status(500).json({ error: 'internal_error', message: 'Failed to finalize WebCall session.' });
  }
}

/**
 * GET /api/webcall/:callSid
 * Returns detailed telemetry, turns, event timeline, and network metrics for a session.
 */
async function getWebCallSessionDetails(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized', message: 'Authentication required.' });
    }
    const businessId = req.user.business_id || userId;
    const { callSid } = req.params;

    // 1. Fetch session ensuring workspace isolation (Phase 18)
    const sessionRes = await db.query(
      `SELECT s.*, a.name as assistant_name
       FROM webcall_sessions s
       LEFT JOIN assistants a ON a.id = s.agent_id
       WHERE s.call_sid = $1 AND s.business_id = $2`,
      [callSid, businessId]
    );

    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ error: 'session_not_found', message: 'Session not found in current workspace.' });
    }

    const session = sessionRes.rows[0];

    // 2. Fetch turns (Phase 5)
    const turnsRes = await db.query(
      `SELECT * FROM webcall_turns WHERE session_id = $1 ORDER BY turn_number ASC`,
      [session.id]
    );

    // 3. Fetch event stream timeline (Phase 14 & Phase 20)
    const eventsRes = await db.query(
      `SELECT * FROM webcall_events WHERE session_id = $1 ORDER BY occurred_at ASC`,
      [session.id]
    );

    // 4. Fetch network samples (Phase 8)
    const netRes = await db.query(
      `SELECT * FROM webcall_network_metrics WHERE session_id = $1 ORDER BY recorded_at ASC`,
      [session.id]
    );

    // 5. Calculate real percentiles (Phase 6)
    const latencies = turnsRes.rows.map(t => t.time_to_first_ai_audio_ms).filter(v => v !== null && v !== undefined);
    const percentiles = calculatePercentiles(latencies);

    return res.status(200).json({
      success: true,
      session,
      turns: turnsRes.rows,
      events: eventsRes.rows,
      networkMetrics: netRes.rows,
      percentiles
    });
  } catch (err) {
    console.error('[WEBCALL DETAILS] Error:', err);
    return res.status(500).json({ error: 'internal_error', message: 'Failed to retrieve session details.' });
  }
}

/**
 * GET /api/webcall/sessions
 * List historical WebCall sessions for workspace with filters (Phase 20).
 */
async function listWebCallSessions(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized', message: 'Authentication required.' });
    }
    const businessId = req.user.business_id || userId;
    const { agentId, status, limit = 25, offset = 0 } = req.query;

    const conditions = ['s.business_id = $1'];
    const params = [businessId];

    if (agentId) {
      params.push(agentId);
      conditions.push(`s.agent_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`s.status = $${params.length}`);
    }

    params.push(Math.min(100, Math.max(1, parseInt(limit, 10) || 25)));
    const limitIdx = params.length;
    params.push(Math.max(0, parseInt(offset, 10) || 0));
    const offsetIdx = params.length;

    const listRes = await db.query(
      `SELECT s.id, s.call_sid, s.agent_id, a.name as assistant_name, s.status,
              s.started_at, s.ended_at, s.duration_ms, s.end_reason,
              s.user_speech_duration_ms, s.assistant_speech_duration_ms, s.user_turn_count,
              s.avg_latency_ms, s.p50_latency_ms, s.p95_latency_ms,
              s.interruption_count, s.error_count, s.created_at
       FROM webcall_sessions s
       LEFT JOIN assistants a ON a.id = s.agent_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY s.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );

    return res.status(200).json({
      success: true,
      sessions: listRes.rows,
      limit: parseInt(limit, 10) || 25,
      offset: parseInt(offset, 10) || 0
    });
  } catch (err) {
    console.error('[WEBCALL LIST] Error:', err);
    return res.status(500).json({ error: 'internal_error', message: 'Failed to list WebCall sessions.' });
  }
}

module.exports = {
  initiateWebCallSession,
  recordClientTelemetry,
  endWebCallSession,
  getWebCallSessionDetails,
  listWebCallSessions,
  signSessionToken,
  verifySessionToken
};
