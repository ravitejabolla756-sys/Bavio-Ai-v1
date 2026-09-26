'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Draft, Voice } from './types';
import type { PhoneNumber } from '@/lib/api';
import IdentityStep from './steps/IdentityStep';
import VoiceLanguageStep from './steps/VoiceLanguageStep';
import s from './create-agent.module.css';

export const sections = [
  ['identity', 'Behavior', 'Identity'],
  ['instructions', 'Behavior', 'Instructions'],
  ['knowledge', 'Intelligence', 'Knowledge'],
  ['voice', 'Conversation', 'Voice & language'],
  ['deployment', 'Deploy', 'How customers reach this agent'],
  ['test', 'Quality', 'Test'],
] as const;

export type Section = typeof sections[number][0];

interface Props {
  section: Section;
  draft: Draft;
  set: (key: keyof Draft, value: any) => void;
  creating: boolean;
  voices: Voice[];
  voiceError: boolean;
  onRetryVoices?: () => void;
  knowledgeCount: number | null;
  numbers: PhoneNumber[];
  numberError: boolean;
  assigned: string;
  onNavigateStep: (step: Section) => void;
  onCancel: () => void;
  onSaveDraft?: () => void;
}

const starterTemplate = 'You are the AI receptionist for [Business]. Your responsibilities are…';

export default function AgentFields(p: Props) {
  const { draft: d, set, onNavigateStep, onCancel } = p;
  const currentChannel = d.channel || 'both';

  if (p.section === 'identity') {
    return (
      <IdentityStep
        draft={d}
        onChange={(key, val) => set(key, val)}
        onContinue={() => onNavigateStep('instructions')}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className={s.stepContentColumn}>
      {p.section === 'instructions' && (
        <>
          <div className={s.stepHeader}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono)', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              INSTRUCTIONS
            </span>
            <h2 className={s.stepNumberTitle} style={{ marginTop: '4px' }}>
              How this agent should behave
            </h2>
            <p className={s.stepDescription}>
              Set responsibilities, tone, and boundaries for each response.
            </p>
          </div>

          <div className={s.fieldsGrid}>
            <div className={s.bannerBox}>
              <div>
                <h3 className={s.bannerTitle}>Start with a clear brief</h3>
                <p className={s.bannerSubtitle}>
                  Suggested starter: &ldquo;{starterTemplate}&rdquo;
                </p>
              </div>
              <button
                type="button"
                className={s.cancelButton}
                onClick={() => {
                  set('system_prompt', starterTemplate);
                  document.getElementById('agent-instructions')?.focus();
                }}
              >
                Insert starter template
              </button>
            </div>

            <div className={s.fieldGroup}>
              <label htmlFor="agent-instructions" className={s.fieldLabel}>
                Instructions <span className={s.requiredStar}>*</span>
              </label>
              <textarea
                id="agent-instructions"
                className={s.textareaControl}
                style={{ minHeight: '220px', lineHeight: '1.7' }}
                required
                value={d.system_prompt}
                onChange={e => set('system_prompt', e.target.value)}
                placeholder="Describe role, responsibilities, tone, business rules, escalation, and how to handle unknown questions..."
              />
              <div className={s.fieldMetaRow}>
                <span className={s.fieldHelperText}>
                  Write the rules and guidelines this agent should follow.
                </span>
                <span className={s.charCounterRight}>
                  {d.system_prompt.length.toLocaleString()} characters
                </span>
              </div>
            </div>
          </div>

          <div className={s.bottomActionBar}>
            <button type="button" className={s.cancelButton} onClick={() => onNavigateStep('identity')}>
              ← Identity
            </button>
            <button type="button" className={s.continueButton} onClick={() => onNavigateStep('knowledge')}>
              Continue to Knowledge →
            </button>
          </div>
        </>
      )}

      {p.section === 'knowledge' && (
        <>
          <div className={s.stepHeader}>
            <h2 className={s.stepNumberTitle}>3. Knowledge</h2>
            <p className={s.stepDescription}>
              Give {d.name.trim() || 'this agent'} access to the right information from your workspace so it can answer customer questions accurately.
            </p>
          </div>

          <div className={s.fieldsGrid}>
            <div className={s.bannerBox}>
              <div>
                <h3 className={s.bannerTitle}>Workspace knowledge (Optional)</h3>
                <p className={s.bannerSubtitle}>
                  Agents use information stored in your workspace knowledge base. If empty, the agent follows its system instructions.
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: p.knowledgeCount ? 'var(--ca-badge-draft-text)' : 'var(--ca-text-faint)' }}>
                  {p.knowledgeCount === null ? '0 sources (knowledge optional).' : `${p.knowledgeCount} sources available in workspace`}
                </p>
              </div>
              <Link href="/dashboard/knowledge" className={s.cancelButton} style={{ textDecoration: 'none' }}>
                Manage knowledge →
              </Link>
            </div>
          </div>

          <div className={s.bottomActionBar}>
            <button type="button" className={s.cancelButton} onClick={() => onNavigateStep('instructions')}>
              ← Instructions
            </button>
            <button type="button" className={s.continueButton} onClick={() => onNavigateStep('voice')}>
              Continue to Voice & language →
            </button>
          </div>
        </>
      )}

      {p.section === 'voice' && (
        <VoiceLanguageStep
          draft={d}
          onChange={(key, val) => set(key, val)}
          voices={p.voices}
          voiceError={p.voiceError}
          onRetryVoices={p.onRetryVoices}
          onNavigateStep={p.onNavigateStep}
        />
      )}

      {p.section === 'deployment' && (
        <>
          <div className={s.stepHeader}>
            <h2 className={s.stepNumberTitle}>5. How customers reach this agent</h2>
            <p className={s.stepDescription}>
              Choose how your customers connect with this AI agent — via instant browser WebCall, phone telephony, or both.
            </p>
          </div>

          <div className={s.fieldsGrid}>
            {/* Channel Selection Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => set('channel', 'webcall')}
                style={{
                  textAlign: 'left',
                  padding: '16px',
                  borderRadius: '12px',
                  border: currentChannel === 'webcall' ? '2px solid #F97316' : '1px solid var(--ca-border-subtle, rgba(255,255,255,0.1))',
                  backgroundColor: currentChannel === 'webcall' ? 'rgba(249, 115, 22, 0.08)' : 'var(--ca-surface-card, rgba(255,255,255,0.03))',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>🌐</div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ca-text-primary, #fff)', marginBottom: '4px' }}>Website / WebCall</div>
                <div style={{ fontSize: '12px', color: 'var(--ca-text-muted, #94a3b8)', lineHeight: '1.4' }}>Let customers talk to your AI directly from your website. No phone number required.</div>
              </button>

              <button
                type="button"
                onClick={() => set('channel', 'phone')}
                style={{
                  textAlign: 'left',
                  padding: '16px',
                  borderRadius: '12px',
                  border: currentChannel === 'phone' ? '2px solid #F97316' : '1px solid var(--ca-border-subtle, rgba(255,255,255,0.1))',
                  backgroundColor: currentChannel === 'phone' ? 'rgba(249, 115, 22, 0.08)' : 'var(--ca-surface-card, rgba(255,255,255,0.03))',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>📞</div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ca-text-primary, #fff)', marginBottom: '4px' }}>Phone number</div>
                <div style={{ fontSize: '12px', color: 'var(--ca-text-muted, #94a3b8)', lineHeight: '1.4' }}>Use a dedicated business phone number for incoming carrier voice calls.</div>
              </button>

              <button
                type="button"
                onClick={() => set('channel', 'both')}
                style={{
                  textAlign: 'left',
                  padding: '16px',
                  borderRadius: '12px',
                  border: currentChannel === 'both' ? '2px solid #F97316' : '1px solid var(--ca-border-subtle, rgba(255,255,255,0.1))',
                  backgroundColor: currentChannel === 'both' ? 'rgba(249, 115, 22, 0.08)' : 'var(--ca-surface-card, rgba(255,255,255,0.03))',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>⚡</div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ca-text-primary, #fff)', marginBottom: '4px' }}>Both (WebCall & Phone)</div>
                <div style={{ fontSize: '12px', color: 'var(--ca-text-muted, #94a3b8)', lineHeight: '1.4' }}>Max reach: talk to website visitors and handle inbound telephone calls.</div>
              </button>
            </div>

            {/* Phone Assignment Details if Phone/Both is active */}
            {currentChannel !== 'webcall' ? (
              <div className={s.bannerBox}>
                <div>
                  <h3 className={s.bannerTitle}>Business phone number</h3>
                  <p className={s.bannerSubtitle}>
                    {p.creating
                      ? 'You can assign a phone number now, or skip to test in browser first.'
                      : p.numberError
                      ? 'Phone assignment unavailable.'
                      : p.numbers.find(n => n.id === p.assigned)?.number || 'No number assigned'}
                  </p>
                </div>
                <Link href="/dashboard/phone-numbers" className={s.cancelButton} style={{ textDecoration: 'none' }}>
                  Manage phone numbers →
                </Link>
              </div>
            ) : (
              <div className={s.bannerBox}>
                <div>
                  <h3 className={s.bannerTitle}>WebCall-Ready Agent</h3>
                  <p className={s.bannerSubtitle}>
                    This agent is configured for instant browser voice sessions. You can test it immediately in Step 6 without a phone number.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className={s.bottomActionBar}>
            <button type="button" className={s.cancelButton} onClick={() => onNavigateStep('voice')}>
              ← Back to Voice & language
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              {currentChannel !== 'webcall' && !p.assigned && (
                <button
                  type="button"
                  className={s.cancelButton}
                  onClick={() => {
                    set('channel', 'webcall');
                    onNavigateStep('test');
                  }}
                >
                  Skip for WebCall →
                </button>
              )}
              <button type="button" className={s.continueButton} onClick={() => onNavigateStep('test')}>
                Continue to Test →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
