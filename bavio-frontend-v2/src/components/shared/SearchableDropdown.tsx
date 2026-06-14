"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaretDown, Check, MagnifyingGlass } from "@phosphor-icons/react";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: string; // Emoji or icon name
  description?: string; // Rich description for industry/voices
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  footer?: React.ReactNode;
  renderTrigger?: (selected: DropdownOption | undefined) => React.ReactNode;
}

export function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  disabled = false,
  className = "",
  footer,
  renderTrigger,
}: SearchableDropdownProps) {
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
      (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

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

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left font-sans ${isOpen ? "z-[60]" : "z-10"} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-[#FAF7F2] border transition-all duration-200 outline-none rounded-xl py-3 px-4 text-body-xs text-[#14141A] select-none ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
        } ${
          isOpen
            ? "border-[#FF6B00] ring-4 ring-[#FF6B00]/10 shadow-[0_4px_12px_rgba(255,107,0,0.08)]"
            : "border-[#E5E0D8] hover:border-[#FF6B00]/65"
        }`}
      >
        {renderTrigger ? (
          renderTrigger(selectedOption)
        ) : (
          <div className="flex items-center gap-3">
            {selectedOption?.icon && (
              <span className="text-base leading-none shrink-0">{selectedOption.icon}</span>
            )}
            <span className="font-semibold text-body-xs truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
        )}
        <CaretDown
          className={`w-4 h-4 text-[#8A8A96] transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-[#14141A]" : ""
          }`}
        />
      </button>

      {/* Dropdown Floating Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ borderRadius: "16px" }}
            className="absolute left-0 right-0 mt-1 z-50 bg-white border border-[#FF6B00] shadow-[0_12px_32px_rgba(0,0,0,0.12)] overflow-hidden origin-top"
          >
            {/* Search Input (only shown if options count exceeds 5) */}
            {options.length > 5 && (
              <div className="p-3 border-b border-[#EBE6DD]/60 flex items-center gap-2 bg-[#FAF9F6]">
                <MagnifyingGlass className="w-4 h-4 text-[#8A8A96] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(-1);
                  }}
                  className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-body-xs font-semibold text-[#14141A] placeholder-[#8A8A96] p-0"
                  style={{ outline: "none", boxShadow: "none" }}
                />
              </div>
            )}

            {/* Options List */}
            <div
              ref={optionsListRef}
              className="py-1.5 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-track-transparent"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div key={opt.value} className="px-2 py-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          onChange(opt.value);
                          setIsOpen(false);
                        }}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`w-full text-left px-3.5 py-2.5 transition-all duration-150 flex items-center justify-between gap-3 rounded-[12px] border focus:outline-none focus-visible:outline-none focus-visible:ring-0 ${
                          isSelected
                            ? "bg-[#FF6B00]/8 border-[#FF6B00] font-bold"
                            : isHighlighted
                            ? "bg-[#FAF7F2] border-[#E5E0D8]/45"
                            : "bg-transparent border-transparent"
                        }`}
                        style={{ outline: "none", boxShadow: "none" }}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {opt.icon && (
                            <span className="text-base leading-none shrink-0 mt-0.5">{opt.icon}</span>
                          )}
                          <div className="flex flex-col text-left min-w-0">
                            <span
                              className={`text-body-xs truncate ${
                                isSelected ? "text-[#FF6B00]" : "text-[#14141A]"
                              }`}
                            >
                              {opt.label}
                            </span>
                            {opt.description && (
                              <span className="text-[10px] text-[#8A8A96] font-medium leading-normal mt-0.5 break-words">
                                {opt.description}
                              </span>
                            )}
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
                  No matching options
                </div>
              )}
            </div>
            {footer && (
              <div 
                className="border-t border-[#E5E0D8]"
                onClick={() => setIsOpen(false)}
              >
                {footer}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
