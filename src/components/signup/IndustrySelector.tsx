"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  House,
  Heartbeat,
  Briefcase,
  Bank,
  GraduationCap,
  ForkKnife,
  Wrench,
  FileText,
  ShoppingCart,
  Airplane,
  Car,
  DotsThreeCircle,
  CaretDown,
  Check,
  MagnifyingGlass
} from "@phosphor-icons/react";

export interface IndustryOption {
  value: string;
  label: string;
  description: string;
}

interface IndustrySelectorProps {
  options: IndustryOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const getIndustryIcon = (value: string) => {
  switch (value) {
    case "real_estate":
      return House;
    case "healthcare":
      return Heartbeat;
    case "legal":
      return Briefcase;
    case "finance":
      return Bank;
    case "education":
      return GraduationCap;
    case "restaurants":
      return ForkKnife;
    case "home_services":
      return Wrench;
    case "professional_services":
      return FileText;
    case "ecommerce":
      return ShoppingCart;
    case "travel":
      return Airplane;
    case "automotive":
      return Car;
    default:
      return DotsThreeCircle;
  }
};

export default function IndustrySelector({
  options,
  value,
  onChange,
  placeholder = "Select your industry",
}: IndustrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  // Selected option details
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (!isOpen) {
      setSearchQuery("");
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsListRef.current) {
      const listEl = optionsListRef.current;
      const activeEl = listEl.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        const listHeight = listEl.clientHeight;
        const listScrollTop = listEl.scrollTop;
        const activeHeight = activeEl.clientHeight;
        const activeOffsetTop = activeEl.offsetTop;

        if (activeOffsetTop + activeHeight > listScrollTop + listHeight) {
          listEl.scrollTop = activeOffsetTop + activeHeight - listHeight;
        } else if (activeOffsetTop < listScrollTop) {
          listEl.scrollTop = activeOffsetTop;
        }
      }
    }
  }, [highlightedIndex]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isOpen) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        onChange(filteredOptions[highlightedIndex].value);
        setIsOpen(false);
      } else if (!isOpen) {
        setIsOpen(true);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const SelectedIcon = selectedOption ? getIndustryIcon(selectedOption.value) : null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left font-sans ${isOpen ? "z-[60]" : "z-10"}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger button (Closed state) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-[#FAF7F2] border transition-all duration-200 outline-none rounded-xl py-3 px-4 text-body-xs text-[#14141A] cursor-pointer select-none ${
          isOpen
            ? "border-[#FF6B00] ring-4 ring-[#FF6B00]/10 shadow-[0_4px_12px_rgba(255,107,0,0.06)]"
            : "border-[#E5E0D8] hover:border-[#FF6B00]/65"
        }`}
      >
        <div className="flex items-center gap-3">
          {SelectedIcon && (
            <SelectedIcon className="w-4 h-4 text-[#8A8A96] shrink-0" weight="regular" />
          )}
          <span className="font-semibold text-body-xs text-[#14141A] truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <CaretDown
          className={`w-4 h-4 text-[#8A8A96] transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-[#14141A]" : ""
          }`}
        />
      </button>

      {/* Floating Dropdown (Open state) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 mt-1 z-50 bg-white border border-[#E5E0D8] shadow-[0_12px_32px_rgba(0,0,0,0.08)] overflow-hidden origin-top rounded-xl"
          >
            {/* Search Input bar */}
            <div className="p-3 border-b border-[#EBE6DD]/60 flex items-center gap-2 bg-[#FAF9F6]">
              <MagnifyingGlass className="w-4 h-4 text-[#8A8A96] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search industries..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-body-xs font-semibold text-[#14141A] placeholder-[#8A8A96] p-0"
                style={{ outline: "none", boxShadow: "none" }}
              />
            </div>

            {/* Options List */}
            <div
              ref={optionsListRef}
              className="py-1.5 max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-track-transparent"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = idx === highlightedIndex;
                  const OptionIcon = getIndustryIcon(opt.value);

                  return (
                    <div key={opt.value} className="px-2 py-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          onChange(opt.value);
                          setIsOpen(false);
                        }}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-3 rounded-[8px] border focus:outline-none focus-visible:outline-none focus-visible:ring-0 transition-all duration-150 ${
                          isSelected
                            ? "bg-[#FF6B00]/5 border-[#FF6B00]/25 font-bold"
                            : isHighlighted
                            ? "bg-[#FAF7F2] border-transparent"
                            : "bg-transparent border-transparent"
                        }`}
                        style={{ outline: "none", boxShadow: "none" }}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <OptionIcon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? "text-[#FF6B00]" : "text-[#8A8A96]"}`} weight="regular" />
                          <div className="flex flex-col text-left min-w-0">
                            <span
                              className={`text-body-xs truncate ${
                                isSelected ? "text-[#FF6B00]" : "text-[#14141A]"
                              }`}
                            >
                              {opt.label}
                            </span>
                            <span className="text-[10px] text-[#8A8A96] font-medium leading-normal mt-0.5 truncate">
                              {opt.description}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#FF6B00] shrink-0" weight="bold" />
                        )}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-6 text-center text-body-xs text-[#8A8A96] font-medium font-mono">
                  No matching sectors
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
