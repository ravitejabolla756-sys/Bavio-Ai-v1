"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { CircleNotch } from "@phosphor-icons/react";

export default function OnboardingRootPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccessAndRedirect = async () => {
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
        const subStatus = p.subscription_status || "inactive";

        if (subStatus === "pending") {
          router.replace("/payment-processing");
          return;
        }

        if (subStatus !== "active") {
          router.replace("/pricing");
          return;
        }

        // Active subscriber: Route to current onboarding step
        const step = profile.onboarding_step || 1;
        if (step <= 1) router.replace("/onboarding/business");
        else if (step === 2) router.replace("/onboarding/knowledge");
        else if (step === 3) router.replace("/onboarding/agent");
        else if (step === 4) router.replace("/onboarding/phone");
        else if (step === 5) router.replace("/onboarding/test-call");
        else if (step >= 6) router.replace("/onboarding/complete");
        else router.replace("/onboarding/business");
      } catch (err) {
        console.error("Onboarding access check failed:", err);
        router.replace("/signup");
      } finally {
        setLoading(false);
      }
    };

    checkAccessAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col items-center justify-center p-6 text-[#14141A]">
      <div className="flex flex-col items-center gap-4 bg-white border border-[#E5E0D8] rounded-[24px] p-8 shadow-premium max-w-sm w-full text-center">
        <CircleNotch className="w-8 h-8 text-[#FF6B00] animate-spin" />
        <h2 className="font-display text-xl font-bold">Verifying Subscription...</h2>
        <p className="text-body-xs text-[#5A5A66]">
          Configuring your paid onboarding workspace. Please wait...
        </p>
      </div>
    </div>
  );
}
