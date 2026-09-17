"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, billingApi, BusinessProfile, PaymentRecord, getClientId } from "@/lib/api";

interface WorkspaceContextType {
  profile: BusinessProfile | null;
  payments: PaymentRecord[];
  isProfileLoading: boolean;
  isPaymentsLoading: boolean;
  profileError: string | null;
  paymentsError: string | null;
  refreshProfile: (silent?: boolean) => Promise<BusinessProfile | null>;
  refreshPayments: (clientId?: string, silent?: boolean) => Promise<PaymentRecord[]>;
  updateProfileLocally: (updated: Partial<BusinessProfile>) => void;
}
const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

/** State belongs to this authenticated provider, never to a module-global tenant cache. */
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const refreshProfile = useCallback(async (_silent = true) => {
    setIsProfileLoading(true);
    setProfileError(null);
    try {
      const result = await authApi.getProfile();
      if (!result?.id) throw new Error("Invalid business profile response");
      setProfile(result);
      return result;
    } catch (error) {
      setProfile(null);
      setProfileError(error instanceof Error ? error.message : "Profile unavailable");
      return null;
    } finally { setIsProfileLoading(false); }
  }, []);

  const refreshPayments = useCallback(async (clientId?: string, _silent = true) => {
    setIsPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const id = clientId || getClientId();
      if (!id) throw new Error("Not authenticated");
      const result = await billingApi.getPayments(id);
      if (!Array.isArray(result)) throw new Error("Invalid payment history response");
      setPayments(result);
      return result;
    } catch (error) {
      setPayments([]);
      setPaymentsError(error instanceof Error ? error.message : "Payments unavailable");
      // Context carries the failure separately; consumers must use paymentsError.
      return [];
    } finally { setIsPaymentsLoading(false); }
  }, []);

  const updateProfileLocally = useCallback((updated: Partial<BusinessProfile>) => {
    setProfile(previous => previous ? { ...previous, ...updated } : null);
  }, []);

  useEffect(() => {
    void Promise.all([refreshProfile(), refreshPayments()]);
  }, [refreshProfile, refreshPayments]);

  return <WorkspaceContext.Provider value={{
    profile, payments, isProfileLoading, isPaymentsLoading, profileError, paymentsError,
    refreshProfile, refreshPayments, updateProfileLocally,
  }}>{children}</WorkspaceContext.Provider>;
}
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return context;
}
