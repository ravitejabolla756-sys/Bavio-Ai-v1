'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Draft, Voice } from '../types';
import s from '../create-agent.module.css';

interface LanguageOption {
  code: string;
  name: string;
}

const ALL_LANGUAGES: LanguageOption[] = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-IN', name: 'English (India)' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'hi-en', name: 'Hinglish' },
  { code: 'te-IN', name: 'Telugu' },
  { code: 'ta-IN', name: 'Tamil' },
];

interface Props {
  draft: Draft;
  onChange: (key: keyof Draft, val: any) => void;
  voices: Voice[];
  voiceError: boolean;
  onRetryVoices?: () => void;
  onNavigateStep: (step: any) => void;
}

export default function VoiceLanguageStep({
  draft,
  onChange,
  voices,
  voiceError,
  onRetryVoices,
  onNavigateStep,
}: Props) {
  const [genderTab, setGenderTab] = useState<'male' | 'female'>('female');
  const [langSearchQuery, setLangSearchQuery] = useState('');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioState, setAudioState] = useState<'idle' | 'generating' | 'playing' | 'failed'>('idle');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close language dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter languages by search query
  const filteredLanguages = ALL_LANGUAGES.filter(
    l => l.name.toLowerCase().includes(langSearchQuery.toLowerCase()) || l.code.toLowerCase().includes(langSearchQuery.toLowerCase())
  );

  // Current primary language name
  const currentLangObj = ALL_LANGUAGES.find(l => l.code === draft.language) || { code: draft.language, name: draft.language };

  // Compatible voices for current primary language
  const compatibleVoices = voices.filter(v => {
    if (!v.supportedLanguages || v.supportedLanguages.length === 0) return true;
    return v.supportedLanguages.includes(draft.language);
  });

  // Check if selected voice is compatible
  const selectedVoiceObj = voices.find(v => v.id === draft.voice_id || v.voice_id === draft.voice_id);
  const isSelectedVoiceIncompatible = selectedVoiceObj
    ? Boolean(selectedVoiceObj.supportedLanguages && !selectedVoiceObj.supportedLanguages.includes(draft.language))
    : false;

  // Auto-reset voice selection if selected voice becomes incompatible when primary language changes
  useEffect(() => {
    if (draft.voice_id && isSelectedVoiceIncompatible) {
      onChange('voice_id', '');
    }
  }, [draft.language, draft.voice_id, isSelectedVoiceIncompatible, onChange]);

  // Gender filtered voices
  const maleVoices = compatibleVoices.filter(v => v.gender === 'male');
  const femaleVoices = compatibleVoices.filter(v => v.gender === 'female');
  const displayedVoices = genderTab === 'male' ? maleVoices : femaleVoices;

  // Real Audio Preview player handler
  function handlePlayPreview(voice: Voice) {
    const vId = voice.id || voice.voice_id || '';
    if (!vId) return;

    if (playingVoiceId === vId && audioState === 'playing') {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingVoiceId(null);
      setAudioState('idle');
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setPlayingVoiceId(vId);
    setAudioState('generating');

    const previewUrl = `/api/voice/preview/${encodeURIComponent(vId)}?language=${encodeURIComponent(draft.language)}`;
    const audio = new Audio(previewUrl);
    audioRef.current = audio;

    audio.oncanplay = () => {
      setAudioState('playing');
      audio.play().catch(() => setAudioState('failed'));
    };

    audio.onended = () => {
      setAudioState('idle');
      setPlayingVoiceId(null);
    };

    audio.onerror = () => {
      setAudioState('failed');
    };

    audio.load();
  }

  // Toggle additional language selection
  function toggleAdditionalLanguage(code: string) {
    if (code === draft.language) return; // primary language cannot be additional
    const currentList = draft.languages || [draft.language];
    if (currentList.includes(code)) {
      onChange('languages', currentList.filter(c => c !== code));
    } else {
      onChange('languages', [...currentList, code]);
    }
  }

  return (
    <div className={s.stepContent}>
      <div className={s.stepHeader}>
        <h2 className={s.stepNumberTitle}>4. Voice &amp; language</h2>
        <p className={s.stepDescription}>
          Choose the languages and voice for {draft.name.trim() || 'your agent'}. You can add more languages later.
        </p>
      </div>

      <div className={s.fieldsGrid}>
        {/* ── 1. PRIMARY & ADDITIONAL LANGUAGES SELECTOR ───────────────────── */}
        <div className={s.fieldGroup} ref={langDropdownRef}>
          <label className={s.fieldLabel}>Primary language</label>
          <div className={s.selectControlWrapper} onClick={() => setLangDropdownOpen(o => !o)}>
            <div className={s.selectControl} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span className="text-sm font-medium">{currentLangObj.name} ({currentLangObj.code})</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: langDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* Searchable Language Dropdown Menu */}
          {langDropdownOpen && (
            <div style={{ position: 'absolute', zIndex: 50, marginTop: '4px', width: '100%', maxWidth: '360px', background: 'var(--color-surface, #fff)', border: '1px solid var(--color-line, #e5e7eb)', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '8px' }}>
              <input
                type="text"
                placeholder="Search language name or code…"
                value={langSearchQuery}
                onChange={e => setLangSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid var(--color-line, #e5e7eb)', borderRadius: '6px', outline: 'none', background: 'var(--color-canvas, #fafafa)', color: 'var(--color-ink, #111)' }}
              />
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '6px' }}>
                {filteredLanguages.map(l => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      onChange('language', l.code);
                      setLangDropdownOpen(false);
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 12px', fontSize: '13px', border: 'none', background: l.code === draft.language ? 'var(--color-saffron-subtle, rgba(249,115,22,0.1))' : 'transparent', color: 'var(--color-ink, #111)', cursor: 'pointer', borderRadius: '4px', textAlign: 'left' }}
                  >
                    <span>{l.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-ink-tertiary, #9ca3af)', fontFamily: 'monospace' }}>{l.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Additional Languages Multiselect */}
        <div className={s.fieldGroup}>
          <label className={s.fieldLabel}>Additional supported languages</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
            {ALL_LANGUAGES.filter(l => l.code !== draft.language).map(l => {
              const selected = (draft.languages || []).includes(l.code);
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => toggleAdditionalLanguage(l.code)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', borderRadius: '16px', border: selected ? '1px solid var(--color-saffron, #f97316)' : '1px solid var(--color-line, #e5e7eb)', background: selected ? 'color-mix(in srgb, var(--color-saffron, #f97316) 10%, transparent)' : 'var(--color-surface, #fff)', color: selected ? 'var(--color-saffron, #f97316)' : 'var(--color-ink-secondary, #4b5563)', cursor: 'pointer', fontWeight: selected ? 600 : 400 }}
                >
                  <span>{l.name}</span>
                  {selected && <span>✓</span>}
                </button>
              );
            })}
          </div>
          <p className={s.fieldHelperText}>Select secondary languages your agent can detect and converse in.</p>
        </div>

        {/* ── 2. VOICE SELECTION & GENDER FILTER ──────────────────────────── */}
        <div className={s.fieldGroup} style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
            <label className={s.fieldLabel} style={{ marginBottom: 0 }}>Voice selection</label>

            {/* Male / Female Gender Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--color-canvas, #f3f4f6)', padding: '3px', borderRadius: '6px', border: '1px solid var(--color-line, #e5e7eb)' }}>
              <button
                type="button"
                onClick={() => setGenderTab('female')}
                style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 600, border: 'none', borderRadius: '4px', cursor: 'pointer', background: genderTab === 'female' ? 'var(--color-surface, #fff)' : 'transparent', color: genderTab === 'female' ? 'var(--color-ink, #111)' : 'var(--color-ink-tertiary, #6b7280)', boxShadow: genderTab === 'female' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              >
                Female ({femaleVoices.length})
              </button>
              <button
                type="button"
                onClick={() => setGenderTab('male')}
                style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 600, border: 'none', borderRadius: '4px', cursor: 'pointer', background: genderTab === 'male' ? 'var(--color-surface, #fff)' : 'transparent', color: genderTab === 'male' ? 'var(--color-ink, #111)' : 'var(--color-ink-tertiary, #6b7280)', boxShadow: genderTab === 'male' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              >
                Male ({maleVoices.length})
              </button>
            </div>
          </div>

          {/* Provider Failure / Voice Error Card */}
          {voiceError ? (
            <div style={{ borderLeft: '3px solid #ef4444', background: 'rgba(239,68,68,0.06)', padding: '16px', borderRadius: '6px', margin: '8px 0' }}>
              <strong style={{ fontSize: '13px', color: '#dc2626', display: 'block' }}>Voice service is temporarily unavailable.</strong>
              <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary, #4b5563)', marginTop: '4px' }}>
                We couldn't load the voice catalog right now. Please check connection and retry.
              </p>
              {onRetryVoices && (
                <button
                  type="button"
                  onClick={onRetryVoices}
                  style={{ marginTop: '10px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, background: 'var(--color-saffron, #f97316)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Retry
                </button>
              )}
            </div>
          ) : displayedVoices.length === 0 ? (
            <div style={{ border: '1px dashed var(--color-line, #e5e7eb)', padding: '20px', textAlign: 'center', color: 'var(--color-ink-tertiary, #9ca3af)', fontSize: '13px' }}>
              No {genderTab} voices available for {currentLangObj.name}.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {displayedVoices.map(voice => {
                const vId = voice.id || voice.voice_id || '';
                const isSelected = draft.voice_id === vId;
                const isPlaying = playingVoiceId === vId && audioState === 'playing';
                const isGenerating = playingVoiceId === vId && audioState === 'generating';

                return (
                  <div
                    key={vId}
                    onClick={() => onChange('voice_id', vId)}
                    style={{
                      border: isSelected ? '2px solid var(--color-saffron, #f97316)' : '1px solid var(--color-line, #e5e7eb)',
                      background: isSelected ? 'color-mix(in srgb, var(--color-saffron, #f97316) 5%, var(--color-surface, #fff))' : 'var(--color-surface, #fff)',
                      borderRadius: '8px',
                      padding: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-ink, #111)' }}>{voice.name || voice.voice_display_name}</span>
                          <span style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--color-canvas, #f3f4f6)', color: 'var(--color-ink-secondary, #4b5563)', borderRadius: '4px', fontWeight: 600, textTransform: 'capitalize' }}>
                            {voice.tone || 'Friendly'}
                          </span>
                        </div>
                        {isSelected && (
                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--color-saffron, #f97316)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                            ✓
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary, #4b5563)', marginTop: '6px', lineHeight: '1.4' }}>
                        {voice.description || 'Natural, expressive voice'}
                      </p>
                    </div>

                    {/* Audio Preview Action Button */}
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-line, #f3f4f6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-ink-tertiary, #9ca3af)' }}>
                        {voice.supportedLanguages?.map(c => c.split('-')[0].toUpperCase()).join(', ')}
                      </span>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handlePlayPreview(voice);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '4px',
                          border: '1px solid var(--color-line, #e5e7eb)',
                          background: isPlaying ? 'var(--color-saffron, #f97316)' : 'var(--color-canvas, #f9fafb)',
                          color: isPlaying ? '#fff' : 'var(--color-ink, #111)',
                          cursor: 'pointer',
                        }}
                      >
                        {isGenerating ? (
                          <span>Generating…</span>
                        ) : isPlaying ? (
                          <span>⏸ Pause preview</span>
                        ) : (
                          <span>▶ Play preview</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Incompatible Voice Notice */}
          {isSelectedVoiceIncompatible && (
            <p className={s.fieldHelperText} style={{ color: '#ef4444', marginTop: '8px' }}>
              This voice does not support the selected language. Please pick a compatible voice above.
            </p>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className={s.bottomActionBar}>
        <button type="button" className={s.cancelButton} onClick={() => onNavigateStep('knowledge')}>
          ← Knowledge
        </button>
        <button
          type="button"
          className={s.continueButton}
          onClick={() => onNavigateStep('deployment')}
          disabled={!draft.voice_id || !draft.language}
        >
          Continue to Phone assignment →
        </button>
      </div>
    </div>
  );
}
