'use strict';

/**
 * CurrentTwilioTelephony — Telephony adapter for the current_openai stack
 *
 * Wraps the Twilio Media Streams WebSocket in the TelephonyProvider interface.
 * Replicates the streaming logic from routes/callStream.js as a class so
 * it can be shared or replaced without touching callStream.js.
 *
 * Audio format: G.711 mu-law 8 kHz mono, delivered in 160-byte / 20 ms packets.
 */

const WebSocket            = require('ws');
const TelephonyProvider    = require('../interfaces/TelephonyProvider');

const PACKET_SIZE_BYTES    = 160;  // 20 ms @ 8 kHz mu-law
const PACKET_INTERVAL_MS   = 20;

class CurrentTwilioTelephony extends TelephonyProvider {
  constructor() {
    super('CurrentTwilioTelephony');
    this._ws             = null;
    this._streamSid      = null;
    this._callSid        = null;
    this._playInterval   = null;
    this._playQueue      = [];
    this._isSpeaking     = false;
  }

  // ── TelephonyProvider implementation ──────────────────────────────────────

  async startMediaSession({ ws, callSid, streamSid }) {
    this._ws        = ws;
    this._callSid   = callSid;
    this._streamSid = streamSid;
  }

  sendAudio(audioBuffer) {
    // Clear any existing playback and re-queue
    if (this._playInterval) {
      clearInterval(this._playInterval);
      this._playInterval = null;
    }
    this._playQueue = [];

    for (let offset = 0; offset < audioBuffer.length; offset += PACKET_SIZE_BYTES) {
      this._playQueue.push(audioBuffer.slice(offset, offset + PACKET_SIZE_BYTES));
    }

    this._isSpeaking = true;
    let idx = 0;

    this._playInterval = setInterval(() => {
      if (idx >= this._playQueue.length) {
        clearInterval(this._playInterval);
        this._playInterval = null;
        this._isSpeaking   = false;
        return;
      }

      if (this._ws && this._ws.readyState === WebSocket.OPEN) {
        this._ws.send(JSON.stringify({
          event    : 'media',
          streamSid: this._streamSid,
          media    : { payload: this._playQueue[idx].toString('base64') },
        }));
      }
      idx++;
    }, PACKET_INTERVAL_MS);
  }

  clearAudio() {
    if (this._isSpeaking) {
      if (this._playInterval) {
        clearInterval(this._playInterval);
        this._playInterval = null;
      }
      this._playQueue  = [];
      this._isSpeaking = false;

      if (this._ws && this._ws.readyState === WebSocket.OPEN && this._streamSid) {
        this._ws.send(JSON.stringify({ event: 'clear', streamSid: this._streamSid }));
      }
    }
  }

  async terminateCall(reason = 'requested') {
    try {
      const twilioProvider = require('../../../providers/twilio');
      await twilioProvider.client.calls(this._callSid).update({ status: 'completed' });
      console.log(`[CurrentTwilioTelephony] Call ${this._callSid} terminated. Reason: ${reason}`);
    } catch (err) {
      console.error(`[CurrentTwilioTelephony] terminateCall error: ${err.message}`);
    }
  }

  async close() {
    this.clearAudio();
    this._ws = null;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  get isSpeaking() { return this._isSpeaking; }

  /** Allow callStream.js to update streamSid after the 'start' event */
  setStreamSid(streamSid) {
    this._streamSid = streamSid;
  }
}

module.exports = CurrentTwilioTelephony;
