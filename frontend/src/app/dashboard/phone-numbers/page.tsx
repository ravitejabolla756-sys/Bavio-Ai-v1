'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle,
  Info,
  MagnifyingGlass,
  Phone,
  Plus,
  Spinner,
  Warning,
  X,
} from '@phosphor-icons/react';
import {
  assistantsApi,
  getClientId,
  numbersApi,
  type Assistant,
  type AvailablePhoneNumber,
  type PhoneNumber,
  type SupportedCountry,
  type SupportedNumberType,
} from '@/lib/api';

type InventoryState = 'idle' | 'loading' | 'ready' | 'empty' | 'unavailable';
type ProvisionState = 'idle' | 'provisioning' | 'connected' | 'failed';
type CountryLoadState = 'loading' | 'ready' | 'error';

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function capabilityLabels(item: AvailablePhoneNumber) {
  const c = item.capabilities;
  if (!c) return [];
  return [
    c.voice ? 'Voice' : null,
    c.sms ? 'SMS' : null,
    c.mms ? 'MMS' : null,
    c.inbound ? 'Inbound' : null,
    c.outbound ? 'Outbound' : null,
  ].filter((v): v is string => Boolean(v));
}

// ─── Searchable Country Selector ──────────────────────────────────────────────

interface CountrySelectorProps {
  countries: SupportedCountry[];
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

function CountrySelector({ countries, value, onChange, disabled }: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = countries.find(c => c.code === value);

  const filtered = query.trim()
    ? countries.filter(c => {
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.dialCode.includes(q)
        );
      })
    : countries;

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          width: '100%',
          minHeight: '44px',
          padding: '0 12px',
          border: '1px solid var(--color-line, #e5e7eb)',
          background: 'var(--color-white, #fff)',
          color: 'var(--color-ink, #111)',
          fontSize: '14px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          {selected ? (
            <>
              <span aria-hidden="true" style={{ fontSize: '18px', lineHeight: 1 }}>{selected.flag}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selected.name} ({selected.dialCode})
              </span>
            </>
          ) : (
            <span style={{ color: 'var(--color-ink-tertiary, #9ca3af)' }}>Select a country…</span>
          )}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select country"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            border: '1px solid var(--color-line, #e5e7eb)',
            background: 'var(--color-canvas, #fff)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            maxHeight: '320px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search input */}
          <div style={{ padding: '8px', borderBottom: '1px solid var(--color-line, #e5e7eb)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MagnifyingGlass size={14} style={{ color: 'var(--color-ink-tertiary, #9ca3af)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by country name or code…"
              aria-label="Search countries"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                background: 'transparent',
                color: 'var(--color-ink, #111)',
              }}
            />
          </div>

          {/* Country list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '16px 12px', fontSize: '13px', color: 'var(--color-ink-tertiary, #9ca3af)', textAlign: 'center' }}>
                No countries match &ldquo;{query}&rdquo;
              </div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.code}
                  role="option"
                  aria-selected={c.code === value}
                  type="button"
                  onClick={() => {
                    onChange(c.code);
                    setOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    background: c.code === value ? 'color-mix(in srgb, var(--color-saffron, #f97316) 8%, transparent)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '13px',
                    color: 'var(--color-ink, #111)',
                  }}
                  onMouseOver={e => {
                    if (c.code !== value) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-white, #f9fafb)';
                  }}
                  onMouseOut={e => {
                    if (c.code !== value) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: '18px', lineHeight: 1, width: '24px', textAlign: 'center' }}>{c.flag}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <span>{c.name}</span>
                    {c.provisioningStatus === 'regulatory_requirements' && (
                      <span style={{ fontSize: '11px', color: 'var(--color-ink-tertiary, #71717a)', fontWeight: 400 }}>
                        Additional verification required
                      </span>
                    )}
                  </div>
                  <span style={{ color: 'var(--color-ink-tertiary, #9ca3af)', fontFamily: 'monospace', fontSize: '12px' }}>
                    {c.dialCode}
                  </span>
                  {c.code === value && (
                    <CheckCircle size={14} weight="fill" style={{ color: 'var(--color-saffron, #f97316)', flexShrink: 0 }} />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Country count */}
          <div style={{ padding: '6px 12px', borderTop: '1px solid var(--color-line, #e5e7eb)', fontSize: '10px', color: 'var(--color-ink-tertiary, #9ca3af)', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {filtered.length} of {countries.length} verified countries
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PhoneNumbersDashboardPage() {
  const clientId = getClientId();

  // Page-level data
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);

  // Country catalog
  const [countries, setCountries] = useState<SupportedCountry[]>([]);
  const [countryLoadState, setCountryLoadState] = useState<CountryLoadState>('loading');
  const [countryLoadError, setCountryLoadError] = useState('');

  // Buy flow
  const [isBuyOpen, setIsBuyOpen] = useState(false);
  const [buyStep, setBuyStep] = useState<1 | 2 | 3 | 4>(1);
  const [buyCountry, setBuyCountry] = useState('US');
  const [buyNumberType, setBuyNumberType] = useState('local');
  const [numberTypes, setNumberTypes] = useState<SupportedNumberType[]>([]);
  const [numberTypesLoading, setNumberTypesLoading] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<AvailablePhoneNumber[]>([]);
  const [inventoryState, setInventoryState] = useState<InventoryState>('idle');
  const [inventoryMessage, setInventoryMessage] = useState('');
  const [selectedNumber, setSelectedNumber] = useState<AvailablePhoneNumber | null>(null);
  const [provisionState, setProvisionState] = useState<ProvisionState>('idle');
  const [provisionMessage, setProvisionMessage] = useState('');
  const [assignAssistantId, setAssignAssistantId] = useState('');
  const [assignmentBusy, setAssignmentBusy] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState('');

  // Detail panel
  const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);
  const [isExternalOpen, setIsExternalOpen] = useState(false);
  const [detailAssistantId, setDetailAssistantId] = useState('');
  const [detailBusy, setDetailBusy] = useState(false);
  const [detailMessage, setDetailMessage] = useState('');

  // ─── Loaders ───────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!clientId) {
      setLoadError('Phone numbers unavailable. Sign in again to view telephony.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const [numbers, agentList] = await Promise.all([
        numbersApi.list(clientId),
        assistantsApi.list(clientId),
      ]);
      setPhoneNumbers(Array.isArray(numbers) ? numbers : []);
      setAssistants(Array.isArray(agentList) ? agentList : []);
    } catch (error) {
      setLoadError(messageFor(error, 'Phone numbers could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const loadCountries = useCallback(async () => {
    setCountryLoadState('loading');
    setCountryLoadError('');
    try {
      const res = await numbersApi.getCountries();
      const status = res?.status;
      const list = res?.countries || [];

      if (status === 'temporarily_unavailable' || !Array.isArray(list)) {
        setCountries([]);
        setCountryLoadError('Phone number availability is temporarily unavailable.');
        setCountryLoadState('error');
        return;
      }

      // FAIL CLOSED: Only include countries whose capability has actually been verified
      const selectable = list.filter(c =>
        c.provisioningStatus === 'available' || c.provisioningStatus === 'regulatory_requirements'
      );

      if (selectable.length === 0) {
        setCountries([]);
        setCountryLoadError('Phone number availability is temporarily unavailable.');
        setCountryLoadState('error');
        return;
      }

      // Sort: available first, then regulatory
      const order: Record<string, number> = {
        available: 0,
        regulatory_requirements: 1,
      };
      selectable.sort((a, b) => {
        const diff = (order[a.provisioningStatus] ?? 2) - (order[b.provisioningStatus] ?? 2);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      });

      setCountries(selectable);

      // Default to US if present, else first
      if (selectable.some(c => c.code === 'US')) {
        setBuyCountry('US');
      } else if (selectable.length > 0) {
        setBuyCountry(selectable[0].code);
      }
      setCountryLoadState('ready');
    } catch (error) {
      setCountries([]);
      setCountryLoadError('Phone number availability is temporarily unavailable.');
      setCountryLoadState('error');
    }
  }, []);

  useEffect(() => {
    void loadData();
    void loadCountries();
  }, [loadData, loadCountries]);

  // Load number types whenever country changes
  useEffect(() => {
    if (!buyCountry || countryLoadState !== 'ready') return;
    setNumberTypesLoading(true);
    setBuyNumberType('local');
    numbersApi.getNumberTypes(buyCountry)
      .then(types => {
        setNumberTypes(types.filter(t => t.supported));
        // Auto-select first type
        const first = types.find(t => t.supported);
        if (first) setBuyNumberType(first.type);
      })
      .catch(() => {
        setNumberTypes([{ type: 'local', label: 'Local', supported: true }]);
      })
      .finally(() => setNumberTypesLoading(false));
  }, [buyCountry, countryLoadState]);

  // ─── Buy flow handlers ──────────────────────────────────────────────────────

  function openBuy() {
    setBuyStep(1);
    setInventoryState('idle');
    setInventoryMessage('');
    setSelectedNumber(null);
    setProvisionState('idle');
    setProvisionMessage('');
    setAssignmentMessage('');
    setIsBuyOpen(true);
  }

  async function searchInventory() {
    setInventoryState('loading');
    setInventoryMessage('');
    setAvailableNumbers([]);
    setSelectedNumber(null);
    try {
      const result = await numbersApi.getAvailable(buyCountry, buyNumberType);
      setAvailableNumbers(result.numbers);
      setInventoryMessage(result.notice || '');
      setInventoryState(result.numbers.length ? 'ready' : 'empty');
      setBuyStep(2);
    } catch (error) {
      setInventoryState('unavailable');
      setInventoryMessage(
        messageFor(error, 'Telephony service unavailable. Phone number inventory could not be checked.')
      );
      setBuyStep(2);
    }
  }

  async function provisionNumber() {
    if (!selectedNumber) return;
    setProvisionState('provisioning');
    setProvisionMessage('');
    setBuyStep(4);
    try {
      const purchased = await numbersApi.buyNumber({
        phoneNumber: selectedNumber.phoneNumber,
        countryCode: buyCountry,
      });
      setPhoneNumbers(prev => [...prev, purchased]);
      setProvisionState('connected');
    } catch (error) {
      setProvisionState('failed');
      setProvisionMessage(messageFor(error, 'Provision failed. The number was not connected.'));
    }
  }

  async function assignProvisionedNumber() {
    const number = phoneNumbers[phoneNumbers.length - 1];
    if (!number || !assignAssistantId) { setIsBuyOpen(false); return; }
    setAssignmentBusy(true);
    setAssignmentMessage('Saving assignment…');
    try {
      const agent = assistants.find(a => a.id === assignAssistantId);
      const updated = await numbersApi.linkNumber({
        phoneId: number.id,
        assistantId: assignAssistantId,
        assistantName: agent?.name,
      });
      setPhoneNumbers(prev => prev.map(n => n.id === number.id ? updated : n));
      setAssignmentMessage('Number assigned to agent.');
    } catch (error) {
      setAssignmentMessage(messageFor(error, 'Assignment could not be confirmed.'));
    } finally {
      setAssignmentBusy(false);
    }
  }

  async function saveDetailAssignment() {
    if (!selectedPhone) return;
    setDetailBusy(true);
    setDetailMessage('Saving assignment…');
    try {
      const agent = assistants.find(a => a.id === detailAssistantId);
      if (!detailAssistantId) {
        await numbersApi.unlinkNumber(selectedPhone.id);
        setPhoneNumbers(prev =>
          prev.map(n => n.id === selectedPhone.id ? { ...n, assistant_id: null, assistant_name: null } : n)
        );
        setDetailMessage('Agent unassigned.');
      } else {
        const updated = await numbersApi.linkNumber({
          phoneId: selectedPhone.id,
          assistantId: detailAssistantId,
          assistantName: agent?.name,
        });
        setPhoneNumbers(prev => prev.map(n => n.id === selectedPhone.id ? updated : n));
        setDetailMessage('Assignment saved.');
      }
    } catch (error) {
      setDetailMessage(messageFor(error, 'Assignment could not be confirmed.'));
    } finally {
      setDetailBusy(false);
    }
  }

  const selectedPhone = phoneNumbers.find(n => n.id === selectedPhoneId) || null;
  const selectedCountryInfo = countries.find(c => c.code === buyCountry);

  // ─── Page loading / error states ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex w-full max-w-7xl flex-col gap-6">
        <header className="border-b border-line/40 pb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">Phone Numbers</h1>
          <p className="mt-1 text-sm text-ink-tertiary">Loading phone numbers…</p>
        </header>
        <div role="status" className="h-24 animate-pulse border-y border-line/40 bg-white/40" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div role="alert" className="w-full max-w-3xl border-y border-line/40 py-10 text-ink">
        <h1 className="font-display text-2xl font-bold tracking-tight">Phone Numbers</h1>
        <p className="mt-3 text-sm text-ink-secondary">{loadError}</p>
        <button className="mt-5 min-h-11 border border-line bg-white px-4 text-sm font-semibold" onClick={() => void loadData()}>
          Retry
        </button>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="relative flex w-full max-w-7xl flex-col gap-6 text-ink">
      {/* Page header */}
      <header className="flex flex-col justify-between gap-5 border-b border-line/40 pb-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Phone Numbers</h1>
          <p className="mt-1 text-sm text-ink-tertiary">Manage phone numbers connected to your Bavio workspace.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsExternalOpen(true)}
            className="min-h-11 border border-line bg-white px-4 text-xs font-semibold text-ink"
          >
            Connect existing number
          </button>
          <button
            onClick={openBuy}
            className="flex min-h-11 items-center gap-2 bg-saffron px-4 text-xs font-semibold text-white"
          >
            <Plus size={15} />
            Get a phone number
          </button>
        </div>
      </header>

      {/* Connected numbers list */}
      {phoneNumbers.length === 0 ? (
        <section className="border-b border-line/40 py-12">
          <div className="flex max-w-xl items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center border-l-2 border-saffron bg-white text-saffron">
              <Phone size={21} />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">No phone numbers connected</h2>
              <p className="mt-2 text-sm leading-6 text-ink-secondary">
                Connect a Bavio number when you are ready to receive calls. Use the actions above to search available numbers or learn about existing-number connections.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section aria-labelledby="connected-numbers">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-tertiary">Workspace register</span>
              <h2 id="connected-numbers" className="mt-1 font-display text-xl font-semibold">Connected numbers</h2>
            </div>
            <span className="text-xs text-ink-tertiary">{phoneNumbers.length} connected</span>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {phoneNumbers.map(number => (
              <button
                key={number.id}
                className="grid w-full grid-cols-1 gap-3 py-5 text-left transition hover:bg-white/60 md:grid-cols-[1.6fr_1fr_1fr_1.4fr_auto] md:items-center md:gap-5"
                onClick={() => {
                  setSelectedPhoneId(number.id);
                  setDetailAssistantId(number.assistant_id || '');
                  setDetailMessage('');
                }}
              >
                <div>
                  <strong className="font-mono text-sm">{number.number}</strong>
                  <small className="mt-1 block text-xs text-ink-tertiary">
                    {number.label || 'Bavio Number'}{number.country_code ? ` · ${number.country_code}` : ''}
                  </small>
                </div>
                <span className="text-xs">
                  <small className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-ink-tertiary">Status</small>
                  {number.status || 'Unavailable'}
                </span>
                <span className="text-xs">
                  <small className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-ink-tertiary">Assigned agent</small>
                  {number.assistant_name || 'No agent assigned'}
                </span>
                <span className="text-xs">
                  <small className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-ink-tertiary">Connected</small>
                  {number.created_at
                    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(number.created_at))
                    : 'Date unavailable'}
                </span>
                <span aria-hidden="true" className="text-lg text-ink-tertiary">→</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ─── Buy number modal ─────────────────────────────────────────────────── */}
      {isBuyOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="provision-title"
            className="max-h-[calc(100dvh-32px)] w-full max-w-xl overflow-y-auto border border-line bg-canvas p-5 shadow-2xl md:p-7"
          >
            {/* Modal header */}
            <div className="mb-5 flex items-start justify-between border-b border-line pb-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">Provisioning</span>
                <h2 id="provision-title" className="mt-1 font-display text-xl font-semibold">Get a phone number</h2>
              </div>
              <button aria-label="Close provisioning" onClick={() => setIsBuyOpen(false)} className="border border-line bg-white p-2">
                <X size={16} />
              </button>
            </div>

            {/* Step indicator */}
            <div className="mb-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
              <span className={buyStep >= 1 ? 'font-bold text-ink' : ''}>1 Country</span>
              <span>·</span>
              <span className={buyStep >= 2 ? 'font-bold text-ink' : ''}>2 Search</span>
              <span>·</span>
              <span className={buyStep >= 3 ? 'font-bold text-ink' : ''}>3 Confirm</span>
              <span>·</span>
              <span className={buyStep >= 4 ? 'font-bold text-ink' : ''}>4 Provision</span>
            </div>

            {/* ── Step 1: Country & type selection ─────────────────────────── */}
            {buyStep === 1 && (
              <div className="space-y-5">
                {countryLoadState === 'error' ? (
                  <div className="border-l-2 border-amber-500 bg-amber-500/5 p-4 text-sm">
                    <strong className="block text-ink font-semibold">Phone number availability is temporarily unavailable.</strong>
                    <p className="mt-1 text-xs text-ink-secondary">
                      We couldn't load the countries where Bavio numbers are currently available. Please try again.
                    </p>
                    <button
                      onClick={() => void loadCountries()}
                      className="mt-3 inline-flex items-center justify-center bg-saffron text-white px-4 py-1.5 text-xs font-semibold rounded hover:bg-saffron/90 transition"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm leading-6 text-ink-secondary">
                      Choose a country to search available Bavio numbers.
                    </p>

                    {/* Country selector */}
                    <label className="block text-xs font-semibold">
                      Country
                      <div className="mt-2">
                        {countryLoadState === 'loading' ? (
                          <div className="flex min-h-11 items-center gap-2 border border-line bg-white px-3 text-sm text-ink-tertiary">
                            <Spinner size={14} className="animate-spin" />
                            Loading countries…
                          </div>
                        ) : (
                          <CountrySelector
                            countries={countries}
                            value={buyCountry}
                            onChange={code => setBuyCountry(code)}
                          />
                        )}
                      </div>
                    </label>

                    {/* Country notice (e.g. India regulatory note) */}
                    {selectedCountryInfo?.notice && (
                      <div className="flex items-start gap-2 border border-line bg-white p-3 text-xs text-ink-secondary">
                        <Info size={13} className="mt-0.5 shrink-0" />
                        <span>{selectedCountryInfo.notice}</span>
                      </div>
                    )}

                    {/* Number type — dynamic based on country */}
                    {countryLoadState === 'ready' && (
                      <label className="block text-xs font-semibold">
                        Number type
                        <div className="mt-2">
                          {numberTypesLoading ? (
                            <div className="flex min-h-11 items-center gap-2 border border-line bg-white px-3 text-sm text-ink-tertiary">
                              <Spinner size={14} className="animate-spin" />
                              Loading types for {selectedCountryInfo?.name || buyCountry}…
                            </div>
                          ) : (
                            <select
                              className="min-h-11 w-full border border-line bg-white px-3 text-sm"
                              value={buyNumberType}
                              onChange={e => setBuyNumberType(e.target.value)}
                            >
                              {numberTypes.length > 0 ? (
                                numberTypes.map(t => (
                                  <option key={t.type} value={t.type}>{t.label}</option>
                                ))
                              ) : (
                                <option value="local">Local</option>
                              )}
                            </select>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-ink-tertiary">
                          Available types are determined by {selectedCountryInfo?.name || buyCountry} carrier capabilities.
                        </p>
                      </label>
                    )}

                    <button
                      onClick={() => void searchInventory()}
                      className="flex min-h-11 w-full items-center justify-center gap-2 bg-saffron text-sm font-semibold text-white"
                      disabled={inventoryState === 'loading' || countryLoadState !== 'ready' || numberTypesLoading}
                    >
                      {inventoryState === 'loading' && <Spinner className="animate-spin" size={16} />}
                      Search available numbers
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Step 2: Inventory results ─────────────────────────────────── */}
            {buyStep === 2 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Available numbers</h3>
                    <p className="text-xs text-ink-tertiary">
                      {selectedCountryInfo
                        ? `${selectedCountryInfo.flag} ${selectedCountryInfo.name} · ${buyNumberType}`
                        : `${buyCountry} · ${buyNumberType}`} inventory
                    </p>
                  </div>
                  <button className="text-xs underline" onClick={() => setBuyStep(1)}>
                    Change country
                  </button>
                </div>

                {inventoryState === 'unavailable' && (
                  <div className="border-l-2 border-red-600 bg-red-50 p-3 text-sm text-red-800">
                    <strong>Telephony service unavailable</strong>
                    <p className="mt-1 text-xs">{inventoryMessage}</p>
                    <p className="mt-2 text-xs">This is a service error, not an empty inventory. Please retry shortly.</p>
                    <button onClick={() => setBuyStep(1)} className="mt-3 text-xs underline">
                      ← Back to country selection
                    </button>
                  </div>
                )}

                {inventoryState === 'empty' && (
                  <div className="border-l-2 border-line bg-white p-3 text-sm">
                    <strong>No numbers found</strong>
                    <p className="mt-1 text-xs text-ink-secondary">
                      {inventoryMessage || 'No numbers are currently available for this country and number type.'}
                    </p>
                    <button onClick={() => setBuyStep(1)} className="mt-3 text-xs underline">
                      ← Try another country or type
                    </button>
                  </div>
                )}

                {inventoryState === 'ready' && (
                  <div className="divide-y divide-line border-y border-line">
                    {availableNumbers.map(item => (
                      <button
                        key={item.phoneNumber}
                        onClick={() => setSelectedNumber(item)}
                        className={`w-full p-4 text-left transition ${
                          selectedNumber?.phoneNumber === item.phoneNumber ? 'bg-saffron/5' : 'hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <strong className="font-mono text-sm">{item.phoneNumber}</strong>
                          {item.monthlyRate && (
                            <span className="text-xs font-semibold">{item.monthlyRate}/mo</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-ink-secondary">
                          {[item.locality, item.region, item.isoCountry].filter(Boolean).join(', ') || 'Location unavailable'}
                          {item.numberType ? ` · ${item.numberType}` : ''}
                        </p>
                        {capabilityLabels(item).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink-tertiary">
                            {capabilityLabels(item).map(cap => (
                              <span key={cap}>{cap}</span>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {inventoryState !== 'unavailable' && inventoryState !== 'empty' && (
                  <div className="flex justify-between border-t border-line pt-4">
                    <button onClick={() => setBuyStep(1)} className="min-h-10 border border-line bg-white px-4 text-xs font-semibold">
                      Back
                    </button>
                    <button
                      onClick={() => setBuyStep(3)}
                      disabled={!selectedNumber}
                      className="min-h-10 bg-saffron px-4 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      Continue
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Confirm ───────────────────────────────────────────── */}
            {buyStep === 3 && selectedNumber && (
              <div className="space-y-5">
                <h3 className="font-semibold">Confirm number</h3>
                <div className="divide-y divide-line border-y border-line bg-white">
                  <div className="flex justify-between gap-4 p-4 text-sm">
                    <span className="text-ink-tertiary">Number</span>
                    <strong className="font-mono">{selectedNumber.phoneNumber}</strong>
                  </div>
                  <div className="flex justify-between gap-4 p-4 text-sm">
                    <span className="text-ink-tertiary">Country</span>
                    <span>
                      {selectedCountryInfo
                        ? `${selectedCountryInfo.flag} ${selectedCountryInfo.name}`
                        : buyCountry}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 p-4 text-sm">
                    <span className="text-ink-tertiary">Type</span>
                    <span className="capitalize">{buyNumberType}</span>
                  </div>
                  {selectedNumber.monthlyRate && (
                    <div className="flex justify-between gap-4 p-4 text-sm">
                      <span className="text-ink-tertiary">Recurring price</span>
                      <strong>{selectedNumber.monthlyRate}/mo</strong>
                    </div>
                  )}
                  {capabilityLabels(selectedNumber).length > 0 && (
                    <div className="p-4 text-sm">
                      <span className="text-ink-tertiary">Capabilities</span>
                      <p className="mt-1">{capabilityLabels(selectedNumber).join(' · ')}</p>
                    </div>
                  )}
                </div>
                <p className="text-xs leading-5 text-ink-tertiary">
                  Provisioning will allocate this number to your Bavio workspace. Assignment to an agent is optional and can be managed anytime.
                </p>
                {provisionState === 'failed' && (
                  <div className="border-l-2 border-red-600 bg-red-50 p-3 text-sm text-red-800">
                    <strong>Provision failed</strong>
                    <p className="mt-1 text-xs">{provisionMessage}</p>
                  </div>
                )}
                <div className="flex justify-between border-t border-line pt-4">
                  <button onClick={() => setBuyStep(2)} className="min-h-10 border border-line bg-white px-4 text-xs font-semibold">
                    Back
                  </button>
                  <button
                    onClick={() => void provisionNumber()}
                    disabled={provisionState === 'provisioning'}
                    className="flex min-h-10 items-center gap-2 bg-saffron px-4 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {provisionState === 'provisioning' && <Spinner className="animate-spin" size={15} />}
                    {provisionState === 'provisioning' ? 'Provisioning…' : 'Provision number'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 4: Provisioning result ───────────────────────────────── */}
            {buyStep === 4 && (
              <div className="space-y-5">
                {provisionState === 'provisioning' ? (
                  <div role="status" className="border-l-2 border-saffron bg-white p-4">
                    <Spinner className="mb-2 animate-spin text-saffron" size={20} />
                    <strong className="block text-sm">Provisioning…</strong>
                    <p className="mt-1 text-xs text-ink-secondary">
                      Bavio is connecting {selectedNumber?.phoneNumber}. This can take a moment.
                    </p>
                  </div>
                ) : provisionState === 'connected' ? (
                  <>
                    <div className="flex items-start gap-3 border-l-2 border-state-success bg-white p-4">
                      <CheckCircle className="mt-0.5 shrink-0 text-state-success" size={20} />
                      <div>
                        <strong className="text-sm">Connected</strong>
                        <p className="mt-1 font-mono text-sm">{selectedNumber?.phoneNumber}</p>
                        <p className="mt-1 text-xs text-ink-secondary">The number is connected. Assign it to an agent if one is ready.</p>
                      </div>
                    </div>
                    {assistants.length > 0 ? (
                      <label className="block text-xs font-semibold">
                        Assign to agent
                        <select
                          className="mt-2 min-h-11 w-full border border-line bg-white px-3 text-sm"
                          value={assignAssistantId}
                          onChange={e => setAssignAssistantId(e.target.value)}
                        >
                          <option value="">Leave unassigned</option>
                          {assistants.map(agent => (
                            <option key={agent.id} value={agent.id}>{agent.name}</option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <p className="text-sm text-ink-secondary">No agents are available for assignment.</p>
                    )}
                    {assignmentMessage && <p role="status" className="text-xs text-ink-secondary">{assignmentMessage}</p>}
                    <div className="flex justify-end gap-2 border-t border-line pt-4">
                      <button onClick={() => setIsBuyOpen(false)} className="min-h-10 border border-line bg-white px-4 text-xs font-semibold">
                        {assignAssistantId ? 'Skip assignment' : 'Done'}
                      </button>
                      {assistants.length > 0 && (
                        <button
                          onClick={() => void assignProvisionedNumber()}
                          disabled={!assignAssistantId || assignmentBusy}
                          className="min-h-10 bg-saffron px-4 text-xs font-semibold text-white disabled:opacity-40"
                        >
                          {assignmentBusy ? 'Saving…' : 'Assign to agent'}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="border-l-2 border-red-600 bg-red-50 p-4 text-sm text-red-800">
                    <strong>Provision failed</strong>
                    <p className="mt-1 text-xs">{provisionMessage || 'The number was not connected.'}</p>
                    <button onClick={() => setBuyStep(3)} className="mt-4 min-h-10 border border-red-200 bg-white px-4 text-xs font-semibold">
                      Back to confirmation
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ─── Number detail panel ──────────────────────────────────────────────── */}
      {selectedPhone && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/35"
          role="presentation"
          onClick={e => { if (e.target === e.currentTarget) setSelectedPhoneId(null); }}
        >
          <aside role="dialog" aria-modal="true" aria-labelledby="number-detail-title" className="flex h-full w-full max-w-md flex-col bg-canvas shadow-2xl">
            <header className="flex items-start justify-between border-b border-line p-6">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">Connected number</span>
                <h2 id="number-detail-title" className="mt-1 font-mono text-lg font-semibold">{selectedPhone.number}</h2>
              </div>
              <button aria-label="Close number details" onClick={() => setSelectedPhoneId(null)} className="border border-line bg-white p-2">
                <X size={16} />
              </button>
            </header>
            <div className="flex-1 space-y-7 overflow-y-auto p-6">
              <dl className="grid grid-cols-2 gap-5 border-y border-line py-5 text-sm">
                <div>
                  <dt className="text-xs text-ink-tertiary">Line Type</dt>
                  <dd className="mt-1">{selectedPhone.label || 'Bavio Number'}</dd>
                </div>
                {selectedPhone.status && (
                  <div>
                    <dt className="text-xs text-ink-tertiary">Status</dt>
                    <dd className="mt-1">{selectedPhone.status}</dd>
                  </div>
                )}
                {selectedPhone.country_code && (
                  <div>
                    <dt className="text-xs text-ink-tertiary">Country</dt>
                    <dd className="mt-1">{selectedPhone.country_code}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-ink-tertiary">Assigned agent</dt>
                  <dd className="mt-1">{selectedPhone.assistant_name || 'No agent assigned'}</dd>
                </div>
              </dl>
              <section>
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">Assignment</h3>
                <p className="mt-2 text-sm text-ink-secondary">Choose an existing agent to handle calls on this number.</p>
                <select
                  aria-label="Assign connected number to agent"
                  className="mt-4 min-h-11 w-full border border-line bg-white px-3 text-sm"
                  value={detailAssistantId}
                  onChange={e => setDetailAssistantId(e.target.value)}
                >
                  <option value="">No agent assigned</option>
                  {assistants.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
                {detailMessage && <p role="status" className="mt-3 text-xs text-ink-secondary">{detailMessage}</p>}
                <button
                  onClick={() => void saveDetailAssignment()}
                  disabled={detailBusy}
                  className="mt-4 min-h-10 bg-saffron px-4 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {detailBusy ? 'Saving…' : 'Save assignment'}
                </button>
              </section>
            </div>
            <footer className="border-t border-line p-5">
              <p className="flex gap-2 text-xs leading-5 text-ink-tertiary">
                <Info className="mt-0.5 shrink-0" size={15} />
                Bavio phone numbers support inbound and outbound calls.
              </p>
            </footer>
          </aside>
        </div>
      )}

      {/* ─── Connect existing number modal ─────────────────────────────────────── */}
      {isExternalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="existing-number-title" className="w-full max-w-md border border-line bg-canvas p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">Existing number</span>
                <h2 id="existing-number-title" className="mt-1 font-display text-xl font-semibold">Connect existing number</h2>
              </div>
              <button aria-label="Close existing number information" onClick={() => setIsExternalOpen(false)} className="border border-line bg-white p-2">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 py-5 text-sm leading-6 text-ink-secondary">
              <p>Bavio manages phone number provisioning and routing directly within your workspace.</p>
              <p>If you need custom enterprise trunking, SIP termination, or number porting, contact your Bavio account representative.</p>
            </div>
            <div className="flex justify-end border-t border-line pt-4">
              <button onClick={() => setIsExternalOpen(false)} className="min-h-10 bg-saffron px-4 text-xs font-semibold text-white">
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
