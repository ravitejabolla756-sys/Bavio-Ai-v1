"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CountryData {
  code: string; // ISO 2-letter code
  name: string;
  currency: "inr" | "usd" | "gbp" | "aud" | "aed";
  symbol: string;
  dialCode: string;
  flag: string;
}

export const countries: CountryData[] = [
  { code: "US", name: "United States", currency: "usd", symbol: "$", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", currency: "gbp", symbol: "£", dialCode: "+44", flag: "🇬🇧" },
  { code: "CA", name: "Canada", currency: "usd", symbol: "$", dialCode: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", currency: "aud", symbol: "AUD", dialCode: "+61", flag: "🇦🇺" },
  { code: "AE", name: "United Arab Emirates", currency: "aed", symbol: "AED", dialCode: "+971", flag: "🇦🇪" },
];

const DEFAULT_COUNTRY = countries[0]; // US as default

interface CountryContextType {
  country: CountryData;
  isLoading: boolean;
  detectedMethod: "geolocation" | "geoip" | "manual" | "default" | null;
  changeCountry: (code: string) => Promise<void>;
  detectCountry: (force?: boolean) => Promise<void>;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountry] = useState<CountryData>(countries[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedMethod, setDetectedMethod] = useState<CountryContextType["detectedMethod"]>("default");

  const getCountryByCode = useCallback((code: string): CountryData => {
    return countries[0];
  }, []);

  const detectCountry = useCallback(async (force = false) => {
    setCountry(countries[0]);
    setDetectedMethod("default");
    setIsLoading(false);
  }, []);

  const changeCountry = useCallback(async (code: string) => {
    setCountry(countries[0]);
    setDetectedMethod("manual");
  }, []);

  // Run on mount
  useEffect(() => {
    setCountry(countries[0]);
    setDetectedMethod("default");
    setIsLoading(false);
  }, []);

  return (
    <CountryContext.Provider value={{ country, isLoading, detectedMethod, changeCountry, detectCountry }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (!context) {
    throw new Error("useCountry must be used within a CountryProvider");
  }
  return context;
}
