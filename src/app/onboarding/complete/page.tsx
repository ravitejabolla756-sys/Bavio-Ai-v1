"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingStepper from "@/components/onboarding/OnboardingStepper";
import { authApi } from "@/lib/api";
import { ArrowRight, CheckCircle, Sparkle, Building, Phone, Users, ShieldCheck, CreditCard } from "@phosphor-icons/react";

interface SummaryData {
  businessName: string;
  industry: string;
  country: string;
  phoneNumber: string;
  assistantName: string;
  voice: string;
  language: string;
  plan: string;
  status: string;
}

export default function CompleteStepPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData>({
    businessName: "Your Business",
    industry: "General",
    country: "US",
    phoneNumber: "Not assigned",
    assistantName: "Bavio Assistant",
    voice: "meera",
    language: "en-US",
    plan: "GROWTH",
    status: "Active"
  });

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("bavio_token");
        if (!token) {
          router.replace("/signup");
          return;
        }

        const res = await fetch("/api/onboarding/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        const data = await res.json();
        if (data.success && data.summary) {
          setSummary(data.summary);
        } else {
          // Fallback to profile lookup
          const profile = await authApi.getProfile();
          const p = profile as any;
          setSummary({
            businessName: p.businessName || p.name || "Your Business",
            industry: p.industry || "General",
            country: p.country_code || "US",
            phoneNumber: p.twilio_number || "Not assigned",
            assistantName: p.assistant_name || "Bavio Assistant",
            voice: p.voice || "meera",
            language: p.language || "en-US",
            plan: (p.plan_name || "growth").toUpperCase(),
            status: "Active"
          });
        }
      } catch (err) {
        console.error("Failed to complete onboarding:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleGoToDashboard = () => {
    router.push("/dashboard");
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
      <OnboardingStepper currentStep={6} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <div className="bg-white border border-[#E5E0D8] rounded-[28px] p-8 md:p-12 shadow-premium text-center">
          
          {/* Badge & Icon */}
          <div className="w-16 h-16 bg-[#10B981]/15 text-[#10B981] rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-9 h-9" weight="fill" />
          </div>

          <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold block mb-2">
            ONBOARDING COMPLETE
          </span>

          <h1 className="font-display text-4xl font-extrabold text-[#14141A] tracking-tight mb-3">
            Your AI receptionist is ready.
          </h1>

          <p className="text-body-xs text-[#5A5A66] max-w-lg mx-auto mb-10 leading-relaxed">
            Your custom AI agent is deployed on your dedicated line. Every caller will now be answered instantly, qualified, and recorded in your lead dashboard.
          </p>

          {/* Onboarding Summary Card */}
          <div className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-2xl p-6 md:p-8 text-left mb-10">
            <h3 className="font-display text-lg font-bold text-[#14141A] mb-6 flex items-center gap-2 pb-3 border-b border-[#E5E0D8]">
              <Sparkle className="w-5 h-5 text-[#FF6B00]" />
              <span>Deployment Configuration Summary</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-body-xs">
              
              {/* Business */}
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-[#E5E0D8]">
                <Building className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider block">Business</span>
                  <span className="font-bold text-[#14141A] block text-sm">{summary.businessName}</span>
                  <span className="text-xs text-[#5A5A66]">{summary.industry} • {summary.country}</span>
                </div>
              </div>

              {/* Assistant */}
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-[#E5E0D8]">
                <Users className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider block">Assistant</span>
                  <span className="font-bold text-[#14141A] block text-sm">{summary.assistantName}</span>
                  <span className="text-xs text-[#5A5A66]">Voice: {summary.voice} ({summary.language})</span>
                </div>
              </div>

              {/* Phone Line */}
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-[#E5E0D8]">
                <Phone className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider block">Dedicated Phone Line</span>
                  <span className="font-bold text-[#14141A] block text-sm font-mono">{summary.phoneNumber}</span>
                  <span className="text-xs text-[#10B981] font-semibold">Twilio Real Voice Active</span>
                </div>
              </div>

              {/* Plan & Status */}
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-[#E5E0D8]">
                <CreditCard className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider block">Subscription & Status</span>
                  <span className="font-bold text-[#14141A] block text-sm">{summary.plan} Plan</span>
                  <span className="text-xs font-bold text-[#10B981] uppercase tracking-wider">{summary.status}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleGoToDashboard}
            className="inline-flex items-center justify-center gap-2.5 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white font-bold px-10 py-4.5 rounded-xl text-body-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-5 h-5" weight="bold" />
          </button>
        </div>
      </main>
    </div>
  );
}
