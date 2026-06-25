"use client";

import React, { useState, useEffect } from "react";
import { useCountry } from "@/context/CountryContext";
import { CALL_FORWARD_INSTRUCTIONS, OperatorInstruction } from "@/config/callForwardInstructions";
import { SearchableDropdown } from "@/components/shared/SearchableDropdown";
import {
  CaretDown,
  Check,
  GlobeSimple,
  Spinner,
  Phone,
  PhoneCall,
  Copy,
  ArrowRight,
  ArrowLeft,
  Chats,
  Info,
  YoutubeLogo,
  Warning,
  CheckCircle,
  Question,
  DeviceMobile
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

interface CallForwardSetupProps {
  virtualNumber?: string;
  onComplete?: () => void;
  onSupportClick?: () => void;
}

export default function CallForwardSetup({
  virtualNumber = "+1 (202) 555-0199",
  onComplete,
  onSupportClick
}: CallForwardSetupProps) {
  const { country, changeCountry } = useCountry();
  const [selectedCountry, setSelectedCountry] = useState(country.code || "US");
  
  // Resolve list of operators for the selected country
  const operatorMap = CALL_FORWARD_INSTRUCTIONS[selectedCountry] || CALL_FORWARD_INSTRUCTIONS["US"];
  const operators = Object.keys(operatorMap);
  const [selectedOperator, setSelectedOperator] = useState(operators[0] || "");
 
  // Stepper state
  const [currentStep, setCurrentStep] = useState(0);

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Copy state
  const [copiedText, setCopiedText] = useState(false);

  // Track user override or context change
  useEffect(() => {
    if (country.code && country.code !== selectedCountry) {
      setSelectedCountry(country.code);
      const newMap = CALL_FORWARD_INSTRUCTIONS[country.code] || CALL_FORWARD_INSTRUCTIONS["US"];
      const newOps = Object.keys(newMap);
      setSelectedOperator(newOps[0] || "");
      setCurrentStep(0);
      setVerificationSuccess(false);
      setVerificationError(null);
    }
  }, [country.code, selectedCountry]);

  // Adjust operator when country is manually overridden
  const handleCountryChange = (code: string) => {
    setSelectedCountry(code);
    changeCountry(code); // update global context
    const newMap = CALL_FORWARD_INSTRUCTIONS[code] || CALL_FORWARD_INSTRUCTIONS["US"];
    const newOps = Object.keys(newMap);
    setSelectedOperator(newOps[0] || "");
    setCurrentStep(0);
    setVerificationSuccess(false);
    setVerificationError(null);
  };

  const instruction: OperatorInstruction = operatorMap[selectedOperator] || Object.values(operatorMap)[0];

  // USSD code builder (extracts 10 digits for local carriers, formats international prefix for US numbers)
  const getCleanUssdNumber = (num: string) => {
    const cleaned = num.replace(/\D/g, "");
    if (num.startsWith("+1") || (cleaned.length === 11 && cleaned.startsWith("1"))) {
      const digitsWithoutPlus = cleaned.startsWith("1") ? cleaned : `1${cleaned}`;
      return `00${digitsWithoutPlus}`; // e.g. 0012025550199
    }
    return cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
  };

  const cleanUssdNum = getCleanUssdNumber(virtualNumber);
  const ussdCodeString = instruction?.code ? `${instruction.code}${cleanUssdNum}#` : "";

  const handleCopyCode = () => {
    const textToCopy = ussdCodeString || virtualNumber;
    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Replace tokens in instruction steps
  const formatStepText = (text: string) => {
    return text
      .replace("{virtualNumber}", virtualNumber)
      .replace("{ussdCode}", ussdCodeString);
  };

  // Real backend call forwarding verification check
  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("bavio_token") : null;
      const response = await fetch("/api/numbers/verify-forwarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Carrier verification timed out.");
      }

      setVerificationSuccess(true);
      console.log("[CallForwardSetup] Verification confirmed live via backend.");
    } catch (err: any) {
      console.error("Verification failed:", err);
      setVerificationError(
        err.message || "Carrier verification check failed. Please ensure call forwarding has been configured on your device, then try again."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  if (!instruction) return null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-16 font-sans">
      {/* Page Header */}
      <div className="mb-10 text-center md:text-left">
        <span className="rounded-full bg-saffron/15 px-3.5 py-1 text-[10px] uppercase tracking-[0.2em] font-bold text-saffron inline-block mb-3">
          Verification Phase
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-[#140A02] mb-3">
          Configure Call Forwarding
        </h1>
        <p className="text-body-sm text-[#5A5A66] max-w-2xl leading-relaxed">
          To receive calls, forward your active business number to your new Bavio virtual line. Select your carrier below for tailored setup guides.
        </p>
      </div>
 
      {/* Main Container: Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Settings and Media - Span 5 */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Card 1: Configuration Selection */}
          <div className="bg-white border border-[#E5E0D8] p-1.5 rounded-[2rem] shadow-premium">
            <div className="bg-[#FAF9F6]/40 border border-[#E5E0D8] rounded-[calc(2rem-0.375rem)] p-6 flex flex-col gap-5">
              <h2 className="text-body-xs font-bold text-[#140A02] uppercase tracking-wider border-b border-[#E5E0D8] pb-3 flex items-center gap-2">
                <GlobeSimple className="w-4 h-4 text-saffron" />
                Select Carrier & Provider
              </h2>
 
              {/* Operator Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider">Telecom Operator</label>
                <SearchableDropdown
                  options={operators.map((op) => ({
                    value: op,
                    label: operatorMap[op].name,
                  }))}
                  value={selectedOperator}
                  onChange={(val) => {
                    setSelectedOperator(val);
                    setCurrentStep(0);
                    setVerificationSuccess(false);
                    setVerificationError(null);
                  }}
                />
              </div>
 
              {/* Estimated Time Badge */}
              <div className="flex items-center gap-2 bg-[#FAF9F6] rounded-xl p-3 border border-[#E5E0D8]/60 text-body-xs font-bold text-[#5A5A66]">
                <Info className="w-4 h-4 text-saffron" />
                <span>Estimated Setup Time: <strong className="text-saffron">{instruction.estimatedTimeMinutes} minutes</strong></span>
              </div>
            </div>
          </div>
 
          {/* Card 2: Interactive Video Embed */}
          {instruction.videoUrl && (
            <div className="bg-white border border-[#E5E0D8] p-1.5 rounded-[2rem] shadow-premium">
              <div className="bg-[#FAF9F6]/40 border border-[#E5E0D8] rounded-[calc(2rem-0.375rem)] p-5 flex flex-col gap-4">
                <h3 className="text-body-xs font-bold text-[#140A02] uppercase tracking-wider flex items-center gap-2">
                  <YoutubeLogo className="w-4.5 h-4.5 text-[#FF0000]" weight="fill" />
                  Video Setup Tutorial
                </h3>
                
                {/* Embed container */}
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[#E5E0D8]">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${instruction.videoUrl}?rel=0&modestbranding=1`}
                    title={`${instruction.name} Call Forwarding Setup`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          )}
 
          {/* Card 3: Portal Help Link */}
          {instruction.portalUrl && (
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 flex justify-between items-center transition-all hover:bg-[#FAF9F6] hover:border-[#E5E0D8] hover:shadow-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-[#8A8A96]">Portal Support</span>
                <span className="text-body-xs font-bold text-[#140A02]">{instruction.portalLabel}</span>
              </div>
              <a
                href={instruction.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-saffron hover:bg-saffron-hover text-white font-bold text-[10px] uppercase py-2 px-4 rounded-lg transition-all"
              >
                Open Site ↗
              </a>
            </div>
          )}
        </div>
 
        {/* Right Column: Step-by-Step Stepper - Span 7 */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Main Stepper Card */}
          <div className="bg-white border border-[#E5E0D8] p-1.5 rounded-[2rem] shadow-premium relative overflow-hidden min-h-[460px] flex flex-col justify-between">
            <div className="bg-[#FAF9F6]/40 border border-[#E5E0D8] rounded-[calc(2rem-0.375rem)] p-6 md:p-8 flex-1 flex flex-col justify-between">
              
              {/* Stepper Header */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono tracking-widest text-saffron font-bold uppercase">
                    Setup Walkthrough
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#8A8A96] bg-white border border-[#E5E0D8] px-2.5 py-0.5 rounded-full">
                    Step {currentStep + 1} of {instruction.steps.length}
                  </span>
                </div>
                
                {/* Stepper Progress Bar */}
                <div className="w-full h-1 bg-[#FAF9F6] border border-[#E5E0D8]/40 rounded-full overflow-hidden mb-6">
                  <motion.div
                    className="h-full bg-saffron rounded-full"
                    animate={{ width: `${((currentStep + 1) / instruction.steps.length) * 100}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              </div>
 
              {/* Stepper Content */}
              <div className="flex-1 flex flex-col justify-center py-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${selectedOperator}-${currentStep}`}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-6"
                  >
                    {/* Operator Warnings/Compliance Badges */}
                    {instruction.badge && currentStep === 0 && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-3.5 flex items-start gap-2.5">
                        <Warning className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-amber-600" />
                        <div className="text-body-xs font-semibold leading-relaxed">
                          <strong>Regulatory Notice:</strong> {instruction.badge}
                        </div>
                      </div>
                    )}
 
                    {/* Step Content */}
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-saffron/15 text-saffron flex items-center justify-center font-bold font-mono text-body-xs flex-shrink-0">
                        {currentStep + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-body-sm md:text-body font-medium text-[#140A02] leading-relaxed">
                          {formatStepText(instruction.steps[currentStep])}
                        </p>
                      </div>
                    </div>
 
                    {/* Interactive Widget 1: USSD Code Builder & Dialer Copy */}
                    {instruction.code && instruction.steps[currentStep].includes("{ussdCode}") && (
                      <div className="bg-[#FAF9F6] border border-[#E5E0D8] rounded-2xl p-5 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-saffron text-white flex items-center justify-center">
                            <DeviceMobile className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8A8A96] block">Carrier Command Code</span>
                            <code className="text-body-sm font-mono font-bold text-[#140A02] select-all">
                              {ussdCodeString}
                            </code>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="w-full sm:w-auto bg-white border border-[#E5E0D8] text-[#140A02] hover:bg-[#FAF9F6] text-body-xs font-bold uppercase tracking-wider py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                          {copiedText ? (
                            <>
                              <Check className="w-4 h-4 text-saffron" weight="bold" />
                              <span className="text-saffron">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy Command</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
 
                    {/* Interactive Widget 2: Standard Number Display */}
                    {!instruction.code && instruction.steps[currentStep].includes("{virtualNumber}") && (
                      <div className="bg-[#FAF9F6] border border-[#E5E0D8] rounded-2xl p-5 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-saffron text-white flex items-center justify-center">
                            <PhoneCall className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8A8A96] block">Bavio Virtual Number</span>
                            <span className="text-body-sm font-bold text-[#140A02] select-all">
                              {virtualNumber}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="w-full sm:w-auto bg-white border border-[#E5E0D8] text-[#140A02] hover:bg-[#FAF9F6] text-body-xs font-bold uppercase tracking-wider py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                          {copiedText ? (
                            <>
                              <Check className="w-4 h-4 text-saffron" weight="bold" />
                              <span className="text-saffron">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy Number</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
 
              {/* Stepper Footer Controls */}
              <div className="flex items-center justify-between gap-3 pt-5 border-t border-[#E5E0D8] mt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                  className="bg-white hover:bg-[#FAF9F6] disabled:opacity-40 disabled:hover:bg-white text-[#140A02] border border-[#E5E0D8] text-body-xs font-bold uppercase tracking-wider py-3 px-5 rounded-xl flex items-center gap-2 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" weight="bold" />
                  <span>Prev</span>
                </button>
 
                {currentStep < instruction.steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => Math.min(instruction.steps.length - 1, prev + 1))}
                    className="bg-saffron hover:bg-saffron-hover text-white text-body-xs font-bold uppercase tracking-wider py-3 px-6 rounded-xl flex items-center gap-2 transition-all"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-4 h-4" weight="bold" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(0)}
                    className="bg-[#FAF9F6] hover:bg-[#FAF7F2] border border-[#E5E0D8] text-[#140A02] text-body-xs font-bold uppercase tracking-wider py-3 px-5 rounded-xl flex items-center gap-2 transition-all"
                  >
                    <span>Start Over</span>
                  </button>
                )}
              </div>
            </div>
          </div>
 
          {/* Verification / Success Card */}
          <div className="bg-white border border-[#E5E0D8] p-1.5 rounded-[2rem] shadow-premium">
            <div className="bg-[#FAF9F6]/40 border border-[#E5E0D8] rounded-[calc(2rem-0.375rem)] p-6 md:p-8 flex flex-col gap-6">
              
              {!verificationSuccess ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-body-sm font-bold text-[#140A02] mb-1.5 flex items-center gap-2">
                        <PhoneCall className="w-4.5 h-4.5 text-saffron" />
                        Test Forwarding Connectivity
                      </h3>
                      <p className="text-body-xs text-[#5A5A66] leading-relaxed">
                        Once you&apos;ve applied the settings on your phone, click verify. We will run a real backend handshake check to verify your routing line is active.
                      </p>
                    </div>
 
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={isVerifying}
                      className="bg-saffron hover:bg-saffron-hover text-white text-body-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_4px_16px_rgba(255,107,0,0.2)] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed min-w-[150px]"
                    >
                      {isVerifying ? (
                        <>
                          <Spinner className="w-4 h-4 text-white animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify Setup</span>
                          <Check className="w-4 h-4" weight="bold" />
                        </>
                      )}
                    </button>
                  </div>
 
                  {verificationError && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 text-red-500 text-body-xs font-semibold rounded-xl p-3.5 flex items-start gap-2.5"
                    >
                      <Warning className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                      <div className="leading-relaxed">{verificationError}</div>
                    </motion.div>
                  )}
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_4px_16px_rgba(255,107,0,0.06)]"
                >
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 border border-green-200 text-green-600 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-7 h-7" weight="fill" />
                    </div>
                    <div>
                      <h3 className="text-body-sm font-bold text-green-700 mb-1">
                        Forwarding Verified & Live!
                      </h3>
                      <p className="text-[12px] text-[#5A5A66] leading-relaxed max-w-md">
                        Our test connection completed successfully. Calls to your business line will now instantly route to your Bavio AI receptionist.
                      </p>
                    </div>
                  </div>
 
                  <button
                    type="button"
                    onClick={onComplete}
                    className="w-full md:w-auto bg-saffron hover:bg-saffron-hover text-white text-body-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <span>Proceed to Dashboard</span>
                    <ArrowRight className="w-4 h-4" weight="bold" />
                  </button>
                </motion.div>
              )}
            </div>
          </div>
 
          {/* Need Help Chatbot CTA */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#E5E0D8] text-[#8A8A96] flex items-center justify-center">
                <Question className="w-5 h-5 text-saffron" />
              </div>
              <div>
                <span className="text-body-xs font-bold text-[#140A02] block">Stuck or need carrier assistance?</span>
                <span className="text-[11px] text-[#5A5A66] block leading-normal">Our team is available 24/7 to help you configure forwarding.</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={onSupportClick}
              className="w-full sm:w-auto bg-white border border-[#E5E0D8] text-[#140A02] hover:bg-[#FAF9F6] text-body-xs font-bold uppercase tracking-wider py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Chats className="w-4.5 h-4.5" />
              <span>Talk to Agent</span>
            </button>
          </div>
 
        </div>
      </div>
    </div>
  );
}
