"use client";

import React from "react";
import { useCountry } from "../shared/CountryContext";
import { PRICING_BY_COUNTRY } from "@/config/pricing";

// ─── Plan feature lists per tier (same across all regions) ───────────────────

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    "200 included minutes",
    "Basic call routing",
    "AI Receptionist role",
    "Email lead notifications",
    "Dashboard lead storage",
  ],
  growth: [
    "500 included minutes",
    "Multi-tenant routing",
    "Email lead notifications",
    "SMS lead notifications",
    "WhatsApp lead notifications",
  ],
  scale: [
    "1,500 included minutes",
    "Everything in Growth",
    "Custom notification channels",
    "Premium low-latency voices",
    "Priority SLA helpdesk",
  ],
};

const PLAN_DESCRIPTIONS: Record<string, string> = {
  starter: "Perfect for micro businesses starting with voice AI receptionist.",
  growth: "Most popular plan for expanding customer care outreach.",
  scale: "For high-volume operations requiring custom notifications & SLA.",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface PricingSelectorProps {
  selectedPlan: string;
  onSelectPlan: (planName: string, billingCycle: "monthly" | "annual", price: number) => void;
  billingCycle: "monthly" | "annual";
  setBillingCycle: (cycle: "monthly" | "annual") => void;
}

export function PricingSelector({
  selectedPlan,
  onSelectPlan,
  billingCycle,
  setBillingCycle,
}: PricingSelectorProps) {
  const { country, loading } = useCountry();

  const resolvedCountry = country && PRICING_BY_COUNTRY[country] ? country : "US";
  const pricing = PRICING_BY_COUNTRY[resolvedCountry] || PRICING_BY_COUNTRY.DEFAULT;

  // Plan Comparison Table States & Refs
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [activeMobileIndex, setActiveMobileIndex] = React.useState<number>(0);
  const [hasTrackedExpand, setHasTrackedExpand] = React.useState(false);
  const carouselRef = React.useRef<HTMLDivElement>(null);

  // Retrieve values from live pricing config
  const growthOverage = (pricing as any).growthOverageRate || "";
  const scaleOverage = (pricing as any).scaleOverageRate || "";
  const starterTranscripts = (pricing as any).starterTranscripts || "";
  const growthTranscripts = (pricing as any).growthTranscripts || "";
  const scaleTranscripts = (pricing as any).scaleTranscripts || "";

  // Log console warnings for unconfigured values in dev mode only
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      if (!(pricing as any).growthOverageRate) {
        console.warn("[CONFIRM] Overage rate per minute for Growth is not defined in the pricing config.");
      }
      if (!(pricing as any).scaleOverageRate) {
        console.warn("[CONFIRM] Overage rate per minute for Scale is not defined in the pricing config.");
      }
      if (!(pricing as any).starterTranscripts) {
        console.warn("[CONFIRM] Call transcripts for Starter is not defined in the pricing config.");
      }
      if (!(pricing as any).growthTranscripts) {
        console.warn("[CONFIRM] Call transcripts for Growth is not defined in the pricing config.");
      }
      if (!(pricing as any).scaleTranscripts) {
        console.warn("[CONFIRM] Call transcripts for Scale is not defined in the pricing config.");
      }
    }
  }, [pricing]);

  // Sync scroll position when expanded or when selected plan changes
  React.useEffect(() => {
    if (isExpanded) {
      const idx = selectedPlan === "starter" ? 0 : selectedPlan === "growth" ? 1 : 2;
      setActiveMobileIndex(idx);
      // Wait a frame for DOM rendering before scrolling
      const timer = setTimeout(() => {
        scrollToPlan(idx);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, selectedPlan]);

  // Expand / collapse with analytics tracking
  const handleExpandCollapse = () => {
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);
    if (nextExpanded) {
      if (!hasTrackedExpand) {
        console.log("[Analytics] comparison_table_expanded");
        setHasTrackedExpand(true);
      }
    } else {
      console.log("[Analytics] comparison_table_collapsed");
    }
  };

  // Mobile carousel scroll tracker
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const index = Math.round(container.scrollLeft / container.clientWidth);
    if (index >= 0 && index <= 2 && index !== activeMobileIndex) {
      setActiveMobileIndex(index);
      const planNames = ["starter", "growth", "scale"] as const;
      console.log("[Analytics] comparison_table_mobile_swipe", { to_plan: planNames[index] });
    }
  };

  // Scroll mobile snap carousel to a specific index
  const scrollToPlan = (idx: number) => {
    if (carouselRef.current) {
      const width = carouselRef.current.clientWidth;
      carouselRef.current.scrollTo({
        left: idx * width,
        behavior: "smooth"
      });
    }
  };

  const getPrice = (basePrice: number) => {
    if (billingCycle === "annual") {
      return Math.round(basePrice * 12 * 0.8);
    }
    return basePrice;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#FF6B00]/25 border-t-[#FF6B00] rounded-full animate-spin mb-4" />
        <p className="text-body-sm text-[#8A8A96] font-medium animate-pulse">
          Calculating localized plan rates...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Currency indicator */}
      <div className="mb-2 px-3 py-1 bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl text-[10px] font-semibold text-[#8A8A96] inline-flex items-center gap-1.5">
        <span className="w-1.2 h-1.2 rounded-full bg-green-500 inline-block" />
        Prices shown in{" "}
        <span className="font-black text-[#14141A]">{pricing.currencyCode}</span>
        {" "}for {resolvedCountry}
      </div>

      {/* Billing Switcher */}
      <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl p-0.5 mb-6 shadow-sm">
        <button
          type="button"
          onClick={() => setBillingCycle("monthly")}
          className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
            billingCycle === "monthly"
              ? "bg-[#14141A] text-white shadow-sm"
              : "text-[#8A8A96] hover:text-[#14141A]"
          }`}
        >
          Monthly Billing
        </button>
        <button
          type="button"
          onClick={() => setBillingCycle("annual")}
          className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 inline-flex items-center gap-1.5 ${
            billingCycle === "annual"
              ? "bg-[#14141A] text-white shadow-sm"
              : "text-[#8A8A96] hover:text-[#14141A]"
          }`}
        >
          Annual Billing
          <span className="text-[8px] font-black uppercase tracking-widest bg-[#FF6B00]/15 text-[#FF6B00] py-0.5 px-1.5 rounded-md">
            Save 20%
          </span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl items-stretch">
        {(["starter", "growth", "scale"] as const).map((planName) => {
          const isSelected = selectedPlan === planName;
          const isGrowth = planName === "growth";
          const basePrice = pricing[planName];
          const finalPrice = getPrice(basePrice);
          const features = PLAN_FEATURES[planName];

          return (
            <div
              key={planName}
              onClick={() => onSelectPlan(planName, billingCycle, finalPrice)}
              className={`relative rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden bg-white cursor-pointer ${
                isSelected
                  ? "border-[#FF6B00] ring-4 ring-[#FF6B00]/10 shadow-[0_12px_32px_rgba(255,107,0,0.08)] scale-[1.02]"
                  : "border-[#EBE6DD] shadow-sm hover:border-[#FF6B00]/50 hover:shadow-md hover:scale-[1.01]"
              }`}
            >
              {/* Top Status Badges */}
              {isSelected ? (
                <div className="absolute top-3 right-3 bg-[#FF6B00] text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-sm">
                  Selected
                </div>
              ) : isGrowth && pricing.mostPopularBadge ? (
                <div className="absolute top-3 right-3 bg-[#14141A] text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-sm">
                  Popular
                </div>
              ) : null}

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-heading-xs font-bold text-[#14141A] capitalize mb-0.5 mt-1">
                    {planName}
                  </h3>
                  <p className="text-[11px] text-[#8A8A96] mb-3 min-h-[32px] leading-relaxed">
                    {PLAN_DESCRIPTIONS[planName]}
                  </p>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-heading-lg font-bold text-[#14141A]">
                      {pricing.currency}
                      {formatPrice(finalPrice)}
                    </span>
                    <span className="text-[11px] text-[#8A8A96]">
                      {billingCycle === "annual" ? "/year" : "/month"}
                    </span>
                  </div>

                  <ul className="flex flex-col gap-2 mb-4">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px] text-[#4A4A57]">
                        <svg
                          className="w-3.5 h-3.5 text-[#FF6B00] shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    className={`w-full h-10 rounded-xl text-body-xs font-bold transition-all duration-300 inline-flex items-center justify-center gap-1.5 border ${
                      isSelected
                        ? "bg-[#FF6B00] border-[#FF6B00] text-white shadow-[0_4px_12px_rgba(255,107,0,0.15)]"
                        : "bg-white border-[#EBE6DD] hover:border-[#14141A] text-[#14141A] hover:bg-[#FAF9F6]"
                    }`}
                  >
                    {isSelected ? "Selected" : `Choose ${planName}`}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Plan Comparison Table Section ─── */}
      <div className="w-full mt-10 border-t border-[#E5E0D8] pt-8 relative z-20">
        {/* Screen Reader Announcement */}
        <div className="sr-only" aria-live="polite">
          {selectedPlan ? `${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan selected` : ""}
        </div>

        {/* Expand / Collapse Trigger */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleExpandCollapse}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#8A8A96] hover:text-[#FF6B00] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:ring-offset-2 rounded px-3 py-2 cursor-pointer"
          >
            <span>Compare all plans in detail</span>
            <svg
              className={`w-4 h-4 transition-transform duration-250 ease-out ${
                isExpanded ? "rotate-180 text-[#FF6B00]" : "text-[#8A8A96]"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Collapsible Container */}
        <div
          className={`transition-all duration-250 ease-out overflow-hidden ${
            isExpanded ? "max-h-[3500px] opacity-100 mt-6" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          {/* Section Heading & Subtext */}
          <div className="text-center md:text-left mb-6">
            <h2 className="font-display text-xl font-bold text-[#140A02] mb-1">
              Compare plans in detail
            </h2>
            <p className="text-xs text-[#5A5A66]">
              Every feature, side by side.
            </p>
          </div>

          {loading ? (
            /* Skeleton Loader */
            <div className="space-y-3 p-4 border border-[#E5E0D8] rounded-2xl bg-white">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200/50 rounded w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* Desktop / Tablet View (>= 768px) */}
              <div className="hidden md:block w-full overflow-x-auto border border-[#E5E0D8] rounded-2xl bg-white shadow-sm">
                <table className="w-full border-collapse text-left text-xs text-[#4A4A57]">
                  <thead>
                    <tr className="sticky top-0 bg-white z-10 border-b border-[#E5E0D8]">
                      <th
                        scope="col"
                        className="p-4 font-bold text-[#140A02] min-w-[200px] bg-white sticky left-0 z-20 shadow-[4px_0_8px_-4px_rgba(20,10,2,0.08)] border-r border-[#E5E0D8]"
                      >
                        Features
                      </th>
                      {planKeys.map((planKey) => {
                        const isColSelected = selectedPlan === planKey;
                        const basePrice = pricing[planKey];
                        const finalPrice = getPrice(basePrice);

                        return (
                          <th
                            key={planKey}
                            scope="col"
                            className={`p-5 min-w-[160px] text-center border-b border-[#E5E0D8] transition-colors duration-200 ${
                              isColSelected
                                ? "border-t-2 border-t-[#FF6B00] bg-[#FFF8F0]/30"
                                : "border-t border-t-[#E5E0D8] bg-white"
                            }`}
                          >
                            <div className="font-display text-sm font-bold text-[#140A02] capitalize mb-1">
                              {planKey}
                            </div>
                            <div className="text-sm font-black text-[#140A02] mb-4">
                              {pricing.currency}
                              {formatPrice(finalPrice)}
                              <span className="text-[10px] font-normal text-[#8A8A96] block mt-0.5">
                                {billingCycle === "annual" ? "/year" : "/month"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                onSelectPlan(planKey, billingCycle, finalPrice);
                                console.log("[Analytics] comparison_table_plan_selected", {
                                  plan: planKey,
                                  source: "comparison_table",
                                });
                              }}
                              className={`w-full h-8 px-3 rounded-lg text-[10px] font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:ring-offset-1 cursor-pointer ${
                                isColSelected
                                  ? "bg-[#FF6B00] text-white border border-[#FF6B00]"
                                  : "bg-white border border-[#EBE6DD] hover:border-[#14141A] text-[#14141A] hover:bg-[#FAF9F6]"
                              }`}
                            >
                              {isColSelected ? "Selected" : `Choose ${planKey}`}
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {COMPARISON_CATEGORIES.map((category) => (
                      <React.Fragment key={category.name}>
                        <tr className="bg-[#FAF9F6] border-b border-[#E5E0D8]">
                          <th
                            scope="colgroup"
                            colSpan={4}
                            className="p-3 font-display font-black text-[#140A02] uppercase tracking-wider text-[10px] text-left sticky left-0 z-20 bg-[#FAF9F6]"
                          >
                            {category.name}
                          </th>
                        </tr>

                        {category.rows.map((row) => (
                          <tr
                            key={row.feature}
                            className="border-b border-[#E5E0D8]/60 hover:bg-[#FAF9F6]/40 transition-colors duration-150"
                          >
                            <th
                              scope="row"
                              className="p-4 font-semibold text-[#140A02] text-left bg-white sticky left-0 z-20 shadow-[4px_0_8px_-4px_rgba(20,10,2,0.08)] border-r border-[#E5E0D8]"
                            >
                              {row.feature}
                            </th>
                            {planKeys.map((planKey) => {
                              const isColSelected = selectedPlan === planKey;
                              let displayValue: React.ReactNode = "";
                              const rawValue = (row as any)[planKey];

                              if (rawValue === "overageRate") {
                                displayValue = pricing.overageRate;
                              } else if (rawValue === "confirmOverage") {
                                const val = planKey === "growth" ? growthOverage : scaleOverage;
                                displayValue = val ? `${pricing.currency}${val}/min` : "";
                              } else if (rawValue === "confirmTranscripts") {
                                const val =
                                  planKey === "starter"
                                    ? starterTranscripts
                                    : planKey === "growth"
                                    ? growthTranscripts
                                    : scaleTranscripts;
                                displayValue = val || "";
                              } else if (typeof rawValue === "boolean") {
                                displayValue = rawValue ? (
                                  <svg
                                    className="w-4 h-4 text-[#FF6B00] mx-auto"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="3.5"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <span className="text-[#8A8A96] font-medium block text-center">—</span>
                                );
                              } else {
                                displayValue = <span className="block text-center">{rawValue}</span>;
                              }

                              return (
                                <td
                                  key={planKey}
                                  className={`p-4 text-center transition-colors duration-200 ${
                                    isColSelected ? "bg-[#FFF8F0]/30" : ""
                                  }`}
                                >
                                  <span className="font-semibold text-xs text-[#4A4A57]">{displayValue}</span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Carousel View (< 768px) */}
              <div className="block md:hidden w-full relative">
                {/* Left Swipe/Scroll Arrow */}
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = Math.max(0, activeMobileIndex - 1);
                    scrollToPlan(nextIdx);
                  }}
                  disabled={activeMobileIndex === 0}
                  className="absolute left-1 top-16 w-8 h-8 rounded-full bg-white border border-[#E5E0D8] shadow-sm flex items-center justify-center text-[#140A02] hover:text-[#FF6B00] disabled:opacity-40 disabled:pointer-events-none z-10 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  aria-label="Previous Plan"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Right Swipe/Scroll Arrow */}
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = Math.min(2, activeMobileIndex + 1);
                    scrollToPlan(nextIdx);
                  }}
                  disabled={activeMobileIndex === 2}
                  className="absolute right-1 top-16 w-8 h-8 rounded-full bg-white border border-[#E5E0D8] shadow-sm flex items-center justify-center text-[#140A02] hover:text-[#FF6B00] disabled:opacity-40 disabled:pointer-events-none z-10 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  aria-label="Next Plan"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div
                  ref={carouselRef}
                  onScroll={handleScroll}
                  className="w-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
                  style={{ scrollbarWidth: "none" }}
                >
                  {planKeys.map((planKey) => {
                    const isSelected = selectedPlan === planKey;
                    const basePrice = pricing[planKey];
                    const finalPrice = getPrice(basePrice);

                    return (
                      <div key={planKey} className="w-full shrink-0 snap-center px-8">
                        {/* Mobile Header Card */}
                        <div
                          className={`p-5 rounded-t-2xl border-t border-x border-[#E5E0D8] text-center bg-white ${
                            isSelected ? "border-t-2 border-t-[#FF6B00] bg-[#FFF8F0]/30" : ""
                          }`}
                        >
                          <div className="font-display text-sm font-bold text-[#140A02] capitalize mb-1">
                            {planKey}
                          </div>
                          <div className="text-heading-xs font-black text-[#140A02] mb-3">
                            {pricing.currency}
                            {formatPrice(finalPrice)}
                            <span className="text-[10px] font-normal text-[#8A8A96] ml-1">
                              {billingCycle === "annual" ? "/year" : "/month"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectPlan(planKey, billingCycle, finalPrice);
                              console.log("[Analytics] comparison_table_plan_selected", {
                                plan: planKey,
                                source: "comparison_table",
                              });
                            }}
                            className={`w-full max-w-[180px] h-9 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#FF6B00] cursor-pointer ${
                              isSelected
                                ? "bg-[#FF6B00] text-white border border-[#FF6B00]"
                                : "bg-white border border-[#EBE6DD] hover:border-[#14141A] text-[#14141A]"
                            }`}
                          >
                            {isSelected ? "Selected" : `Choose ${planKey}`}
                          </button>
                        </div>

                        {/* Mobile Feature Stack */}
                        <div className="border border-[#E5E0D8] rounded-b-2xl bg-white divide-y divide-[#E5E0D8]/60 overflow-hidden mb-4">
                          {COMPARISON_CATEGORIES.map((category) => (
                            <div key={category.name} className="flex flex-col">
                              <div className="bg-[#FAF9F6] p-3 text-[9px] font-display font-black text-[#140A02] uppercase tracking-wider">
                                {category.name}
                              </div>
                              {category.rows.map((row) => {
                                let displayValue: React.ReactNode = "";
                                const rawValue = (row as any)[planKey];

                                if (rawValue === "overageRate") {
                                  displayValue = pricing.overageRate;
                                } else if (rawValue === "confirmOverage") {
                                  const val = planKey === "growth" ? growthOverage : scaleOverage;
                                  displayValue = val ? `${pricing.currency}${val}/min` : "";
                                } else if (rawValue === "confirmTranscripts") {
                                  const val =
                                    planKey === "starter"
                                      ? starterTranscripts
                                      : planKey === "growth"
                                      ? growthTranscripts
                                      : scaleTranscripts;
                                  displayValue = val || "";
                                } else if (typeof rawValue === "boolean") {
                                  displayValue = rawValue ? (
                                    <svg
                                      className="w-4 h-4 text-[#FF6B00]"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth="3.5"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <span className="text-[#8A8A96] font-medium">—</span>
                                  );
                                } else {
                                  displayValue = rawValue;
                                }

                                return (
                                  <div key={row.feature} className="flex justify-between items-center p-3 text-xs">
                                    <span className="font-medium text-[#5A5A66]">{row.feature}</span>
                                    <span className="font-bold text-[#140A02]">{displayValue}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dot Indicators */}
                <div className="flex justify-center gap-1.5 mt-2">
                  {planKeys.map((planKey, idx) => (
                    <button
                      key={planKey}
                      type="button"
                      onClick={() => scrollToPlan(idx)}
                      className={`w-2 h-2 rounded-full transition-all focus:outline-none focus:ring-1 focus:ring-[#FF6B00] cursor-pointer ${
                        activeMobileIndex === idx ? "bg-[#FF6B00] w-4" : "bg-[#EBE6DD]"
                      }`}
                      aria-label={`Go to plan ${planKey}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Fine Print footer under table */}
          <p className="text-[11px] text-[#5A5A66] mt-4 text-center md:text-left leading-relaxed">
            Overage rates apply after included minutes are used. Switch or cancel anytime from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

const planKeys = ["starter", "growth", "scale"] as const;

const COMPARISON_CATEGORIES = [
  {
    name: "Call Handling",
    rows: [
      { feature: "Included minutes/month", starter: "200", growth: "500", scale: "1,500" },
      { feature: "Overage rate per minute", starter: "overageRate", growth: "confirmOverage", scale: "confirmOverage" },
      { feature: "Basic call routing", starter: true, growth: true, scale: true },
      { feature: "Multi-tenant routing", starter: false, growth: true, scale: true },
      { feature: "AI Receptionist role", starter: true, growth: true, scale: true }
    ]
  },
  {
    name: "Lead Notifications",
    rows: [
      { feature: "Email lead notifications", starter: true, growth: true, scale: true },
      { feature: "SMS lead notifications", starter: false, growth: true, scale: true },
      { feature: "WhatsApp lead notifications", starter: false, growth: true, scale: true },
      { feature: "Custom notification channels", starter: false, growth: false, scale: true }
    ]
  },
  {
    name: "Voice Quality",
    rows: [
      { feature: "Standard AI voice", starter: true, growth: true, scale: true },
      { feature: "Premium low-latency voices", starter: false, growth: false, scale: true }
    ]
  },
  {
    name: "Dashboard & Data",
    rows: [
      { feature: "Dashboard lead storage", starter: true, growth: true, scale: true },
      { feature: "Call transcripts", starter: "confirmTranscripts", growth: "confirmTranscripts", scale: "confirmTranscripts" }
    ]
  },
  {
    name: "Support",
    rows: [
      { feature: "Standard support", starter: true, growth: true, scale: false },
      { feature: "Priority SLA helpdesk", starter: false, growth: false, scale: true }
    ]
  }
];

