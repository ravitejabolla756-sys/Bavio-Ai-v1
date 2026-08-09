"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { defaultCountries, parseCountry } from "react-international-phone";
import { parsePhoneNumberFromString, AsYouType } from "libphonenumber-js";
import { CaretDown, Check } from "@phosphor-icons/react";

// Convert ISO-3166-1 alpha-2 country code to flag emoji dynamically
function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export interface CountryInfo {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

interface PhoneInputProps {
  id?: string;
  value: string; // The E.164 formatted value or raw input
  onChange: (value: string, isValid: boolean, country: CountryInfo) => void;
  onBlur?: () => void;
  error?: string;
  label?: string;
  required?: boolean;
}

export default function PhoneInput({
  id = "phone-input",
  value = "",
  onChange,
  onBlur,
  error,
  label = "Phone Number",
  required = false,
}: PhoneInputProps) {
  // 1. Resolve country list dynamically from react-international-phone
  const countries = useMemo<CountryInfo[]>(() => {
    return defaultCountries.map((c) => {
      const parsed = parseCountry(c);
      const code = parsed.iso2.toUpperCase();
      return {
        name: parsed.name,
        code,
        dialCode: `+${parsed.dialCode}`,
        flag: getFlagEmoji(code),
      };
    });
  }, []);

  // 2. State & refs
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(() => {
    // Default to India (+91)
    const india = countries.find((c) => c.code === "IN");
    return india || countries[0];
  });
  const [phoneVal, setPhoneVal] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 3. Sync incoming value with internal state
  useEffect(() => {
    if (!value) {
      setPhoneVal("");
      return;
    }

    // Try to parse the E.164 value
    const parsed = parsePhoneNumberFromString(value);
    if (parsed && parsed.country) {
      const matchingCountry = countries.find((c) => c.code === parsed.country);
      if (matchingCountry) {
        setSelectedCountry(matchingCountry);
        // Set phone value without the dial code
        const nationalNumber = parsed.nationalNumber;
        const formatted = new AsYouType(parsed.country).input(nationalNumber);
        setPhoneVal(formatted);
        return;
      }
    }

    // Fallback if parsing fails (e.g. partial phone number)
    if (value.startsWith(selectedCountry.dialCode)) {
      const national = value.slice(selectedCountry.dialCode.length);
      const formatted = new AsYouType(selectedCountry.code as any).input(national);
      setPhoneVal(formatted);
    } else {
      const formatted = new AsYouType(selectedCountry.code as any).input(value);
      setPhoneVal(formatted);
    }
  }, [value, selectedCountry.dialCode, selectedCountry.code, countries]);

  // 4. Handle change in the raw text input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const digitsOnly = rawInput.replace(/\D/g, "");

    // Format as-you-type based on selected country
    const formatted = new AsYouType(selectedCountry.code as any).input(digitsOnly);
    setPhoneVal(formatted);

    // Compute validity & E.164 representation
    const fullPhone = selectedCountry.dialCode + digitsOnly;
    let isValid = false;
    let e164Value = fullPhone;

    try {
      const parsed = parsePhoneNumberFromString(fullPhone, selectedCountry.code as any);
      if (parsed) {
        isValid = parsed.isValid() && parsed.country === selectedCountry.code;
        e164Value = parsed.number || fullPhone;
      }
    } catch (err) {}

    onChange(e164Value, isValid, selectedCountry);
  };

  // 5. Filter countries for searching
  const filteredCountries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
  }, [searchQuery, countries]);

  // Reset focus index when search changes
  useEffect(() => {
    setFocusedIndex(0);
  }, [searchQuery]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  // 6. Handle country selection
  const handleSelectCountry = (country: CountryInfo) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchQuery("");

    // Re-format existing number with new country format and trigger onChange
    const digitsOnly = phoneVal.replace(/\D/g, "");
    const formatted = new AsYouType(country.code as any).input(digitsOnly);
    setPhoneVal(formatted);

    const fullPhone = country.dialCode + digitsOnly;
    let isValid = false;
    let e164Value = fullPhone;

    try {
      const parsed = parsePhoneNumberFromString(fullPhone, country.code as any);
      if (parsed) {
        isValid = parsed.isValid() && parsed.country === country.code;
        e164Value = parsed.number || fullPhone;
      }
    } catch (err) {}

    onChange(e164Value, isValid, country);
  };

  // 7. Click outside close listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 8. Keyboard Navigation for Search Dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsDropdownOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % filteredCountries.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + filteredCountries.length) % filteredCountries.length);
        break;
      case "Enter":
        e.preventDefault();
        if (filteredCountries[focusedIndex]) {
          handleSelectCountry(filteredCountries[focusedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsDropdownOpen(false);
        setSearchQuery("");
        break;
      case "Tab":
        setIsDropdownOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      {label && (
        <label htmlFor={id} className="block font-semibold text-sm text-[#14141A] mb-1.5 pl-1 font-sans">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Styled Input Row */}
      <div
        className={`w-full flex items-center bg-white border ${
          error
            ? "border-red-500"
            : "border-[#E5E0D8] focus-within:border-[#FF6B00] focus-within:ring-4 focus-within:ring-[#FF6B00]/10"
        } rounded-xl transition-all duration-200 overflow-hidden min-h-[44px]`}
      >
        {/* Country Flag Button */}
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isDropdownOpen}
          aria-label="Select Country"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          onKeyDown={handleKeyDown}
          className="flex items-center gap-1.5 py-3.5 pl-4 pr-3 border-r border-[#E5E0D8]/60 hover:bg-[#FAF7F2] transition-colors duration-200 focus:outline-none focus:bg-[#FAF7F2]"
        >
          <span className="text-xl leading-none select-none">{selectedCountry.flag}</span>
          <span className="text-sm font-semibold text-[#14141A]">{selectedCountry.dialCode}</span>
          <CaretDown className="w-3.5 h-3.5 text-[#8A8A96]" weight="bold" />
        </button>

        {/* Real Phone input */}
        <input
          id={id}
          type="tel"
          required={required}
          value={phoneVal}
          onChange={handlePhoneChange}
          onBlur={onBlur}
          className="flex-1 bg-transparent border-none outline-none py-3.5 px-4 text-base text-[#14141A] placeholder-[#8A8A96]/60 font-sans"
          style={{ outline: "none", boxShadow: "none" }}
          placeholder="Enter phone number"
        />
      </div>

      {error && (
        <p id={`${id}-error`} className="text-red-500 text-xs mt-1.5 pl-1 font-semibold">
          {error}
        </p>
      )}

      {/* Search Dropdown */}
      {isDropdownOpen && (
        <div className="absolute left-0 mt-2 w-full min-w-[280px] bg-white border border-[#E5E0D8] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-[#E5E0D8]/60 bg-[#FAF7F2]/50">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by country, code, or +code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-white border border-[#E5E0D8] focus:border-[#FF6B00] rounded-lg py-2 px-3 text-sm text-[#14141A] placeholder-[#8A8A96] outline-none transition-all"
            />
          </div>

          <ul
            className="max-h-[220px] overflow-y-auto py-1.5"
            role="listbox"
            aria-label="Country list"
          >
            {filteredCountries.length === 0 ? (
              <li className="px-4 py-3 text-xs text-[#8A8A96] italic text-center">
                No countries found
              </li>
            ) : (
              filteredCountries.map((c, idx) => {
                const isSelected = c.code === selectedCountry.code;
                const isFocused = idx === focusedIndex;
                return (
                  <li
                    key={c.code}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectCountry(c)}
                    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors duration-150 ${
                      isFocused ? "bg-[#FAF7F2]" : ""
                    } ${isSelected ? "text-[#FF6B00] bg-[#FFF7ED]" : "text-[#14141A]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg select-none">{c.flag}</span>
                      <span className="font-semibold text-xs text-[#6B7280] w-6 block uppercase">{c.code}</span>
                      <span className="font-medium truncate max-w-[140px] md:max-w-[200px]">
                        {c.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${isSelected ? "text-[#FF6B00]" : "text-[#8A8A96]"} font-bold`}>
                        {c.dialCode}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#FF6B00]" weight="bold" />}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
