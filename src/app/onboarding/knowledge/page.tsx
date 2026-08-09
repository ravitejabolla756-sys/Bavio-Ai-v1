"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingStepper from "@/components/onboarding/OnboardingStepper";
import { authApi } from "@/lib/api";
import { ArrowRight, Plus, Trash, BookOpen, ShieldWarning, Question } from "@phosphor-icons/react";

interface FAQItem {
  question: string;
  answer: string;
}

export default function KnowledgeStepPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  // Form states
  const [faqs, setFaqs] = useState<FAQItem[]>([
    { question: "What are your business hours?", answer: "We are open Monday to Friday from 9 AM to 5 PM." },
    { question: "Where are you located?", answer: "Our main office is located downtown." }
  ]);
  const [serviceDetails, setServiceDetails] = useState("");
  const [pricingGuidance, setPricingGuidance] = useState("");
  const [policies, setPolicies] = useState("");
  const [importantInstructions, setImportantInstructions] = useState("");
  const [qualificationQuestions, setQualificationQuestions] = useState("");
  const [doNotInvent, setDoNotInvent] = useState("");

  // Access Control & Profile Check
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
      } catch (err) {
        console.error("Access verification failed:", err);
        router.replace("/signup");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleAddFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleFaqChange = (index: number, field: "question" | "answer", value: string) => {
    const next = [...faqs];
    next[index][field] = value;
    setFaqs(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setServerError("");

    try {
      const token = localStorage.getItem("bavio_token");
      const res = await fetch("/api/onboarding/knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          faqs: faqs.filter(f => f.question.trim() && f.answer.trim()),
          serviceDetails: serviceDetails.trim(),
          pricingGuidance: pricingGuidance.trim(),
          policies: policies.trim(),
          importantInstructions: importantInstructions.trim(),
          qualificationQuestions: qualificationQuestions.trim(),
          doNotInvent: doNotInvent.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to save knowledge base.");
      }

      router.push("/onboarding/agent");
    } catch (err: any) {
      console.error("Failed to save step 2:", err);
      setServerError(err.message || "Failed to save knowledge base.");
    } finally {
      setSubmitting(false);
    }
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
      <OnboardingStepper currentStep={2} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <div className="bg-white border border-[#E5E0D8] rounded-[28px] p-8 md:p-12 shadow-premium">
          <div className="mb-8">
            <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold block mb-1">
              Step 2 of 6 — Knowledge Base
            </span>
            <h1 className="font-display text-3xl font-bold text-[#14141A] tracking-tight">
              Business Knowledge & Instructions
            </h1>
            <p className="text-body-xs text-[#5A5A66] mt-2">
              Provide answers to common caller questions, price guidelines, and explicit rules on what the AI must never invent.
            </p>
          </div>

          {serverError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-xs font-semibold">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Frequently Asked Questions */}
            <div className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#FF6B00]" />
                  <h3 className="font-display text-lg font-bold text-[#14141A]">
                    Frequently Asked Questions (FAQs)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="flex items-center gap-1.5 bg-[#FF6B00] text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-[#FF8C3A] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add FAQ</span>
                </button>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="bg-white border border-[#E5E0D8] rounded-xl p-4 relative group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#8A8A96]">FAQ #{idx + 1}</span>
                      {faqs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFaq(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Question (e.g. What is your refund policy?)"
                      value={faq.question}
                      onChange={(e) => handleFaqChange(idx, "question", e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E5E0D8] rounded-lg p-3 text-body-xs font-semibold mb-2.5 outline-none focus:border-[#FF6B00]"
                    />
                    <textarea
                      rows={2}
                      placeholder="Answer provided to callers..."
                      value={faq.answer}
                      onChange={(e) => handleFaqChange(idx, "answer", e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E5E0D8] rounded-lg p-3 text-body-xs outline-none focus:border-[#FF6B00] resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Service Details & Pricing Guidance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Service Details & Offerings
                </label>
                <textarea
                  rows={4}
                  placeholder="Detail key services, packages, or solutions you provide..."
                  value={serviceDetails}
                  onChange={(e) => setServiceDetails(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl p-4 text-body-xs outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Pricing Guidance & Estimates
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Consultations start at $99. Quotes provided after initial call..."
                  value={pricingGuidance}
                  onChange={(e) => setPricingGuidance(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl p-4 text-body-xs outline-none resize-none"
                />
              </div>
            </div>

            {/* Policies & Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Company Policies (Cancellation, Returns)
                </label>
                <textarea
                  rows={3}
                  placeholder="Specify cancellation deadlines, return windows, or safety protocols..."
                  value={policies}
                  onChange={(e) => setPolicies(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl p-4 text-body-xs outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Qualification Questions to Ask Callers
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. 1. Are you a new or returning customer? 2. What is your timeline?"
                  value={qualificationQuestions}
                  onChange={(e) => setQualificationQuestions(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl p-4 text-body-xs outline-none resize-none"
                />
              </div>
            </div>

            {/* Do Not Invent Rules */}
            <div className="bg-[#FFF5F5] border border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldWarning className="w-5 h-5 text-red-600" />
                <h3 className="font-display text-base font-bold text-red-900">
                  Strict Rule: Information the AI Must NEVER Invent
                </h3>
              </div>
              <p className="text-xs text-red-700 mb-3">
                Specify topics, prices, or promises the receptionist must decline to answer or defer to a manager.
              </p>
              <textarea
                rows={3}
                placeholder="e.g. Never promise exact appointment times. Never guarantee discounts over 10%. Never discuss legal liability..."
                value={doNotInvent}
                onChange={(e) => setDoNotInvent(e.target.value)}
                className="w-full bg-white border border-red-200 focus:border-red-500 rounded-xl p-4 text-body-xs text-[#14141A] outline-none resize-none"
              />
            </div>

            <div className="pt-6 border-t border-[#E5E0D8] flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:opacity-50 text-white font-bold px-8 py-4 rounded-xl text-body-xs uppercase tracking-wider transition-all duration-200 shadow-md"
              >
                {submitting ? (
                  <span>Saving Step 2...</span>
                ) : (
                  <>
                    <span>Continue to Step 3 — Agent</span>
                    <ArrowRight className="w-4 h-4" weight="bold" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
