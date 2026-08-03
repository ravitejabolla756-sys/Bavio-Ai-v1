'use strict';

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

  async startMediaSession({ ws, callSid, streamSid }) {
    this._ws        = ws;
    this._callSid   = callSid;
    this._streamSid = streamSid;

    // Handle inbound events from WebSocket (forwarded by server.js upgrade)
    this._ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.event === 'media') {
          const payload = Buffer.from(data.media.payload, 'base64');
          this._emitAudioChunk(payload);
        } else if (data.event === 'stop') {
          this._emitCallEnd();
        }
      } catch (err) {
        // Safe to ignore non-JSON or malformed events
      }
    });

    this._ws.on('close', () => {
      this._emitCallEnd();
    });
  }

  sendAudio(audioBuffer) {
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
      if (!this._callSid) return;
      const twilio = require('twilio');
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      if (sid && token) {
        const client = twilio(sid, token);
        await client.calls(this._callSid).update({ status: 'completed' });
        console.log(`[TwilioTelephony] Call ${this._callSid} terminated programmatically: ${reason}`);
      } else {
        console.warn(`[TwilioTelephony] Cannot terminate call ${this._callSid}: missing Twilio env vars`);
      }
    } catch (err) {
      console.error(`[TwilioTelephony] terminateCall error: ${err.message}`);
    }
  }

  async close() {
    this.clearAudio();
    this._ws = null;
  }

  get isSpeaking() { return this._isSpeaking; }
  setStreamSid(streamSid) { this._streamSid = streamSid; }
}

module.exports = CurrentTwilioTelephony;
