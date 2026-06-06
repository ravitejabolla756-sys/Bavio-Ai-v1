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
  IN: 'INR',
  US: 'USD',
  GB: 'GBP',
  AU: 'AUD',
  AE: 'AED',
  CA: 'USD', // Fallback mapping for CA to USD as spec requires US/Canada to use USD
};

export const DIAL_CODES: Record<string, string> = {
  IN: '+91',
  US: '+1',
  GB: '+44',
  AU: '+61',
  AE: '+971',
  CA: '+1',
};

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>('USD');
  const [loading, setLoading] = useState<boolean>(true);

  const setCountry = (code: string) => {
    const cleanCode = code.toUpperCase();
    setCountryState(cleanCode);
    setCurrency(CURRENCY_MAP[cleanCode] || 'USD');
    if (typeof window !== 'undefined') {
      localStorage.setItem('bavio_country_override', cleanCode);
    }
  };

  useEffect(() => {
    // 1. Check manual override from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bavio_country_override');
      if (stored) {
        setCountry(stored);
        setLoading(false);
        return;
      }
    }

    // 2. Browser Geolocation (Primary)
    const detectViaGeolocation = new Promise<{ countryCode: string }>((resolve, reject) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (res.ok) {
              const geoData = await res.json();
              if (geoData.countryCode) {
                resolve({ countryCode: geoData.countryCode.toUpperCase() });
                return;
              }
            }
            reject(new Error('Failed reverse geocoding'));
          } catch (err) {
            reject(err);
          }
        },
        (error) => reject(error),
        { timeout: 3000 }
      );
    });

    detectViaGeolocation
      .then((data) => {
        setCountry(data.countryCode);
        setLoading(false);
      })
      .catch(() => {
        // 3. Fallback: IP GeoIP detection using backend proxied endpoint
        fetch('/api/onboarding/detect-country')
          .then((res) => {
            if (!res.ok) throw new Error('API failed');
            return res.json();
          })
          .then((data) => {
            const code = (data.country_code || 'US').toUpperCase();
            setCountry(code);
            setLoading(false);
          })
          .catch(() => {
            // 4. Ultimate Fallback to US
            setCountry('US');
            setLoading(false);
          });
      });
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
