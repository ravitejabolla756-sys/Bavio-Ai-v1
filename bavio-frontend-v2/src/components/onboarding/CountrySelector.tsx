"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCountry, countries } from "@/context/CountryContext";
import { CaretDown, Check, GlobeSimple, Spinner } from "@phosphor-icons/react";

export default function CountrySelector() {
  const { country, isLoading, detectedMethod, changeCountry, detectCountry } = useCountry();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full text-left font-sans" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 px-4 text-body-xs text-[#14141A] transition-all duration-200 outline-none select-none"
      >
        <div className="flex items-center gap-3">
          {isLoading ? (
            <Spinner className="w-4 h-4 text-[#FF6B00] animate-spin" />
          ) : (
            <span className="text-base leading-none">{country.flag}</span>
          )}
          <span className="font-semibold text-body-xs">
            {isLoading ? "Auto-detecting country..." : `${country.name} (${country.dialCode})`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {detectedMethod && detectedMethod !== "manual" && !isLoading && (
            <span className="text-[9px] font-bold bg-[#FF6B00]/10 text-[#FF6B00] uppercase tracking-wider px-2 py-0.5 rounded-full select-none">
              Auto
            </span>
          )}
          <CaretDown
            className={`w-4 h-4 text-[#8A8A96] transition-transform duration-300 ease-premium ${
              isOpen ? "rotate-180 text-[#14141A]" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 bg-white border border-[#E5E0D8] rounded-2xl shadow-premium overflow-hidden transform origin-top transition-all duration-200">
          <div className="py-1 max-h-[260px] overflow-y-auto">
            {countries.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  changeCountry(c.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[#FAF7F2] transition-colors duration-150 text-left ${
                  c.code === country.code ? "bg-[#FAF7F2]/60 font-semibold" : ""
                }`}
              >
                <div className="flex items-center gap-3 text-body-xs">
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="text-[#14141A]">{c.name}</span>
                  <span className="text-[#8A8A96] font-mono text-[10px]">{c.dialCode}</span>
                </div>
                {c.code === country.code && (
                  <Check className="w-4 h-4 text-[#FF6B00]" weight="bold" />
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-[#E5E0D8] p-2 bg-[#FAF7F2]/40 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                detectCountry(true);
                setIsOpen(false);
              }}
              className="text-[10px] font-bold text-[#FF6B00] hover:text-[#E05E00] uppercase tracking-wider inline-flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors outline-none"
            >
              <GlobeSimple className="w-3.5 h-3.5" />
              Re-Detect
            </button>
            <span className="text-[9px] text-[#8A8A96] select-none">
              Detected via {detectedMethod || "unknown"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
