"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingStepper from "@/components/onboarding/OnboardingStepper";
import { authApi } from "@/lib/api";
import { ArrowRight, Phone, ShieldCheck, CheckCircle, Warning, CircleNotch } from "@phosphor-icons/react";

export default function PhoneStepPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [assignedNumber, setAssignedNumber] = useState<string | null>(null);
  const [country, setCountry] = useState("US");
  const [serverError, setServerError] = useState("");

  // Verification checks state
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [businessExists, setBusinessExists] = useState(false);
  const [assistantExists, setAssistantExists] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("bavio_token");
        if (!token) {
          router.replace("/signup");
          return;
        }

        const profile = await authApi.getProfile();
        if (!profile || !profile.id) {
          router.replace("/signup");
          return;
        }

        const p = profile as any;
        if (p.subscription_status === "pending") {
          router.replace("/payment-processing");
          return;
        }

        if (p.subscription_status !== "active") {
          router.replace("/pricing");
          return;
        }

        setSubscriptionActive(true);
        setBusinessExists(true);
        if (p.assistant_status !== "not_configured") {
          setAssistantExists(true);
        } else {
          setAssistantExists(false);
        }

        if (p.country_code || p.country) {
          setCountry(p.country_code || p.country);
        }

        if (p.twilio_number) {
          setAssignedNumber(p.twilio_number);
        }
      } catch (err) {
        console.error("Access verification failed:", err);
        router.replace("/signup");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleProvisionNumber = async () => {
    setPurchasing(true);
    setServerError("");

    try {
      const token = localStorage.getItem("bavio_token");
      const res = await fetch("/api/onboarding/phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          country
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to provision phone number.");
      }

      setAssignedNumber(data.phoneNumber);
    } catch (err: any) {
      console.error("Failed to provision phone number:", err);
      setServerError(err.message || "Failed to provision Twilio number.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleContinue = () => {
    router.push("/onboarding/test-call");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FF6B00]/30 border-t-[#FF6B00] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#14141A] font-sans flex flex-col">
      <OnboardingStepper currentStep={4} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <div className="bg-white border border-[#E5E0D8] rounded-[28px] p-8 md:p-12 shadow-premium">
          <div className="mb-8">
            <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold block mb-1">
              Step 4 of 6 — Dedicated Phone Line
            </span>
            <h1 className="font-display text-3xl font-bold text-[#14141A] tracking-tight">
              Provision Virtual Phone Number
            </h1>
            <p className="text-body-xs text-[#5A5A66] mt-2">
              Bavio will search for and provision a dedicated, voice-capable virtual phone number through Twilio linked to your subscription.
            </p>
          </div>

          {serverError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
              <Warning className="w-5 h-5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Verification Requirements Card */}
          <div className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-2xl p-6 mb-8">
            <h3 className="font-display text-base font-bold text-[#14141A] mb-4">
              Provisioning Verification Checklist
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-[#10B981]" weight="fill" />
                <span>Subscription Status: <strong className="text-[#10B981]">Active</strong></span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-[#10B981]" weight="fill" />
                <span>Country Supported: <strong className="text-[#14141A]">{country}</strong></span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-[#10B981]" weight="fill" />
                <span>Business Profile: <strong className="text-[#10B981]">Verified</strong></span>
              </div>
              <div className="flex items-center gap-2 font-medium">

                {assistantExists ? (
                  <CheckCircle className="w-4 h-4 text-[#10B981]" weight="fill" />
                ) : (
                  <Warning className="w-4 h-4 text-[#F59E0B]" weight="fill" />
                )}
                <span>AI Agent Configured: <strong className={assistantExists ? "text-[#10B981]" : "text-[#F59E0B]"}>{assistantExists ? "Ready" : "Pending"}</strong></span>
              </div>
            </div>
          </div>

          {/* Country Selection */}
          {!assignedNumber && (
            <div className="mb-8">
              <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                Select Provisioning Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full max-w-md bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl py-3.5 px-4 text-body-xs outline-none"
              >
                <option value="US">🇺🇸 United States (+1)</option>
                <option value="GB">🇬🇧 United Kingdom (+44)</option>
                <option value="AU">🇦🇺 Australia (+61)</option>
              </select>
              <p className="text-[11px] text-[#8A8A96] mt-2 font-medium">
                Virtual numbers are provisioned through Twilio&apos;s real voice network. India (+91) virtual numbers are not currently available.
              </p>
            </div>
          )}

          {/* Number Display or Provision Action */}
          {assignedNumber ? (
            <div className="bg-[#ECFDF5] border border-[#10B981]/30 rounded-2xl p-8 text-center mb-8">
              <div className="w-14 h-14 bg-[#10B981]/15 text-[#10B981] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-7 h-7" weight="bold" />
              </div>
              <span className="text-xs uppercase font-bold text-[#047857] tracking-wider block mb-1">
                Twilio Number Provisioned & Mapped
              </span>
              <h2 className="font-display text-4xl font-extrabold text-[#065F46] tracking-tight mb-2">
                {assignedNumber}
              </h2>
              <p className="text-xs text-[#047857] max-w-md mx-auto">
                Mapped to Business ID and Assistant ID on real Twilio voice network.
              </p>
            </div>
          ) : (
            <div className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-2xl p-8 text-center mb-8">
              <div className="w-14 h-14 bg-[#FF6B00]/10 text-[#FF6B00] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-7 h-7" weight="bold" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#14141A] mb-2">
                Ready to Provision Twilio Virtual Number
              </h3>
              <p className="text-xs text-[#5A5A66] max-w-md mx-auto mb-6">
                Click below to query Twilio available inventory and purchase a dedicated line for your AI receptionist.
              </p>
              <button
                type="button"
                onClick={handleProvisionNumber}
                disabled={purchasing || !assistantExists}
                className="bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:opacity-50 text-white font-bold px-8 py-4 rounded-xl text-body-xs uppercase tracking-wider transition-all shadow-md inline-flex items-center gap-2"
              >
                {purchasing ? (
                  <>
                    <CircleNotch className="w-4 h-4 animate-spin" />
                    <span>Searching & Purchasing Twilio Number...</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4" weight="bold" />
                    <span>Search & Provision Twilio Number</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="pt-6 border-t border-[#E5E0D8] flex justify-end">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!assignedNumber}
              className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl text-body-xs uppercase tracking-wider transition-all shadow-md"
            >
              <span>Continue to Step 5 — Test Call</span>
              <ArrowRight className="w-4 h-4" weight="bold" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
