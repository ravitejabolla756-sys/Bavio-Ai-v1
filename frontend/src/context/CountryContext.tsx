"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CountryData {
  code: string; // ISO 2-letter code
  name: string;
  currency: string; // e.g. "inr", "usd", "gbp"
  currencyCode: string; // e.g. "INR", "USD", "GBP"
  symbol: string;
  dialCode: string;
  flag: string;
}

export const countries: CountryData[] = [
  { code: "IN", name: "India",               currency: "inr", currencyCode: "INR", symbol: "₹",    dialCode: "+91",  flag: "🇮🇳" },
  { code: "US", name: "United States",       currency: "usd", currencyCode: "USD", symbol: "$",    dialCode: "+1",   flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom",      currency: "gbp", currencyCode: "GBP", symbol: "£",    dialCode: "+44",  flag: "🇬🇧" },
  { code: "CA", name: "Canada",              currency: "cad", currencyCode: "CAD", symbol: "C$",   dialCode: "+1",   flag: "🇨🇦" },
  { code: "AU", name: "Australia",           currency: "aud", currencyCode: "AUD", symbol: "A$",   dialCode: "+61",  flag: "🇦🇺" },
  { code: "AE", name: "United Arab Emirates",currency: "aed", currencyCode: "AED", symbol: "AED ", dialCode: "+971", flag: "🇦🇪" },
  { code: "DE", name: "Germany",             currency: "eur", currencyCode: "EUR", symbol: "€",    dialCode: "+49",  flag: "🇩🇪" },
  { code: "FR", name: "France",              currency: "eur", currencyCode: "EUR", symbol: "€",    dialCode: "+33",  flag: "🇫🇷" },
  { code: "SG", name: "Singapore",           currency: "sgd", currencyCode: "SGD", symbol: "S$",   dialCode: "+65",  flag: "🇸🇬" },
  { code: "NZ", name: "New Zealand",         currency: "nzd", currencyCode: "NZD", symbol: "NZ$",  dialCode: "+64",  flag: "🇳🇿" },
];

const DEFAULT_COUNTRY = countries.find(c => c.code === "US") || countries[0];

interface CountryContextType {
  country: CountryData;
  isLoading: boolean;
  detectedMethod: "geolocation" | "geoip" | "manual" | "default" | null;
  changeCountry: (code: string) => Promise<void>;
  detectCountry: (force?: boolean) => Promise<void>;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountry] = useState<CountryData>(DEFAULT_COUNTRY);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedMethod, setDetectedMethod] = useState<CountryContextType["detectedMethod"]>("default");

  const getCountryByCode = useCallback((code: string): CountryData => {
    return countries.find(c => c.code === code) || DEFAULT_COUNTRY;
  }, []);

  const detectCountry = useCallback(async (force = false) => {
    // Auto-detect can be wired to a geo-IP API later.
    // For now default to US, but respect a previously saved user preference.
    try {
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem("bavio_country");
        if (saved) {
          const found = countries.find(c => c.code === saved);
          if (found) {
            setCountry(found);
            setDetectedMethod("manual");
            return;
          }
        }
      }
    } catch (_) {
      // sessionStorage not available
    }
    setCountry(DEFAULT_COUNTRY);
    setDetectedMethod("default");
    setIsLoading(false);
  }, []);

  const changeCountry = useCallback(async (code: string) => {
    const found = countries.find(c => c.code === code);
    if (found) {
      setCountry(found);
      setDetectedMethod("manual");
      // Persist to session so the choice survives page navigation
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("bavio_country", code);
        }
      } catch (_) {
        // ignore
      }
    }
  }, []);

  // Run on mount
  useEffect(() => {
    detectCountry();
  }, [detectCountry]);

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
