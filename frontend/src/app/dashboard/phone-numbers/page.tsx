"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Phone,
  CheckCircle,
  Warning,
  Spinner,
  ArrowLeft,
  Plus,
  Trash,
  Globe,
  Sliders,
  TrendUp,
  X,
  CaretDown,
  CaretRight,
  Info,
} from "@phosphor-icons/react";
import {
  numbersApi,
  assistantsApi,
  callsApi,
  getClientId,
  PhoneNumber,
  Assistant,
  CallRecord,
} from "@/lib/api";

export default function PhoneNumbersDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Data States
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);

  // Buy Flow Wizard State
  const [isBuyOpen, setIsBuyOpen] = useState(false);
  const [buyStep, setBuyStep] = useState(1);
  const [buyCountry, setBuyCountry] = useState("US");
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedNumberToBuy, setSelectedNumberToBuy] = useState<string | null>(null);
  const [assignAssistantId, setAssignAssistantId] = useState("");

  // Details drawer edit state
  const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [linkAssistantId, setLinkAssistantId] = useState("");

  const clientId = getClientId();

  const loadData = useCallback(async () => {
    if (!clientId) {
      setErrorMsg("Not authenticated");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg("");

      const [nums, asts, callList] = await Promise.all([
        numbersApi.list(clientId),
        assistantsApi.list(clientId),
        callsApi.list(clientId),
      ]);

      setPhoneNumbers(Array.isArray(nums) ? nums : []);
      setAssistants(Array.isArray(asts) ? asts : []);
      setCalls(Array.isArray(callList) ? callList : []);
    } catch (err: any) {
      console.error("Failed to load telephony data:", err);
      setErrorMsg(err.message || "Failed to load phone numbers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedPhone = phoneNumbers.find(p => p.id === selectedPhoneId);

  // Sync linkAssistantId when selectedPhone changes
  useEffect(() => {
    if (selectedPhone) {
      setLinkAssistantId(selectedPhone.assistant_id || "");
    }
  }, [selectedPhone]);

  // Fetch available numbers to buy
  const handleFetchAvailable = async (country: string) => {
    setLoadingAvailable(true);
    setErrorMsg("");
    try {
      const data = await numbersApi.getAvailable(country);
      setAvailableNumbers(Array.isArray(data) ? data : []);
      setBuyStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to find available numbers for this country");
    } finally {
      setLoadingAvailable(false);
    }
  };

  // Trigger Purchase number
  const handleBuyNumber = async () => {
    if (!selectedNumberToBuy) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const purchased = await numbersApi.buyNumber({
        phoneNumber: selectedNumberToBuy,
        countryCode: buyCountry,
      });

      setSuccessMsg(`Successfully purchased ${purchased.number}!`);
      setPhoneNumbers(prev => [...prev, purchased]);

      // Move to step 4 for assignment
      setBuyStep(4);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to purchase number");
      setIsBuyOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // Trigger AI assistant linking
  const handleLinkNumber = async (phoneId: string, assistantId: string) => {
    setSaving(true);
    setErrorMsg("");
    try {
      if (!assistantId) {
        // Unlink if empty
        await numbersApi.unlinkNumber(phoneId);
        setPhoneNumbers(prev => prev.map(p => p.id === phoneId ? { ...p, assistant_id: null, assistant_name: null } : p));
        setSuccessMsg("Phone number unlinked from AI Employee.");
      } else {
        const ast = assistants.find(a => a.id === assistantId);
        if (!ast) throw new Error("AI Employee not found");

        const updated = await numbersApi.linkNumber({
          phoneId,
          assistantId,
          assistantName: ast.name,
        });

        setPhoneNumbers(prev => prev.map(p => p.id === phoneId ? updated : p));
        setSuccessMsg(`Phone number linked to "${ast.name}" successfully.`);
      }
      setTimeout(() => setSuccessMsg(""), 4000);
      setSelectedPhoneId(null);
      setIsBuyOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update phone link");
    } finally {
      setSaving(false);
    }
  };

  // Release / Delete Phone number
  const handleReleaseNumber = async (phoneId: string) => {
    if (!window.confirm("Are you sure you want to release this phone number? You will lose access to it immediately.")) return;
    setSaving(true);
    setErrorMsg("");
    try {
      await numbersApi.unlinkNumber(phoneId); // Cleanup links
      // Release is mapped to unlink in v1, but we filter it locally or we let it unlink
      setPhoneNumbers(prev => prev.filter(p => p.id !== phoneId));
      setSuccessMsg("Phone number released successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
      setSelectedPhoneId(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to release number");
    } finally {
      setSaving(false);
    }
  };

  // Helper: count calls handled by number
  const getCallCountForNumber = (numStr: string) => {
    return calls.filter(c => c.virtual_number === numStr).length;
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div className="flex items-center justify-between border-b border-line/40 pb-6">
          <div className="text-left">
            <h1 className="font-serif text-3xl text-ink font-normal">Phone Numbers</h1>
            <p className="text-body-xs text-ink-tertiary mt-1">Loading phone carrier configuration...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-line rounded-2xl p-6 shadow-sm animate-pulse h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative text-ink font-sans">
      
      {/* Alert Notices */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-700 text-xs text-left">
          <ShieldWarning className="w-4 h-4 mt-0.5 shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 text-green-700 text-xs font-semibold text-left">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line/40 pb-6">
        <div className="text-left">
          <h1 className="font-serif text-3.5xl tracking-tight text-ink font-normal">Phone Numbers</h1>
          <p className="text-sm text-ink-tertiary mt-1">
            Manage the numbers your AI employees use to receive and make calls.
          </p>
        </div>
        
        <button
          onClick={() => {
            setBuyStep(1);
            setIsBuyOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl transition-all shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Get a Phone Number
        </button>
      </div>

      {/* 2. Number Overview Grid */}
      {phoneNumbers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-white border border-line rounded-[24px] shadow-[0_1px_3px_rgba(20,10,2,0.02)]">
          <div className="w-12 h-12 bg-saffron/5 border border-saffron/10 rounded-2xl flex items-center justify-center text-saffron">
            <Phone className="w-6 h-6" />
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-ink mb-1 font-sans">Connect a phone number</h4>
            <p className="text-xs text-ink-tertiary max-w-sm font-sans leading-relaxed">
              Give your AI employee a real business number so customers can call you.
            </p>
          </div>

          {/* Capabilities features overview */}
          <div className="flex flex-wrap justify-center gap-4 mt-2 text-[10px] font-bold text-ink-secondary uppercase tracking-wider">
            <span className="flex items-center gap-1.5 bg-canvas/20 border border-line/50 px-3 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5 text-state-success" />
              Voice inbound
            </span>
            <span className="flex items-center gap-1.5 bg-canvas/20 border border-line/50 px-3 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5 text-state-success" />
              Voice outbound
            </span>
            <span className="flex items-center gap-1.5 bg-canvas/20 border border-line/50 px-3 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5 text-state-success" />
              AI employee routing
            </span>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                setBuyStep(1);
                setIsBuyOpen(true);
              }}
              className="px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              Get a Phone Number
            </button>
            <button
              onClick={() => alert("To link an existing external SIP or carrier line, please contact support@bavio.in.")}
              className="px-4 py-2 border border-line bg-white hover:bg-canvas text-xs font-semibold rounded-xl transition-colors text-ink"
            >
              Use an existing number
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {phoneNumbers.map((num) => {
            const hasAgent = !!num.assistant_id;
            const callsCount = getCallCountForNumber(num.number);
            return (
              <div
                key={num.id}
                className="bg-white border border-line rounded-2xl p-6 shadow-[0_1px_2px_rgba(20,10,2,0.02)] hover:border-saffron/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[230px]"
              >
                <div>
                  {/* Phone Header & status */}
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-mono text-base font-bold text-ink leading-tight">{num.number}</h3>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border capitalize ${
                      hasAgent
                        ? "text-green-700 border-green-150 bg-green-50"
                        : "text-red-700 border-red-150 bg-red-50"
                    }`}>
                      {hasAgent ? "Online" : "Offline / Unassigned"}
                    </span>
                  </div>
                  
                  {/* Country & capabilities specs */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-4 text-[10px] font-sans border-t border-line/40 pt-3">
                    <div>
                      <span className="text-ink-muted block uppercase tracking-wider text-[8px]">Assigned Employee</span>
                      <span className="font-semibold text-ink mt-0.5 block truncate">
                        {num.assistant_name || "Unassigned"}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-muted block uppercase tracking-wider text-[8px]">Capabilities</span>
                      <span className="font-semibold text-ink mt-0.5 block">Voice IN / OUT</span>
                    </div>
                    <div>
                      <span className="text-ink-muted block uppercase tracking-wider text-[8px]">Country</span>
                      <span className="font-semibold text-ink mt-0.5 block capitalize">
                        {num.country_code || "US"}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-muted block uppercase tracking-wider text-[8px]">Calls Routed</span>
                      <span className="font-semibold text-ink mt-0.5 block">{callsCount} handled</span>
                    </div>
                  </div>
                </div>

                {/* Footer specs */}
                <div className="flex justify-between items-center border-t border-line/30 pt-3 mt-4">
                  <span className="text-[10px] font-mono text-ink-tertiary font-bold">$2.00 / mo</span>
                  <button
                    onClick={() => setSelectedPhoneId(num.id)}
                    className="px-3.5 py-1.5 border border-line bg-canvas hover:bg-canvas/50 text-[9px] font-bold uppercase tracking-wider text-ink rounded-xl transition-all"
                  >
                    Configure
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. NUMBER SETUP FLOW WIZARD (BUY FLOW MODAL) */}
      <AnimatePresence>
        {isBuyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBuyOpen(false)}
              className="fixed inset-0 bg-black"
            />

            {/* Wizard Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-line rounded-[24px] p-6 shadow-2xl z-50 w-full max-w-lg text-left"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-line/40 pb-4 mb-4">
                <h3 className="font-serif text-lg font-normal">Provision Phone Number</h3>
                <button
                  onClick={() => setIsBuyOpen(false)}
                  className="p-1.5 text-ink-tertiary hover:text-ink border border-line hover:bg-canvas rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Line */}
              <div className="w-full h-1 bg-canvas/30 rounded-full overflow-hidden mb-4">
                <div
                  className="bg-saffron h-full rounded-full transition-all duration-300"
                  style={{ width: `${(buyStep / 5) * 100}%` }}
                />
              </div>

              {/* STEP 1: COUNTRY SELECTION */}
              {buyStep === 1 && (
                <div className="space-y-4">
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    Select the geographic origin country for your virtual receptionist phone line.
                  </p>
                  <div>
                    <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Country</label>
                    <select
                      value={buyCountry}
                      onChange={(e) => setBuyCountry(e.target.value)}
                      className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none cursor-pointer"
                    >
                      <option value="US">United States (+1)</option>
                      <option value="GB">United Kingdom (+44)</option>
                      <option value="CA">Canada (+1)</option>
                      <option value="IN">India (+91)</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleFetchAvailable(buyCountry)}
                    disabled={loadingAvailable}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-40"
                  >
                    {loadingAvailable && <Spinner className="w-4 h-4 animate-spin" />}
                    Search Available Lines
                  </button>
                </div>
              )}

              {/* STEP 2: NUMBER SELECTION */}
              {buyStep === 2 && (
                <div className="space-y-4">
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    Choose one of the active numbers search found in the Twilio carrier directory.
                  </p>
                  <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                    {availableNumbers.map(item => (
                      <div
                        key={item.phoneNumber}
                        onClick={() => setSelectedNumberToBuy(item.phoneNumber)}
                        className={`flex justify-between items-center p-3 border rounded-xl cursor-pointer transition-colors ${
                          selectedNumberToBuy === item.phoneNumber ? "border-saffron bg-saffron/5" : "border-line hover:border-saffron/30"
                        }`}
                      >
                        <span className="font-mono text-xs font-semibold text-ink">{item.friendlyName || item.phoneNumber}</span>
                        <span className="text-[9px] font-bold text-ink-muted uppercase">Voice Line</span>
                      </div>
                    ))}
                    {availableNumbers.length === 0 && (
                      <p className="text-xs text-ink-muted text-center py-6">No available numbers found. Try another country.</p>
                    )}
                  </div>

                  <div className="flex justify-between items-center border-t border-line/40 pt-4">
                    <button
                      onClick={() => setBuyStep(1)}
                      className="px-4 py-2 border border-line hover:bg-canvas text-xs font-semibold rounded-xl text-ink"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setBuyStep(3)}
                      disabled={!selectedNumberToBuy}
                      className="px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl shadow-sm"
                    >
                      Confirm Selection
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CAPABILITIES & PURCHASE */}
              {buyStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-canvas/20 border border-line rounded-xl p-4 text-xs font-sans text-left space-y-3">
                    <span className="font-bold text-sm text-ink block mb-2">Carrier Checkout Details</span>
                    <div className="flex justify-between">
                      <span className="text-ink-tertiary">Selected Line</span>
                      <span className="font-mono font-semibold text-ink">{selectedNumberToBuy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-tertiary">Line Type</span>
                      <span className="font-semibold text-ink">Inbound / Outbound Voice</span>
                    </div>
                    <div className="flex justify-between border-t border-line/45 pt-2 font-bold">
                      <span className="text-ink">Telephony Monthly Rate</span>
                      <span className="text-ink">$2.00 / mo</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-line/40 pt-4">
                    <button
                      onClick={() => setBuyStep(2)}
                      className="px-4 py-2 border border-line hover:bg-canvas text-xs font-semibold rounded-xl text-ink"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleBuyNumber}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-40"
                    >
                      {saving && <Spinner className="w-4 h-4 animate-spin" />}
                      Buy & Provision Line
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: AI EMPLOYEE ASSIGNMENT */}
              {buyStep === 4 && (
                <div className="space-y-4">
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    Assign this new phone line to one of your active AI Employees to start handling calls immediately.
                  </p>
                  <div>
                    <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Select AI Employee</label>
                    <select
                      value={assignAssistantId}
                      onChange={(e) => setAssignAssistantId(e.target.value)}
                      className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none cursor-pointer"
                    >
                      <option value="">Leave Unassigned (Offline Draft)</option>
                      {assistants.map(ast => (
                        <option key={ast.id} value={ast.id}>{ast.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      const latestNum = phoneNumbers[phoneNumbers.length - 1];
                      if (latestNum) {
                        handleLinkNumber(latestNum.id, assignAssistantId);
                      } else {
                        setIsBuyOpen(false);
                      }
                    }}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                  >
                    {saving && <Spinner className="w-4 h-4 animate-spin" />}
                    Save Assignment & Complete
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. SLIDING NUMBER CONFIGURATION & ADVANCED SPECS DRAWER */}
      <AnimatePresence>
        {selectedPhone && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhoneId(null)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Drawer Box */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-line shadow-2xl z-50 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-line/40 flex justify-between items-center bg-canvas/10">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 bg-saffron/5 flex items-center justify-center rounded-xl">
                    <Phone className="w-4 h-4 text-saffron" />
                  </div>
                  <div>
                    <h4 className="font-mono font-bold text-sm text-ink">{selectedPhone.number}</h4>
                    <span className="text-[9px] font-mono text-ink-tertiary">Telephony ID: {selectedPhone.id}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPhoneId(null)}
                  className="p-1.5 text-ink-tertiary hover:text-ink border border-line hover:bg-canvas rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6 text-left">
                
                {/* Details list */}
                <div className="bg-canvas/30 border border-line rounded-xl p-4 grid grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Carrier Network</span>
                    <p className="font-semibold text-ink mt-0.5">Twilio Voice Trunk</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Monthly Rate</span>
                    <p className="font-semibold text-ink mt-0.5">$2.00 / mo</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Inbound Routing</span>
                    <p className="font-semibold text-ink mt-0.5">AI Agent Flow</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Outbound Status</span>
                    <p className="font-semibold text-ink mt-0.5">Active ID</p>
                  </div>
                </div>

                {/* Assignment settings */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary border-b border-line/40 pb-2">
                    Routing & AI Assignment
                  </h5>
                  <div>
                    <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">AI Employee Assigned</label>
                    <select
                      value={linkAssistantId}
                      onChange={(e) => setLinkAssistantId(e.target.value)}
                      className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-saffron text-ink font-semibold"
                    >
                      <option value="">Leave Unassigned (Offline)</option>
                      {assistants.map(ast => (
                        <option key={ast.id} value={ast.id}>{ast.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Save button */}
                  <button
                    onClick={() => handleLinkNumber(selectedPhone.id, linkAssistantId)}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-saffron hover:bg-saffron-dark text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm disabled:opacity-40"
                  >
                    Save Routing Assignment
                  </button>
                </div>

                {/* ADVANCED ACCORDION: SIP TRUNKS & WEBHOCK ENDPOINTS */}
                <div className="border border-line rounded-xl overflow-hidden">
                  <button
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    className="w-full flex justify-between items-center p-3 bg-canvas/15 hover:bg-canvas/30 text-xs font-semibold transition-all"
                  >
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-secondary">
                      <Sliders className="w-3.5 h-3.5 text-saffron" />
                      Advanced Technical Specs
                    </span>
                    {isAdvancedOpen ? <CaretDown className="w-4 h-4" /> : <CaretRight className="w-4 h-4" />}
                  </button>

                  <AnimatePresence>
                    {isAdvancedOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden bg-white border-t border-line"
                      >
                        <div className="p-4 space-y-3 text-[10px] font-mono text-ink-secondary leading-relaxed">
                          <div>
                            <span className="text-ink-muted uppercase block text-[8px]">Inbound Webhook URI</span>
                            <span className="break-all mt-0.5 block">https://api.bavio.in/twilio/webhook</span>
                          </div>
                          <div>
                            <span className="text-ink-muted uppercase block text-[8px]">SIP Trunk Address</span>
                            <span className="break-all mt-0.5 block">sip:trunk.us1.twilio.com</span>
                          </div>
                          <div>
                            <span className="text-ink-muted uppercase block text-[8px]">Twilio SID Reference</span>
                            <span className="break-all mt-0.5 block">{selectedPhone.twilio_sid || "—"}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-line/40 bg-canvas/10 flex justify-between items-center gap-4">
                <button
                  onClick={() => handleReleaseNumber(selectedPhone.id)}
                  disabled={saving}
                  className="flex items-center gap-1 px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors font-sans"
                >
                  <Trash className="w-3.5 h-3.5" />
                  Release Line
                </button>

                <button
                  onClick={() => handleLinkNumber(selectedPhone.id, linkAssistantId)}
                  disabled={saving}
                  className="flex items-center gap-1 px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all disabled:opacity-40 font-sans"
                >
                  {saving && <Spinner className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
