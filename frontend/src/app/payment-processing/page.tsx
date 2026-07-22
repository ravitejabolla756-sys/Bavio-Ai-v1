"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import Logo from "@/components/Logo";

export default function PaymentProcessingPage() {
  const router = useRouter();
  const [status, setStatus] = useState("waiting"); // waiting, success, failed, timeout
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let intervalId: any;
    const startTime = Date.now();
    const TIMEOUT_LIMIT = 120000; // 2 minutes

    async function pollStatus() {
      try {
        const user = (await authApi.getProfile()) as any;
        
        if (user.subscription_status === "active") {
          setStatus("success");
          clearInterval(intervalId);
          // Redirect to the backend-calculated nextRoute
          const destination = user.nextRoute || "/onboarding";
          setTimeout(() => {
            router.push(destination);
          }, 1500);
        } else if (user.subscription_status === "failed") {
          setStatus("failed");
          setErrorMsg("The payment attempt failed. Please check your details and try again.");
          clearInterval(intervalId);
        } else {
          // Check for timeout
          if (Date.now() - startTime > TIMEOUT_LIMIT) {
            setStatus("timeout");
            clearInterval(intervalId);
          }
        }
      } catch (err: any) {
        console.error("Payment processing poll error:", err);
        // Ignore single fetch errors and keep polling
      }
    }

    // Run immediately on mount
    pollStatus();

    // Poll every 3 seconds
    intervalId = setInterval(pollStatus, 3000);

    return () => clearInterval(intervalId);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans flex flex-col items-center justify-center p-6">
      <div className="mb-8">
        <Logo />
      </div>
      
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#EBEBEB] p-8 shadow-sm text-center space-y-6">
        {status === "waiting" && (
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-[#FF6B00]/25 border-t-[#FF6B00] rounded-full animate-spin mx-auto" />
            <h1 className="text-xl font-serif font-bold text-[#140A02]">Confirming your subscription...</h1>
            <p className="text-[#5A5A66] text-sm">
              We are waiting for payment verification from our processor. This usually takes just a few seconds.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-serif font-bold text-green-600">Payment Confirmed!</h1>
            <p className="text-[#5A5A66] text-sm">
              Your subscription is active. Preparing your workspace...
            </p>
          </div>
        )}

        {status === "failed" && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-serif font-bold text-red-600">Payment Failed</h1>
            <p className="text-[#5A5A66] text-sm mb-4">{errorMsg}</p>
            <button
              onClick={() => router.push("/pricing")}
              className="w-full py-3 bg-[#FF6B00] hover:bg-[#E56000] text-white font-medium rounded-xl transition duration-200"
            >
              Choose Plan & Retry
            </button>
          </div>
        )}

        {status === "timeout" && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-serif font-bold text-amber-600">Verification Pending</h1>
            <p className="text-[#5A5A66] text-sm mb-4">
              Your payment is being processed by the provider but confirmation is taking longer than expected. 
              Please check your dashboard in a few minutes.
            </p>
            <button
              onClick={() => router.push("/pricing")}
              className="w-full py-3 bg-[#FF6B00] hover:bg-[#E56000] text-white font-medium rounded-xl transition duration-200"
            >
              Return to Pricing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
