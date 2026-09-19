'use client';

import React, { useState } from 'react';
import type { Draft } from '../types';
import { ROLE_OPTIONS, BUSINESS_TYPE_OPTIONS, TONE_OPTIONS } from '../types';
import s from '../create-agent.module.css';

interface Props {
  draft: Draft;
  onChange: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  onContinue: () => void;
  onCancel: () => void;
}

export default function IdentityStep({ draft, onChange, onContinue, onCancel }: Props) {
  const [nameTouched, setNameTouched] = useState(false);
  const [descTouched, setDescTouched] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const nameLength = draft.name.length;
  const descLength = draft.description.length;

  const isNameInvalid = (nameTouched && !draft.name.trim()) || nameLength > 120;
  const isDescInvalid = descTouched && !draft.description.trim();

  const handleToneToggle = (toneItem: string) => {
    const currentTones = draft.tone || [];
    if (currentTones.includes(toneItem)) {
      onChange('tone', currentTones.filter(t => t !== toneItem));
    } else {
      if (currentTones.length >= 2) {
        // Replace second or add up to 2
        onChange('tone', [currentTones[0], toneItem]);
      } else {
        onChange('tone', [...currentTones, toneItem]);
      }
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setDescTouched(true);

    if (!draft.name.trim() || draft.name.length > 120) {
      return;
    }
    if (!draft.description.trim()) {
      return;
    }
    onContinue();
  };

  return (
    <form onSubmit={handleContinue} className={s.stepContentColumn}>
      {/* Header */}
      <div className={s.stepHeader}>
        <h2 className={s.stepNumberTitle}>1. Identity</h2>
        <p className={s.stepDescription}>
          Define who this agent is and how it represents your business.
        </p>
      </div>

      {/* Fields */}
      <div className={s.fieldsGrid}>
        {/* Row 1: Agent name & Role */}
        <div className={s.rowTwoCol}>
          <div className={s.fieldGroup}>
            <label htmlFor="agent-name-input" className={s.fieldLabel}>
              Agent name <span className={s.requiredStar}>*</span>
            </label>
            <input
              id="agent-name-input"
              type="text"
              required
              maxLength={120}
              className={s.inputControl}
              value={draft.name}
              onChange={e => onChange('name', e.target.value)}
              onBlur={() => setNameTouched(true)}
              placeholder="e.g. Vikram"
              aria-invalid={isNameInvalid}
              autoComplete="off"
            />
            <div className={s.charCounterRight}>
              {nameLength}/120
            </div>
            {isNameInvalid && (
              <p className={s.fieldHelperText} style={{ color: '#EF4444' }}>
                Agent name is required (max 120 characters).
              </p>
            )}
          </div>

          <div className={s.fieldGroup}>
            <label htmlFor="agent-role-select" className={s.fieldLabel}>
              Role <span className={s.requiredStar}>*</span>
            </label>
            <div className={s.selectControlWrapper}>
              <svg className={s.selectLeftIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <select
                id="agent-role-select"
                required
                className={s.selectControl}
                value={draft.role}
                onChange={e => onChange('role', e.target.value)}
              >
                {ROLE_OPTIONS.map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <svg className={s.selectRightIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            <p className={s.fieldHelperText}>
              Choose the primary role for this agent.
            </p>
          </div>
        </div>

        {/* Row 2: Business type */}
        <div className={s.fieldGroup}>
          <label htmlFor="agent-business-type-select" className={s.fieldLabel}>
            Business type
          </label>
          <div className={s.selectControlWrapper}>
            <svg className={s.selectLeftIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <select
              id="agent-business-type-select"
              className={s.selectControl}
              value={draft.business_type}
              onChange={e => onChange('business_type', e.target.value)}
            >
              {BUSINESS_TYPE_OPTIONS.map(bizType => (
                <option key={bizType} value={bizType}>
                  {bizType}
                </option>
              ))}
            </select>
            <svg className={s.selectRightIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <p className={s.fieldHelperText}>
            Helps tailor the agent&apos;s responses to your industry.
          </p>
        </div>

        {/* Row 3: Short description */}
        <div className={s.fieldGroup}>
          <label htmlFor="agent-description-input" className={s.fieldLabel}>
            Short description <span className={s.requiredStar}>*</span>
          </label>
          <textarea
            id="agent-description-input"
            required
            maxLength={500}
            className={s.textareaControl}
            value={draft.description}
            onChange={e => onChange('description', e.target.value)}
            onBlur={() => setDescTouched(true)}
            placeholder="A brief summary of what this agent handles..."
            rows={3}
          />
          <div className={s.fieldMetaRow}>
            <span className={s.fieldHelperText}>
              A brief summary of what this agent does.
            </span>
            <span className={s.charCounterRight}>
              {descLength}/500
            </span>
          </div>
          {isDescInvalid && (
            <p className={s.fieldHelperText} style={{ color: '#EF4444' }}>
              Please provide a short description for this agent.
            </p>
          )}
        </div>

        {/* Row 4: Tone */}
        <div className={s.toneSection}>
          <div className={s.toneTitle}>Tone</div>
          <div className={s.toneSubtitle}>
            Select 1–2 tones that match your brand voice.
          </div>
          <div className={s.tonePillsRow} role="group" aria-label="Select tones">
            {TONE_OPTIONS.map(toneOption => {
              const isSelected = draft.tone?.includes(toneOption);
              return (
                <button
                  type="button"
                  key={toneOption}
                  className={`${s.tonePill} ${isSelected ? s.tonePillSelected : ''}`}
                  onClick={() => handleToneToggle(toneOption)}
                  aria-pressed={isSelected}
                >
                  {isSelected && (
                    <svg className={s.checkMarkIcon} viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {toneOption}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 5: Additional details (optional disclosure) */}
        <div className={s.disclosureWrapper}>
          <button
            type="button"
            className={s.disclosureButton}
            onClick={() => setDetailsOpen(prev => !prev)}
            aria-expanded={detailsOpen}
          >
            <div>
              <div className={s.disclosureTitle}>Additional details (optional)</div>
              <p className={s.fieldHelperText}>
                Add extra context to improve how your agent represents your business.
              </p>
            </div>
            <svg
              className={`${s.disclosureChevron} ${detailsOpen ? s.disclosureChevronOpen : ''}`}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {detailsOpen && (
            <div className={s.disclosureContent}>
              <div className={s.fieldGroup}>
                <label htmlFor="agent-greeting-input" className={s.fieldLabel}>
                  Custom greeting
                </label>
                <input
                  id="agent-greeting-input"
                  type="text"
                  className={s.inputControl}
                  value={draft.greeting}
                  onChange={e => onChange('greeting', e.target.value)}
                  placeholder="Hi, thanks for calling. How can I help you today?"
                />
                <p className={s.fieldHelperText}>
                  The first phrase spoken by the agent when answering incoming calls.
                </p>
              </div>

              <div className={s.fieldGroup}>
                <label htmlFor="agent-additional-details-input" className={s.fieldLabel}>
                  Workspace & company context
                </label>
                <textarea
                  id="agent-additional-details-input"
                  className={s.textareaControl}
                  value={draft.additional_details}
                  onChange={e => onChange('additional_details', e.target.value)}
                  placeholder="Specific company policies, pronunciation guide, key staff names, or branch locations..."
                  rows={3}
                />
                <p className={s.fieldHelperText}>
                  Additional facts that help the voice agent stay context-aware during live customer calls.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className={s.bottomActionBar}>
        <button type="button" className={s.cancelButton} onClick={onCancel}>
          Cancel
        </button>

        <button type="submit" className={s.continueButton}>
          Continue
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </form>
  );
}
