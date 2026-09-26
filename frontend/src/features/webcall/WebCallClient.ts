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
  private audioQueue: ArrayBuffer[] = [];
  private isPlayingAudio: boolean = false;
  private turnCounter: number = 0;
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

      console.log('[BAVIO_DIAG] WS_CONNECTING —', finalWsUrl.replace(/token=[^&]+/, 'token=REDACTED'));

      const ws = new WebSocket(finalWsUrl);
      this.ws = ws;
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        console.log('[BAVIO_DIAG] WS_CONNECTED — WebSocket open, audioCtx.state=', this.audioCtx?.state);
        // Attempt AudioContext resume on WS open (user gesture may have happened by now)
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
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
          // Play binary audio response from assistant through ordered audio queue
          this.enqueueAudioBuffer(evt.data);
        }
      };

      ws.onerror = (err) => {
        console.error('[BAVIO_DIAG] WS_ERROR —', err);
        this.logEvent('ws_error', { type: 'websocket_error' });
      };

      ws.onclose = (evt) => {
        console.log('[BAVIO_DIAG] WS_CLOSED — code:', evt.code, 'reason:', evt.reason || 'none');
        if (this.state !== 'completed') {
          this.logEvent('ws_closed', { code: evt.code, reason: evt.reason });
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
            turnNumber: this.turnCounter,
            userSpeechDurationMs: 0,
            timeToFirstAiAudioMs: msg.telemetry.timeToFirstAiAudioMs || 0,
            llmLatencyMs: msg.telemetry.llmLatencyMs,
            ttsLatencyMs: msg.telemetry.ttsLatencyMs,
            endToEndMs: msg.telemetry.endToEndMs
          });
        }
        break;

      case 'assistant:speech_ended':
        // Let audioQueue finish playback naturally before switching state
        if (this.audioQueue.length === 0 && !this.isPlayingAudio && this.state === 'ai_speaking') {
          this.setState('connected');
        }
        break;

      case 'assistant:interrupt_ack':
        // Halt current audio playback and clear queue immediately on interruption
        this.clearAudioQueue();
        if (this.state === 'ai_speaking') {
          this.setState('connected');
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
   * Includes onend restart loop (Chrome silently kills continuous sessions after ~60s),
   * onerror handler, and full [BAVIO_DIAG] diagnostic logging.
   */
  private initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[BAVIO_DIAG] STT_NO_API — Browser does not support SpeechRecognition. User speech will NOT be transcribed.');
      this.callbacks.onError('Your browser does not support speech recognition. Please use Chrome for WebCall.');
      return;
    }

    const startRecognition = () => {
      if (this.state === 'completed' || this.state === 'failed') return;

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        this.recognition = recognition;

        console.log('[BAVIO_DIAG] STT_SESSION_STARTED — recognition.start() called');
        this.logEvent('stt_session_started', { engine: 'browser_web_speech_api' });

        recognition.onspeechstart = () => {
          if (this.isMuted) return;
          this.isUserSpeaking = true;
          this.userSpeechStartTime = Date.now();
          this.setState('user_speaking');
          console.log('[BAVIO_DIAG] STT_SPEECH_STARTED — browser VAD detected speech');

          // Check if user is interrupting AI audio playback (Barge-in)
          if (this.isPlayingAudio || this.currentAudioSource || this.audioQueue.length > 0) {
            this.clearAudioQueue();
            this.logEvent('user_interrupted');
          }

          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'user:speech_started' }));
          }
        };

        recognition.onspeechend = () => {
          if (this.isMuted) return;
          this.isUserSpeaking = false;
          console.log('[BAVIO_DIAG] STT_SPEECH_ENDED — browser VAD silence detected');
          if (this.state === 'user_speaking') {
            this.setState('connected');
          }
        };

        recognition.onresult = (event: any) => {
          if (this.isMuted) return;
          const lastResult = event.results[event.results.length - 1];
          const interimText = lastResult[0].transcript.trim();

          // Real-time barge-in trigger: if interim text is received while AI is speaking, interrupt immediately
          if (interimText.length > 0 && (this.isPlayingAudio || this.currentAudioSource || this.audioQueue.length > 0)) {
            this.clearAudioQueue();
            this.setState('user_speaking');
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ type: 'user:speech_started' }));
            }
          }

          console.log(`[BAVIO_DIAG] STT_RESULT — isFinal=${lastResult.isFinal} text="${interimText.slice(0, 60)}"`);

          if (lastResult.isFinal) {
            const transcript = interimText;
            if (transcript.length > 0) {
              this.turnCounter++;
              console.log(`[BAVIO_DIAG] STT_FINAL_TRANSCRIPT — turn ${this.turnCounter}: "${transcript.slice(0, 80)}"`);
              this.logEvent('stt_final_transcript', { charCount: transcript.length, turnNumber: this.turnCounter });

              this.callbacks.onTranscript({
                speaker: 'user',
                text: transcript,
                time: this.getElapsedFormatted()
              });

              // Send speech ended with transcript to backend
              if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                console.log('[BAVIO_DIAG] WS_SEND — user:speech_ended with transcript');
                this.ws.send(JSON.stringify({
                  type: 'user:speech_ended',
                  payload: { transcript }
                }));
              } else {
                console.warn('[BAVIO_DIAG] WS_SEND_FAILED — WebSocket not open, transcript lost. State:', this.ws?.readyState);
              }
            }
          }
        };

        // CRITICAL FIX: Chrome's continuous SpeechRecognition silently stops after ~60s.
        // Without this onend restart, all user speech after the first session dies is ignored.
        recognition.onend = () => {
          console.log('[BAVIO_DIAG] STT_SESSION_ENDED — recognition.onend fired');
          this.logEvent('stt_session_ended');
          if (this.state !== 'completed' && this.state !== 'failed') {
            console.log('[BAVIO_DIAG] STT_SESSION_RESTARTING — auto-restarting recognition');
            // Small delay to avoid rapid restart loops on transient errors
            setTimeout(() => startRecognition(), 300);
          }
        };

        // CRITICAL FIX: Handle recognition errors explicitly
        recognition.onerror = (event: any) => {
          console.error('[BAVIO_DIAG] STT_ERROR —', event.error, event.message || '');
          this.logEvent('stt_error', { error: event.error });
          // 'no-speech' is normal — do not escalate to user
          if (event.error === 'aborted' || event.error === 'audio-capture') {
            console.warn('[BAVIO_DIAG] STT_CRITICAL_ERROR — microphone may be unavailable:', event.error);
          }
          // onend will fire after onerror and handle restart
        };

        recognition.start();
      } catch (e: any) {
        console.error('[BAVIO_DIAG] STT_START_FAILED —', e.message);
      }
    };

    startRecognition();
  }

  /**
   * Enqueues incoming audio chunks from streaming TTS for gapless playback.
   */
  private enqueueAudioBuffer(arrayBuffer: ArrayBuffer) {
    this.audioQueue.push(arrayBuffer);
    if (!this.isPlayingAudio) {
      this.playNextAudioFromQueue();
    }
  }

  /**
   * Clears the audio playback queue immediately (e.g. on user barge-in / interruption).
   */
  private clearAudioQueue() {
    this.audioQueue = [];
    this.isPlayingAudio = false;
    if (this.currentAudioSource) {
      try { this.currentAudioSource.stop(); } catch {}
      this.currentAudioSource = null;
    }
  }

  /**
   * Plays the next available audio chunk from the queue.
   */
  private async playNextAudioFromQueue() {
    if (this.audioQueue.length === 0) {
      this.isPlayingAudio = false;
      if (this.state === 'ai_speaking') {
        this.setState('connected');
      }
      return;
    }

    this.isPlayingAudio = true;
    const nextChunk = this.audioQueue.shift();
    if (nextChunk) {
      await this.playAudioBuffer(nextChunk);
    }
  }

  /**
   * Plays incoming MP3 / WAV audio chunk through Web Audio API.
   * Resumes suspended AudioContext before playback.
   */
  private async playAudioBuffer(arrayBuffer: ArrayBuffer) {
    if (!this.audioCtx) {
      console.warn('[BAVIO_DIAG] AUDIO_PLAY_FAILED — no AudioContext available');
      this.isPlayingAudio = false;
      return;
    }

    if (this.audioCtx.state === 'suspended') {
      console.warn('[BAVIO_DIAG] AUDIO_CTX_SUSPENDED — attempting resume()');
      try {
        await this.audioCtx.resume();
        console.log('[BAVIO_DIAG] AUDIO_CTX_RESUMED — state:', this.audioCtx.state);
      } catch (resumeErr: any) {
        console.error('[BAVIO_DIAG] AUDIO_CTX_RESUME_FAILED —', resumeErr.message);
        this.callbacks.onError('Audio playback blocked by browser. Please interact with the page first.');
        this.isPlayingAudio = false;
        return;
      }
    }

    try {
      const decodedBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      const source = this.audioCtx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(this.audioCtx.destination);
      this.currentAudioSource = source;

      source.onended = () => {
        if (this.currentAudioSource === source) {
          this.currentAudioSource = null;
          // Play next chunk in queue seamlessly
          this.playNextAudioFromQueue();
        }
      };

      source.start();
    } catch (err: any) {
      console.error('[BAVIO_DIAG] AUDIO_DECODE_FAILED —', err.message, '— bytes:', arrayBuffer.byteLength);
      this.isPlayingAudio = false;
      this.playNextAudioFromQueue();
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
          const turnCount = data.userTurnCount ?? data.turnsCount ?? this.turnCounter;
          this.callbacks.onCompleted({
            callSid,
            durationMs: data.durationMs || (Date.now() - this.startTime),
            durationSeconds: data.durationSeconds || Math.ceil((Date.now() - this.startTime) / 1000),
            userSpeechTotalMs: data.userSpeechTotalMs || 0,
            assistantSpeechTotalMs: data.assistantSpeechTotalMs || 0,
            turnsCount: turnCount,
            interruptionsCount: data.interruptionsCount || 0,
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
    this.clearAudioQueue();
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
