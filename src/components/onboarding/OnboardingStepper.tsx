"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Check } from "@phosphor-icons/react";

interface StepperProps {
  currentStep: number; // 1 to 6
}

const STEPS = [
  { step: 1, label: "Business", path: "/onboarding/business" },
  { step: 2, label: "Knowledge", path: "/onboarding/knowledge" },
  { step: 3, label: "Agent", path: "/onboarding/agent" },
  { step: 4, label: "Phone", path: "/onboarding/phone" },
  { step: 5, label: "Test Call", path: "/onboarding/test-call" },
  { step: 6, label: "Complete", path: "/onboarding/complete" },
];

export default function OnboardingStepper({ currentStep }: StepperProps) {
  return (
    <header className="w-full bg-[#FAF7F2] border-b border-[#E5E0D8] py-4 px-6 md:px-12 sticky top-0 z-30 shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <Logo className="w-8 h-8 transition-transform duration-300 group-hover:scale-105" />
          <span className="font-display text-xl font-bold text-[#14141A] tracking-tight">
            Bavio AI <span className="text-[#FF6B00] text-xs font-semibold uppercase tracking-wider ml-1">Onboarding</span>
          </span>
        </Link>

        {/* Steps Progress */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {STEPS.map((s) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;

            return (
              <div key={s.step} className="flex items-center gap-2 shrink-0">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    isCurrent
                      ? "bg-[#FF6B00] text-white shadow-[0_4px_12px_rgba(255,107,0,0.25)]"
                      : isCompleted
                      ? "bg-[#10B981]/15 text-[#047857] border border-[#10B981]/30"
                      : "bg-[#EBE6DD]/60 text-[#8A8A96]"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                      isCurrent
                        ? "bg-white text-[#FF6B00]"
                        : isCompleted
                        ? "bg-[#10B981] text-white"
                        : "bg-[#E5E0D8] text-[#5A5A66]"
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3" weight="bold" /> : s.step}
                  </span>
                  <span>{s.label}</span>
                </div>
                {s.step < 6 && (
                  <div
                    className={`w-4 h-0.5 ${
                      currentStep > s.step ? "bg-[#10B981]" : "bg-[#E5E0D8]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}
