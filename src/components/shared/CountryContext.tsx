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
  US: 'USD',
  GB: 'GBP',
  AU: 'AUD',
};

export const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  USD: '$',
  GBP: '£',
  AUD: 'A$',
};

export const DIAL_CODES: Record<string, string> = {
  US: '+1',
  GB: '+44',
  AU: '+61',
};

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState<string | null>('US');
  const [currency, setCurrency] = useState<string>('USD');
  const [loading, setLoading] = useState<boolean>(false);

  // Use the passed code, validating that it is supported
  const setCountry = (code: string) => {
    const cleanCode = code.toUpperCase();
    if (CURRENCY_MAP[cleanCode]) {
      setCountryState(cleanCode);
      setCurrency(CURRENCY_MAP[cleanCode]);
    } else {
      setCountryState('US');
      setCurrency('USD');
    }
  };

  useEffect(() => {
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
