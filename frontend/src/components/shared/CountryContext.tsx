"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';

export interface CountryContextType {
  country: string | null;
  currency: string;
  loading: boolean;
  setCountry: (code: string) => void;
}

export const CountryContext = createContext<CountryContextType | undefined>(undefined);

export const CURRENCY_MAP: Record<string, string> = {
  US: 'USD',
  GB: 'GBP',
  AU: 'AUD',
  AE: 'AED',
  CA: 'USD', // Fallback mapping for CA to USD as spec requires US/Canada to use USD
};

export const DIAL_CODES: Record<string, string> = {
  US: '+1',
  GB: '+44',
  AU: '+61',
  AE: '+971',
  CA: '+1',
};

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState<string | null>('US');
  const [currency, setCurrency] = useState<string>('USD');
  const [loading, setLoading] = useState<boolean>(false);

  const setCountry = (code: string) => {
    setCountryState('US');
    setCurrency('USD');
  };

  useEffect(() => {
    setCountryState('US');
    setCurrency('USD');
    setLoading(false);
  }, []);

  return (
    <CountryContext.Provider value={{ country, currency, setCountry, loading }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
}
