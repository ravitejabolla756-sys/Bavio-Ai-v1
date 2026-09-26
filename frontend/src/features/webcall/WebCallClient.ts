import type { WebCallState, WebCallTranscriptEntry, WebCallTurnTelemetry, WebCallSessionSummary, NetworkTelemetry } from './types';

export interface WebCallClientCallbacks {
  onStateChange: (state: WebCallState) => void;
  onAudioLevels: (levels: number[]) => void;
  onTranscript: (entry: WebCallTranscriptEntry) => void;
  onTurnTelemetry: (telemetry: WebCallTurnTelemetry) => void;
  onNetworkTelemetry: (net: NetworkTelemetry) => void;
  onEventLog: (event: { eventType: string; occurredAt: string; metadata?: Record<string, unknown> }) => void;
  onCompleted: (summary: WebCallSessionSummary) => void;
  onError: (errorMsg: string) => void;
}

export class WebCallClient {
  private agentId: string;
  private callSid: string | null = null;
  private sessionToken: string | null = null;
  private wsUrl: string | null = null;
  private state: WebCallState = 'idle';
  private callbacks: WebCallClientCallbacks;

  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private ws: WebSocket | null = null;
  private recognition: any = null;

  private isMuted: boolean = false;
  private currentAudioSource: AudioBufferSourceNode | null = null;
  private startTime: number = 0;
  private pingStartTime: number = 0;
  private rttMs: number = 24;
  private jitterMs: number = 3;
  private telemetryInterval: NodeJS.Timeout | null = null;
  private userSpeechStartTime: number = 0;
  private isUserSpeaking: boolean = false;

  constructor(agentId: string, callbacks: WebCallClientCallbacks) {
    this.agentId = agentId;
    this.callbacks = callbacks;
  }

  private setState(newState: WebCallState) {
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  private logEvent(eventType: string, metadata: Record<string, unknown> = {}) {
    const occurredAt = new Date().toISOString();
    this.callbacks.onEventLog({ eventType, occurredAt, metadata });
    if (this.callSid) {
      void fetch(`/api/webcall/${encodeURIComponent(this.callSid)}/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: [{ eventType, occurredAt, metadata }] })
      }).catch(() => {});
    }
  }

  /**
   * Start a live WebCall session.
   */
  async start() {
    this.setState('requesting_session');
    this.startTime = Date.now();

    try {
      // 1. Request session from backend
      const token = typeof window !== 'undefined' ? localStorage.getItem('bavio_token') : null;
      const res = await fetch('/api/webcall/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          agentId: this.agentId,
          browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Browser',
          os: navigator.platform || 'Unknown OS',
          deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop'
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to initialize WebCall session.');
      }

      const data = await res.json();
      this.callSid = data.callSid;
      this.sessionToken = data.sessionToken;
      this.wsUrl = data.wsUrl;

      this.logEvent('session_created', { callSid: this.callSid });

      // 2. Request Microphone Access
      this.setState('requesting_microphone');
      this.logEvent('microphone_requested');

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        this.stream = mediaStream;
        this.logEvent('microphone_granted');
      } catch (micErr: any) {
        this.logEvent('microphone_denied', { error: micErr.message });
        throw new Error('Microphone permission denied. Please allow microphone access to talk to your AI agent.');
      }

      // 3. Setup Audio Context & Visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      this.audioCtx = audioCtx;
      const source = audioCtx.createMediaStreamSource(mediaStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      this.analyser = analyser;

      this.startAudioVisualizer(analyser);

      // 4. Connect to WebCall streaming WebSocket
      this.setState('connecting');
      this.logEvent('webrtc_connecting');

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const defaultWsUrl = `${wsProtocol}//${window.location.host}/api/webcall/stream?callSid=${this.callSid}&token=${this.sessionToken}`;
      const finalWsUrl = this.wsUrl || defaultWsUrl;

      const ws = new WebSocket(finalWsUrl);
      this.ws = ws;
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        this.setState('connected');
        this.logEvent('webrtc_connected');
        this.startNetworkTelemetryReporting();
        this.initSpeechRecognition();
      };

      ws.onmessage = async (evt) => {
        if (typeof evt.data === 'string') {
          const msg = JSON.parse(evt.data);
          this.handleServerMessage(msg);
        } else if (evt.data instanceof ArrayBuffer) {
          // Play binary audio response from assistant
          await this.playAudioBuffer(evt.data);
        }
      };

      ws.onerror = (err) => {
        console.error('[WebCall WS Error]', err);
      };

      ws.onclose = () => {
        if (this.state !== 'completed') {
          this.end('network_disconnect');
        }
      };
    } catch (err: any) {
      this.setState('failed');
      this.callbacks.onError(err.message || 'WebCall failed to connect.');
      this.cleanup();
    }
  }

  private handleServerMessage(msg: any) {
    switch (msg.type) {
      case 'assistant:speech_started':
        this.setState('ai_speaking');
        this.callbacks.onTranscript({
          speaker: 'assistant',
          text: msg.text,
          time: this.getElapsedFormatted(),
          turnId: msg.turnId
        });
        if (msg.telemetry) {
          this.callbacks.onTurnTelemetry({
            turnId: msg.turnId,
            turnNumber: 0,
            userSpeechDurationMs: 0,
            timeToFirstAiAudioMs: msg.telemetry.timeToFirstAiAudioMs || 0,
            llmLatencyMs: msg.telemetry.llmLatencyMs,
            ttsLatencyMs: msg.telemetry.ttsLatencyMs,
            endToEndMs: msg.telemetry.endToEndMs
          });
        }
        break;

      case 'assistant:speech_ended':
        if (this.state === 'ai_speaking') {
          this.setState('connected');
        }
        break;

      case 'assistant:interrupt_ack':
        // Halt current audio playback immediately on interruption
        if (this.currentAudioSource) {
          try { this.currentAudioSource.stop(); } catch {}
          this.currentAudioSource = null;
        }
        break;

      case 'session:ended':
        if (msg.summary) {
          this.callbacks.onCompleted(msg.summary);
        }
        this.cleanup();
        break;
    }
  }

  /**
   * Initializes browser SpeechRecognition for speech boundary and transcript detection.
   */
  private initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onspeechstart = () => {
        if (this.isMuted) return;
        this.isUserSpeaking = true;
        this.userSpeechStartTime = Date.now();
        this.setState('user_speaking');

        // Check if user is interrupting AI audio playback (Barge-in)
        if (this.currentAudioSource) {
          try { this.currentAudioSource.stop(); } catch {}
          this.currentAudioSource = null;
          this.logEvent('user_interrupted');
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'user:speech_started' }));
        }
      };

      recognition.onspeechend = () => {
        if (this.isMuted) return;
        this.isUserSpeaking = false;
        if (this.state === 'user_speaking') {
          this.setState('connected');
        }
      };

      recognition.onresult = (event: any) => {
        if (this.isMuted) return;
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim();
          if (transcript.length > 0) {
            this.callbacks.onTranscript({
              speaker: 'user',
              text: transcript,
              time: this.getElapsedFormatted()
            });

            // Send speech ended with transcript to backend
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({
                type: 'user:speech_ended',
                payload: { transcript }
              }));
            }
          }
        }
      };

      recognition.start();
      this.recognition = recognition;
    } catch (e) {
      console.warn('[WebCall] Speech recognition fallback:', e);
    }
  }

  /**
   * Plays incoming MP3 / WAV audio from backend.
   */
  private async playAudioBuffer(arrayBuffer: ArrayBuffer) {
    if (!this.audioCtx) return;
    try {
      const decodedBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      const source = this.audioCtx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(this.audioCtx.destination);
      this.currentAudioSource = source;

      source.onended = () => {
        if (this.currentAudioSource === source) {
          this.currentAudioSource = null;
          if (this.state === 'ai_speaking') {
            this.setState('connected');
          }
        }
      };

      source.start();
    } catch (err) {
      console.error('[WebCall Audio Decode Error]', err);
    }
  }

  private startAudioVisualizer(analyser: AnalyserNode) {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const update = () => {
      if (this.state === 'completed' || this.state === 'failed') return;
      analyser.getByteFrequencyData(dataArray);
      const levels = [];
      for (let i = 0; i < 16; i++) {
        const val = dataArray[i * 2] || 0;
        levels.push(Math.max(8, Math.min(100, Math.round((val / 255) * 100))));
      }
      this.callbacks.onAudioLevels(levels);
      this.animFrameId = requestAnimationFrame(update);
    };
    this.animFrameId = requestAnimationFrame(update);
  }

  private startNetworkTelemetryReporting() {
    this.telemetryInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Measure simulated RTT
        this.rttMs = Math.round(20 + Math.random() * 15);
        this.jitterMs = Math.round(2 + Math.random() * 3);

        const netTelemetry: NetworkTelemetry = {
          rttMs: this.rttMs,
          jitterMs: this.jitterMs,
          packetLossPercent: 0,
          packetsSent: 120,
          packetsReceived: 118
        };

        this.callbacks.onNetworkTelemetry(netTelemetry);

        this.ws.send(JSON.stringify({
          type: 'telemetry:network',
          payload: netTelemetry
        }));
      }
    }, 5000);
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.stream) {
      this.stream.getAudioTracks().forEach(track => {
        track.enabled = !this.isMuted;
      });
    }
    return this.isMuted;
  }

  /**
   * End WebCall session gracefully.
   */
  async end(reason = 'user_hangup') {
    if (this.state === 'completed') return;
    this.setState('completed');
    this.logEvent('session_ended', { reason });

    const callSid = this.callSid;
    if (callSid) {
      try {
        const res = await fetch(`/api/webcall/${encodeURIComponent(callSid)}/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        });
        if (res.ok) {
          const data = await res.json();
          this.callbacks.onCompleted({
            callSid,
            durationMs: Date.now() - this.startTime,
            durationSeconds: data.durationSeconds || Math.ceil((Date.now() - this.startTime) / 1000),
            userSpeechTotalMs: 0,
            assistantSpeechTotalMs: 0,
            turnsCount: 0,
            interruptionsCount: 0,
            percentiles: data.percentiles || { avg: null, p50: null, p75: null, p90: null, p95: null, min: null, max: null }
          });
        }
      } catch (err) {
        console.warn('[WebCall End Warning]', err);
      }
    }

    this.cleanup();
  }

  private cleanup() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.telemetryInterval) clearInterval(this.telemetryInterval);
    if (this.currentAudioSource) {
      try { this.currentAudioSource.stop(); } catch {}
      this.currentAudioSource = null;
    }
    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
      this.recognition = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try { this.audioCtx.close(); } catch {}
      this.audioCtx = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
  }

  private getElapsedFormatted(): string {
    const secs = Math.floor((Date.now() - this.startTime) / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
}
