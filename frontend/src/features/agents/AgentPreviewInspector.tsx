'use client';

import React from 'react';
import type { Draft, Voice } from './types';
import s from './create-agent.module.css';

interface Props {
  draft: Draft;
  voices: Voice[];
  knowledgeCount: number | null;
  assignedNumber?: string;
  hasTestCompleted?: boolean;
}

export default function AgentPreviewInspector({
  draft,
  voices,
  knowledgeCount,
  assignedNumber,
  hasTestCompleted = false,
}: Props) {
  const agentName = draft.name.trim() || 'New agent';
  const initial = (draft.name.trim().charAt(0) || 'A').toUpperCase();
  const roleLabel = draft.role ? `AI ${draft.role}` : 'AI Voice Agent';

  const selectedVoice = voices.find(v => v.id === draft.voice_id || v.voice_id === draft.voice_id);
  const voiceDisplay = selectedVoice
    ? `${selectedVoice.name || selectedVoice.voice_display_name} · ${selectedVoice.tone || 'Friendly'}`
    : 'Not selected';

  const langName = (code: string) => {
    if (!code) return 'English';
    if (code === 'hi-IN') return 'Hindi';
    if (code === 'hi-en') return 'Hinglish';
    if (code === 'te-IN') return 'Telugu';
    if (code === 'ta-IN') return 'Tamil';
    if (code.startsWith('en')) return 'English';
    return code;
  };

  const selectedLangs = Array.from(new Set([draft.language, ...(draft.languages || [])])).filter(Boolean);
  const primaryLangLabel = langName(draft.language || 'en-US');
  const languagesDisplay = selectedLangs.length > 1
    ? `${primaryLangLabel} +${selectedLangs.length - 1}`
    : primaryLangLabel;

  const knowledgeDisplay = knowledgeCount !== null ? `${knowledgeCount} sources` : '0 sources';
  const phoneDisplay = assignedNumber || 'Not assigned';

  // Compute readiness checklist
  const isVoiceCompatible = selectedVoice
    ? (!selectedVoice.supportedLanguages || selectedVoice.supportedLanguages.includes(draft.language))
    : false;

  const hasName = Boolean(draft.name.trim());
  const hasInstructions = Boolean(draft.system_prompt.trim());
  const hasKnowledge = Boolean(knowledgeCount && knowledgeCount > 0);
  const hasVoiceAndLanguage = Boolean(draft.language) && Boolean(draft.voice_id) && isVoiceCompatible;
  const hasPhone = Boolean(assignedNumber || draft.phone_number);
  const hasTest = Boolean(hasTestCompleted);

  const configuredCount = [hasName, hasInstructions, hasKnowledge, hasVoiceAndLanguage, hasPhone, hasTest].filter(Boolean).length;

  return (
    <aside className={s.inspectorCard} aria-label="Agent preview">
      {/* Header */}
      <div className={s.inspectorHeader}>
        <h3 className={s.inspectorTitle}>Agent preview</h3>
        <span className={s.draftBadge}>
          <span className={s.draftDot} />
          Draft
        </span>
      </div>

      {/* Profile Row */}
      <div className={s.agentProfileRow}>
        <div className={s.agentAvatar}>
          {initial}
        </div>
        <div className={s.agentNameRole}>
          <h4 className={s.agentNameText}>{agentName}</h4>
          <span className={s.agentRoleText}>{roleLabel}</span>
        </div>
      </div>

      {/* Quote Bubble */}
      <div className={s.quoteBox}>
        &ldquo;{draft.greeting || 'Hi, thanks for calling. How can I help you today?'}&rdquo;
      </div>

      {/* Configuration Metadata */}
      <div className={s.metadataList}>
        <div className={s.metadataRow}>
          <span className={s.metadataLabel}>
            <svg className={s.metadataIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Languages
          </span>
          <span className={s.metadataValue}>{languagesDisplay}</span>
        </div>

        <div className={s.metadataRow}>
          <span className={s.metadataLabel}>
            <svg className={s.metadataIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
            Voice
          </span>
          <span className={s.metadataValue}>{voiceDisplay}</span>
        </div>

        <div className={s.metadataRow}>
          <span className={s.metadataLabel}>
            <svg className={s.metadataIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Knowledge
          </span>
          <span className={knowledgeCount && knowledgeCount > 0 ? s.metadataValueGreen : s.metadataValue}>
            {knowledgeDisplay}
          </span>
        </div>

        <div className={s.metadataRow}>
          <span className={s.metadataLabel}>
            <svg className={s.metadataIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Phone
          </span>
          <span className={s.metadataValue}>{phoneDisplay}</span>
        </div>
      </div>

      <div className={s.inspectorDivider} />

      {/* Readiness Section */}
      <div className={s.readinessHeader}>
        <span className={s.readinessTitle}>Readiness</span>
        <span className={s.readinessCount}>{configuredCount} of 6 configured</span>
      </div>

      <div className={s.checklistList}>
        <div className={`${s.checklistItem} ${hasName ? s.checklistItemCompleted : ''}`}>
          {hasName ? (
            <span className={s.checkIconCompleted}>✓</span>
          ) : (
            <span className={s.checkIconEmpty} />
          )}
          <span>Identity</span>
        </div>

        <div className={`${s.checklistItem} ${hasInstructions ? s.checklistItemCompleted : ''}`}>
          {hasInstructions ? (
            <span className={s.checkIconCompleted}>✓</span>
          ) : (
            <span className={s.checkIconEmpty} />
          )}
          <span>Instructions</span>
        </div>

        <div className={`${s.checklistItem} ${hasKnowledge ? s.checklistItemCompleted : ''}`}>
          {hasKnowledge ? (
            <span className={s.checkIconCompleted}>✓</span>
          ) : (
            <span className={s.checkIconEmpty} />
          )}
          <span>Knowledge</span>
        </div>

        <div className={`${s.checklistItem} ${hasVoiceAndLanguage ? s.checklistItemCompleted : ''}`}>
          {hasVoiceAndLanguage ? (
            <span className={s.checkIconCompleted}>✓</span>
          ) : (
            <span className={s.checkIconEmpty} />
          )}
          <span>Voice &amp; language</span>
        </div>

        <div className={`${s.checklistItem} ${hasPhone ? s.checklistItemCompleted : ''}`}>
          {hasPhone ? (
            <span className={s.checkIconCompleted}>✓</span>
          ) : (
            <span className={s.checkIconEmpty} />
          )}
          <span>Phone</span>
        </div>

        <div className={`${s.checklistItem} ${hasTest ? s.checklistItemCompleted : ''}`}>
          {hasTest ? (
            <span className={s.checkIconCompleted}>✓</span>
          ) : (
            <span className={s.checkIconEmpty} />
          )}
          <span>Test</span>
        </div>
      </div>

      {/* Information Tip Box */}
      <div className={s.infoCalloutBox}>
        <svg className={s.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>Complete the remaining steps to test and deploy your agent.</span>
      </div>
    </aside>
  );
}
