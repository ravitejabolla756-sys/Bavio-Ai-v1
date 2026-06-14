import { useState, useEffect } from "react";

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};path=/;expires=${expires.toUTCString()}`;
}

/**
 * Computes the correct CTA destination synchronously on first render
 * by reading cookies directly — no useEffect delay that caused double-click issues.
 */
function computeDestination(): string {
  const isAuthenticated = getCookie("bavio_auth") === "true";
  const isOnboardingComplete = getCookie("bavio_onboarding_completed") === "true";
  if (!isAuthenticated) return "/signup";
  if (!isOnboardingComplete) return "/onboarding";
  return "/workspace";
}

export function useCTADestination() {
  // Initialize synchronously so the href is correct on first render
  const [destination, setDestination] = useState<string>(() => {
    // During SSR, default to /signup; on client, compute immediately
    if (typeof document === "undefined") return "/signup";
    return computeDestination();
  });

  // Re-check on mount to handle any edge cases (cookie changed between SSR & client)
  useEffect(() => {
    const d = computeDestination();
    if (d !== destination) setDestination(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return destination;
}
