'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { billingApi, numbersApi, getClientId, type PhoneNumber } from '@/lib/api';
import { blank, countKnowledgeSources, draftOf, listAgents, listVoices, persistAgent, type Agent, type Draft, type Voice } from './service';
import AgentFields, { sections, type Section } from './AgentFields';
import TestPanel from './TestPanel';
import { languageLabel, updatedLabel } from './presentation';
import { isLocalUiPreviewSession } from '@/lib/local-ui-preview';
import s from './agents.module.css';

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
    try { setAgents(isLocalUiPreviewSession() ? [] : await listAgents()); }
    catch { setLoadError('Agents could not be loaded. Please retry.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    void checkSubscription();
    void reload();
    void listVoices().then(rows => { setVoices(rows); setVoiceError(rows.length === 0); }).catch(() => setVoiceError(true));
    void countKnowledgeSources().then(count => setKnowledgeCount(isLocalUiPreviewSession() ? null : count)).catch(() => setKnowledgeCount(null));
    const client = getClientId();
    if (client) void numbersApi.list(client).then(setNumbers).catch(() => setNumberError(true));
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
      setDiscardPrompt({ kind: 'link', href: `${url.pathname}${url.search}${url.hash}` });
    };
    document.addEventListener('click', navigate, true);
    return () => document.removeEventListener('click', navigate, true);
  }, [dirty]);

  useEffect(() => {
    if (!discardPrompt) return;
    const dialog = modalRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => { dialog?.close(); previousFocus?.focus(); };
  }, [discardPrompt]);

  function open(agent: Agent | null) {
    if (subscriptionState !== 'active' && !agent) {
      return;
    }
    setSelected(agent);
    const value = agent ? draftOf(agent) : { ...blank };
    setDraft(value);
    setBaseline(value);
    setSection('identity');
    setEditing(true);
    setSaveMessage('No changes');
    setSaveDetail('');
    setSaveFailed(false);
  }

  function change(key: keyof Draft, value: string | boolean) {
    setDraft(previous => ({ ...previous, [key]: value }));
    setSaveMessage('Unsaved changes');
    setSaveDetail('');
    setSaveFailed(false);
  }

  async function save(): Promise<boolean> {
    if (saving) return false;
    if (!draft.name.trim() || draft.name.length > 120 || !draft.system_prompt.trim() || !voices.some(v => v.voice_id === draft.voice_id)) {
      setSaveFailed(true);
      setSaveMessage('Save failed');
      setSaveDetail('Enter an agent name, instructions, and a real voice before saving.');
      return false;
    }
    if (selected?.greeting && !draft.greeting.trim()) {
      setSaveFailed(true);
      setSaveMessage('Save failed');
      setSaveDetail('The current service cannot clear a stored greeting. Enter a replacement.');
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
      setAgents(previous => [agent, ...previous.filter(a => a.id !== agent.id)]);
      setSaveMessage('Saved');
      return true;
    } catch {
      setSaveFailed(true);
      setSaveMessage('Save failed');
      setSaveDetail('Save could not be confirmed. Your changes are still here. Check the agents list before retrying.');
      return false;
    } finally { setSaving(false); }
  }

  function leaveAfterDiscard() {
    const pending = discardPrompt;
    setDiscardPrompt(null);
    if (!pending) return;
    if (pending.kind === 'back') setEditing(false);
    else window.location.assign(pending.href);
  }

  async function saveAndContinue() { if (await save()) leaveAfterDiscard(); }

  const assigned = selected ? numbers.find(n => n.assistant_id === selected.id)?.id || '' : '';
  const selectedVoice = voices.find(v => v.voice_id === draft.voice_id);
  const canTest = Boolean(draft.name.trim() && draft.system_prompt.trim() && draft.name.length <= 120 && selectedVoice && !voiceError);
  const saveState = saving ? 'Saving…' : saveFailed ? 'Save failed' : dirty ? 'Unsaved changes' : saveMessage === 'Saved' ? 'Saved' : 'No changes';
  const visibleAgents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return query ? agents.filter(agent => `${agent.name} ${agent.language || ''}`.toLowerCase().includes(query)) : agents;
  }, [agents, searchQuery]);

  return <section className={s.root} aria-labelledby="agents-title">
    <div className={s.eyebrow}>Build / Agents</div>
    <header className={s.header}>
      <div>
        {editing && <button className={s.back} onClick={() => { if (!dirty) setEditing(false); else setDiscardPrompt({ kind: 'back' }); }}>← All agents</button>}
        <h1 id="agents-title">{editing ? selected?.name || 'Create agent' : 'Agents'}</h1>
        {editing ? (
          <div className={s.entityMeta}>
            <span>Voice agent</span>
            <span>{languageLabel(draft.language)}</span>
            <span>{numberError ? 'Assignments unavailable' : numbers.find(n => n.id === assigned)?.number || 'No number assigned'}</span>
          </div>
        ) : subscriptionState === 'inactive' ? (
          <p>AI voice agents that answer, understand, and act for your business.</p>
        ) : (
          <p>AI voice agents that define how Bavio handles your conversations.</p>
        )}
      </div>
      <div className={s.utilities}>
        {!editing && subscriptionState === 'active' && agents.length > 1 && (
          <label className={s.search}>
            <span className="sr-only">Search agents</span>
            <input aria-label="Search agents" placeholder="Search agents" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} />
          </label>
        )}
        {editing ? (
          <>
            <span role={saveFailed ? 'alert' : 'status'} className={s.saveState} data-error={saveFailed} data-saved={!dirty && saveMessage === 'Saved'}>
              {saveState}{saveDetail && <span className="sr-only"> {saveDetail}</span>}
            </span>
            <button className={s.primary} disabled={saving || (!dirty && !!selected)} onClick={() => void save()}>
              {saving ? 'Saving…' : selected ? 'Save changes' : 'Create agent'}
            </button>
          </>
        ) : subscriptionState === 'active' ? (
          <button className={s.primary} onClick={() => open(null)}>Create agent</button>
        ) : null}
      </div>
    </header>

    {editing && (
      <nav className={s.stepper} aria-label="Agent setup steps">
        {sections.map(([key, , label], index) => (
          <button key={key} type="button" className={section === key ? s.stepActive : ''} aria-current={section === key ? 'step' : undefined} onClick={() => setSection(key)}>
            <span>{index + 1}</span>
            <strong>{label}</strong>
          </button>
        ))}
      </nav>
    )}

    {editing && saveDetail && !discardPrompt && <p role="alert">{saveDetail}</p>}

    {!editing ? (
      subscriptionState === 'loading' ? (
        <div className={s.loadingSkeleton}>
          <p role="status">Verifying workspace status…</p>
        </div>
      ) : subscriptionState === 'error' ? (
        <div className={s.errorState} role="alert">
          <h2>Unable to verify workspace subscription</h2>
          <p>We couldn&apos;t confirm whether this workspace is active.</p>
          <button onClick={() => { void checkSubscription(); void reload(); }}>Retry</button>
        </div>
      ) : subscriptionState === 'inactive' ? (
        <div className={s.activation}>
          <h2>Workspace activation required</h2>
          <p>Choose a subscription before creating your first Bavio AI agent.</p>
          <p>Once your workspace is active, you can configure the agent&apos;s identity, instructions, business knowledge, voice, phone number, and test it before going live.</p>
          <Link href="/dashboard/billing/plans" className={s.activationCta}>
            Choose a plan →
          </Link>
          <p className={s.activationMeta}>Your agent setup begins after workspace activation.</p>
        </div>
      ) : loading ? (
        <p role="status">Loading agents…</p>
      ) : loadError ? (
        <div role="alert">
          <p>{loadError}</p>
          <button onClick={() => void reload()}>Retry</button>
        </div>
      ) : agents.length === 0 ? (
        <div className={s.empty}>
          <h2>Create your first agent</h2>
          <p>Build the AI employee that will answer calls, understand customers, use your business knowledge, and take supported actions.</p>
          <button className={s.primary} onClick={() => open(null)}>Create agent →</button>
        </div>
      ) : (
        <div className={s.list}>
          <div className={s.listHeading}>
            <h2>Agent register</h2>
            <span>{visibleAgents.length} of {agents.length}</span>
          </div>
          {visibleAgents.length ? (
            visibleAgents.map(agent => (
              <button className={s.agentRow} key={agent.id} onClick={() => open(agent)}>
                <div className={s.agentIdentity}>
                  <strong>{agent.name || 'Agent name unavailable'}</strong>
                  <small>{agentStatus(agent)}</small>
                </div>
                <span><small>Language</small>{languageLabel(agent.language)}</span>
                <span><small>Voice</small>{voiceName(agent, voices)}</span>
                <span><small>Phone assignment</small>{numberError ? 'Unavailable' : numbers.find(n => n.assistant_id === agent.id)?.number || 'No number assigned'}</span>
                <span><small>Last updated</small>{updatedLabel(agent.updated_at) || 'Unavailable'}</span>
                <span className={s.rowArrow} aria-hidden="true">→</span>
              </button>
            ))
          ) : (
            <p className={s.emptySearch}>No agents match “{searchQuery}”.</p>
          )}
        </div>
      )
    ) : (
      <div className={s.builder}>
        <fieldset className={s.config} disabled={saving}>
          {section === 'test' ? (
            <TestPanel key={selected?.id || 'new'} draft={draft} voice={selectedVoice} enabled={canTest} />
          ) : (
            <AgentFields
              section={section}
              draft={draft}
              set={change}
              creating={!selected}
              voices={voices}
              voiceError={voiceError}
              knowledgeCount={knowledgeCount}
              numbers={numbers}
              numberError={numberError}
              assigned={assigned}
            />
          )}
        </fieldset>
        {section !== 'test' && (
          <div className={s.desktopTest}>
            <TestPanel key={selected?.id || 'new'} draft={draft} voice={selectedVoice} activeSection={section} enabled={canTest} />
          </div>
        )}
      </div>
    )}

    {discardPrompt && (
      <dialog
        ref={modalRef}
        className={s.modal}
        aria-labelledby="unsaved-title"
        aria-describedby="unsaved-description"
        onCancel={event => { event.preventDefault(); if (!saving) setDiscardPrompt(null); }}
      >
        <h2 id="unsaved-title">Unsaved changes</h2>
        <p id="unsaved-description">You have changes that haven&apos;t been saved.</p>
        {saveDetail && <p role="alert">{saveDetail}</p>}
        <div className={s.modalActions}>
          <button autoFocus disabled={saving} onClick={() => setDiscardPrompt(null)}>Stay here</button>
          <button disabled={saving} onClick={leaveAfterDiscard}>Discard changes</button>
          <button disabled={saving} className={s.primary} onClick={() => void saveAndContinue()}>
            {saving ? 'Saving…' : 'Save & continue'}
          </button>
        </div>
      </dialog>
    )}
  </section>;
}
