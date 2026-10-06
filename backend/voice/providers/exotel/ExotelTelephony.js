'use strict';

const TelephonyProvider = require('../interfaces/TelephonyProvider');
const axios = require('axios');

/**
 * ExotelTelephony — TelephonyProvider implementation for Exotel Indian Voice Infrastructure
 * 
 * Supports:
 * - Realtime WebSocket audio streaming for Indian carrier calls
 * - G.711 mu-law 8kHz mono audio chunks (20ms packet framing)
 * - Programmatic barge-in clear commands
 * - Call termination via Exotel REST API
 */
class ExotelTelephony extends TelephonyProvider {
  constructor(opts = {}) {
    super('ExotelTelephony');
    this.apiKey = opts.apiKey || process.env.EXOTEL_API_KEY;
    this.apiToken = opts.apiToken || process.env.EXOTEL_API_TOKEN;
    this.subdomain = opts.subdomain || process.env.EXOTEL_SUBDOMAIN || 'api.exotel.com';
    this.sid = opts.accountSid || process.env.EXOTEL_ACCOUNT_SID;
    this._ws = null;
    this._callSid = null;
    this._streamSid = null;
    this._isConnected = false;
  }

  async startMediaSession(opts = {}) {
    this._ws = opts.ws;
    this._callSid = opts.callSid;
    this._streamSid = opts.streamSid || `exotel_stream_${Date.now()}`;
    this._isConnected = true;

    if (this._ws) {
      this._ws.on('message', (message) => {
        try {
          const msg = typeof message === 'string' ? JSON.parse(message) : JSON.parse(message.toString());
          if (msg.event === 'media' && msg.media?.payload) {
            const audioBuffer = Buffer.from(msg.media.payload, 'base64');
            this._emitAudioChunk(audioBuffer);
          } else if (msg.event === 'stop') {
            this._emitCallEnd();
          }
        } catch (err) {
          // Binary audio packet handling
          if (Buffer.isBuffer(message)) {
            this._emitAudioChunk(message);
          }
        }
      });

      this._ws.on('close', () => {
        this._isConnected = false;
        this._emitCallEnd();
      });

      this._ws.on('error', (err) => {
        console.error(`[ExotelTelephony] WebSocket error: ${err.message}`);
      });
    }

    console.log(`[ExotelTelephony] Media session started for callSid=${this._callSid}`);
  }

  sendAudio(audioBuffer) {
    if (!this._isConnected || !audioBuffer || audioBuffer.length === 0) return;

    if (this._ws && this._ws.readyState === 1) { // WebSocket.OPEN
      // Frame audio into 160-byte (20ms at 8kHz) chunks for smooth jitter-free playback
      const CHUNK_SIZE = 160;
      for (let offset = 0; offset < audioBuffer.length; offset += CHUNK_SIZE) {
        const chunk = audioBuffer.slice(offset, offset + CHUNK_SIZE);
        const payload = {
          event: 'media',
          streamSid: this._streamSid,
          media: {
            payload: chunk.toString('base64')
          }
        };
        this._ws.send(JSON.stringify(payload));
      }
    }
  }

  clearAudio() {
    if (this._ws && this._ws.readyState === 1) {
      console.log(`[ExotelTelephony] Sending clear audio command (barge-in) for stream ${this._streamSid}`);
      this._ws.send(JSON.stringify({
        event: 'clear',
        streamSid: this._streamSid
      }));
    }
  }

  async terminateCall(reason = 'completed') {
    console.log(`[ExotelTelephony] Terminating call ${this._callSid}, reason: ${reason}`);
    this.clearAudio();
    if (this.apiKey && this.apiToken && this.sid && this._callSid) {
      try {
        const auth = Buffer.from(`${this.apiKey}:${this.apiToken}`).toString('base64');
        await axios.post(
          `https://${this.subdomain}/v1/Accounts/${this.sid}/Calls/${this._callSid}.json`,
          { Status: 'completed' },
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 5000
          }
        );
      } catch (err) {
        console.warn(`[ExotelTelephony] HTTP terminate failed: ${err.message}`);
      }
    }
    this.close();
  }

  async close() {
    this._isConnected = false;
    if (this._ws) {
      try {
        this._ws.close();
      } catch {}
      this._ws = null;
    }
    console.log('[ExotelTelephony] Media session closed.');
  }
}

module.exports = ExotelTelephony;
