"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { authApi, billingApi, BusinessProfile, PaymentRecord, clearAuthData } from "@/lib/api";

interface WorkspaceContextType {
  profile: BusinessProfile | null;
  payments: PaymentRecord[];
  isProfileLoading: boolean;
  isPaymentsLoading: boolean;
  profileError: string | null;
  refreshProfile: (silent?: boolean) => Promise<BusinessProfile | null>;
  refreshPayments: (clientId?: string, silent?: boolean) => Promise<PaymentRecord[]>;
  updateProfileLocally: (updated: Partial<BusinessProfile>) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// Memory cache across component lifecycles
let memoryProfileCache: BusinessProfile | null = null;
let memoryPaymentsCache: PaymentRecord[] = [];
let memoryProfileFetchedAt = 0;
let memoryPaymentsFetchedAt = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute fresh TTL, then stale-while-revalidate

function getInitialProfile(): BusinessProfile | null {
  if (memoryProfileCache) return memoryProfileCache;

  if (typeof window !== "undefined") {
    try {
      const storedName = localStorage.getItem("bavio_name") || "My Workspace";
      const storedId = localStorage.getItem("bavio_client_id") || "";
      const storedUser = localStorage.getItem("bavio_user");
      let parsed: any = {};
      if (storedUser) {
        parsed = JSON.parse(storedUser);
      }

      if (storedName || storedId || parsed.email) {
        const fallback: BusinessProfile = {
          id: storedId || parsed.id || "usr_default",
          name: parsed.name || storedName,
          email: parsed.email || "",
          phone: parsed.phone || "",
          country: parsed.country || "US",
          api_key: parsed.api_key || "",
          minutes_limit: parsed.minutes_limit ?? 30,
          minutes_used: parsed.minutes_used ?? 0,
          plan: parsed.plan || "free",
          plan_name: parsed.plan_name || "free_trial",
          current_period_end: parsed.current_period_end || null,
          onboarding_status: parsed.onboarding_status || "completed",
          onboarding_step: parsed.onboarding_step ?? 3,
          dodo_subscription_id: parsed.dodo_subscription_id || null,
          created_at: parsed.created_at || new Date().toISOString(),
          subscription_status: parsed.subscription_status || "active",
          twilio_number: parsed.twilio_number || null,
          industry: parsed.industry || "General Business",
          voice: parsed.voice || "saffron",
        };
        memoryProfileCache = fallback;
        return fallback;
      }
    } catch {
      // Storage unavailable
    }
  }
  return null;
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<BusinessProfile | null>(getInitialProfile);
  const [payments, setPayments] = useState<PaymentRecord[]>(memoryPaymentsCache);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(!memoryProfileCache);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState<boolean>(memoryPaymentsCache.length === 0);
  const [profileError, setProfileError] = useState<string | null>(null);

  const profilePromiseRef = useRef<Promise<BusinessProfile | null> | null>(null);
  const paymentsPromiseRef = useRef<Promise<PaymentRecord[]> | null>(null);

  // Refresh profile with background deduplication
  const refreshProfile = useCallback(async (silent = true): Promise<BusinessProfile | null> => {
    if (!silent && !memoryProfileCache) {
      setIsProfileLoading(true);
    }
    setProfileError(null);

    // Reuse in-flight request
    if (profilePromiseRef.current) {
      return profilePromiseRef.current;
    }

    const fetchPromise = (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("bavio_token") : null;
        if (!token) return null;

        const res = await fetch("/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          clearAuthData();
          return null;
        }

        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            const freshProfile = data as BusinessProfile;
            memoryProfileCache = freshProfile;
            memoryProfileFetchedAt = Date.now();
            setProfile(freshProfile);

            if (freshProfile.name) {
              localStorage.setItem("bavio_name", freshProfile.name);
            }
            if (freshProfile.id) {
              localStorage.setItem("bavio_client_id", freshProfile.id);
            }
            return freshProfile;
          }
        }
        return null;
      } catch (err: any) {
        console.error("[WorkspaceContext] Profile fetch error:", err);
        setProfileError(err.message || "Failed to load profile");
        return null;
      } finally {
        setIsProfileLoading(false);
        profilePromiseRef.current = null;
      }
    })();

    profilePromiseRef.current = fetchPromise;
    return fetchPromise;
  }, []);

  // Refresh payments with background deduplication
  const refreshPayments = useCallback(async (clientId?: string, silent = true): Promise<PaymentRecord[]> => {
    const targetId = clientId || memoryProfileCache?.id || (typeof window !== "undefined" ? localStorage.getItem("bavio_client_id") : null);
    if (!targetId) return [];

    if (!silent && memoryPaymentsCache.length === 0) {
      setIsPaymentsLoading(true);
    }

    if (paymentsPromiseRef.current) {
      return paymentsPromiseRef.current;
    }

    const fetchPromise = (async () => {
      try {
        const payRes = await billingApi.getPayments(targetId);
        if (Array.isArray(payRes)) {
          memoryPaymentsCache = payRes;
          memoryPaymentsFetchedAt = Date.now();
          setPayments(payRes);
          return payRes;
        }
        return [];
      } catch (err) {
        console.error("[WorkspaceContext] Payments fetch error:", err);
        return [];
      } finally {
        setIsPaymentsLoading(false);
        paymentsPromiseRef.current = null;
      }
    })();

    paymentsPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, []);

  // Local optimistic update
  const updateProfileLocally = useCallback((updated: Partial<BusinessProfile>) => {
    setProfile((prev) => {
      const next = prev ? { ...prev, ...updated } : (updated as BusinessProfile);
      memoryProfileCache = next;
      if (next.name) {
        localStorage.setItem("bavio_name", next.name);
      }
      return next;
    });
  }, []);

  // Parallel prefetch on startup (Promise.all)
  useEffect(() => {
    const now = Date.now();
    const shouldFetchProfile = !memoryProfileCache || now - memoryProfileFetchedAt > CACHE_TTL_MS;
    const shouldFetchPayments = memoryPaymentsCache.length === 0 || now - memoryPaymentsFetchedAt > CACHE_TTL_MS;

    if (shouldFetchProfile || shouldFetchPayments) {
      Promise.all([
        shouldFetchProfile ? refreshProfile(true) : Promise.resolve(memoryProfileCache),
        shouldFetchPayments ? refreshPayments(undefined, true) : Promise.resolve(memoryPaymentsCache),
      ]).catch((err) => {
        console.error("[WorkspaceContext] Parallel prefetch error:", err);
      });
    }
  }, [refreshProfile, refreshPayments]);

  return (
    <WorkspaceContext.Provider
      value={{
        profile,
        payments,
        isProfileLoading,
        isPaymentsLoading,
        profileError,
        refreshProfile,
        refreshPayments,
        updateProfileLocally,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
