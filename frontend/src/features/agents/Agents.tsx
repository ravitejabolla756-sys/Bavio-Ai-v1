'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { billingApi, numbersApi, getClientId, type PhoneNumber } from '@/lib/api';
import {
  blank,
  countKnowledgeSources,
  draftOf,
  listAgents,
  listVoices,
  persistAgent,
  loadSavedDraft,
  saveLocalDraft,
  clearLocalDraft,
  type Agent,
  type Draft,
  type Voice,
} from './service';
import type { StepKey } from './types';
import AgentFields, { sections, type Section } from './AgentFields';
import CreateAgentStepper from './CreateAgentStepper';
import AgentPreviewInspector from './AgentPreviewInspector';
import TestPanel from './TestPanel';
import { languageLabel, updatedLabel } from './presentation';
import { isLocalUiPreviewSession } from '@/lib/local-ui-preview';
import sList from './agents.module.css';
import sCreate from './create-agent.module.css';

type SubscriptionState = 'loading' | 'active' | 'inactive' | 'error';

function agentStatus(agent: Agent) {
  if (!agent.id) return 'Unavailable';
  if (!agent.name?.trim() || !agent.system_prompt?.trim() || !(agent.voice_id || agent.voice)) return 'Needs setup';
  return agent.is_active === false ? 'Draft' : 'Ready';
}

function voiceName(agent: Agent, voices: Voice[]) {
  if (!agent.voice_id && !agent.voice) return 'No voice selected';
  return voices.find(voice => voice.voice_id === (agent.voice_id || agent.voice))?.voice_display_name || 'Voice unavailable';
}

type PendingLeave = { kind: 'back' } | { kind: 'link'; href: string };

export default function Agents() {
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>('loading');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voiceError, setVoiceError] = useState(false);
  const [knowledgeCount, setKnowledgeCount] = useState<number | null>(null);
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [numberError, setNumberError] = useState(false);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank);
  const [baseline, setBaseline] = useState<Draft>(blank);
  const [section, setSection] = useState<Section>('identity');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('No changes');
  const [saveDetail, setSaveDetail] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [discardPrompt, setDiscardPrompt] = useState<PendingLeave | null>(null);
  const [hasTestCompleted, setHasTestCompleted] = useState(false);
  const modalRef = useRef<HTMLDialogElement>(null);
  const dirty = editing && JSON.stringify(draft) !== JSON.stringify(baseline);

  async function checkSubscription() {
    setSubscriptionState('loading');
    try {
      if (isLocalUiPreviewSession()) {
        setSubscriptionState('inactive');
        return;
      }
      const clientId = getClientId();
      if (!clientId) {
        setSubscriptionState('inactive');
        return;
      }
      const status = await billingApi.getStatus(clientId);
      const billing = status?.client || status?.data || (status as any)?.subscription || status || {};
      const subStatus = String(billing.subscription_status || billing.subscriptionStatus || billing.status || '').toLowerCase();
      setSubscriptionState(subStatus === 'active' ? 'active' : 'inactive');
    } catch {
      setSubscriptionState('error');
    }
  }

  async function reload() {
    setLoading(true);
    setLoadError('');
    try {
      setAgents(isLocalUiPreviewSession() ? [] : await listAgents());
    } catch {
      setLoadError('Agents could not be loaded. Please retry.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void checkSubscription();
    void reload();
    void listVoices().then(rows => {
      setVoices(rows);
      setVoiceError(rows.length === 0);
    }).catch(() => setVoiceError(true));
    void countKnowledgeSources().then(count => {
      setKnowledgeCount(isLocalUiPreviewSession() ? null : count);
    }).catch(() => setKnowledgeCount(null));
    const client = getClientId();
    if (client) {
      void numbersApi.list(client).then(setNumbers).catch(() => setNumberError(true));
    }
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const navigate = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      if (!link || link.getAttribute('target') === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      event.stopPropagation();
      setDiscardPrompt({ kind: 'link', href: link.href });
    };
    window.addEventListener('click', navigate, true);
    return () => window.removeEventListener('click', navigate, true);
  }, [dirty]);

  useEffect(() => {
    const dialog = modalRef.current;
    if (!discardPrompt) {
      dialog?.close();
      return;
    }
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previousFocus?.focus();
    };
  }, [discardPrompt]);

  function open(agent: Agent | null) {
    if (subscriptionState !== 'active' && !agent) {
      return;
    }
    setSelected(agent);
    if (agent) {
      const value = draftOf(agent);
      setDraft(value);
      setBaseline(value);
    } else {
      // Check for saved local draft first
      const saved = loadSavedDraft();
      const initial = saved || { ...blank };
      setDraft(initial);
      setBaseline(initial);
    }
    setSection('identity');
    setEditing(true);
    setHasTestCompleted(false);
    setSaveMessage('No changes');
    setSaveDetail('');
    setSaveFailed(false);
  }

  function change<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft(previous => {
      const updated = { ...previous, [key]: value };
      // Save local draft on each change
      saveLocalDraft(updated);
      return updated;
    });
    setSaveMessage('Unsaved changes');
    setSaveDetail('');
    setSaveFailed(false);
  }

  async function handleSaveDraft() {
    saveLocalDraft(draft);
    setSaveMessage('Saved');
    setSaveFailed(false);

    // If fully configured, also attempt to persist to backend
    if (draft.name.trim() && draft.system_prompt.trim() && draft.voice_id) {
      setSaving(true);
      try {
        const agent = await persistAgent(selected?.id || null, draft);
        setSelected(agent);
        const persisted = draftOf(agent);
        setDraft(persisted);
        setBaseline(persisted);
        setAgents(previous => [agent, ...previous.filter(a => a.id !== agent.id)]);
        setSaveMessage('Saved');
      } catch {
        // Retain local save status
      } finally {
        setSaving(false);
      }
    }
  }

  async function save(): Promise<boolean> {
    if (saving) return false;
    if (!draft.name.trim() || draft.name.length > 120) {
      setSaveFailed(true);
      setSaveMessage('Save failed');
      setSaveDetail('Enter a valid agent name before saving.');
      return false;
    }
    setSaving(true);
    setSaveFailed(false);
    setSaveMessage('Saving…');
    setSaveDetail('');
    try {
      const agent = await persistAgent(selected?.id || null, draft);
      setSelected(agent);
      const persisted = draftOf(agent);
      setDraft(persisted);
      setBaseline(persisted);
      clearLocalDraft();
      setAgents(previous => [agent, ...previous.filter(a => a.id !== agent.id)]);
      setSaveMessage('Saved');
      return true;
    } catch {
      setSaveFailed(true);
      setSaveMessage('Save failed');
      setSaveDetail('Save could not be confirmed. Your changes are stored locally.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveAndGetAgent(): Promise<Agent | null> {
    if (!draft.name.trim() || draft.name.length > 120) return null;
    try {
      const agent = await persistAgent(selected?.id || null, draft);
      setSelected(agent);
      const persisted = draftOf(agent);
      setDraft(persisted);
      setBaseline(persisted);
      clearLocalDraft();
      setAgents(previous => [agent, ...previous.filter(a => a.id !== agent.id)]);
      return agent;
    } catch {
      return null;
    }
  }

  function handleCancel() {
    if (!dirty) {
      setEditing(false);
    } else {
      setDiscardPrompt({ kind: 'back' });
    }
  }

  function leaveAfterDiscard() {
    const pending = discardPrompt;
    setDiscardPrompt(null);
    if (!pending) return;
    if (pending.kind === 'back') {
      clearLocalDraft();
      setEditing(false);
    } else {
      window.location.assign(pending.href);
    }
  }

  async function saveAndContinue() {
    if (await save()) leaveAfterDiscard();
  }

  const assigned = selected ? numbers.find(n => n.assistant_id === selected.id)?.id || '' : '';
  const selectedVoice = voices.find(v => v.voice_id === draft.voice_id);
  const canTest = Boolean(draft.name.trim() && draft.system_prompt.trim() && draft.name.length <= 120 && selectedVoice && !voiceError);
  const visibleAgents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return query ? agents.filter(agent => `${agent.name} ${agent.language || ''}`.toLowerCase().includes(query)) : agents;
  }, [agents, searchQuery]);

  // Compute completed steps for horizontal progress navigation
  const completedSteps = useMemo(() => {
    const set = new Set<StepKey>();
    if (draft.name.trim().length > 0 && draft.description.trim().length > 0) {
      set.add('identity');
    }
    if (draft.system_prompt.trim().length > 0) {
      set.add('instructions');
    }
    if (knowledgeCount !== null && knowledgeCount > 0) {
      set.add('knowledge');
    }
    if (draft.voice_id) {
      set.add('voice');
    }
    if (assigned || draft.phone_number) {
      set.add('deployment');
    }
    if (hasTestCompleted) {
      set.add('test');
    }
    return set;
  }, [draft, knowledgeCount, assigned, hasTestCompleted]);

  // ─────────────────────────────────────────────────────────────
  // 1. EDITING / CREATE AGENT VIEW (CANONICAL 6-STEP EXPERIENCE)
  // ─────────────────────────────────────────────────────────────
  if (editing) {
    const assignedNumber = numbers.find(n => n.id === assigned)?.number;

    return (
      <div className={sCreate.container}>
        {/* Top bar with back link, meta, and Save draft */}
        <div className={sCreate.topNav}>
          <button type="button" className={sCreate.backLink} onClick={handleCancel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            All agents
          </button>

          <div className={sCreate.headerMetaRight}>
            <div className={sCreate.metaStatusList}>
              <span>Voice agent</span>
              <span className={sCreate.metaDot}>•</span>
              <span>{languageLabel(draft.language)}</span>
              <span className={sCreate.metaDot}>•</span>
              <span>{numberError ? 'Assignments unavailable' : assignedNumber || 'No number assigned'}</span>
            </div>

            <button
              type="button"
              className={sCreate.saveDraftButton}
              disabled={saving}
              onClick={handleSaveDraft}
            >
              {saving ? 'Saving…' : saveMessage === 'Saved' ? 'Draft saved' : 'Save draft'}
            </button>
          </div>
        </div>

        {/* Title Section */}
        <div className={sCreate.headerTitleSection}>
          <h1 className={sCreate.pageTitle}>Create agent</h1>
          <p className={sCreate.pageSubtitle}>
            Build an AI voice agent for your business in a few simple steps.
          </p>
        </div>

        {/* 6-Step Horizontal Progress Navigation */}
        <CreateAgentStepper
          currentStep={section as StepKey}
          onSelectStep={step => setSection(step)}
          completedSteps={completedSteps}
        />

        {/* 2-Column Main Layout */}
        <div className={sCreate.mainGrid}>
          {/* Central Content */}
          <div className={sCreate.stepContentColumn}>
            {section === 'test' ? (
              <TestPanel
                key={selected?.id || 'new'}
                draft={draft}
                voice={selectedVoice}
                agent={selected}
                assignedNumber={assignedNumber}
                enabled={canTest}
                onNavigateToPhone={() => setSection('deployment')}
                onSaveAgent={saveAndGetAgent}
                onTestCompleted={() => setHasTestCompleted(true)}
              />
            ) : (
              <AgentFields
                section={section}
                draft={draft}
                set={change}
                creating={!selected}
                voices={voices}
                voiceError={voiceError}
                onRetryVoices={() => {
                  setVoiceError(false);
                  void listVoices().then(rows => {
                    setVoices(rows);
                    setVoiceError(rows.length === 0);
                  }).catch(() => setVoiceError(true));
                }}
                knowledgeCount={knowledgeCount}
                numbers={numbers}
                numberError={numberError}
                assigned={assigned}
                onNavigateStep={step => setSection(step)}
                onCancel={handleCancel}
                onSaveDraft={handleSaveDraft}
              />
            )}
          </div>

          {/* Right Inspector */}
          <AgentPreviewInspector
            draft={draft}
            voices={voices}
            knowledgeCount={knowledgeCount}
            assignedNumber={assignedNumber}
            hasTestCompleted={hasTestCompleted}
          />
        </div>

        {/* Unsaved Changes Dialog */}
        {discardPrompt && (
          <dialog
            ref={modalRef}
            className={sList.modal}
            aria-labelledby="unsaved-title"
            aria-describedby="unsaved-description"
            onCancel={event => {
              event.preventDefault();
              if (!saving) setDiscardPrompt(null);
            }}
          >
            <h2 id="unsaved-title">Unsaved changes</h2>
            <p id="unsaved-description">You have changes that haven&apos;t been saved.</p>
            {saveDetail && <p role="alert">{saveDetail}</p>}
            <div className={sList.modalActions}>
              <button autoFocus disabled={saving} onClick={() => setDiscardPrompt(null)}>
                Stay here
              </button>
              <button disabled={saving} onClick={leaveAfterDiscard}>
                Discard changes
              </button>
              <button disabled={saving} className={sList.primary} onClick={() => void saveAndContinue()}>
                {saving ? 'Saving…' : 'Save & continue'}
              </button>
            </div>
          </dialog>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. AGENTS LIST REGISTER (WHEN NOT CREATING/EDITING)
  // ─────────────────────────────────────────────────────────────
  return (
    <section className={sList.root} aria-labelledby="agents-title">
      <div className={sList.eyebrow}>Build / Agents</div>
      <header className={sList.header}>
        <div>
          <h1 id="agents-title">Agents</h1>
          {subscriptionState === 'inactive' ? (
            <p>AI voice agents that answer, understand, and act for your business.</p>
          ) : (
            <p>AI voice agents that define how Bavio handles your conversations.</p>
          )}
        </div>
        <div className={sList.utilities}>
          {subscriptionState === 'active' && agents.length > 1 && (
            <label className={sList.search}>
              <span className="sr-only">Search agents</span>
              <input
                aria-label="Search agents"
                placeholder="Search agents"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
              />
            </label>
          )}
          {subscriptionState === 'active' && (
            <button className={sList.primary} onClick={() => open(null)}>
              Create agent
            </button>
          )}
        </div>
      </header>

      {subscriptionState === 'loading' ? (
        <div className={sList.loadingSkeleton}>
          <p role="status">Verifying workspace status…</p>
        </div>
      ) : subscriptionState === 'error' ? (
        <div className={sList.errorState} role="alert">
          <h2>Unable to verify workspace subscription</h2>
          <p>We couldn&apos;t confirm whether this workspace is active.</p>
          <button onClick={() => { void checkSubscription(); void reload(); }}>
            Retry
          </button>
        </div>
      ) : subscriptionState === 'inactive' ? (
        <div className={sList.activation}>
          <h2>Workspace activation required</h2>
          <p>Choose a subscription before creating your first Bavio AI agent.</p>
          <p>Once your workspace is active, you can configure the agent&apos;s identity, instructions, business knowledge, voice, phone number, and test it before going live.</p>
          <Link href="/dashboard/billing/plans" className={sList.activationCta}>
            Choose a plan →
          </Link>
          <p className={sList.activationMeta}>Your agent setup begins after workspace activation.</p>
        </div>
      ) : loading ? (
        <p role="status">Loading agents…</p>
      ) : loadError ? (
        <div role="alert">
          <p>{loadError}</p>
          <button onClick={() => void reload()}>Retry</button>
        </div>
      ) : agents.length === 0 ? (
        <div className={sList.empty}>
          <h2>Create your first agent</h2>
          <p>Build the AI employee that will answer calls, understand customers, use your business knowledge, and take supported actions.</p>
          <button className={sList.primary} onClick={() => open(null)}>
            Create agent →
          </button>
        </div>
      ) : (
        <div className={sList.list}>
          <div className={sList.listHeading}>
            <h2>Agent register</h2>
            <span>{visibleAgents.length} of {agents.length}</span>
          </div>
          {visibleAgents.length ? (
            visibleAgents.map(agent => (
              <button className={sList.agentRow} key={agent.id} onClick={() => open(agent)}>
                <div className={sList.agentIdentity}>
                  <strong>{agent.name || 'Agent name unavailable'}</strong>
                  <small>{agentStatus(agent)}</small>
                </div>
                <span>
                  <small>Language</small>
                  {languageLabel(agent.language)}
                </span>
                <span>
                  <small>Voice</small>
                  {voiceName(agent, voices)}
                </span>
                <span>
                  <small>Phone assignment</small>
                  {numberError ? 'Unavailable' : numbers.find(n => n.assistant_id === agent.id)?.number || 'No number assigned'}
                </span>
                <span>
                  <small>Last updated</small>
                  {updatedLabel(agent.updated_at) || 'Unavailable'}
                </span>
                <span className={sList.rowArrow} aria-hidden="true">→</span>
              </button>
            ))
          ) : (
            <p className={sList.emptySearch}>No agents match “{searchQuery}”.</p>
          )}
        </div>
      )}
    </section>
  );
}
