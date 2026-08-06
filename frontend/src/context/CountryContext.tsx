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

// Static default/supported countries (excluding India by default)
export const countries: CountryData[] = [
  { code: "US", name: "United States",       currency: "usd", currencyCode: "USD", symbol: "$",    dialCode: "+1",   flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom",      currency: "gbp", currencyCode: "GBP", symbol: "£",    dialCode: "+44",  flag: "🇬🇧" },
  { code: "AU", name: "Australia",           currency: "aud", currencyCode: "AUD", symbol: "A$",   dialCode: "+61",  flag: "🇦🇺" },
];

const DEFAULT_COUNTRY = countries.find(c => c.code === "US") || countries[0];

interface CountryContextType {
  country: CountryData;
  countriesList: CountryData[];
  isLoading: boolean;
  error: string | null;
  detectedMethod: "geolocation" | "geoip" | "manual" | "default" | null;
  changeCountry: (code: string) => Promise<void>;
  detectCountry: (force?: boolean) => Promise<void>;
  retryFetchCountries: () => Promise<void>;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountry] = useState<CountryData>(DEFAULT_COUNTRY);
  const [countriesList, setCountriesList] = useState<CountryData[]>(countries);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectedMethod, setDetectedMethod] = useState<CountryContextType["detectedMethod"]>("default");

  const fetchCountries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/telephony/supported-countries");
      if (!res.ok) throw new Error("Failed to fetch supported countries");
      const data = await res.json();
      
      const METADATA_MAP: Record<string, { currency: string, currencyCode: string, symbol: string, flag: string }> = {
        US: { currency: "usd", currencyCode: "USD", symbol: "$",    flag: "🇺🇸" },
        GB: { currency: "gbp", currencyCode: "GBP", symbol: "£",    flag: "🇬🇧" },
        AU: { currency: "aud", currencyCode: "AUD", symbol: "A$",   flag: "🇦🇺" }
      };

      const mapped = data
        .filter((c: any) => c.iso2 !== "IN")
        .map((c: any) => {
          const meta = METADATA_MAP[c.iso2] || { currency: "usd", currencyCode: "USD", symbol: "$", flag: "🌐" };
          return {
            code: c.iso2,
            name: c.name,
            dialCode: c.dialCode,
            flag: meta.flag,
            currency: meta.currency,
            currencyCode: meta.currencyCode,
            symbol: meta.symbol
          };
        });

      setCountriesList(mapped);

      // Re-detect with the new country list
      let defaultCode = "US";
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem("bavio_country");
        if (saved) {
          defaultCode = saved;
        }
      }
      const found = mapped.find((c: CountryData) => c.code === defaultCode);
      if (found) {
        setCountry(found);
        setDetectedMethod("manual");
      } else if (mapped.length > 0) {
        setCountry(mapped.find((c: CountryData) => c.code === "US") || mapped[0]);
        setDetectedMethod("default");
      }
    } catch (err: any) {
      console.error("Error loading countries:", err.message);
      setError("Failed to load supported countries.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const detectCountry = useCallback(async (force = false) => {
    try {
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem("bavio_country");
        if (saved) {
          const found = countriesList.find(c => c.code === saved);
          if (found) {
            setCountry(found);
            setDetectedMethod("manual");
            return;
          }
        }
      }
    } catch (_) {}
    setCountry(countriesList.find(c => c.code === "US") || countriesList[0] || DEFAULT_COUNTRY);
    setDetectedMethod("default");
  }, [countriesList]);

  const changeCountry = useCallback(async (code: string) => {
    const found = countriesList.find(c => c.code === code);
    if (found) {
      setCountry(found);
      setDetectedMethod("manual");
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("bavio_country", code);
        }
      } catch (_) {}
    }
  }, [countriesList]);

  // Run on mount
  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  return (
    <CountryContext.Provider 
      value={{ 
        country, 
        countriesList, 
        isLoading, 
        error, 
        detectedMethod, 
        changeCountry, 
        detectCountry,
        retryFetchCountries: fetchCountries
      }}
    >
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
