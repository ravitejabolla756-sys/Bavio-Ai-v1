"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthHashHandler() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("[AuthHashHandler] PASSWORD_RECOVERY event triggered. Routing to /reset-password.");
        if (typeof window !== "undefined") {
          window.location.href = "/reset-password";
        }
      }
    });

    const checkHash = () => {
      if (typeof window !== "undefined" && window.location.hash) {
        const hash = window.location.hash;
        if (hash.includes("type=recovery") || hash.includes("error_code=otp_expired")) {
          if (hash.includes("error_code=otp_expired")) {
            window.location.href = "/forgot-password?error=otp_expired";
          } else {
            window.location.href = "/reset-password";
          }
        }
      }
    };
    
    checkHash();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
