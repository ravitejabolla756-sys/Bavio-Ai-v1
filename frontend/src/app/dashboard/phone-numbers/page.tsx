"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  CheckCircle,
  Warning,
  ShieldWarning,
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
  Check,
  MagnifyingGlass,
  Buildings,
  IdentificationCard,
  MapPin,
  Broadcast,
} from "@phosphor-icons/react";
import {
  numbersApi,
  assistantsApi,
  callsApi,
  getClientId,
  PhoneNumber,
  Assistant,
  CallRecord,
  PhoneCountry,
  NumberTypeOption,
  AvailableNumber,
  RegulatoryRequirement,
} from "@/lib/api";

const INITIAL_COUNTRIES: PhoneCountry[] = [
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91", hasDirectInventory: false, availableTypes: ["local"], notice: "Indian phone-number availability depends on current regulatory and carrier requirements. You can use an eligible international Bavio number where available." },
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1", hasDirectInventory: true, availableTypes: ["local", "tollFree"] },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44", hasDirectInventory: true, availableTypes: ["local", "mobile", "national", "tollFree"] },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1", hasDirectInventory: true, availableTypes: ["local", "tollFree"] },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61", hasDirectInventory: true, availableTypes: ["local", "mobile", "tollFree"] },
  { code: "SG", name: "Singapore", flag: "🇸🇬", dialCode: "+65", hasDirectInventory: true, availableTypes: ["local", "mobile"] },
  { code: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49", hasDirectInventory: true, availableTypes: ["local", "mobile", "national", "tollFree"] },
  { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33", hasDirectInventory: true, availableTypes: ["local", "mobile", "tollFree"] },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", dialCode: "+971", hasDirectInventory: false, availableTypes: ["local"] },
];

export default function PhoneNumbersDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Data States
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);

  // Country & Catalog States
  const [countries, setCountries] = useState<PhoneCountry[]>(INITIAL_COUNTRIES);
  const [businessCountry, setBusinessCountry] = useState("IN"); // Default business country
  const [numberCountry, setNumberCountry] = useState("US"); // Selected phone number country
  const [availableTypes, setAvailableTypes] = useState<NumberTypeOption[]>([
    { type: "local", label: "Local", supported: true },
    { type: "tollFree", label: "Toll-Free", supported: true },
  ]);
  const [selectedType, setSelectedType] = useState("local");
  const [filterVoice, setFilterVoice] = useState(true);
  const [filterSms, setFilterSms] = useState(false);
  const [areaCodeFilter, setAreaCodeFilter] = useState("");

  // Buy Flow Wizard State
  const [isBuyOpen, setIsBuyOpen] = useState(false);
  const [buyStep, setBuyStep] = useState(1); // 1: Country & Type, 2: Inventory, 3: Regulatory / Checkout, 4: AI Assignment
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [inventoryNotice, setInventoryNotice] = useState<string | null>(null);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedNumberToBuy, setSelectedNumberToBuy] = useState<AvailableNumber | null>(null);
  const [assignAssistantId, setAssignAssistantId] = useState("");

  // Regulatory Compliance State
  const [regulatoryInfo, setRegulatoryInfo] = useState<RegulatoryRequirement | null>(null);
  const [loadingRegulatory, setLoadingRegulatory] = useState(false);
  const [businessLegalName, setBusinessLegalName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [signatoryName, setSignatoryName] = useState("");

  // Details drawer edit state
  const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [linkAssistantId, setLinkAssistantId] = useState("");

  const clientId = getClientId();

  // Load initial page data
  const loadData = useCallback(async () => {
    if (!clientId) {
      setErrorMsg("Not authenticated");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg("");

      const [nums, asts, callList, countryRes] = await Promise.all([
        numbersApi.list(clientId).catch(() => []),
        assistantsApi.list(clientId).catch(() => []),
        callsApi.list(clientId).catch(() => []),
        numbersApi.getCountries().catch(() => ({ success: true, countries: [] })),
      ]);

      setPhoneNumbers(Array.isArray(nums) ? nums : []);
      setAssistants(Array.isArray(asts) ? asts : []);
      setCalls(Array.isArray(callList) ? callList : []);

      if (countryRes?.countries && Array.isArray(countryRes.countries) && countryRes.countries.length > 0) {
        setCountries(countryRes.countries);
      }
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

  // Load supported number types when numberCountry changes
  useEffect(() => {
    if (!numberCountry) return;
    let isMounted = true;

    async function fetchTypes() {
      try {
        const res = await numbersApi.getNumberTypes(numberCountry);
        if (isMounted && res?.types) {
          setAvailableTypes(res.types);
          if (res.types.length > 0 && !res.types.some((t) => t.type === selectedType)) {
            setSelectedType(res.types[0].type);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch types for country:", e);
      }
    }

    fetchTypes();
    return () => {
      isMounted = false;
    };
  }, [numberCountry, selectedType]);

  const selectedPhone = phoneNumbers.find((p) => p.id === selectedPhoneId);

  // Sync linkAssistantId when selectedPhone changes
  useEffect(() => {
    if (selectedPhone) {
      setLinkAssistantId(selectedPhone.assistant_id || "");
    }
  }, [selectedPhone]);

  // Fetch available numbers dynamically from Twilio
  const handleFetchAvailable = async () => {
    setLoadingAvailable(true);
    setErrorMsg("");
    setInventoryNotice(null);
    setAvailableNumbers([]);
    setSelectedNumberToBuy(null);

    try {
      const res = await numbersApi.search({
        countryCode: numberCountry,
        type: selectedType,
        voice: filterVoice,
        sms: filterSms,
        areaCode: areaCodeFilter.trim() || undefined,
        limit: 12,
      });

      if (res?.numbers) {
        setAvailableNumbers(res.numbers);
      }
      if (res?.notice) {
        setInventoryNotice(res.notice);
      }
      setBuyStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to query carrier inventory for this country.");
    } finally {
      setLoadingAvailable(false);
    }
  };

  // Check regulatory requirements before proceeding to checkout
  const handleSelectNumber = async (num: AvailableNumber) => {
    setSelectedNumberToBuy(num);
    setLoadingRegulatory(true);
    setErrorMsg("");

    try {
      const reqs = await numbersApi.getRegulatoryRequirements(num.isoCountry, num.numberType);
      setRegulatoryInfo(reqs);
      setBuyStep(3);
    } catch (err: any) {
      console.warn("Regulatory check error:", err);
      setRegulatoryInfo({
        required: false,
        friendlyName: `${num.isoCountry} Standard Provisioning`,
        requirements: [],
        message: "Standard provisioning available.",
      });
      setBuyStep(3);
    } finally {
      setLoadingRegulatory(false);
    }
  };

  // Trigger Purchase & Provisioning
  const handleBuyNumber = async () => {
    if (!selectedNumberToBuy) return;
    setSaving(true);
    setErrorMsg("");

    try {
      const payload: any = {
        phoneNumber: selectedNumberToBuy.phoneNumber,
        countryCode: selectedNumberToBuy.isoCountry,
        numberType: selectedNumberToBuy.numberType,
      };

      if (regulatoryInfo?.required) {
        payload.regulatoryInfo = {
          businessLegalName: businessLegalName.trim() || "Bavio Enterprise Customer",
          businessAddress: businessAddress.trim() || "Registered Business Address",
          signatoryName: signatoryName.trim() || "Authorized Officer",
        };
      }

      const res = await numbersApi.provision(payload);
      const provisioned = res.data;

      setSuccessMsg(`Successfully provisioned ${provisioned.number || provisioned.phone_number}!`);
      setPhoneNumbers((prev) => [provisioned, ...prev.filter((p) => p.id !== provisioned.id)]);

      // Move to step 4 for assignment
      setBuyStep(4);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to provision number with carrier");
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
        setPhoneNumbers((prev) =>
          prev.map((p) => (p.id === phoneId ? { ...p, assistant_id: null, assistant_name: null } : p))
        );
        setSuccessMsg("Phone number unlinked from AI Employee.");
      } else {
        const ast = assistants.find((a) => a.id === assistantId);
        if (!ast) throw new Error("AI Employee not found");

        const updated = await numbersApi.linkNumber({
          phoneId,
          assistantId,
          assistantName: ast.name,
        });

        setPhoneNumbers((prev) => prev.map((p) => (p.id === phoneId ? { ...p, ...updated } : p)));
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
    if (
      !window.confirm(
        "Are you sure you want to release this phone number? You will lose access to it immediately."
      )
    )
      return;
    setSaving(true);
    setErrorMsg("");
    try {
      await numbersApi.release(phoneId);
      setPhoneNumbers((prev) => prev.filter((p) => p.id !== phoneId));
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
    return calls.filter((c) => c.virtual_number === numStr || c.caller_number === numStr).length;
  };

  const selectedCountryObj = countries.find((c) => c.code === numberCountry);
  const selectedBusinessCountryObj = countries.find((c) => c.code === businessCountry);

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div className="flex items-center justify-between border-b border-line/40 pb-6">
          <div className="text-left">
            <h1 className="font-serif text-3xl text-ink font-normal">Phone Numbers</h1>
            <p className="text-body-xs text-ink-tertiary mt-1">Connecting to Twilio carrier directory...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
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
            Manage the virtual phone numbers your AI employees use to receive and make calls.
          </p>
        </div>

        <button
          id="get-phone-number-btn"
          onClick={() => {
            setBuyStep(1);
            setIsBuyOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl transition-all shadow-sm self-start md:self-auto cursor-pointer"
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
            <h4 className="text-sm font-bold text-ink mb-1 font-sans">Connect a Bavio Phone Number</h4>
            <p className="text-xs text-ink-tertiary max-w-md font-sans leading-relaxed">
              Equip your AI voice receptionist with a dedicated carrier line. Search live inventory across available
              countries and provision instantaneously.
            </p>
          </div>

          {/* Capabilities features overview */}
          <div className="flex flex-wrap justify-center gap-4 mt-2 text-[10px] font-bold text-ink-secondary uppercase tracking-wider">
            <span className="flex items-center gap-1.5 bg-canvas/20 border border-line/50 px-3 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5 text-state-success" />
              Voice Inbound
            </span>
            <span className="flex items-center gap-1.5 bg-canvas/20 border border-line/50 px-3 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5 text-state-success" />
              Voice Outbound
            </span>
            <span className="flex items-center gap-1.5 bg-canvas/20 border border-line/50 px-3 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5 text-state-success" />
              AI Employee Auto-Routing
            </span>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                setBuyStep(1);
                setIsBuyOpen(true);
              }}
              className="px-4 py-2.5 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              Get a Phone Number
            </button>
            <button
              onClick={() => alert("To link an existing external SIP or carrier line, please contact support@bavio.in.")}
              className="px-4 py-2.5 border border-line bg-white hover:bg-canvas text-xs font-semibold rounded-xl transition-colors text-ink cursor-pointer"
            >
              Use an existing number
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {phoneNumbers.map((num) => {
            const hasAgent = !!num.assistant_id;
            const displayNumber = num.number || num.phone_number || "—";
            const callsCount = getCallCountForNumber(displayNumber);
            return (
              <div
                key={num.id}
                className="bg-white border border-line rounded-2xl p-6 shadow-[0_1px_2px_rgba(20,10,2,0.02)] hover:border-saffron/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[240px]"
              >
                <div>
                  {/* Phone Header & status */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-mono text-base font-bold text-ink leading-tight">{displayNumber}</h3>
                      <span className="text-[10px] text-ink-muted mt-0.5 block capitalize">
                        {num.phone_number_type || "Local"} · {num.country_code || "US"}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded border capitalize ${
                        hasAgent
                          ? "text-green-700 border-green-200 bg-green-50"
                          : "text-amber-700 border-amber-200 bg-amber-50"
                      }`}
                    >
                      {hasAgent ? "Online" : "Unassigned"}
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
                      <span className="font-semibold text-ink mt-0.5 block">Voice In / Out</span>
                    </div>
                    <div>
                      <span className="text-ink-muted block uppercase tracking-wider text-[8px]">Carrier Network</span>
                      <span className="font-semibold text-ink mt-0.5 block capitalize">
                        {num.provider || "Twilio"}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-muted block uppercase tracking-wider text-[8px]">Calls Handled</span>
                      <span className="font-semibold text-ink mt-0.5 block">{callsCount} calls</span>
                    </div>
                  </div>
                </div>

                {/* Footer specs */}
                <div className="flex justify-between items-center border-t border-line/30 pt-3 mt-4">
                  <span className="text-[10px] font-mono text-ink-tertiary font-bold">$2.00 / mo</span>
                  <button
                    onClick={() => setSelectedPhoneId(num.id)}
                    className="px-3.5 py-1.5 border border-line bg-canvas hover:bg-canvas/50 text-[9px] font-bold uppercase tracking-wider text-ink rounded-xl transition-all cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white border border-line rounded-[24px] p-6 sm:p-7 shadow-2xl z-50 w-full max-w-xl text-left max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-line/40 pb-4 mb-4">
                <div>
                  <h3 className="font-serif text-xl font-normal text-ink">Choose your Bavio phone number</h3>
                  <p className="text-[11px] text-ink-tertiary mt-0.5">
                    Live carrier inventory powered by dynamic Twilio routing.
                  </p>
                </div>
                <button
                  onClick={() => setIsBuyOpen(false)}
                  className="p-1.5 text-ink-tertiary hover:text-ink border border-line hover:bg-canvas rounded-full transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex items-center justify-between mb-5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                <span className={buyStep >= 1 ? "text-saffron font-bold" : ""}>1. Country & Type</span>
                <span>→</span>
                <span className={buyStep >= 2 ? "text-saffron font-bold" : ""}>2. Inventory</span>
                <span>→</span>
                <span className={buyStep >= 3 ? "text-saffron font-bold" : ""}>3. Compliance & Review</span>
                <span>→</span>
                <span className={buyStep >= 4 ? "text-saffron font-bold" : ""}>4. Assign</span>
              </div>

              {/* Progress Line */}
              <div className="w-full h-1 bg-canvas/40 rounded-full overflow-hidden mb-6">
                <div
                  className="bg-saffron h-full rounded-full transition-all duration-300"
                  style={{ width: `${(buyStep / 4) * 100}%` }}
                />
              </div>

              {/* ========================================================= */}
              {/* STEP 1: BUSINESS COUNTRY & PHONE NUMBER COUNTRY SELECTION */}
              {/* ========================================================= */}
              {buyStep === 1 && (
                <div className="space-y-5">
                  {/* Business Country Selection */}
                  <div className="bg-canvas/20 border border-line rounded-xl p-3.5">
                    <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">
                      Your Business Location (Country)
                    </label>
                    <select
                      value={businessCountry}
                      onChange={(e) => setBusinessCountry(e.target.value)}
                      className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-saffron cursor-pointer font-medium"
                    >
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name} ({c.dialCode || c.code})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-ink-muted mt-1.5">
                      Bavio is available globally for businesses in {selectedBusinessCountryObj?.name || "all countries"}.
                    </p>
                  </div>

                  {/* Phone Number Country Selection */}
                  <div>
                    <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">
                      Phone Number Country (Twilio Inventory)
                    </label>
                    <select
                      value={numberCountry}
                      onChange={(e) => setNumberCountry(e.target.value)}
                      className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-saffron cursor-pointer font-semibold"
                    >
                      {countries
                        .filter((c) => c.hasDirectInventory || c.code === "US" || c.code === "GB" || c.code === "CA" || c.code === "IN")
                        .map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.name} {c.dialCode ? `(${c.dialCode})` : ""}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Country specific notice (e.g. India regulatory notice) */}
                  {selectedCountryObj?.notice && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 flex gap-2.5">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                      <div>{selectedCountryObj.notice}</div>
                    </div>
                  )}

                  {/* Number Type Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">
                        Number Type
                      </label>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-saffron cursor-pointer capitalize font-medium"
                      >
                        {availableTypes.map((t) => (
                          <option key={t.type} value={t.type}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">
                        Area Code / Prefix (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 415 or 212"
                        value={areaCodeFilter}
                        onChange={(e) => setAreaCodeFilter(e.target.value)}
                        className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-saffron placeholder:text-ink-muted"
                      />
                    </div>
                  </div>

                  {/* Capabilities selection */}
                  <div>
                    <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-2">
                      Required Capabilities
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterVoice}
                          onChange={(e) => setFilterVoice(e.target.checked)}
                          className="accent-saffron rounded"
                        />
                        <span>Voice Inbound & Outbound</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterSms}
                          onChange={(e) => setFilterSms(e.target.checked)}
                          className="accent-saffron rounded"
                        />
                        <span>SMS Messaging</span>
                      </label>
                    </div>
                  </div>

                  <button
                    id="search-available-numbers-btn"
                    onClick={handleFetchAvailable}
                    disabled={loadingAvailable}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {loadingAvailable ? (
                      <>
                        <Spinner className="w-4 h-4 animate-spin" />
                        <span>Searching available numbers...</span>
                      </>
                    ) : (
                      <>
                        <MagnifyingGlass className="w-4 h-4" />
                        <span>Search Live Available Numbers</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 2: LIVE NUMBER INVENTORY SELECTION */}
              {/* ========================================================= */}
              {buyStep === 2 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-ink-secondary">
                      Showing live inventory in{" "}
                      <span className="font-semibold text-ink">
                        {selectedCountryObj?.name || numberCountry} ({selectedType})
                      </span>
                    </p>
                    <button
                      onClick={() => setBuyStep(1)}
                      className="text-[11px] text-saffron hover:underline font-semibold cursor-pointer"
                    >
                      Change Filters
                    </button>
                  </div>

                  {inventoryNotice && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800">
                      {inventoryNotice}
                    </div>
                  )}

                  <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
                    {availableNumbers.map((item) => {
                      const isSelected = selectedNumberToBuy?.phoneNumber === item.phoneNumber;
                      return (
                        <div
                          key={item.phoneNumber}
                          onClick={() => setSelectedNumberToBuy(item)}
                          className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? "border-saffron bg-saffron/5 shadow-sm"
                              : "border-line hover:border-saffron/40 bg-white"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-ink">
                                {item.friendlyName || item.phoneNumber}
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-saffron" />}
                            </div>
                            <div className="text-[10px] text-ink-muted mt-0.5 flex items-center gap-2">
                              <span>
                                {item.locality ? `${item.locality}, ` : ""}
                                {item.region || item.isoCountry}
                              </span>
                              <span>•</span>
                              <span className="capitalize">{item.numberType}</span>
                              <span>•</span>
                              <span>Voice In / Out</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono text-xs font-bold text-ink">{item.monthlyRate}</span>
                            <span className="text-[9px] text-ink-muted block">Monthly</span>
                          </div>
                        </div>
                      );
                    })}

                    {availableNumbers.length === 0 && (
                      <div className="text-center py-8 px-4 bg-canvas/20 border border-line rounded-xl">
                        <p className="text-xs font-semibold text-ink">No voice numbers are currently available.</p>
                        <p className="text-[11px] text-ink-tertiary mt-1 max-w-sm mx-auto">
                          Try searching another number type (Local / Toll-Free) or select an eligible international Bavio
                          number country (e.g. United States, United Kingdom).
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center border-t border-line/40 pt-4">
                    <button
                      onClick={() => setBuyStep(1)}
                      className="px-4 py-2 border border-line hover:bg-canvas text-xs font-semibold rounded-xl text-ink cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => selectedNumberToBuy && handleSelectNumber(selectedNumberToBuy)}
                      disabled={!selectedNumberToBuy || loadingRegulatory}
                      className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl shadow-sm disabled:opacity-40 cursor-pointer"
                    >
                      {loadingRegulatory && <Spinner className="w-3.5 h-3.5 animate-spin" />}
                      Continue to Review
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 3: REGULATORY COMPLIANCE & CHECKOUT REVIEW */}
              {/* ========================================================= */}
              {buyStep === 3 && selectedNumberToBuy && (
                <div className="space-y-4">
                  {/* Regulatory Compliance Box if Required */}
                  {regulatoryInfo?.required ? (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <IdentificationCard className="w-4 h-4 text-amber-700" />
                        <span>Regulatory Verification Required</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        {regulatoryInfo.message ||
                          "This country requires standard business compliance registration before activating the phone line."}
                      </p>

                      <div className="space-y-2 pt-2 border-t border-amber-200/60">
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                            Legal Business Name
                          </label>
                          <input
                            type="text"
                            placeholder="Your Registered Business Name"
                            value={businessLegalName}
                            onChange={(e) => setBusinessLegalName(e.target.value)}
                            className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                            Business Physical Address
                          </label>
                          <input
                            type="text"
                            placeholder="Street, City, Postal Code"
                            value={businessAddress}
                            onChange={(e) => setBusinessAddress(e.target.value)}
                            className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                            Authorized Representative Name
                          </label>
                          <input
                            type="text"
                            placeholder="Full Name of Officer"
                            value={signatoryName}
                            onChange={(e) => setSignatoryName(e.target.value)}
                            className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-800 text-xs font-medium">
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                      <span>Instant carrier provisioning ready. No additional regulatory documentation required.</span>
                    </div>
                  )}

                  {/* Review Summary */}
                  <div className="bg-canvas/20 border border-line rounded-xl p-4 text-xs font-sans text-left space-y-3">
                    <span className="font-bold text-sm text-ink block mb-2">Order & Routing Summary</span>
                    <div className="flex justify-between">
                      <span className="text-ink-tertiary">Selected Number</span>
                      <span className="font-mono font-bold text-ink">{selectedNumberToBuy.phoneNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-tertiary">Carrier Line Type</span>
                      <span className="font-semibold text-ink capitalize">
                        {selectedNumberToBuy.numberType} ({selectedNumberToBuy.isoCountry})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-tertiary">Capabilities</span>
                      <span className="font-semibold text-ink">Voice Inbound · Voice Outbound</span>
                    </div>
                    <div className="flex justify-between border-t border-line/45 pt-2 font-bold">
                      <span className="text-ink">Telephony Monthly Rate</span>
                      <span className="text-ink">{selectedNumberToBuy.monthlyRate}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-line/40 pt-4">
                    <button
                      onClick={() => setBuyStep(2)}
                      className="px-4 py-2 border border-line hover:bg-canvas text-xs font-semibold rounded-xl text-ink cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleBuyNumber}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {saving && <Spinner className="w-4 h-4 animate-spin" />}
                      Confirm & Provision Number
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 4: AI EMPLOYEE ASSIGNMENT */}
              {/* ========================================================= */}
              {buyStep === 4 && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-800 text-xs font-medium">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <span>Number provisioned and verified with Twilio carrier routing!</span>
                  </div>

                  <p className="text-xs text-ink-secondary leading-relaxed">
                    Assign this new phone line to one of your active AI Employees so inbound calls are automatically
                    handled with real-time conversational AI.
                  </p>
                  <div>
                    <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">
                      Select AI Employee
                    </label>
                    <select
                      value={assignAssistantId}
                      onChange={(e) => setAssignAssistantId(e.target.value)}
                      className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none cursor-pointer"
                    >
                      <option value="">Leave Unassigned (Offline Draft)</option>
                      {assistants.map((ast) => (
                        <option key={ast.id} value={ast.id}>
                          {ast.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      const latestNum = phoneNumbers[0];
                      if (latestNum) {
                        handleLinkNumber(latestNum.id, assignAssistantId);
                      } else {
                        setIsBuyOpen(false);
                      }
                    }}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    {saving && <Spinner className="w-4 h-4 animate-spin" />}
                    Complete Setup
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
              transition={{ type: "tween", duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-line shadow-2xl z-50 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-line/40 flex justify-between items-center bg-canvas/10">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 bg-saffron/5 flex items-center justify-center rounded-xl">
                    <Phone className="w-4 h-4 text-saffron" />
                  </div>
                  <div>
                    <h4 className="font-mono font-bold text-sm text-ink">{selectedPhone.number || selectedPhone.phone_number}</h4>
                    <span className="text-[9px] font-mono text-ink-tertiary">Telephony ID: {selectedPhone.id}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPhoneId(null)}
                  className="p-1.5 text-ink-tertiary hover:text-ink border border-line hover:bg-canvas rounded-full transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6 text-left">
                {/* Details list */}
                <div className="bg-canvas/30 border border-line rounded-xl p-4 grid grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">
                      Carrier Network
                    </span>
                    <p className="font-semibold text-ink mt-0.5">Twilio Voice Trunk</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">
                      Monthly Rate
                    </span>
                    <p className="font-semibold text-ink mt-0.5">$2.00 / mo</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">
                      Inbound Routing
                    </span>
                    <p className="font-semibold text-ink mt-0.5">AI Agent Flow</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">
                      Outbound Status
                    </span>
                    <p className="font-semibold text-ink mt-0.5">Active ID</p>
                  </div>
                </div>

                {/* Assignment settings */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary border-b border-line/40 pb-2">
                    Routing & AI Assignment
                  </h5>
                  <div>
                    <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">
                      AI Employee Assigned
                    </label>
                    <select
                      value={linkAssistantId}
                      onChange={(e) => setLinkAssistantId(e.target.value)}
                      className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-saffron text-ink font-semibold"
                    >
                      <option value="">Leave Unassigned (Offline)</option>
                      {assistants.map((ast) => (
                        <option key={ast.id} value={ast.id}>
                          {ast.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Save button */}
                  <button
                    onClick={() => handleLinkNumber(selectedPhone.id, linkAssistantId)}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-saffron hover:bg-saffron-dark text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm disabled:opacity-40 cursor-pointer"
                  >
                    Save Routing Assignment
                  </button>
                </div>

                {/* ADVANCED ACCORDION */}
                <div className="border border-line rounded-xl overflow-hidden">
                  <button
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    className="w-full flex justify-between items-center p-3 bg-canvas/15 hover:bg-canvas/30 text-xs font-semibold transition-all cursor-pointer"
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
                            <span className="break-all mt-0.5 block">https://api.bavio.in/calls/twilio</span>
                          </div>
                          <div>
                            <span className="text-ink-muted uppercase block text-[8px]">Carrier Network</span>
                            <span className="break-all mt-0.5 block">Twilio Programmable Voice</span>
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
                  className="flex items-center gap-1 px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors font-sans cursor-pointer"
                >
                  <Trash className="w-3.5 h-3.5" />
                  Release Line
                </button>

                <button
                  onClick={() => handleLinkNumber(selectedPhone.id, linkAssistantId)}
                  disabled={saving}
                  className="flex items-center gap-1 px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all disabled:opacity-40 font-sans cursor-pointer"
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
