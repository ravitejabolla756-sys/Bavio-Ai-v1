'use strict';

const ACTION_TYPE = 'bavio.lead.create';

function safeError(error) {
  const code = typeof error?.code === 'string' && /^[A-Z0-9_:-]{1,80}$/i.test(error.code) ? error.code : 'LEAD_CREATE_FAILED';
  const knownMessages = new Set([
    'A lead phone number is required.',
    'Tenant resolution is required.',
    'Transactional database access is unavailable.',
  ]);
  const message = knownMessages.has(error?.message) ? error.message : 'Lead creation failed.';
  return { code, message };
}

function normalizeIdempotencyKey(value) {
  if (typeof value !== 'string') {
    throw Object.assign(new Error('A lead idempotency key is required.'), { code: 'LEAD_IDEMPOTENCY_KEY_REQUIRED' });
  }
  const key = value.trim();
  if (!key || key.length > 255 || /[\u0000-\u001f\u007f]/.test(key)) {
    throw Object.assign(new Error('Lead idempotency key is invalid.'), { code: 'LEAD_IDEMPOTENCY_KEY_INVALID' });
  }
  return key;
}

function validateLead(lead) {
  const text = (field, max) => {
    if (lead[field] == null) return null;
    if (typeof lead[field] !== 'string' || lead[field].length > max) {
      throw Object.assign(new Error('Lead input is invalid.'), { code: 'LEAD_INPUT_INVALID' });
    }
    return lead[field].trim() || null;
  };
  const phone = text('phone', 64);
  if (!phone) throw Object.assign(new Error('A lead phone number is required.'), { code: 'LEAD_INPUT_INVALID' });
  const status = text('status', 32) || 'new';
  if (!['new', 'contacted', 'qualified', 'converted', 'lost'].includes(status)) {
    throw Object.assign(new Error('Lead input is invalid.'), { code: 'LEAD_INPUT_INVALID' });
  }
  return { phone, name: text('name', 255), intent: text('intent', 255), budget: text('budget', 255), location: text('location', 255), notes: text('notes', 50000), status };
}

/**
 * Persists the internal Create Bavio Lead action, its lead, and its evidence
 * in one transaction. Tenant identity is an argument resolved by the caller,
 * never accepted from model/tool payload fields.
 */
async function createBavioLead({ db, businessId, idempotencyKey, lead, sourceType, sourceId, conversationId = null }) {
  if (!db?.pool?.connect) throw Object.assign(new Error('Transactional database access is unavailable.'), { code: 'DB_TRANSACTION_UNAVAILABLE' });
  if (typeof businessId !== 'string' || !businessId) throw Object.assign(new Error('Tenant resolution is required.'), { code: 'TENANT_REQUIRED' });
  const stableKey = normalizeIdempotencyKey(idempotencyKey);
  if (!lead || typeof lead !== 'object') throw Object.assign(new Error('A lead phone number is required.'), { code: 'LEAD_INPUT_INVALID' });
  const validatedLead = validateLead(lead);

  const client = await db.pool.connect();
  let executionId = null;
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      `SELECT id, status, lead_id, completed_at, error_code, error_message
       FROM action_executions
       WHERE business_id = $1 AND action_type = $2 AND idempotency_key = $3
       FOR UPDATE`,
      [businessId, ACTION_TYPE, stableKey]
    );
    if (existing.rows.length === 1) {
      const prior = existing.rows[0];
      await client.query('COMMIT');
      if (prior.status === 'succeeded') {
        return {
          executionId: prior.id,
          leadId: prior.lead_id ? String(prior.lead_id) : null,
          actionType: ACTION_TYPE,
          status: 'succeeded',
          duplicate: true,
          evidence: prior.lead_id ? { type: 'internal_record', entity: 'lead', recordId: String(prior.lead_id) } : null,
        };
      }
      const failure = new Error(prior.error_message || 'Lead creation failed.');
      failure.code = prior.error_code || 'LEAD_CREATE_FAILED';
      failure.executionId = prior.id;
      failure.duplicate = true;
      throw failure;
    }
    const execution = await client.query(
      `INSERT INTO action_executions (business_id, action_type, status, source_type, source_id, conversation_id, idempotency_key, started_at)
       VALUES ($1, $2, 'started', $3, $4, $5, $6, NOW()) RETURNING id`,
      [businessId, ACTION_TYPE, sourceType || 'internal_system', sourceId || null, conversationId, stableKey]
    );
    executionId = execution.rows[0].id;
    const inserted = await client.query(
      `INSERT INTO leads (business_id, client_id, call_id, phone, name, intent, budget, location, notes, status, created_at)
       VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING id, created_at`,
      [businessId, conversationId, validatedLead.phone, validatedLead.name, validatedLead.intent, validatedLead.budget, validatedLead.location, validatedLead.notes, validatedLead.status]
    );
    const record = inserted.rows[0];
    await client.query(
      `INSERT INTO execution_evidence (execution_id, business_id, evidence_type, entity_type, record_id, recorded_at)
       VALUES ($1, $2, 'internal_record', 'lead', $3, NOW())`,
      [executionId, businessId, String(record.id)]
    );
    await client.query(
      `UPDATE action_executions SET status = 'succeeded', lead_id = $2, completed_at = NOW()
       WHERE id = $1 AND business_id = $3`,
      [executionId, record.id, businessId]
    );
    await client.query('COMMIT');
    return { executionId, leadId: String(record.id), createdAt: record.created_at, actionType: ACTION_TYPE, status: 'succeeded', evidence: { type: 'internal_record', entity: 'lead', recordId: String(record.id) } };
  } catch (caughtError) {
    await client.query('ROLLBACK').catch(() => {});
    if (caughtError?.code === '23505') {
      const concurrent = await db.query(
        `SELECT id, status, lead_id, error_code, error_message
         FROM action_executions
         WHERE business_id = $1 AND action_type = $2 AND idempotency_key = $3`,
        [businessId, ACTION_TYPE, stableKey]
      );
      if (concurrent.rows.length === 1 && (concurrent.rows[0].status === 'succeeded' || concurrent.rows[0].status === 'failed')) {
        const prior = concurrent.rows[0];
        if (prior.status === 'succeeded') {
          return {
            executionId: prior.id,
            leadId: prior.lead_id ? String(prior.lead_id) : null,
            actionType: ACTION_TYPE,
            status: 'succeeded',
            duplicate: true,
            evidence: prior.lead_id ? { type: 'internal_record', entity: 'lead', recordId: String(prior.lead_id) } : null,
          };
        }
        const duplicateFailure = new Error(prior.error_message || 'Lead creation failed.');
        duplicateFailure.code = prior.error_code || 'LEAD_CREATE_FAILED';
        duplicateFailure.executionId = prior.id;
        duplicateFailure.duplicate = true;
        throw duplicateFailure;
      }
    }
    const safe = safeError(caughtError);
    try {
      const failed = await db.query(
        `INSERT INTO action_executions (business_id, action_type, status, source_type, source_id, conversation_id, idempotency_key, started_at, completed_at, error_code, error_message)
         VALUES ($1, $2, 'failed', $3, $4, $5, $6, NOW(), NOW(), $7, $8)
         ON CONFLICT (business_id, action_type, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
         RETURNING id`,
        [businessId, ACTION_TYPE, sourceType || 'internal_system', sourceId || null, conversationId, stableKey, safe.code, safe.message]
      );
      executionId = failed.rows[0]?.id || executionId;
      if (!executionId) {
        const existingFailure = await db.query(
          `SELECT id FROM action_executions WHERE business_id = $1 AND action_type = $2 AND idempotency_key = $3`,
          [businessId, ACTION_TYPE, stableKey]
        );
        executionId = existingFailure.rows[0]?.id || executionId;
      }
    } catch (recordError) {
      console.error('[ACTION] Failed to persist failure state:', { code: recordError.code || 'ACTION_FAILURE_RECORD_FAILED' });
    }
    const failure = new Error(safe.message);
    failure.code = safe.code;
    failure.executionId = executionId;
    throw failure;
  } finally {
    client.release();
  }
}

module.exports = { ACTION_TYPE, createBavioLead, normalizeIdempotencyKey, safeError };
