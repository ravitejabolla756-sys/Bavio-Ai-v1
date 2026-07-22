"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingStepper from "@/components/onboarding/OnboardingStepper";
import { authApi } from "@/lib/api";
import { ArrowRight, Phone, CheckCircle, Chats, Microphone, ShieldCheck } from "@phosphor-icons/react";

export default function TestCallStepPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [twilioNumber, setTwilioNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [assistantName, setAssistantName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [verifiedItems, setVerifiedItems] = useState({
    greeting: true,
    assistantName: true,
    businessContext: true,
    leadQualification: true,
    transcriptStorage: true
  });

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
        if (p.subscription_status !== "active") {
          router.replace("/pricing");
          return;
        }

        if (p.twilio_number) {
          setTwilioNumber(p.twilio_number);
        }

        setBusinessName(p.businessName || p.name || "Your Business");
        setAssistantName(p.assistant_name || "Bavio Assistant");
        setGreeting(p.greeting || `Hello! This is ${p.assistant_name || "Bavio Assistant"} from ${p.name || "our business"}. How can I help you today?`);

        // Update backend step
        fetch("/api/onboarding/test-call", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }).catch(err => console.warn("Failed to ping test-call endpoint:", err));
      } catch (err) {
        console.error("Access verification failed:", err);
        router.replace("/signup");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleContinue = () => {
    router.push("/onboarding/complete");
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
      <OnboardingStepper currentStep={5} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <div className="bg-white border border-[#E5E0D8] rounded-[28px] p-8 md:p-12 shadow-premium">
          <div className="mb-8 text-center md:text-left">
            <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold block mb-1">
              Step 5 of 6 — Live Line Verification
            </span>
            <h1 className="font-display text-3xl font-bold text-[#14141A] tracking-tight">
              Test Your AI Receptionist Live
            </h1>
            <p className="text-body-xs text-[#5A5A66] mt-2">
              Dial your provisioned business number from your phone to test response accuracy, lead qualification, and transcript logging.
            </p>
          </div>

          {/* Assigned Phone Card */}
          <div className="bg-[#14141A] text-white border border-black rounded-3xl p-8 md:p-10 text-center mb-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />
            <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-widest block mb-2">
              DIAL YOUR LIVE BAVIO LINE
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white tracking-tight mb-4 select-all font-mono">
              {twilioNumber || "+1 217 846 8075"}
            </h2>
            <p className="text-xs text-white/80 max-w-md mx-auto mb-6">
              Calls to this line connect directly to your configured AI receptionist ({assistantName}) and use your plan&apos;s included minutes.
            </p>

            <a
              href={`tel:${twilioNumber}`}
              className="inline-flex items-center gap-2.5 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white font-bold px-8 py-3.5 rounded-xl text-body-xs uppercase tracking-wider transition-all shadow-md"
            >
              <Phone className="w-4 h-4" weight="bold" />
              <span>Call Number Now</span>
            </a>
          </div>

          {/* Verification Checklist */}
          <div className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-2xl p-6 mb-8">
            <h3 className="font-display text-base font-bold text-[#14141A] mb-4">
              Live Test Call Verification Metrics
            </h3>
            <div className="space-y-3">
              {[
                { title: "Correct Business Greeting", desc: greeting, key: "greeting" },
                { title: "Assistant Persona & Name", desc: `Identifies as ${assistantName} representing ${businessName}`, key: "assistantName" },
                { title: "Business Context & Knowledge", desc: "Answers FAQs accurately using your uploaded knowledge base", key: "businessContext" },
                { title: "Lead Qualification & Capture", desc: "Captures caller name, phone, email, and intent", key: "leadQualification" },
                { title: "Transcript Storage", desc: "Generates instant transcript and updates dashboard leads", key: "transcriptStorage" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white border border-[#E5E0D8] p-4 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" weight="fill" />
                  <div>
                    <span className="font-bold text-sm text-[#14141A] block">{item.title}</span>
                    <span className="text-xs text-[#5A5A66] leading-relaxed block mt-0.5">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-[#E5E0D8] flex justify-end">
            <button
              type="button"
              onClick={handleContinue}
              className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white font-bold px-8 py-4 rounded-xl text-body-xs uppercase tracking-wider transition-all shadow-md"
            >
              <span>Continue to Step 6 — Complete Setup</span>
              <ArrowRight className="w-4 h-4" weight="bold" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
