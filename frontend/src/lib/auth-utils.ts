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
  // SameSite=Lax is required so the cookie is included in the subsequent
  // navigation request that Next.js middleware reads.
  document.cookie = `${name}=${value};path=/;expires=${expires.toUTCString()};SameSite=Lax`;
}

/**
 * Navigate to a URL after setting auth cookies.
 * Uses window.location.href (hard redirect) instead of router.push() so the
 * browser sends the freshly-written cookies in the very next HTTP request,
 * which is what Next.js middleware reads to decide access.
 */
export function navigateAfterAuth(url: string) {
  if (typeof window !== "undefined") {
    window.location.href = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_BAVIO_REVIEW_HOST && !url.startsWith('/review') ? `/review${url}` : url;
  }
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

/**
 * The canonical production auth origin.
 * bavio.in (apex) is the production host. www.bavio.in must never be used as
 * the OAuth redirect origin because PKCE code_verifier lives in localStorage
 * which is origin-scoped — mixing apex and www breaks the exchange.
 */
export const PROD_AUTH_ORIGIN = 'https://bavio.in';

/**
 * Resolves the canonical callback URL for Supabase OAuth.
 * Ensures consistent host origin so PKCE code_verifier is not lost
 * due to apex -> www canonical redirects.
 *
 * Returns PROD_AUTH_ORIGIN in production (including SSR fallback).
 * Returns window.location.origin for localhost, Vercel preview, and ngrok.
 */
export function getCanonicalAuthCallbackUrl(isPopup = false): string {
  if (typeof window === "undefined") {
    // SSR fallback — production server-side render uses the apex domain.
    return `${PROD_AUTH_ORIGIN}/auth/callback${isPopup ? "?oauth_popup=true" : ""}`;
  }
  const hostname = window.location.hostname;
  const isLocalOrPreview =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local") ||
    hostname.includes("vercel.app") ||
    hostname.includes("ngrok-free.dev") ||
    hostname.includes("ngrok.io");

  const origin = isLocalOrPreview ? window.location.origin : PROD_AUTH_ORIGIN;
  return `${origin}/auth/callback${isPopup ? "?oauth_popup=true" : ""}`;
}

/**
 * Sanitizes an intended redirect path to prevent open redirects.
 * Only relative paths starting with a single '/' are allowed.
 */
export function sanitizeRedirectPath(url: string | null | undefined, fallback = "/workspace"): string {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  // Ensure it starts with '/' and not '//' (which browsers treat as protocol-relative URL)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\\")) {
    return trimmed;
  }
  return fallback;
}
