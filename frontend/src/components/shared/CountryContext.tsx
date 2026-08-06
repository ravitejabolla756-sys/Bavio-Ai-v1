"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';

export interface CountryContextType {
  country: string | null;
  currency: string;
  currencySymbol: string;
  loading: boolean;
  setCountry: (code: string) => void;
}

export const CountryContext = createContext<CountryContextType | undefined>(undefined);

export const CURRENCY_MAP: Record<string, string> = {
  IN: 'INR',
  US: 'USD',
  GB: 'GBP',
  AU: 'AUD',
  AE: 'AED',
  CA: 'CAD',
  DE: 'EUR',
  FR: 'EUR',
  EU: 'EUR',
  SG: 'SGD',
  NZ: 'NZD',
};

export const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  INR: '₹',
  USD: '$',
  GBP: '£',
  AUD: 'A$',
  AED: 'AED ',
  CAD: 'C$',
  EUR: '€',
  SGD: 'S$',
  NZD: 'NZ$',
};

export const DIAL_CODES: Record<string, string> = {
  IN: '+91',
  US: '+1',
  GB: '+44',
  AU: '+61',
  AE: '+971',
  CA: '+1',
  DE: '+49',
  FR: '+33',
  SG: '+65',
  NZ: '+64',
};

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState<string | null>('US');
  const [currency, setCurrency] = useState<string>('USD');
  const [loading, setLoading] = useState<boolean>(false);

  // Fix: actually use the passed code, not always 'US'
  const setCountry = (code: string) => {
    const resolvedCurrency = CURRENCY_MAP[code] || 'USD';
    setCountryState(code);
    setCurrency(resolvedCurrency);
  };

  useEffect(() => {
    // Default to US on mount; the onboarding page will call setCountry() with the real selection
    setCountryState('US');
    setCurrency('USD');
    setLoading(false);
  }, []);

  const currencySymbol = CURRENCY_SYMBOL_MAP[currency] || '$';

  return (
    <CountryContext.Provider value={{ country, currency, currencySymbol, loading, setCountry }}>
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
