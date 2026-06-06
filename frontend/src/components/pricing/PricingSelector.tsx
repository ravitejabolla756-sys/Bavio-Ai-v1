"use client";

import React from "react";
import { useCountry } from "../shared/CountryContext";

export interface PricingPlan {
  name: string;
  price: number;
  features: string[];
  ctaText: string;
}

export const PRICING_DATA: Record<
  string,
  {
    currencySymbol: string;
    currencyCode: string;
    popularityBadge?: string;
    plans: Record<string, { price: number; features: string[] }>;
  }
> = {
  IN: {
    currencySymbol: "₹",
    currencyCode: "INR",
    popularityBadge: "Most popular in India",
    plans: {
      starter: {
        price: 1999,
        features: ["200 included minutes", "Basic call routing", "AI Receptionist role", "Email logs support"],
      },
      growth: {
        price: 3999,
        features: ["500 included minutes", "Multi-tenant routing", "Google Calendar integration", "WhatsApp alerts", "Custom voice configs"],
      },
      scale: {
        price: 7999,
        features: ["1500 included minutes", "HubSpot & Zoho CRM syncs", "Webhooks integrations", "Premium low-latency voices", "Priority SLA helpdesk"],
      },
    },
  },
  US: {
    currencySymbol: "$",
    currencyCode: "USD",
    popularityBadge: "Most popular in USA",
    plans: {
      starter: {
        price: 39,
        features: ["200 included minutes", "Basic call routing", "AI Receptionist role", "Email logs support"],
      },
      growth: {
        price: 79,
        features: ["500 included minutes", "Multi-tenant routing", "Google Calendar integration", "WhatsApp alerts", "Custom voice configs"],
      },
      scale: {
        price: 149,
        features: ["1500 included minutes", "HubSpot & Zoho CRM syncs", "Webhooks integrations", "Premium low-latency voices", "Priority SLA helpdesk"],
      },
    },
  },
  GB: {
    currencySymbol: "£",
    currencyCode: "GBP",
    popularityBadge: "Most popular in UK",
    plans: {
      starter: {
        price: 29,
        features: ["200 included minutes", "Basic call routing", "AI Receptionist role", "Email logs support"],
      },
      growth: {
        price: 59,
        features: ["500 included minutes", "Multi-tenant routing", "Google Calendar integration", "WhatsApp alerts", "Custom voice configs"],
      },
      scale: {
        price: 99,
        features: ["1500 included minutes", "HubSpot & Zoho CRM syncs", "Webhooks integrations", "Premium low-latency voices", "Priority SLA helpdesk"],
      },
    },
  },
  AU: {
    currencySymbol: "A$",
    currencyCode: "AUD",
    popularityBadge: "Most popular in Australia",
    plans: {
      starter: {
        price: 49,
        features: ["200 included minutes", "Basic call routing", "AI Receptionist role", "Email logs support"],
      },
      growth: {
        price: 99,
        features: ["500 included minutes", "Multi-tenant routing", "Google Calendar integration", "WhatsApp alerts", "Custom voice configs"],
      },
      scale: {
        price: 199,
        features: ["1500 included minutes", "HubSpot & Zoho CRM syncs", "Webhooks integrations", "Premium low-latency voices", "Priority SLA helpdesk"],
      },
    },
  },
  AE: {
    currencySymbol: "AED ",
    currencyCode: "AED",
    popularityBadge: "Most popular in UAE",
    plans: {
      starter: {
        price: 149,
        features: ["200 included minutes", "Basic call routing", "AI Receptionist role", "Email logs support"],
      },
      growth: {
        price: 299,
        features: ["500 included minutes", "Multi-tenant routing", "Google Calendar integration", "WhatsApp alerts", "Custom voice configs"],
      },
      scale: {
        price: 499,
        features: ["1500 included minutes", "HubSpot & Zoho CRM syncs", "Webhooks integrations", "Premium low-latency voices", "Priority SLA helpdesk"],
      },
    },
  },
};

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

  const resolvedCountry = country && PRICING_DATA[country] ? country : "US";
  const pricing = PRICING_DATA[resolvedCountry];

  const getPrice = (basePrice: number) => {
    if (billingCycle === "annual") {
      // 20% discount on annual plans
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
        <p className="text-body-sm text-[#8A8A96] font-medium animate-pulse">Calculating localized plan rates...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Billing Switcher */}
      <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#E5E0D8] rounded-2xl p-1 mb-12 shadow-sm">
        <button
          type="button"
          onClick={() => setBillingCycle("monthly")}
          className={`px-6 py-2.5 rounded-xl text-body-xs font-bold transition-all duration-200 ${
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
          className={`px-6 py-2.5 rounded-xl text-body-xs font-bold transition-all duration-200 inline-flex items-center gap-2 ${
            billingCycle === "annual"
              ? "bg-[#14141A] text-white shadow-sm"
              : "text-[#8A8A96] hover:text-[#14141A]"
          }`}
        >
          Annual Billing
          <span className="text-[9px] font-black uppercase tracking-widest bg-[#FF6B00]/15 text-[#FF6B00] py-0.5 px-2 rounded-md">
            Save 20%
          </span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl items-stretch">
        {["starter", "growth", "scale"].map((planName) => {
          const planConfig = pricing.plans[planName];
          const isSelected = selectedPlan === planName;
          const isGrowth = planName === "growth";
          const basePrice = planConfig.price;
          const finalPrice = getPrice(basePrice);

          return (
            <div
              key={planName}
              onClick={() => onSelectPlan(planName, billingCycle, finalPrice)}
              className={`relative rounded-[28px] border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden bg-white cursor-pointer ${
                isSelected
                  ? "border-[#FF6B00] ring-4 ring-[#FF6B00]/10 shadow-[0_12px_32px_rgba(255,107,0,0.08)] scale-[1.02]"
                  : "border-[#EBE6DD] shadow-sm hover:border-[#FF6B00]/50 hover:shadow-md hover:scale-[1.01]"
              }`}
            >
              {/* Top Status Badges */}
              {isSelected ? (
                <div className="absolute top-4 right-4 bg-[#FF6B00] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                  Current Plan Selected
                </div>
              ) : isGrowth && pricing.popularityBadge ? (
                <div className="absolute top-4 right-4 bg-[#14141A] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                  {pricing.popularityBadge}
                </div>
              ) : null}

              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-heading-sm font-bold text-[#14141A] capitalize mb-1 mt-2">
                    {planName}
                  </h3>
                  <p className="text-body-xs text-[#8A8A96] mb-6 min-h-[40px] leading-relaxed">
                    {planName === "starter"
                      ? "Perfect for micro businesses starting with voice AI receptionist."
                      : planName === "growth"
                      ? "Most popular plan for expanding customer care outreach."
                      : "For high-volume operations requiring advanced CRM pipelines."}
                  </p>

                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-display-md font-bold text-[#14141A]">
                      {pricing.currencySymbol}
                      {formatPrice(finalPrice)}
                    </span>
                    <span className="text-body-xs text-[#8A8A96]">
                      {billingCycle === "annual" ? "/year" : "/month"}
                    </span>
                  </div>

                  <ul className="flex flex-col gap-3.5 mb-8">
                    {planConfig.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-body-xs text-[#4A4A57]">
                        <svg
                          className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    className={`w-full h-12 rounded-xl text-body-xs font-bold transition-all duration-300 inline-flex items-center justify-center gap-1.5 border ${
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
    </div>
  );
}
