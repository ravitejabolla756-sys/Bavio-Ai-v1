'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Info, Phone, Plus, ShieldWarning, Spinner, X } from '@phosphor-icons/react';
import { assistantsApi, getClientId, numbersApi, type Assistant, type AvailablePhoneNumber, type PhoneNumber } from '@/lib/api';

type InventoryState = 'idle' | 'loading' | 'ready' | 'empty' | 'unavailable';
type ProvisionState = 'idle' | 'provisioning' | 'connected' | 'failed';

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function capabilityLabels(item: AvailablePhoneNumber) {
  const capabilities = item.capabilities;
  if (!capabilities) return [];
  return [
    capabilities.voice ? 'Voice' : null,
    capabilities.sms ? 'SMS' : null,
    capabilities.mms ? 'MMS' : null,
    capabilities.inbound ? 'Inbound' : null,
    capabilities.outbound ? 'Outbound' : null,
  ].filter((value): value is string => Boolean(value));
}

export default function PhoneNumbersDashboardPage() {
  const clientId = getClientId();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);
  const [isBuyOpen, setIsBuyOpen] = useState(false);
  const [isExternalOpen, setIsExternalOpen] = useState(false);
  const [buyStep, setBuyStep] = useState<1 | 2 | 3 | 4>(1);
  const [buyCountry, setBuyCountry] = useState('US');
  const [availableNumbers, setAvailableNumbers] = useState<AvailablePhoneNumber[]>([]);
  const [inventoryState, setInventoryState] = useState<InventoryState>('idle');
  const [inventoryMessage, setInventoryMessage] = useState('');
  const [selectedNumber, setSelectedNumber] = useState<AvailablePhoneNumber | null>(null);
  const [provisionState, setProvisionState] = useState<ProvisionState>('idle');
  const [provisionMessage, setProvisionMessage] = useState('');
  const [assignAssistantId, setAssignAssistantId] = useState('');
  const [assignmentBusy, setAssignmentBusy] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState('');
  const [detailAssistantId, setDetailAssistantId] = useState('');
  const [detailBusy, setDetailBusy] = useState(false);
  const [detailMessage, setDetailMessage] = useState('');

  const loadData = useCallback(async () => {
    if (!clientId) { setLoadError('Phone numbers unavailable. Sign in again to view telephony.'); setLoading(false); return; }
    setLoading(true);
    setLoadError('');
    try {
      const [numbers, agentList] = await Promise.all([numbersApi.list(clientId), assistantsApi.list(clientId)]);
      setPhoneNumbers(Array.isArray(numbers) ? numbers : []);
      setAssistants(Array.isArray(agentList) ? agentList : []);
    } catch (error) {
      setLoadError(messageFor(error, 'Phone numbers could not be loaded.'));
    } finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const selectedPhone = phoneNumbers.find(phone => phone.id === selectedPhoneId) || null;

  function openBuy() {
    setBuyStep(1); setInventoryState('idle'); setInventoryMessage(''); setSelectedNumber(null); setProvisionState('idle'); setProvisionMessage(''); setAssignmentMessage(''); setIsBuyOpen(true);
  }

  async function searchInventory() {
    setInventoryState('loading'); setInventoryMessage(''); setAvailableNumbers([]); setSelectedNumber(null);
    try {
      const result = await numbersApi.getAvailable(buyCountry);
      setAvailableNumbers(result.numbers);
      setInventoryMessage(result.notice || '');
      setInventoryState(result.numbers.length ? 'ready' : 'empty');
      setBuyStep(2);
    } catch (error) {
      setInventoryState('unavailable');
      setInventoryMessage(messageFor(error, 'Provider unavailable. Carrier inventory could not be checked.'));
      setBuyStep(2);
    }
  }

  async function provisionNumber() {
    if (!selectedNumber) return;
    setProvisionState('provisioning'); setProvisionMessage(''); setBuyStep(4);
    try {
      const purchased = await numbersApi.buyNumber({ phoneNumber: selectedNumber.phoneNumber, countryCode: buyCountry });
      setPhoneNumbers(previous => [...previous, purchased]);
      setProvisionState('connected');
      setBuyStep(4);
    } catch (error) {
      setProvisionState('failed');
      setProvisionMessage(messageFor(error, 'Provision failed. The number was not connected.'));
    }
  }

  async function assignProvisionedNumber() {
    const number = phoneNumbers[phoneNumbers.length - 1];
    if (!number || !assignAssistantId) { setIsBuyOpen(false); return; }
    setAssignmentBusy(true); setAssignmentMessage('Saving assignment…');
    try {
      const agent = assistants.find(item => item.id === assignAssistantId);
      const updated = await numbersApi.linkNumber({ phoneId: number.id, assistantId: assignAssistantId, assistantName: agent?.name });
      setPhoneNumbers(previous => previous.map(item => item.id === number.id ? updated : item));
      setAssignmentMessage('Number assigned to agent.');
    } catch (error) { setAssignmentMessage(messageFor(error, 'Assignment could not be confirmed.')); }
    finally { setAssignmentBusy(false); }
  }

  async function saveDetailAssignment() {
    if (!selectedPhone) return;
    setDetailBusy(true); setDetailMessage('Saving assignment…');
    try {
      const agent = assistants.find(item => item.id === detailAssistantId);
      if (!detailAssistantId) {
        await numbersApi.unlinkNumber(selectedPhone.id);
        setPhoneNumbers(previous => previous.map(item => item.id === selectedPhone.id ? { ...item, assistant_id: null, assistant_name: null } : item));
        setDetailMessage('Agent unassigned.');
      } else {
        const updated = await numbersApi.linkNumber({ phoneId: selectedPhone.id, assistantId: detailAssistantId, assistantName: agent?.name });
        setPhoneNumbers(previous => previous.map(item => item.id === selectedPhone.id ? updated : item));
        setDetailMessage('Assignment saved.');
      }
    } catch (error) { setDetailMessage(messageFor(error, 'Assignment could not be confirmed.')); }
    finally { setDetailBusy(false); }
  }

  if (loading) return <div className="flex w-full max-w-7xl flex-col gap-6"><header className="border-b border-line/40 pb-6"><h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">Phone Numbers</h1><p className="mt-1 text-sm text-ink-tertiary">Loading phone numbers…</p></header><div role="status" className="h-24 animate-pulse border-y border-line/40 bg-white/40" /></div>;
  if (loadError) return <div role="alert" className="w-full max-w-3xl border-y border-line/40 py-10 text-ink"><h1 className="font-display text-2xl font-bold tracking-tight">Phone Numbers</h1><p className="mt-3 text-sm text-ink-secondary">{loadError}</p><button className="mt-5 min-h-11 border border-line bg-white px-4 text-sm font-semibold" onClick={() => void loadData()}>Retry</button></div>;

  return <div className="relative flex w-full max-w-7xl flex-col gap-6 text-ink">
    <header className="flex flex-col justify-between gap-5 border-b border-line/40 pb-6 md:flex-row md:items-end"><div><h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Phone Numbers</h1><p className="mt-1 text-sm text-ink-tertiary">Manage phone numbers connected to your Bavio workspace.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setIsExternalOpen(true)} className="min-h-11 border border-line bg-white px-4 text-xs font-semibold text-ink">Connect existing number</button><button onClick={openBuy} className="flex min-h-11 items-center gap-2 bg-saffron px-4 text-xs font-semibold text-white"><Plus size={15} />Get a phone number</button></div></header>

    {phoneNumbers.length === 0 ? <section className="border-b border-line/40 py-12"><div className="flex max-w-xl items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center border-l-2 border-saffron bg-white text-saffron"><Phone size={21} /></div><div><h2 className="font-display text-xl font-semibold">No phone numbers connected</h2><p className="mt-2 text-sm leading-6 text-ink-secondary">Connect a Bavio number when you are ready to receive calls. Use the actions above to search carrier inventory or learn about existing-number connections.</p></div></div></section> : <section aria-labelledby="connected-numbers"><div className="mb-3 flex items-end justify-between"><div><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-tertiary">Workspace register</span><h2 id="connected-numbers" className="mt-1 font-display text-xl font-semibold">Connected numbers</h2></div><span className="text-xs text-ink-tertiary">{phoneNumbers.length} connected</span></div><div className="divide-y divide-line border-y border-line">{phoneNumbers.map(number => <button key={number.id} className="grid w-full grid-cols-1 gap-3 py-5 text-left transition hover:bg-white/60 md:grid-cols-[1.6fr_1fr_1fr_1.4fr_auto] md:items-center md:gap-5" onClick={() => { setSelectedPhoneId(number.id); setDetailAssistantId(number.assistant_id || ''); setDetailMessage(''); }}><div><strong className="font-mono text-sm">{number.number}</strong><small className="mt-1 block text-xs text-ink-tertiary">{number.provider || 'Provider unavailable'}{number.country_code ? ` · ${number.country_code}` : ''}</small></div><span className="text-xs"><small className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-ink-tertiary">Status</small>{number.status || 'Unavailable'}</span><span className="text-xs"><small className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-ink-tertiary">Assigned agent</small>{number.assistant_name || 'No agent assigned'}</span><span className="text-xs"><small className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-ink-tertiary">Connected</small>{number.created_at ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(number.created_at)) : 'Date unavailable'}</span><span aria-hidden="true" className="text-lg text-ink-tertiary">→</span></button>)}</div></section>}

    {isBuyOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="provision-title" className="max-h-[calc(100dvh-32px)] w-full max-w-xl overflow-y-auto border border-line bg-canvas p-5 shadow-2xl md:p-7"><div className="mb-5 flex items-start justify-between border-b border-line pb-4"><div><span className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">Provisioning</span><h2 id="provision-title" className="mt-1 font-display text-xl font-semibold">Get a phone number</h2></div><button aria-label="Close provisioning" onClick={() => setIsBuyOpen(false)} className="border border-line bg-white p-2"><X size={16} /></button></div><div className="mb-6 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-ink-tertiary"><span className={buyStep >= 1 ? 'font-bold text-ink' : ''}>1 Country</span><span>·</span><span className={buyStep >= 2 ? 'font-bold text-ink' : ''}>2 Search</span><span>·</span><span className={buyStep >= 3 ? 'font-bold text-ink' : ''}>3 Confirm</span><span>·</span><span className={buyStep >= 4 ? 'font-bold text-ink' : ''}>4 Provision</span></div>
      {buyStep === 1 && <div className="space-y-5"><p className="text-sm leading-6 text-ink-secondary">Choose a country to search the provider&apos;s current inventory.</p><label className="block text-xs font-semibold">Country<select className="mt-2 min-h-11 w-full border border-line bg-white px-3 text-sm" value={buyCountry} onChange={event => setBuyCountry(event.target.value)}><option value="US">United States (+1)</option><option value="GB">United Kingdom (+44)</option><option value="CA">Canada (+1)</option><option value="IN">India (+91)</option></select></label><button onClick={() => void searchInventory()} className="flex min-h-11 w-full items-center justify-center gap-2 bg-saffron text-sm font-semibold text-white" disabled={inventoryState === 'loading'}>{inventoryState === 'loading' && <Spinner className="animate-spin" size={16} />}Search available numbers</button></div>}
      {buyStep === 2 && <div className="space-y-5"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Available numbers</h3><p className="text-xs text-ink-tertiary">{buyCountry} inventory from the provider</p></div><button className="text-xs underline" onClick={() => setBuyStep(1)}>Change country</button></div>{inventoryState === 'unavailable' && <div className="border-l-2 border-red-600 bg-red-50 p-3 text-sm text-red-800"><strong>Provider unavailable</strong><p className="mt-1 text-xs">{inventoryMessage}</p></div>}{inventoryState === 'empty' && <div className="border-l-2 border-line bg-white p-3 text-sm"><strong>No numbers found</strong><p className="mt-1 text-xs text-ink-secondary">{inventoryMessage || 'No numbers are currently available for this country.'}</p></div>}{inventoryState === 'ready' && <div className="divide-y divide-line border-y border-line">{availableNumbers.map(item => <button key={item.phoneNumber} onClick={() => setSelectedNumber(item)} className={`w-full p-4 text-left transition ${selectedNumber?.phoneNumber === item.phoneNumber ? 'bg-saffron/5' : 'hover:bg-white'}`}><div className="flex items-start justify-between gap-4"><strong className="font-mono text-sm">{item.phoneNumber}</strong>{item.monthlyRate && <span className="text-xs font-semibold">{item.monthlyRate}/mo</span>}</div><p className="mt-1 text-xs text-ink-secondary">{[item.locality, item.region, item.isoCountry].filter(Boolean).join(', ') || 'Location unavailable'}{item.numberType ? ` · ${item.numberType}` : ''}</p>{capabilityLabels(item).length > 0 && <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink-tertiary">{capabilityLabels(item).map(capability => <span key={capability}>{capability}</span>)}</div>}</button>)}</div>}{inventoryState !== 'unavailable' && inventoryState !== 'empty' && <div className="flex justify-between border-t border-line pt-4"><button onClick={() => setBuyStep(1)} className="min-h-10 border border-line bg-white px-4 text-xs font-semibold">Back</button><button onClick={() => setBuyStep(3)} disabled={!selectedNumber} className="min-h-10 bg-saffron px-4 text-xs font-semibold text-white disabled:opacity-40">Continue</button></div>}</div>}
      {buyStep === 3 && selectedNumber && <div className="space-y-5"><h3 className="font-semibold">Confirm number</h3><div className="divide-y divide-line border-y border-line bg-white"><div className="flex justify-between gap-4 p-4 text-sm"><span className="text-ink-tertiary">Number</span><strong className="font-mono">{selectedNumber.phoneNumber}</strong></div>{selectedNumber.monthlyRate && <div className="flex justify-between gap-4 p-4 text-sm"><span className="text-ink-tertiary">Recurring price</span><strong>{selectedNumber.monthlyRate}/mo</strong></div>}{capabilityLabels(selectedNumber).length > 0 && <div className="p-4 text-sm"><span className="text-ink-tertiary">Capabilities</span><p className="mt-1">{capabilityLabels(selectedNumber).join(' · ')}</p></div>}</div><p className="text-xs leading-5 text-ink-tertiary">Provisioning will request this number from the provider. Assignment to an agent is optional and happens after connection.</p>{provisionState === 'failed' && <div className="border-l-2 border-red-600 bg-red-50 p-3 text-sm text-red-800"><strong>Provision failed</strong><p className="mt-1 text-xs">{provisionMessage}</p></div>}<div className="flex justify-between border-t border-line pt-4"><button onClick={() => setBuyStep(2)} className="min-h-10 border border-line bg-white px-4 text-xs font-semibold">Back</button><button onClick={() => void provisionNumber()} disabled={provisionState === 'provisioning'} className="flex min-h-10 items-center gap-2 bg-saffron px-4 text-xs font-semibold text-white disabled:opacity-50">{provisionState === 'provisioning' && <Spinner className="animate-spin" size={15} />}{provisionState === 'provisioning' ? 'Provisioning…' : 'Provision number'}</button></div></div>}
      {buyStep === 4 && <div className="space-y-5">{provisionState === 'provisioning' ? <div role="status" className="border-l-2 border-saffron bg-white p-4"><Spinner className="mb-2 animate-spin text-saffron" size={20} /><strong className="block text-sm">Provisioning…</strong><p className="mt-1 text-xs text-ink-secondary">The provider is connecting {selectedNumber?.phoneNumber}. This can take a moment.</p></div> : provisionState === 'connected' ? <><div className="flex items-start gap-3 border-l-2 border-state-success bg-white p-4"><CheckCircle className="mt-0.5 shrink-0 text-state-success" size={20} /><div><strong className="text-sm">Connected</strong><p className="mt-1 font-mono text-sm">{selectedNumber?.phoneNumber}</p><p className="mt-1 text-xs text-ink-secondary">The number is connected. Assign it to an agent if one is ready.</p></div></div>{assistants.length > 0 ? <label className="block text-xs font-semibold">Assign to agent<select className="mt-2 min-h-11 w-full border border-line bg-white px-3 text-sm" value={assignAssistantId} onChange={event => setAssignAssistantId(event.target.value)}><option value="">Leave unassigned</option>{assistants.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label> : <p className="text-sm text-ink-secondary">No agents are available for assignment.</p>}{assignmentMessage && <p role="status" className="text-xs text-ink-secondary">{assignmentMessage}</p>}<div className="flex justify-end gap-2 border-t border-line pt-4"><button onClick={() => setIsBuyOpen(false)} className="min-h-10 border border-line bg-white px-4 text-xs font-semibold">{assignAssistantId ? 'Skip assignment' : 'Done'}</button>{assistants.length > 0 && <button onClick={() => void assignProvisionedNumber()} disabled={!assignAssistantId || assignmentBusy} className="min-h-10 bg-saffron px-4 text-xs font-semibold text-white disabled:opacity-40">{assignmentBusy ? 'Saving…' : 'Assign to agent'}</button>}</div></> : <div className="border-l-2 border-red-600 bg-red-50 p-4 text-sm text-red-800"><strong>Provision failed</strong><p className="mt-1 text-xs">{provisionMessage || 'The number was not connected.'}</p><button onClick={() => setBuyStep(3)} className="mt-4 min-h-10 border border-red-200 bg-white px-4 text-xs font-semibold">Back to confirmation</button></div>}</div>}
    </section></div>}

    {selectedPhone && <div className="fixed inset-0 z-50 flex justify-end bg-black/35" role="presentation" onClick={event => { if (event.target === event.currentTarget) setSelectedPhoneId(null); }}><aside role="dialog" aria-modal="true" aria-labelledby="number-detail-title" className="flex h-full w-full max-w-md flex-col bg-canvas shadow-2xl"><header className="flex items-start justify-between border-b border-line p-6"><div><span className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">Connected number</span><h2 id="number-detail-title" className="mt-1 font-mono text-lg font-semibold">{selectedPhone.number}</h2></div><button aria-label="Close number details" onClick={() => setSelectedPhoneId(null)} className="border border-line bg-white p-2"><X size={16} /></button></header><div className="flex-1 space-y-7 overflow-y-auto p-6"><dl className="grid grid-cols-2 gap-5 border-y border-line py-5 text-sm">{selectedPhone.provider && <div><dt className="text-xs text-ink-tertiary">Provider</dt><dd className="mt-1">{selectedPhone.provider}</dd></div>}{selectedPhone.status && <div><dt className="text-xs text-ink-tertiary">Status</dt><dd className="mt-1">{selectedPhone.status}</dd></div>}{selectedPhone.country_code && <div><dt className="text-xs text-ink-tertiary">Country</dt><dd className="mt-1">{selectedPhone.country_code}</dd></div>}<div><dt className="text-xs text-ink-tertiary">Assigned agent</dt><dd className="mt-1">{selectedPhone.assistant_name || 'No agent assigned'}</dd></div></dl><section><h3 className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">Assignment</h3><p className="mt-2 text-sm text-ink-secondary">Choose an existing agent. This does not change the number&apos;s provider status.</p><select aria-label="Assign connected number to agent" className="mt-4 min-h-11 w-full border border-line bg-white px-3 text-sm" value={detailAssistantId} onChange={event => setDetailAssistantId(event.target.value)}><option value="">No agent assigned</option>{assistants.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select>{detailMessage && <p role="status" className="mt-3 text-xs text-ink-secondary">{detailMessage}</p>}<button onClick={() => void saveDetailAssignment()} disabled={detailBusy} className="mt-4 min-h-10 bg-saffron px-4 text-xs font-semibold text-white disabled:opacity-50">{detailBusy ? 'Saving…' : 'Save assignment'}</button></section></div><footer className="border-t border-line p-5"><p className="flex gap-2 text-xs leading-5 text-ink-tertiary"><Info className="mt-0.5 shrink-0" size={15} />Provider capabilities are shown only when returned by the carrier.</p></footer></aside></div>}

    {isExternalOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="existing-number-title" className="w-full max-w-md border border-line bg-canvas p-6 shadow-2xl"><div className="flex items-start justify-between border-b border-line pb-4"><div><span className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">Existing number</span><h2 id="existing-number-title" className="mt-1 font-display text-xl font-semibold">Connect existing number</h2></div><button aria-label="Close existing number information" onClick={() => setIsExternalOpen(false)} className="border border-line bg-white p-2"><X size={16} /></button></div><div className="space-y-4 py-5 text-sm leading-6 text-ink-secondary"><p>A provider or SIP/BYOC connection form is not available in this workspace yet.</p><p>Contact your Bavio administrator to configure an existing-number connection. No connection was created.</p></div><div className="flex justify-end border-t border-line pt-4"><button onClick={() => setIsExternalOpen(false)} className="min-h-10 bg-saffron px-4 text-xs font-semibold text-white">Close</button></div></section></div>}
  </div>;
}
