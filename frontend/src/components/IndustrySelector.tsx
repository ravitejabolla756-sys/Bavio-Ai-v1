"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search, Check, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface IndustryItem {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface IndustryCategory {
  category: string;
  items: IndustryItem[];
}

export interface IndustrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

const CATEGORIES: IndustryCategory[] = [
  {
    category: "Popular Industries",
    items: [
      { id: "Real Estate", name: "Real Estate", description: "Property sales, rentals & builders", icon: "🏠" },
      { id: "Healthcare", name: "Healthcare", description: "Clinics, hospitals, diagnostics & wellness", icon: "🏥" },
      { id: "Education & Coaching", name: "Education", description: "Schools, coaching institutes & online learning", icon: "🎓" },
      { id: "E-Commerce", name: "E-Commerce", description: "Online stores, D2C brands & marketplaces", icon: "🛍️" },
      { id: "Restaurants & Cafes", name: "Restaurants", description: "Dining, cafes, cloud kitchens & bakeries", icon: "🍽️" },
      { id: "Financial Services", name: "Financial Services", description: "Banking, wealth management & advisory", icon: "💰" }
    ]
  },
  {
    category: "Professional Services",
    items: [
      { id: "Law Firm", name: "Law Firm", description: "Legal counsel, consultations & case intake", icon: "⚖️" },
      { id: "Accounting", name: "Accounting", description: "Tax prep, bookkeeping & financial audits", icon: "📊" },
      { id: "Consulting", name: "Consulting", description: "Business strategy, operations & advisory", icon: "💼" },
      { id: "Insurance", name: "Insurance", description: "Policy quotes, claims & agent support", icon: "🛡️" },
      { id: "Recruitment", name: "Recruitment", description: "Talent acquisition & staffing services", icon: "🤝" },
      { id: "Marketing Agency", name: "Marketing Agency", description: "Advertising, branding & digital marketing", icon: "📢" }
    ]
  },
  {
    category: "Home & Local Services",
    items: [
      { id: "Plumbing", name: "Plumbing", description: "Pipe repairs, installations & emergencies", icon: "🔧" },
      { id: "Electrician", name: "Electrician", description: "Wiring, panels, lighting & electrical work", icon: "⚡" },
      { id: "Cleaning Services", name: "Cleaning Services", description: "Residential, commercial & deep cleaning", icon: "🧹" },
      { id: "Pest Control", name: "Pest Control", description: "Extermination & prevention services", icon: "🐜" },
      { id: "Home Repairs", name: "Home Repairs", description: "Handyman, carpentry & maintenance", icon: "🛠️" },
      { id: "Interior Design", name: "Interior Design", description: "Space planning, styling & renovations", icon: "🖼️" }
    ]
  },
  {
    category: "Beauty & Wellness",
    items: [
      { id: "Salon", name: "Salon", description: "Hair styling, makeup & beauty treatments", icon: "✂️" },
      { id: "Spa", name: "Spa", description: "Massages, facials & relaxation therapies", icon: "💆" },
      { id: "Gym & Fitness", name: "Gym & Fitness", description: "Personal training & fitness memberships", icon: "🏋️" },
      { id: "Yoga Studio", name: "Yoga Studio", description: "Group classes, meditation & wellness", icon: "🧘" },
      { id: "Skincare Clinic", name: "Skincare Clinic", description: "Dermatology & advanced skin treatments", icon: "✨" }
    ]
  },
  {
    category: "Automotive",
    items: [
      { id: "Car Dealership", name: "Car Dealership", description: "New & pre-owned vehicle sales", icon: "🚗" },
      { id: "Car Service", name: "Car Service", description: "Auto repair, diagnostics & maintenance", icon: "🛠️" },
      { id: "Bike Service", name: "Bike Service", description: "Two-wheeler repairs & tune-ups", icon: "🏍️" },
      { id: "EV Charging", name: "EV Charging", description: "Electric vehicle charging stations", icon: "🔌" }
    ]
  },
  {
    category: "Hospitality & Travel",
    items: [
      { id: "Hotel", name: "Hotel", description: "Lodging, reservations & guest stays", icon: "🏨" },
      { id: "Travel Agency", name: "Travel Agency", description: "Tour booking, flights & trip planning", icon: "✈️" },
      { id: "Tour Operator", name: "Tour Operator", description: "Guided tours & travel excursions", icon: "🗺️" }
    ]
  },
  {
    category: "Technology",
    items: [
      { id: "SaaS", name: "SaaS", description: "Software-as-a-service subscriptions", icon: "💻" },
      { id: "IT Services", name: "IT Services", description: "Tech support, networking & integrations", icon: "🖥️" },
      { id: "Software Development", name: "Software Development", description: "Custom web & mobile app creation", icon: "⌨️" },
      { id: "Cybersecurity", name: "Cybersecurity", description: "Threat monitoring & network security", icon: "🔒" },
      { id: "AI Startup", name: "AI Startup", description: "Artificial intelligence products & research", icon: "🤖" }
    ]
  },
  {
    category: "Manufacturing",
    items: [
      { id: "Factory", name: "Factory", description: "Industrial production & assembly lines", icon: "🏭" },
      { id: "Textile", name: "Textile", description: "Fabric production, apparel & weaving", icon: "🧵" },
      { id: "Electronics", name: "Electronics", description: "Device manufacturing & component assembly", icon: "🔌" },
      { id: "Food Production", name: "Food Production", description: "Processing, packaging & distribution", icon: "🌾" }
    ]
  },
  {
    category: "Retail",
    items: [
      { id: "Clothing Store", name: "Clothing Store", description: "Fashion, apparel & retail shopping", icon: "👕" },
      { id: "Jewellery", name: "Jewellery", description: "Fine ornaments, gold & precious gems", icon: "💎" },
      { id: "Grocery", name: "Grocery", description: "Fresh produce, daily essentials & food", icon: "🛒" },
      { id: "Pharmacy", name: "Pharmacy", description: "Medicines, healthcare & prescriptions", icon: "💊" },
      { id: "Furniture", name: "Furniture", description: "Home furnishings & interior decor", icon: "🛋️" }
    ]
  },
  {
    category: "Others",
    items: [
      { id: "Non-Profit", name: "Non-Profit", description: "Charities, foundations & community work", icon: "🎗️" },
      { id: "Government", name: "Government", description: "Public services & administration", icon: "🏛️" },
      { id: "Freelancer", name: "Freelancer", description: "Independent contractors & solo work", icon: "🧑‍💻" },
      { id: "Startup", name: "Startup", description: "Early stage ventures & fast growth", icon: "🚀" }
    ]
  }
];

export default function IndustrySelector({
  value,
  onChange,
  error,
  required = false
}: IndustrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Flattened items for easy keyboard indexing
  const allItems = useMemo(() => {
    const list: IndustryItem[] = [];
    CATEGORIES.forEach(cat => {
      cat.items.forEach(item => {
        list.push(item);
      });
    });
    return list;
  }, []);

  // Filtered categories based on search input
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return CATEGORIES;

    return CATEGORIES.map(cat => ({
      category: cat.category,
      items: cat.items.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      )
    })).filter(cat => cat.items.length > 0);
  }, [searchQuery]);

  // Flattened filtered items for keyboard index mapping
  const filteredFlatList = useMemo(() => {
    const list: IndustryItem[] = [];
    filteredCategories.forEach(cat => {
      cat.items.forEach(item => {
        list.push(item);
      });
    });
    return list;
  }, [filteredCategories]);

  // Find selected item metadata
  const selectedItem = useMemo(() => {
    if (value === "other") {
      return { id: "other", name: "Other", description: "Describe your business later during AI assistant setup.", icon: "⭐" };
    }
    return allItems.find(item => item.id === value);
  }, [allItems, value]);

  // Auto-focus search field on open
  useEffect(() => {
    if (isOpen) {
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
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation logic
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        e.stopPropagation();
        setHighlightedIndex(prev => {
          // + 1 for "Other" row at the bottom
          const maxIndex = filteredFlatList.length; 
          const next = prev + 1;
          return next > maxIndex ? 0 : next;
        });
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        e.stopPropagation();
        setHighlightedIndex(prev => {
          const maxIndex = filteredFlatList.length;
          const next = prev - 1;
          return next < 0 ? maxIndex : next;
        });
        break;
      }
      case "Enter": {
        e.preventDefault();
        e.stopPropagation();
        if (highlightedIndex === filteredFlatList.length) {
          // Other row selected
          onChange("other");
          setIsOpen(false);
          setSearchQuery("");
        } else if (highlightedIndex >= 0 && highlightedIndex < filteredFlatList.length) {
          onChange(filteredFlatList[highlightedIndex].id);
          setIsOpen(false);
          setSearchQuery("");
        }
        break;
      }
      case "Escape": {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        containerRef.current?.querySelector("button")?.focus();
        break;
      }
      case "Tab": {
        // Close and clean up on Tab
        setIsOpen(false);
        break;
      }
      default:
        break;
    }
  };

  // Scroll active element into view
  useEffect(() => {
    if (highlightedIndex >= 0 && scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      ) as HTMLElement;
      if (activeEl) {
        // Adjust for sticky header
        const container = scrollContainerRef.current;
        const relativeTop = activeEl.offsetTop - container.offsetTop;
        const isAbove = relativeTop < container.scrollTop + 48; // sticky search input height offset
        const isBelow = relativeTop + activeEl.offsetHeight > container.scrollTop + container.clientHeight;
        
        if (isAbove) {
          container.scrollTop = relativeTop - 48;
        } else if (isBelow) {
          container.scrollTop = relativeTop + activeEl.offsetHeight - container.clientHeight;
        }
      }
    }
  }, [highlightedIndex]);

  // Lock body page scrolling when command menu is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Reset highlighted index when filtering results
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  // Build index lookup map for flat list navigation
  let flatIndexCounter = 0;

  return (
    <div ref={containerRef} className="relative w-full text-left font-sans" onKeyDown={handleKeyDown}>
      {/* Label */}
      <label 
        id="industry-label"
        className="block font-sans font-medium text-[14px] text-[#14141A] mb-1.5 pl-1"
      >
        Industry Sector {required && <span className="text-[#FF6B00] ml-0.5">*</span>}
      </label>

      {/* Trigger Field */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="industry-label"
        aria-describedby={error ? "industry-error" : undefined}
        className={`w-full flex items-center justify-between bg-[#FAF7F2] border transition-all duration-200 outline-none rounded-[20px] py-[12px] px-[16px] min-h-[46px] ${
          isOpen
            ? "border-[#FF6B00] ring-4 ring-[#FF6B00]/10 bg-white"
            : "border-[#E5E0D8] hover:border-[#FF6B00]"
        }`}
      >
        <div className="flex items-center gap-[12px] truncate w-full">
          {selectedItem ? (
            <>
              <div className="w-8 h-8 rounded-lg bg-[#F5EFE6] border border-[#EBE3D5] flex items-center justify-center shrink-0 text-lg select-none">
                {selectedItem.icon}
              </div>
              <div className="flex flex-col text-left truncate">
                <span className="font-sans font-medium text-[14px] text-[#14141A] leading-tight">
                  {selectedItem.name}
                </span>
                <span className="font-sans font-normal text-[12px] text-[#7a6e5f] leading-normal truncate line-clamp-1">
                  {selectedItem.description}
                </span>
              </div>
            </>
          ) : (
            <span className="text-[#7a6e5f] font-sans font-medium text-[14px]">
              Search your industry...
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-[18px] h-[18px] text-[#8A8A96] transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? "rotate-180 text-[#FF6B00]" : ""
          }`}
        />
      </button>

      {/* Dropdown Floating Command Palette */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 right-0 mt-2 z-[100] bg-[#FAF8F5] border border-[#E8DDD1] rounded-[20px] shadow-[0_12px_32px_rgba(20,10,2,0.06)] overflow-hidden origin-top w-full max-h-[340px] flex flex-col"
          >
            {/* Sticky Search Field */}
            <div className="p-3 border-b border-[#E8DDD1] flex items-center gap-2.5 bg-[#FAF8F5] shrink-0 sticky top-0 z-20">
              <Search className="w-4 h-4 text-[#7a6e5f] shrink-0 ml-1" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search your industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-[14px] font-medium text-[#14141A] placeholder-[#7a6e5f] p-0"
                style={{ outline: "none", boxShadow: "none" }}
              />
            </div>

            {/* Scrolling Options Container */}
            <div 
              ref={scrollContainerRef}
              className="overflow-y-auto scrollbar-thin grow flex flex-col"
            >
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => (
                  <div key={cat.category} className="flex flex-col">
                    {/* Category Header */}
                    <div className="px-4 py-2 font-sans font-bold text-[10px] text-[#8A8A96] uppercase tracking-wider bg-[#FAF8F5]/90 backdrop-blur-sm sticky top-[48px] z-10 border-b border-[#E8DDD1]/40 select-none">
                      {cat.category}
                    </div>

                    {/* Category Items */}
                    <div className="p-1.5 space-y-0.5">
                      {cat.items.map((opt) => {
                        const index = flatIndexCounter++;
                        const isSelected = opt.id === value;
                        const isHighlighted = index === highlightedIndex;

                        return (
                          <button
                            key={opt.id}
                            data-index={index}
                            role="option"
                            aria-selected={isSelected}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onChange(opt.id);
                              setIsOpen(false);
                              setSearchQuery("");
                            }}
                            className={`w-full text-left p-2.5 transition-all duration-150 flex items-center justify-between gap-[12px] rounded-xl min-h-[46px] outline-none ${
                              isSelected
                                ? "bg-[#FF6B00]/5 border-l-2 border-l-[#FF6B00]"
                                : isHighlighted
                                ? "bg-[#FAF7F2]"
                                : "bg-transparent hover:bg-[#FAF7F2]"
                            }`}
                          >
                            <span className="flex items-center gap-[12px] truncate w-full">
                              <div className="w-9 h-9 rounded-lg bg-[#FAF5EE] border border-[#EBE3D5] flex items-center justify-center shrink-0 text-lg select-none">
                                {opt.icon}
                              </div>
                              <div className="flex flex-col text-left truncate">
                                <span className="font-sans font-medium text-[14px] text-[#14141A] leading-tight">
                                  {opt.name}
                                </span>
                                <span className="font-sans font-normal text-[12px] text-[#7a6e5f] leading-normal truncate line-clamp-1 sm:line-clamp-2">
                                  {opt.description}
                                </span>
                              </div>
                            </span>
                            
                            <div className="flex items-center shrink-0 gap-1 ml-2">
                              {isSelected ? (
                                <motion.div
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  <Check className="w-[16px] h-[16px] text-[#10B981]" />
                                </motion.div>
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-[#8A8A96]/60" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-[13px] text-[#7a6e5f] font-medium select-none">
                  No matching industries found
                </div>
              )}

              {/* Bottom "Other" Row */}
              <div className="mt-auto border-t border-[#E8DDD1] bg-[#FAF8F5] shrink-0 sticky bottom-0 z-10">
                <div className="px-4 py-2 font-sans font-bold text-[10px] text-[#8A8A96] uppercase tracking-wider select-none">
                  Can&apos;t find your industry?
                </div>
                <div className="p-1.5 pt-0">
                  <button
                    data-index={filteredFlatList.length}
                    role="option"
                    aria-selected={value === "other"}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange("other");
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full text-left p-2.5 transition-all duration-150 flex items-center justify-between gap-[12px] rounded-xl min-h-[46px] outline-none ${
                      value === "other"
                        ? "bg-[#FF6B00]/5 border-l-2 border-l-[#FF6B00]"
                        : highlightedIndex === filteredFlatList.length
                        ? "bg-[#FAF7F2]"
                        : "bg-transparent hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <span className="flex items-center gap-[12px] truncate w-full">
                      <div className="w-9 h-9 rounded-lg bg-[#FAF5EE] border border-[#EBE3D5] flex items-center justify-center shrink-0 text-lg select-none">
                        ⭐
                      </div>
                      <div className="flex flex-col text-left truncate">
                        <span className="font-sans font-medium text-[14px] text-[#14141A] leading-tight">
                          Other
                        </span>
                        <span className="font-sans font-normal text-[12px] text-[#7a6e5f] leading-normal truncate line-clamp-1">
                          Describe your business later during AI assistant setup.
                        </span>
                      </div>
                    </span>
                    <div className="flex items-center shrink-0 gap-1 ml-2">
                      {value === "other" ? (
                        <Check className="w-[16px] h-[16px] text-[#10B981]" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-[#8A8A96]/60" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Block */}
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
