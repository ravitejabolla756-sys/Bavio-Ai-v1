"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Spinner, Info, Chats, Gear } from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import { apiFetch, getToken } from "@/lib/api";

interface ProfileResponse {
  id: string;
  businessId: string;
  email: string;
  industry?: string;
  assistant_id?: string;
}

interface AssistantResponse {
  id: string;
  systemPrompt: string;
  followUpQuestions: string[];
}

export default function OnboardingCustomizePage() {
  const router = useRouter();

  // Profile and ID states
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [assistantId, setAssistantId] = useState<string>("");

  // Form states
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>(["BUDGET", "LOCATION", "APPOINTMENT"]);

  // Page states
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load configuration on mount
  useEffect(() => {
    console.log("[Analytics] customize_viewed");

    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadConfig() {
      try {
        const user = await apiFetch<ProfileResponse>("/auth/profile");
        setProfile(user);

        if (user.assistant_id) {
          setAssistantId(user.assistant_id);
          // Fetch current assistant details
          try {
            const ast = await apiFetch<AssistantResponse>(`/assistants/by-id/${user.assistant_id}`);
            if (ast) {
              setSystemPrompt(ast.systemPrompt || "");
              if (Array.isArray(ast.followUpQuestions)) {
                setFollowUpQuestions(ast.followUpQuestions);
              }
            }
          } catch (astErr) {
            console.warn("Could not load assistant details, loading default templates instead.", astErr);
            loadFallbackTemplates(user.industry || "other");
          }
        } else {
          loadFallbackTemplates(user.industry || "other");
        }
      } catch (err: any) {
        console.error("Failed to load profile for Customize step:", err);
        setErrorMsg("Failed to load profile details.");
      } finally {
        setIsPageLoading(false);
      }
    }

    loadConfig();
  }, [router]);

  const loadFallbackTemplates = (industryName: string) => {
    const indLower = industryName.toLowerCase();
    let prompt = "You are a professional AI receptionist. You speak conversationally and naturally in English. Your goals are: 1) Greet the caller warmly, 2) Understand their intent, 3) Capture key details, 4) Keep answers clear and friendly.";

    if (indLower.includes("real") || indLower.includes("estate")) {
      prompt = "You are a helpful AI receptionist for a premier real estate agency. You speak naturally in English. Your goals are: 1) Welcome the caller, 2) Inquire if they want to buy, rent, or sell a property, 3) Ask for their preferred location and budget range, 4) Assure them an agent will call back soon.";
    } else if (indLower.includes("health") || indLower.includes("clinic")) {
      prompt = "You are a professional AI receptionist for a healthcare clinic. You speak warmly and naturally in English. Your goals are: 1) Greet the patient, 2) Ask about their appointment request preference or general inquiry, 3) Capture their preferred date/time and contact details, 4) Assure them a representative will contact them to confirm.";
    } else if (indLower.includes("restaurant") || indLower.includes("food")) {
      prompt = "You are a friendly AI receptionist for a popular restaurant. You speak naturally in English. Your goals are: 1) Greet the caller, 2) Assist with table reservation inquiries, 3) Capture the number of guests and preferred time, 4) Log details to confirm availability.";
    }

    setSystemPrompt(prompt);
  };

  // Quick Template pills
  const handleApplyTemplate = (type: "real_estate" | "healthcare" | "restaurant" | "reset") => {
    let prompt = "";
    if (type === "real_estate") {
      prompt = "You are a helpful AI receptionist for a premier real estate agency. You speak naturally in English. Your goals are: 1) Welcome the caller, 2) Inquire if they want to buy, rent, or sell a property, 3) Ask for their preferred location and budget range, 4) Assure them an agent will call back soon.";
    } else if (type === "healthcare") {
      prompt = "You are a professional AI receptionist for a healthcare clinic. You speak warmly and naturally in English. Your goals are: 1) Greet the patient, 2) Ask about their appointment request preference or general inquiry, 3) Capture their preferred date/time and contact details, 4) Assure them a representative will contact them to confirm.";
    } else if (type === "restaurant") {
      prompt = "You are a friendly AI receptionist for a popular restaurant. You speak naturally in English. Your goals are: 1) Greet the caller, 2) Assist with table reservation inquiries, 3) Capture the number of guests and preferred time, 4) Log details to confirm availability.";
    } else {
      loadFallbackTemplates(profile?.industry || "other");
      return;
    }
    setSystemPrompt(prompt);
    console.log("[Analytics] system_prompt_edited");
  };

  // Checkbox toggle handler
  const handleCheckboxToggle = (qName: string) => {
    setFollowUpQuestions(prev => {
      const updated = prev.includes(qName) 
        ? prev.filter(q => q !== qName) 
        : [...prev, qName];
      
      console.log("[Analytics] questions_selected", { questions: updated });
      return updated;
    });
  };

  // Save changes
  const handleSave = async () => {
    if (systemPrompt.length > 1000) {
      setErrorMsg("System prompt cannot exceed 1000 characters.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      if (assistantId) {
        await apiFetch(`/assistants/by-id/${assistantId}`, {
          method: "PUT",
          body: JSON.stringify({
            systemPrompt: systemPrompt.trim(),
            followUpQuestions
          })
        });
      }

      console.log("[Analytics] customization_saved");
      router.push("/onboarding/billing"); // Next Step: billing setup

    } catch (err: any) {
      console.error("Failed to save customization details:", err);
      setErrorMsg("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Skip step handler
  const handleSkip = () => {
    console.log("[Analytics] skip_clicked");
    router.push("/onboarding/billing");
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex items-center justify-center font-sans text-[#140A02]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin mx-auto" />
          <p className="text-body-xs text-[#5A5A66] font-semibold">Loading configuration profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#FFFDF8] text-[#140A02] font-sans flex flex-col items-center justify-center p-4 md:p-8">
      
      {/* Background glow effects */}
      <div className="absolute w-[400px] h-[400px] bg-[#FF6B00]/5 rounded-full blur-[100px] pointer-events-none top-1/10 left-1/4" />
      <div className="absolute w-[500px] h-[500px] bg-[#FF6B00]/3 rounded-full blur-[120px] pointer-events-none bottom-1/10 right-1/4" />

      {/* Progress Bar (Step 5 of 6) */}
      <div className="w-full max-w-[700px] mb-8 relative z-20">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8A8A96] font-bold">
            Step 5 of 6: Customize AI (Optional)
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[#FF6B00] font-black">
            83% COMPLETE
          </span>
        </div>
        <div className="w-full h-1 bg-[#E5E0D8]/60 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#FF6B00] transition-all duration-500 ease-out" 
            style={{ width: "83%" }}
          />
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[700px] bg-white border border-[#E5E0D8] rounded-[24px] p-6 md:p-10 shadow-premium relative z-20">
        
        {/* Logo block */}
        <div className="flex items-center gap-2 mb-6">
          <Logo className="w-7 h-7" color="text-[#FF6B00]" />
          <span className="font-display text-md font-black tracking-tight text-[#140A02]">
            Bavio AI
          </span>
        </div>

        <h1 
          style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "32px", color: "#140A02", marginBottom: "8px" }}
          className="tracking-tight leading-tight"
        >
          Make it Yours (Optional)
        </h1>

        <p 
          style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 400, fontSize: "15px", color: "#5A5A66", lineHeight: 1.6, marginBottom: "32px" }}
        >
          Fine-tune how your AI behaves. Skip if you&apos;re happy with defaults.
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-500 font-semibold text-xs">
            {errorMsg}
          </div>
        )}

        {/* SECTION 1: SYSTEM PROMPT CUSTOMIZATION */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-[#140A02] mb-1.5" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            System Prompt (Advanced)
          </label>
          
          <p className="text-xs text-[#5A5A66] mb-3 leading-relaxed">
            Tell your AI how to behave during calls. This is optional — default settings work great for most businesses.
          </p>

          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value.substring(0, 1000))}
            placeholder="You are a professional AI receptionist for a business in India..."
            rows={6}
            maxLength={1000}
            className="w-full bg-white border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl p-4 text-xs text-[#140A02] placeholder-[#5A5A66]/40 outline-none transition-all duration-200 resize-none leading-relaxed"
          />

          <div className="flex justify-between items-center mt-2">
            {/* Quick Template pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { type: "real_estate", label: "Real Estate Template" },
                { type: "healthcare", label: "Healthcare Template" },
                { type: "restaurant", label: "Restaurant Template" },
                { type: "reset", label: "Reset to Default" }
              ].map((tpl) => (
                <button
                  key={tpl.type}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl.type as any)}
                  className="bg-white border border-[#E5E0D8] hover:border-[#FF6B00] text-[#5A5A66] hover:text-[#FF6B00] text-[10px] font-bold py-1.5 px-3 rounded-full transition-all"
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            <span className="text-[10px] font-bold text-[#5A5A66] shrink-0 ml-4">
              {systemPrompt.length}/1000 characters
            </span>
          </div>
        </div>

        {/* SECTION 2: FOLLOW-UP QUESTIONS */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-[#140A02] mb-1.5" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Questions to Ask (Optional)
          </label>
          
          <p className="text-xs text-[#5A5A66] mb-4 leading-relaxed">
            Which of these should your AI ask callers?
          </p>

          <div className="space-y-3">
            {[
              { code: "BUDGET", title: "Budget / Price Range", desc: "Helps qualify seriousness of lead" },
              { code: "LOCATION", title: "Location Preference", desc: "Geographic targeting" },
              { code: "APPOINTMENT", title: "Available Appointment Times", desc: "Direct scheduling" },
              { code: "COMPANY", title: "Company Background", desc: "Learn about caller's business" },
              { code: "EXPERIENCE", title: "Past Experience", desc: "Context for recommendations" }
            ].map((question) => {
              const isChecked = followUpQuestions.includes(question.code);
              return (
                <div
                  key={question.code}
                  onClick={() => handleCheckboxToggle(question.code)}
                  className={`p-4 rounded-xl border flex items-start gap-4 transition-all duration-150 cursor-pointer select-none ${
                    isChecked
                      ? "border-[#FF6B00] bg-[#FFF8F0] shadow-sm"
                      : "border-[#E5E0D8] bg-white hover:border-[#FF6B00]/50"
                  }`}
                >
                  <div className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center shrink-0 transition-colors ${
                    isChecked ? "bg-[#FF6B00] border-[#FF6B00]" : "border-[#E5E0D8] bg-white"
                  }`}>
                    {isChecked && <Check className="w-3 h-3 text-white" weight="bold" />}
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-[#140A02]">
                      {question.title}
                    </span>
                    <span className="block text-[11px] text-[#5A5A66] mt-0.5">
                      {question.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: INTEGRATIONS (TEASER) */}
        <div className="mb-10">
          <label className="block text-sm font-semibold text-[#140A02] mb-3" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Email &amp; Webhook Alerts (Coming Next)
          </label>

          <div className="p-5 rounded-xl border border-dashed border-[#E5E0D8] bg-[#FAF9F6] space-y-3">
            <div className="flex gap-2.5 items-start text-xs text-[#5A5A66]">
              <span className="text-[#FF6B00] text-sm shrink-0">⚡</span>
              <p className="leading-relaxed">
                Connect your email notifications or custom webhooks to auto-sync captured leads. Available after subscription starts.
              </p>
            </div>
            
            <div className="pl-6 text-[11px] text-[#5A5A66] space-y-1 font-bold">
              <div>✓ Email Alerts</div>
              <div>✓ Webhook Triggers</div>
              <div>✓ Slack Alerts</div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 select-none cursor-pointer"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600 }}
          >
            {isSaving ? (
              <Spinner className="w-4 h-4 animate-spin" />
            ) : (
              <span>Save &amp; Continue &rarr;</span>
            )}
          </button>

          <button
            onClick={handleSkip}
            className="w-full py-2.5 text-[#FF6B00] hover:text-[#FF8C3A] text-xs font-bold text-center bg-transparent border-none outline-none cursor-pointer"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            Skip Customization
          </button>
        </div>

        {/* Navigation below CTA */}
        <div 
          className="mt-6 flex justify-start items-center text-xs font-bold text-[#8A8A96]"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          <button
            onClick={() => router.push("/onboarding/first-lead")}
            className="hover:text-[#140A02] flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>

      </div>

    </div>
  );
}
