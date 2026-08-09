"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    // 1. Listen to Supabase auth state change events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("[AuthHashHandler] PASSWORD_RECOVERY event triggered. Routing to /reset-password.");
        router.push("/reset-password");
      }
    });

    // 2. Also check URL hash immediately on mount in case event fired before mount
    const checkHash = () => {
      if (typeof window !== "undefined" && window.location.hash) {
        const hash = window.location.hash;
        if (hash.includes("type=recovery") || hash.includes("error_code=otp_expired")) {
          // If OTP expired, we can route back to forgot password with an error
          if (hash.includes("error_code=otp_expired")) {
            router.push("/forgot-password?error=otp_expired");
          } else {
            router.push("/reset-password");
          }
        }
      }
    };
    
    checkHash();

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
