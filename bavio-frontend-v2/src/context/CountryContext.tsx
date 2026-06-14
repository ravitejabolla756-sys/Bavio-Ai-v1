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
  { code: "CA", name: "Canada", currency: "usd", symbol: "$", dialCode: "+1", flag: "🇨🇦" },
  { code: "GB", name: "United Kingdom", currency: "gbp", symbol: "£", dialCode: "+44", flag: "🇬🇧" },
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
  const [country, setCountry] = useState<CountryData>(DEFAULT_COUNTRY);
  const [isLoading, setIsLoading] = useState(true);
  const [detectedMethod, setDetectedMethod] = useState<CountryContextType["detectedMethod"]>(null);

  const getCountryByCode = useCallback((code: string): CountryData => {
    return countries.find((c) => c.code === code.toUpperCase()) || DEFAULT_COUNTRY;
  }, []);

  const detectCountry = useCallback(async (force = false) => {
    setIsLoading(true);
    
    // 1. Check LocalStorage Override
    if (!force) {
      const stored = localStorage.getItem("bavio_country_override");
      if (stored) {
        setCountry(getCountryByCode(stored));
        setDetectedMethod("manual");
        setIsLoading(false);
        return;
      }
    }

    // 2. Try HTML5 Browser Geolocation (Primary)
    const geoPromise = new Promise<{ lat: number; lon: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => reject(error),
        { timeout: 4000 }
      );
    });

    try {
      const coords = await geoPromise;
      // Reverse geocode via BigDataCloud's free client-side API
      const geoRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.lat}&longitude=${coords.lon}&localityLanguage=en`
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.countryCode) {
          const resolved = getCountryByCode(geoData.countryCode);
          setCountry(resolved);
          setDetectedMethod("geolocation");
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.log("HTML5 Geolocation lookup failed or denied, falling back to GeoIP...");
    }

    // 3. Fallback: Backend IP Address GeoIP (MaxMind / ipapi.co)
    try {
      const res = await fetch("/api/onboarding/detect-country");
      if (res.ok) {
        const data = await res.json();
        if (data.country_code) {
          const resolved = getCountryByCode(data.country_code);
          setCountry(resolved);
          setDetectedMethod("geoip");
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.log("Backend GeoIP lookup failed.");
    }

    // 4. Default Fallback
    setCountry(DEFAULT_COUNTRY);
    setDetectedMethod("default");
    setIsLoading(false);
  }, [getCountryByCode]);

  const changeCountry = useCallback(async (code: string) => {
    const nextCountry = getCountryByCode(code);
    setCountry(nextCountry);
    setDetectedMethod("manual");
    localStorage.setItem("bavio_country_override", nextCountry.code);

    // If authenticated, sync with the backend
    const token = localStorage.getItem("bavio_token");
    if (token) {
      try {
        await fetch("/api/onboarding/set-country", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ country_code: nextCountry.code }),
        });
      } catch (err) {
        console.error("Failed to sync country override to database:", err);
      }
    }
  }, [getCountryByCode]);

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
