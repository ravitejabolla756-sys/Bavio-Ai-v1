"use client";

import React from "react";
import { useCountry, countries } from "@/context/CountryContext";
import { GlobeSimple, Spinner } from "@phosphor-icons/react";
import { SearchableDropdown } from "@/components/shared/SearchableDropdown";

export default function CountrySelector() {
  const { country, isLoading, detectedMethod, changeCountry, detectCountry } = useCountry();

  const options = countries.map((c) => ({
    value: c.code,
    label: c.name,
    icon: c.flag,
    description: c.dialCode,
  }));

  const renderTrigger = () => {
    return (
      <div className="flex items-center justify-between w-full pr-2">
        <div className="flex items-center gap-3">
          {isLoading ? (
            <Spinner className="w-4 h-4 text-[#FF6B00] animate-spin animate-duration-1000" />
          ) : (
            <span className="text-base leading-none">{country.flag}</span>
          )}
          <span className="font-semibold text-body-xs text-[#14141A]">
            {isLoading ? "Auto-detecting country..." : `${country.name} (${country.dialCode})`}
          </span>
        </div>
        {detectedMethod && detectedMethod !== "manual" && !isLoading && (
          <span className="text-[9px] font-bold bg-[#FF6B00]/10 text-[#FF6B00] uppercase tracking-wider px-2 py-0.5 rounded-full select-none">
            Auto
          </span>
        )}
      </div>
    );
  };

  const footer = (
    <div className="p-2 bg-[#FAF7F2]/40 flex items-center justify-between">
      <button
        type="button"
        onClick={() => {
          detectCountry(true);
        }}
        className="text-[10px] font-bold text-[#FF6B00] hover:text-[#E05E00] uppercase tracking-wider inline-flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors outline-none"
      >
        <GlobeSimple className="w-3.5 h-3.5" />
        Re-Detect
      </button>
      <span className="text-[9px] text-[#8A8A96] select-none pr-2">
        Detected via {detectedMethod || "unknown"}
      </span>
    </div>
  );

  return (
    <SearchableDropdown
      options={options}
      value={country.code}
      onChange={(val) => changeCountry(val)}
      renderTrigger={renderTrigger}
      footer={footer}
    />
  );
}
