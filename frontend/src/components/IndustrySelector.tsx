"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

export interface IndustryOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface IndustrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

const INDUSTRIES: IndustryOption[] = [
  { id: "Real Estate", name: "Real Estate", description: "Property sales, rentals, site visits, and lead qualification", icon: "🏠" },
  { id: "Healthcare", name: "Healthcare", description: "Patient triage, appointment bookings, and clinical inquiry routing", icon: "🏥" },
  { id: "Legal Services", name: "Legal Services", description: "Case consultation bookings, legal intake, and document processing", icon: "⚖️" },
  { id: "Finance & Banking", name: "Finance & Banking", description: "Customer inquiry routing, account support, and financial consultation", icon: "💰" },
  { id: "Education & Coaching", name: "Education & Coaching", description: "Course enquiries, enrollment support, and demo scheduling", icon: "📚" },
  { id: "Restaurants & Hospitality", name: "Restaurants & Hospitality", description: "Reservations, menu inquiries, and booking management", icon: "🍽️" },
  { id: "Service Businesses", name: "Service Businesses", description: "Plumbing, AC repair, cleaning—lead capture and scheduling", icon: "🔧" },
  { id: "E-Commerce", name: "E-Commerce", description: "Order tracking, returns, product FAQs, and customer support", icon: "📦" }
];

export default function IndustrySelector({
  value,
  onChange,
  error,
  required = false
}: IndustrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  // Alphabetically sorted industries
  const sortedIndustries = useMemo(() => {
    return [...INDUSTRIES].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Filtered industries based on search query
  const filteredIndustries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sortedIndustries;
    return sortedIndustries.filter(
      (ind) =>
        ind.name.toLowerCase().includes(query) ||
        ind.description.toLowerCase().includes(query)
    );
  }, [sortedIndustries, searchQuery]);

  // Selected industry item details
  const selectedIndustry = useMemo(() => {
    return sortedIndustries.find((ind) => ind.id === value);
  }, [sortedIndustries, value]);

  // Sync index when search or options change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchQuery]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Small timeout to ensure element is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard events on the dropdown container/trigger
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab" && !isOpen) return;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        e.stopPropagation();
        if (!isOpen) {
          setIsOpen(true);
        } else if (focusedIndex >= 0 && focusedIndex < filteredIndustries.length) {
          onChange(filteredIndustries[focusedIndex].id);
          setIsOpen(false);
          setSearchQuery("");
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        e.stopPropagation();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) => {
            const next = prev + 1;
            return next >= filteredIndustries.length ? 0 : next;
          });
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        e.stopPropagation();
        if (isOpen) {
          setFocusedIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? filteredIndustries.length - 1 : next;
          });
        }
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        setSearchQuery("");
        containerRef.current?.querySelector("button")?.focus();
        break;
      default:
        break;
    }
  };

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && listboxRef.current) {
      const activeEl = listboxRef.current.children[focusedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex]);

  return (
    <div ref={containerRef} className="relative w-full text-left font-sans" onKeyDown={handleKeyDown}>
      {/* Label and asterisks */}
      <label 
        id="industry-label"
        className="block font-sans font-medium text-[14px] text-[#F5F0E8] mb-1.5 pl-1"
      >
        Industry Sector {required && <span className="text-[#FF6B00] ml-0.5">*</span>}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="industry-label"
        aria-describedby={error ? "industry-error" : undefined}
        className={`w-full flex items-center justify-between bg-[#100e08] border transition-all duration-200 outline-none rounded-lg min-h-[44px] py-[14px] px-[12px] ${
          isOpen
            ? "border-[#FF6B00] bg-[#130f07]"
            : "border-[#2D2560] hover:border-[#4a4275]"
        }`}
      >
        <div className="flex items-center gap-[12px] truncate w-full">
          {selectedIndustry ? (
            <>
              <span className="text-[18px] shrink-0 select-none leading-none">{selectedIndustry.icon}</span>
              <div className="flex flex-col text-left truncate">
                <span className="font-sans font-medium text-[14px] text-[#F5F0E8] leading-tight">
                  {selectedIndustry.name}
                </span>
                <span className="font-sans font-normal text-[12px] text-[#7a6e5f] leading-normal truncate max-w-full sm:max-w-none">
                  {selectedIndustry.description}
                </span>
              </div>
            </>
          ) : (
            <span className="text-[#7a6e5f] font-sans font-medium text-[14px]">
              Select your industry...
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-[18px] h-[18px] text-[#B4A8D4] transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? "rotate-180 text-[#FF6B00]" : ""
          }`}
        />
      </button>

      {/* Dropdown Floating Panel */}
      {isOpen && (
        <div
          role="listbox"
          aria-labelledby="industry-label"
          className="absolute left-0 right-0 mt-1.5 z-[100] bg-[#100e08] border border-[#2D2560] rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.4)] overflow-hidden origin-top w-full max-h-[400px] flex flex-col"
        >
          {/* Search Input */}
          <div className="p-3 border-b border-[#2D2560]/60 flex items-center gap-2 bg-[#130f07] shrink-0">
            <Search className="w-4 h-4 text-[#7a6e5f] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search industries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-[14px] font-medium text-[#F5F0E8] placeholder-[#7a6e5f] p-0"
              style={{ outline: "none", boxShadow: "none" }}
            />
          </div>

          {/* Options List */}
          <div 
            ref={listboxRef}
            className="py-1.5 overflow-y-auto scrollbar-thin grow"
          >
            {filteredIndustries.length > 0 ? (
              filteredIndustries.map((opt, index) => {
                const isSelected = opt.id === value;
                const isFocused = index === focusedIndex;
                return (
                  <div key={opt.id} className="px-1 py-0.5">
                    <button
                      id={`industry-option-${opt.id.replace(/\s+/g, "-")}`}
                      role="option"
                      aria-selected={isSelected}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(opt.id);
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className={`w-full text-left py-[12px] px-[16px] transition-all duration-150 flex items-center justify-between gap-[12px] rounded-md min-h-[44px] ${
                        isSelected
                          ? "bg-[#1A1640] border-l-2 border-l-[#FF6B00]"
                          : isFocused
                          ? "bg-[#1A1640]"
                          : "bg-transparent hover:bg-[#1A1640]/60"
                      }`}
                    >
                      <span className="flex items-center gap-[12px] truncate">
                        <span className="text-[24px] leading-none shrink-0 select-none">{opt.icon}</span>
                        <div className="flex flex-col text-left truncate">
                          <span className="font-sans font-medium text-[14px] text-[#F5F0E8] leading-tight">
                            {opt.name}
                          </span>
                          <span className="font-sans font-normal text-[12px] text-[#7a6e5f] leading-normal truncate line-clamp-2 max-w-full hidden sm:block">
                            {opt.description}
                          </span>
                        </div>
                      </span>
                      {isSelected && (
                        <Check className="w-[16px] h-[16px] text-[#10B981] shrink-0 ml-2" />
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-[13px] text-[#7a6e5f] font-medium">
                No matching industries
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p 
          id="industry-error"
          className="text-[#EF4444] text-[12px] mt-[6px] pl-1 font-semibold flex items-center gap-1.5"
        >
          <span>•</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
