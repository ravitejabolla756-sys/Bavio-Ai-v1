"use client";

import React, { useState, useEffect } from "react";
import { useCountry } from "../shared/CountryContext";
import { CALL_FORWARD_INSTRUCTIONS, OperatorInstruction } from "@/config/callForwardInstructions";

interface PhoneSetupProps {
  onComplete: (phoneNumber: string) => void;
  userId?: string;
}

export function PhoneSetup({ onComplete, userId }: PhoneSetupProps) {
  const { country } = useCountry();
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verified, setVerified] = useState<boolean>(false);

  const resolvedCountry = country || "US";
  const instructions = CALL_FORWARD_INSTRUCTIONS[resolvedCountry] || {};
  const operators = Object.keys(instructions);

  useEffect(() => {
    const activeInstructions = CALL_FORWARD_INSTRUCTIONS[resolvedCountry] || {};
    const ops = Object.keys(activeInstructions);
    if (ops.length > 0) {
      setSelectedOperator(ops[0]);
    } else {
      setSelectedOperator("");
    }
  }, [resolvedCountry]);

  const assignNumber = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("bavio_token") : null;
      const response = await fetch("/api/numbers/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          country_code: resolvedCountry,
          user_id: userId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to assign virtual phone number.");
      }

      setPhoneNumber(data.data.phone_number);
    } catch (err: any) {
      console.error("Number assignment failed:", err);
      setError(err.message || "An unexpected error occurred during telephony allocation.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    setVerifying(true);
    // Simulate active carrier handshake verification
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 2000);
  };

  const cleanNumber = phoneNumber ? phoneNumber.replace(/[^0-9+]/g, "") : "";
  const activeInstruction: OperatorInstruction | undefined = instructions[selectedOperator];

  const formatStepText = (step: string) => {
    if (!phoneNumber) return step;
    return step
      .replace("{virtualNumber}", phoneNumber)
      .replace("{ussdCode}", activeInstruction?.code ? `${activeInstruction.code}${cleanNumber}#` : "");
  };

  return (
    <div className="w-full max-w-2xl bg-white border border-[#E5E0D8] rounded-[24px] p-8 shadow-premium font-sans text-left">
      <h3 className="text-heading-sm font-bold text-[#14141A] mb-2">
        Virtual Phone Number Allocation
      </h3>
      <p className="text-body-xs text-[#8A8A96] mb-8">
        Bavio AI works by intercepting phone calls routed to your virtual number. Let&apos;s allocate a dedicated line for your workspace.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-body-xs text-red-600 font-medium flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>{error}</div>
        </div>
      )}

      {!phoneNumber ? (
        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-[#E5E0D8] rounded-2xl bg-[#FAF9F6]/40">
          <svg className="w-12 h-12 text-[#8A8A96] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <p className="text-body-xs text-[#4A4A57] mb-6 text-center max-w-sm">
            We will request a local virtual number matching your detected region ({resolvedCountry}).
          </p>
          <button
            type="button"
            onClick={assignNumber}
            disabled={loading}
            className="bg-[#FF6B00] hover:bg-[#E05E00] disabled:bg-[#FAF7F2] disabled:text-[#8A8A96] text-white py-3 px-8 rounded-button text-body-xs font-bold transition-all duration-300 shadow-saffron disabled:shadow-none inline-flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#8A8A96]/25 border-t-[#8A8A96] rounded-full animate-spin" />
                Allocating Virtual Line...
              </>
            ) : (
              "Allocate Virtual Number"
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Active number card */}
          <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#FF6B00] block mb-1">
                Your Dedicated Virtual Number
              </span>
              <div className="text-display-sm font-bold text-[#14141A]">
                {phoneNumber}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(phoneNumber);
                alert("Virtual number copied to clipboard!");
              }}
              className="px-4 py-2 border border-[#EBE6DD] hover:border-[#FF6B00] text-[#14141A] hover:text-[#FF6B00] rounded-xl text-body-xs font-bold transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto bg-white"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy Number
            </button>
          </div>

          {/* Stepper call forwarding instructions */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
              <h4 className="text-body-sm font-bold text-[#14141A]">
                Call Forwarding Instructions Guide
              </h4>
              
              {operators.length > 1 && (
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-[#8A8A96] uppercase tracking-wider">
                    Carrier:
                  </label>
                  <select
                    value={selectedOperator}
                    onChange={(e) => setSelectedOperator(e.target.value)}
                    className="border border-[#E5E0D8] rounded-xl px-3 py-1.5 text-body-xs font-semibold bg-white outline-none focus:border-[#FF6B00]"
                  >
                    {operators.map((op) => (
                      <option key={op} value={op}>
                        {instructions[op].name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Operator Warning Badge */}
            {activeInstruction?.badge && (
              <div className="p-4 bg-[#FF6B00]/5 border border-[#FF6B00]/15 rounded-xl text-body-xs text-[#FF6B00] font-semibold flex gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{activeInstruction.badge}</span>
              </div>
            )}

            {/* Dynamic instructions steps */}
            <ol className="space-y-4">
              {activeInstruction?.steps.map((step, idx) => (
                <li key={idx} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#E5E0D8] text-body-xs font-black text-[#FF6B00] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="text-body-xs text-[#4A4A57] pt-0.5 font-medium leading-relaxed">
                    {formatStepText(step)}
                  </div>
                </li>
              ))}
            </ol>

            {/* Dial Code copy utility for India */}
            {resolvedCountry === "IN" && activeInstruction?.code && (
              <div className="p-5 rounded-2xl bg-[#FF6B00]/5 border border-[#FF6B00]/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6B00] block mb-1">
                    Quick Activation Dial Code
                  </span>
                  <p className="text-body-xs text-[#4A4A57] font-medium">
                    Dial this code from your operator SIM card to enable forwarding instantly:
                  </p>
                  <div className="text-body-sm font-mono font-bold text-[#14141A] mt-2">
                    {activeInstruction.code}
                    {cleanNumber}#
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${activeInstruction.code}${cleanNumber}#`);
                    alert("USSD Dial Code copied!");
                  }}
                  className="px-4 py-2 bg-[#FF6B00] text-white hover:bg-[#E05E00] rounded-xl text-body-xs font-bold transition-colors inline-flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  Copy Code
                </button>
              </div>
            )}

            {/* Video Tutorial */}
            {activeInstruction?.videoUrl && (
              <div className="mt-8 border border-[#E5E0D8] rounded-[20px] overflow-hidden">
                <iframe
                  className="w-full aspect-video"
                  src={`https://www.youtube.com/embed/${activeInstruction.videoUrl}`}
                  title={`${selectedOperator} Forwarding Guide`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="border-t border-[#E5E0D8] pt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying || verified}
              className={`py-3 px-6 rounded-button text-body-xs font-bold transition-all duration-300 inline-flex items-center gap-2 ${
                verified
                  ? "bg-green-50 border border-green-200 text-green-600 cursor-default"
                  : "bg-[#14141A] hover:bg-[#2A2A35] text-white"
              }`}
            >
              {verifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                  Verifying Forwarding Status...
                </>
              ) : verified ? (
                <>
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Forwarding Verified
                </>
              ) : (
                "Verify Routing Forward Setup"
              )}
            </button>

            <button
              type="button"
              onClick={() => onComplete(phoneNumber)}
              disabled={!verified}
              className="bg-[#FF6B00] hover:bg-[#E05E00] disabled:bg-[#FAF7F2] disabled:text-[#8A8A96] text-white py-3 px-8 rounded-button text-body-xs font-bold transition-all duration-300 shadow-saffron disabled:shadow-none inline-flex items-center gap-1.5"
            >
              Enable AI Assistant
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
