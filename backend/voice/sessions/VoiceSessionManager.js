'use strict';

const WebSocket = require('ws');

class VoiceSessionManager {
  constructor() {
    this._sessions = new Map(); // callSid -> VoiceWorkerSession
    this._shuttingDown = false;
  }

  get isShuttingDown() {
    return this._shuttingDown;
  }

  setShuttingDown() {
    this._shuttingDown = true;
  }

  registerSession(callSid, session) {
    if (this._sessions.has(callSid)) {
      return true;
    }
    this._sessions.set(callSid, session);
    return false;
  }

  getSession(callSid) {
    return this._sessions.get(callSid);
  }

  unregisterSession(callSid) {
    this._sessions.delete(callSid);
  }

  get activeCount() {
    return this._sessions.size;
  }

  getAllSessions() {
    return Array.from(this._sessions.values());
  }

  /**
   * Gracefully terminate all active call sessions and wait for them to finish saving state.
   */
  async shutdownAll(timeoutMs = 10000) {
    this._shuttingDown = true;
    const activeCount = this.activeCount;
    if (activeCount === 0) {
      console.log('[VoiceSessionManager] No active call sessions to shut down.');
      return;
    }

    console.log(`[VoiceSessionManager] Gracefully shutting down ${activeCount} active call session(s)...`);

    const endPromises = this.getAllSessions().map(async (session) => {
      try {
        console.log(`[VoiceSessionManager] Terminating session: ${session.callSid}`);
        await session.end('server_shutdown');
      } catch (err) {
        console.error(`[VoiceSessionManager] Error terminating session ${session.callSid}:`, err.message);
      }
    });

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.warn(`[VoiceSessionManager] Graceful shutdown timed out after ${timeoutMs}ms. Forcing exit.`);
        resolve();
      }, timeoutMs);
    });

    await Promise.race([Promise.all(endPromises), timeoutPromise]);
    console.log('[VoiceSessionManager] All active sessions terminated or timed out.');
  }
}

// Singleton instance
module.exports = new VoiceSessionManager();
