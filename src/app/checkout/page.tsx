"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Logo from "@/components/Logo";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "starter";
  const period = searchParams.get("period") || "monthly";
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function initCheckout() {
      try {
        const response = await apiFetch<{ checkoutUrl: string }>("/billing/create-checkout", {
          method: "POST",
          body: JSON.stringify({
            planId: plan,
            billingPeriod: period === "yearly" ? "yearly" : "monthly"
          })
        });

        if (response && response.checkoutUrl) {
          window.location.href = response.checkoutUrl;
        } else {
          throw new Error("Could not generate checkout session.");
        }
      } catch (err: any) {
        console.error("Checkout redirect error:", err);
        setErrorMsg(err.message || "Failed to initialize checkout redirect. Returning to pricing...");
        setTimeout(() => {
          router.push("/pricing");
        }, 3000);
      }
    }

    initCheckout();
  }, [plan, period, router]);

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans flex flex-col items-center justify-center p-6">
      <div className="mb-8">
        <Logo />
      </div>
      
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#EBEBEB] p-8 shadow-sm text-center space-y-6">
        {errorMsg ? (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-serif font-bold text-red-600">Checkout Error</h1>
            <p className="text-[#5A5A66] text-sm">{errorMsg}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-[#FF6B00]/25 border-t-[#FF6B00] rounded-full animate-spin mx-auto" />
            <h1 className="text-xl font-serif font-bold text-[#140A02]">Securing your connection</h1>
            <p className="text-[#5A5A66] text-sm">
              Redirecting you to our secure checkout partner to configure your subscription...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFFDF8] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FF6B00]/25 border-t-[#FF6B00] rounded-full animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
