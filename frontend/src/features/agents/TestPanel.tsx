'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import PhoneInput, { type CountryInfo } from '@/components/ui/PhoneInput';
import { initiateTestCall, getTestCallStatus, hangupTestCall } from './service';
import type { Draft, Voice, Agent, TestCallTurn, TestCallStatus } from './types';
import s from './test-panel.module.css';

interface Props {
  draft: Draft;
  voice?: Voice;
  agent?: Agent | null;
  assignedNumber?: string;
  enabled?: boolean;
  onNavigateToPhone?: () => void;
  onSaveAgent?: () => Promise<Agent | null>;
  onTestCompleted?: () => void;
}

export default function TestPanel({
  draft,
  voice,
  agent,
  assignedNumber,
  enabled = true,
  onNavigateToPhone,
  onSaveAgent,
  onTestCompleted,
}: Props) {
  // ── Form & Phone State ──
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(null);

  // ── Call Progression State ──
  const [callState, setCallState] = useState<TestCallStatus>('idle');
  const [activeCallSid, setActiveCallSid] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [maskedPhone, setMaskedPhone] = useState<string>('');
  const [testSummary, setTestSummary] = useState<string>('');
  const [transcript, setTranscript] = useState<TestCallTurn[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── 1. Readiness Verification Logic ──
  const readinessCheck = useMemo(() => {
    if (!draft.name?.trim()) {
      return { ready: false, message: 'Add an agent name before testing your agent.' };
    }
    if (!draft.system_prompt?.trim()) {
      return { ready: false, message: 'Complete Instructions before testing your agent.' };
    }
    if (!draft.voice_id && !voice?.id && !voice?.voice_id) {
      return { ready: false, message: 'Complete Voice & language before testing your agent.' };
    }
    if (!draft.language) {
      return { ready: false, message: 'Select a language in Voice & language before testing your agent.' };
    }
    if (!assignedNumber && !draft.phone_number && !draft.phone_id) {
      return { ready: false, message: 'Assign a phone number before making a live test call.' };
    }
    return { ready: true, message: '' };
  }, [draft, voice, assignedNumber]);

  // ── 2. Live Call Duration Timer ──
  useEffect(() => {
    if (callState === 'in_progress' || callState === 'connected') {
      durationTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [callState]);

  // ── 3. Real-Time Status Polling ──
  useEffect(() => {
    const isPolling = activeCallSid && (callState === 'preparing' || callState === 'calling' || callState === 'ringing' || callState === 'in_progress');
    if (!isPolling) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    const currentAgentId = agent?.id;
    if (!currentAgentId) return;

    const pollStatus = async () => {
      try {
        const result = await getTestCallStatus(currentAgentId, activeCallSid);
        if (!result || !result.success) return;

        const normalized = result.status.toLowerCase();

        if (normalized === 'ringing') {
          setCallState('ringing');
        } else if (normalized === 'in_progress' || normalized === 'in-progress') {
          setCallState('in_progress');
        } else if (normalized === 'completed') {
          setCallState('completed');
          if (result.durationSeconds) setCallDuration(result.durationSeconds);
          if (result.summary) setTestSummary(result.summary);
          if (result.transcript) setTranscript(result.transcript);
          onTestCompleted?.();
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        } else if (['failed', 'busy', 'no-answer', 'canceled'].includes(normalized)) {
          setCallState('failed');
          setErrorMessage('The test call could not be completed. Please ensure your mobile phone is reachable.');
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        }
      } catch (err: any) {
        console.warn('[TEST CALL] Polling check notice:', err.message);
      }
    };

    pollTimerRef.current = setInterval(pollStatus, 2000);
    void pollStatus();

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [activeCallSid, callState, agent?.id, onTestCompleted]);

  // ── 4. Trigger Outbound Test Call ──
  async function handleCallNow(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (isSubmitting || callState === 'preparing' || callState === 'calling' || callState === 'in_progress') {
      return; // Idempotency protection
    }

    if (!readinessCheck.ready) {
      setErrorMessage(readinessCheck.message);
      return;
    }

    if (!phoneNumber.trim()) {
      setErrorMessage('Please enter your mobile phone number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setCallState('preparing');
    setCallDuration(0);
    setTestSummary('');
    setTranscript([]);

    try {
      // If agent is not yet persisted to DB, persist now
      let targetAgentId = agent?.id;
      if (!targetAgentId && onSaveAgent) {
        const saved = await onSaveAgent();
        if (saved && saved.id) {
          targetAgentId = saved.id;
        }
      }

      if (!targetAgentId) {
        setCallState('failed');
        setErrorMessage('Unable to register agent configuration. Please save your draft and try again.');
        setIsSubmitting(false);
        return;
      }

      // Initiate real provider call
      const countryCode = selectedCountry?.code || 'IN';
      const result = await initiateTestCall(targetAgentId, phoneNumber, countryCode);

      if (result.success && result.callSid) {
        setActiveCallSid(result.callSid);
        setMaskedPhone(result.maskedNumber || phoneNumber);
        setCallState('calling');
      } else {
        setCallState('failed');
        setErrorMessage(result.message || 'Failed to place test call.');
      }
    } catch (err: any) {
      console.error('[TEST CALL] Initiate error:', err);
      const isProvider = err.code === 'provider_unavailable' || err.status === 503 || (err.message && err.message.toLowerCase().includes('telephony'));
      if (isProvider) {
        setCallState('provider_unavailable');
        setErrorMessage('Live calling is currently unavailable. Telephony provider credentials are inactive or suspended.');
      } else {
        setCallState('failed');
        setErrorMessage(err.message || 'The test call could not be started. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── 5. End Live Call Early ──
  async function handleHangup() {
    if (!activeCallSid || !agent?.id) return;
    try {
      await hangupTestCall(agent.id, activeCallSid);
      setCallState('completed');
      onTestCompleted?.();
    } catch (err: any) {
      console.error('[TEST CALL] Hangup error:', err);
      setCallState('completed');
    }
  }

  // ── 6. Copy Assigned Number ──
  function handleCopyNumber(num: string) {
    if (!num) return;
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Format Duration (MM:SS or Xm Ys) ──
  function formatTimer(secs: number) {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  }

  function formatReadableDuration(secs: number) {
    if (secs < 60) return `${secs} seconds`;
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return rem > 0 ? `${mins}m ${rem}s` : `${mins} min`;
  }

  return (
    <div className={s.container}>
      {/* ── Page Header ── */}
      <div className={s.header}>
        <span className={s.stepKicker}>Step 6 of 6</span>
        <h1 className={s.title}>Test your AI Receptionist</h1>
        <p className={s.subtitle}>
          Make a test call to your AI agent and experience how it responds in real time.
        </p>
      </div>

      {/* ── Subtle Information Callout ── */}
      <div className={s.infoCallout} role="status">
        <span className={s.infoIconWrapper} aria-hidden="true">☎</span>
        <p className={s.infoText}>
          This will call the assigned number for this agent and you&apos;ll hear the AI response after a short connection time.
        </p>
      </div>

      {/* ── Readiness Alert if Incomplete ── */}
      {!readinessCheck.ready && callState === 'idle' && (
        <div className={s.readinessAlert} role="alert">
          <div>
            <strong>Setup required before testing</strong>
            <p>{readinessCheck.message}</p>
            {(!assignedNumber && !draft.phone_number && !draft.phone_id) && onNavigateToPhone && (
              <button
                type="button"
                className={s.readinessLink}
                onClick={onNavigateToPhone}
              >
                Go to Step 5: Phone assignment →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Main Call Card ── */}
      <div className={s.card}>
        <div className={s.cardHeader}>
          <h2 className={s.cardTitle}>Call a number (optional)</h2>
          <p className={s.cardDesc}>
            Enter your mobile number to receive the call, or use the assigned number.
          </p>
        </div>

        {/* ── STATE 1 - 4: Active Calling UI ── */}
        {(callState === 'preparing' || callState === 'calling' || callState === 'ringing' || callState === 'in_progress') && (
          <div className={s.activeCallBox} aria-live="polite">
            <div className={s.callStateRow}>
              <div className={s.statusIndicator}>
                <span className={callState === 'in_progress' ? s.pulseDot : s.pulseDotOrange} />
                <span className={s.statusBadge}>
                  {callState === 'preparing' && 'Preparing your test call...'}
                  {callState === 'calling' && 'Calling your phone...'}
                  {callState === 'ringing' && 'Your phone should ring shortly.'}
                  {callState === 'in_progress' && '● Live call in progress'}
                </span>
              </div>
              <div className={s.liveTimer}>
                {formatTimer(callDuration)}
              </div>
            </div>

            <div className={s.callDetailsGrid}>
              <div className={s.detailItem}>
                <span className={s.detailLabel}>Agent</span>
                <span className={s.detailValue}>{draft.name || 'AI Receptionist'}</span>
              </div>
              <div className={s.detailItem}>
                <span className={s.detailLabel}>Calling</span>
                <span className={s.detailValue}>{maskedPhone || phoneNumber}</span>
              </div>
              {assignedNumber && (
                <div className={s.detailItem}>
                  <span className={s.detailLabel}>From assigned</span>
                  <span className={s.detailValue}>{assignedNumber}</span>
                </div>
              )}
            </div>

            {callState === 'in_progress' && (
              <button
                type="button"
                className={s.hangupButton}
                onClick={handleHangup}
              >
                End call
              </button>
            )}
          </div>
        )}

        {/* ── STATE 5: Call Completed ── */}
        {callState === 'completed' && (
          <div className={s.completedCard} aria-live="polite">
            <div className={s.completedHeader}>
              <div className={s.completedBadge}>
                <span>✓</span>
                <span>Test completed</span>
              </div>
              <div className={s.liveTimer}>{formatTimer(callDuration)}</div>
            </div>

            <div className={s.completedStatsRow}>
              <div className={s.detailItem}>
                <span className={s.detailLabel}>Call duration</span>
                <span className={s.detailValue}>{formatReadableDuration(callDuration)}</span>
              </div>
              <div className={s.detailItem}>
                <span className={s.detailLabel}>Call status</span>
                <span className={s.detailValue}>Completed</span>
              </div>
              <div className={s.detailItem}>
                <span className={s.detailLabel}>Voice</span>
                <span className={s.detailValue}>{voice?.voice_display_name || voice?.name || 'Configured'}</span>
              </div>
              <div className={s.detailItem}>
                <span className={s.detailLabel}>Language</span>
                <span className={s.detailValue}>{draft.language || 'English (US)'}</span>
              </div>
            </div>

            {/* AI Test Summary */}
            <div className={s.summaryBox}>
              <span className={s.summaryTitle}>Test summary</span>
              <p className={s.summaryContent}>
                {testSummary || 'The agent greeted the caller and responded to caller inquiries in real time.'}
              </p>
            </div>

            {/* Conversation Transcript Accordion */}
            {transcript.length > 0 && (
              <div className={s.transcriptDisclosure}>
                <button
                  type="button"
                  className={s.transcriptToggle}
                  onClick={() => setShowTranscript(!showTranscript)}
                >
                  {showTranscript ? 'Hide transcript ▲' : `View transcript (${transcript.length} turns) ▼`}
                </button>
                {showTranscript && (
                  <div className={s.transcriptList}>
                    {transcript.map((turn, index) => (
                      <div
                        key={index}
                        className={`${s.transcriptTurn} ${turn.role === 'assistant' ? s.turnAssistant : s.turnUser}`}
                      >
                        <span className={s.turnSpeaker}>{turn.role === 'assistant' ? (draft.name || 'AI Receptionist') : 'Caller'}</span>
                        <span>{turn.content}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className={s.secondaryActionRow}>
              <button
                type="button"
                className={s.secondaryButton}
                onClick={() => setCallState('idle')}
              >
                Test again
              </button>
            </div>
          </div>
        )}

        {/* ── STATE 6: Provider Unavailable or Failed ── */}
        {(callState === 'provider_unavailable' || callState === 'failed') && (
          <div className={s.errorCard} role="alert">
            <h3 className={s.errorTitle}>
              {callState === 'provider_unavailable' ? 'Live calling is currently unavailable.' : 'Call failed'}
            </h3>
            <p className={s.errorMessage}>
              {errorMessage || 'The call could not be completed. Please verify your phone number and try again.'}
            </p>
            <div className={s.secondaryActionRow}>
              <button
                type="button"
                className={s.secondaryButton}
                onClick={() => {
                  setCallState('idle');
                  setErrorMessage('');
                }}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* ── Idle Form Input: Phone & Call Now CTA ── */}
        {callState === 'idle' && (
          <form onSubmit={handleCallNow} className={s.inputSection}>
            <PhoneInput
              id="test-phone-input"
              label="Your mobile number"
              value={phoneNumber}
              onChange={(val, valid, country) => {
                setPhoneNumber(val);
                setIsPhoneValid(valid);
                setSelectedCountry(country);
                if (errorMessage) setErrorMessage('');
              }}
              required
            />

            <button
              type="submit"
              className={s.callButton}
              disabled={isSubmitting || !readinessCheck.ready || !phoneNumber.trim()}
            >
              ☎ Call Now
            </button>

            <p className={s.underButtonText}>
              The call will connect in about 60 seconds.
            </p>
          </form>
        )}
      </div>

      {/* ── Optional Assigned Number Flow ── */}
      {assignedNumber ? (
        <div className={s.assignedCard}>
          <div className={s.assignedLeft}>
            <h3 className={s.assignedPromptTitle}>Prefer to call the agent yourself?</h3>
            <span className={s.assignedNumberText}>{assignedNumber}</span>
            <p className={s.assignedInstructions}>
              Call this number from your mobile phone to test your agent.
            </p>
          </div>

          <button
            type="button"
            className={`${s.copyButton} ${copied ? s.copyButtonSuccess : ''}`}
            onClick={() => handleCopyNumber(assignedNumber)}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy number
              </>
            )}
          </button>
        </div>
      ) : (
        <div className={s.phoneRequiredCard}>
          <div className={s.assignedLeft}>
            <h3 className={s.assignedPromptTitle}>Phone number required</h3>
            <p className={s.assignedInstructions}>
              Assign a phone number to this agent before making a live test call.
            </p>
          </div>

          {onNavigateToPhone && (
            <button
              type="button"
              className={s.assignPhoneButton}
              onClick={onNavigateToPhone}
            >
              Assign phone number
            </button>
          )}
        </div>
      )}
    </div>
  );
}
