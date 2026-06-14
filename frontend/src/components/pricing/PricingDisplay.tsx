"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useCountry } from "@/context/CountryContext";
import { PRICING_BY_COUNTRY, PLANS, getComparisonRows, FAQS } from "@/config/pricing";
import { useCTADestination } from "@/lib/auth-utils";
import { CheckCircle, Minus, CaretDown, Buildings, Headset, ArrowRight } from "@phosphor-icons/react";
import ScrollReveal from "@/components/motion/ScrollReveal";

// 3. CurrencyConverter utility (for display only)
export const CurrencyConverter = {
  format: (amount: number, currencySymbol: string): string => {
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    const symbol = currencySymbol.trim();
    // Add space for multi-character currency codes like AUD / AED
    const needsSpace = symbol.length > 1 && !symbol.includes("$") && !symbol.includes("€") && !symbol.includes("£");
    return `${symbol}${needsSpace ? " " : ""}${formatted}`;
  },
};

// 1. PricingCard component (renders a single tier)
export interface PricingCardProps {
  name: string;
  price: number;
  currencySymbol: string;
  description: string;
  features: { text: string; included: boolean }[];
  popular: boolean;
  overageRate: string;
  billingPeriod: "monthly" | "annual";
  ctaDestination: string;
  mostPopularBadge?: string;
  countryCode: string;
}

export function PricingCard({
  name,
  price,
  currencySymbol,
  description,
  features,
  popular,
  overageRate,
  billingPeriod,
  ctaDestination,
  mostPopularBadge,
  countryCode,
}: PricingCardProps) {
  const formattedPrice = useMemo(() => {
    return CurrencyConverter.format(price, currencySymbol);
  }, [price, currencySymbol]);

  // Determine badge text: use country-specific custom badge if popular and matches active country
  const badgeText = useMemo(() => {
    if (popular) {
      return mostPopularBadge || "Most popular";
    }
    return null;
  }, [popular, mostPopularBadge]);

  return (
    <div className={`card-bezel h-full ${popular ? "ring-2 ring-saffron" : ""}`}>
      <div className="card-bezel-inner p-7 lg:p-8 flex flex-col h-full relative">
        {badgeText && (
          <span className="absolute top-4 right-4 bg-saffron text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md shadow-sm">
            {badgeText}
          </span>
        )}

        <h3 className="text-heading-sm font-semibold text-ink mb-2">
          {name}
        </h3>
        <p className="text-body-xs text-ink-muted mb-5 min-h-[32px]">
          {description}
        </p>

        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="font-display text-display-md text-saffron font-bold">
            {formattedPrice}
          </span>
          <span className="text-body-sm text-ink-muted">
            {billingPeriod === "annual" ? "/year" : "/month"}
          </span>
        </div>

        {billingPeriod === "annual" && (
          <p className="text-body-xs text-state-success mb-5 font-semibold">
            Save 20% with annual billing
          </p>
        )}
        {billingPeriod !== "annual" && <div className="mb-5 h-4" />}

        <ul className="flex flex-col gap-3 flex-1 mb-8">
          {features.map((f, idx) => (
            <li key={idx} className="flex items-center gap-2.5 text-body-sm">
              {f.included ? (
                <CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" />
              ) : (
                <Minus className="w-4 h-4 text-ink-faint shrink-0" />
              )}
              <span className={f.included ? "text-ink-secondary" : "text-ink-muted"}>
                {f.text}
              </span>
            </li>
          ))}
        </ul>

        <p className="text-body-xs text-ink-faint font-mono mb-4">
          Overage: {overageRate}
        </p>

        <Link
          href={ctaDestination}
          className={`w-full text-center py-3.5 rounded-button text-body-sm font-semibold transition-all duration-300 ease-premium inline-flex items-center justify-center ${
            popular
              ? "bg-saffron hover:bg-saffron-hover text-white shadow-saffron"
              : "border border-line hover:border-saffron text-ink-tertiary hover:text-ink"
          }`}
        >
          Start 14-Day Free Trial
        </Link>
      </div>
    </div>
  );
}

// 2. PricingGrid component (combines pricing layers, switches, comparison, and FAQ)
export function PricingGrid() {
  const ctaDestination = useCTADestination();
  const { country, isLoading: countryLoading } = useCountry();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Retrieve matching country pricing config (use DEFAULT if not listed)
  const countryPricing = useMemo(() => {
    if (countryLoading) return PRICING_BY_COUNTRY.DEFAULT;
    return PRICING_BY_COUNTRY[country.code] || PRICING_BY_COUNTRY.DEFAULT;
  }, [country, countryLoading]);

  // Compute local pricing for each tier, accounting for monthly / annual toggles (20% discount on yearly)
  const tiers = useMemo(() => {
    const isAnnual = billing === "annual";
    const scaleFactor = isAnnual ? 12 * 0.8 : 1;

    return PLANS.map((plan) => {
      const baseMonthlyPrice = countryPricing[plan.key];
      const computedPrice = Math.round(baseMonthlyPrice * scaleFactor);

      return {
        ...plan,
        price: computedPrice,
        currencySymbol: countryPricing.currency,
        overageRate: countryPricing.overageRate,
        mostPopularBadge: countryPricing.mostPopularBadge,
      };
    });
  }, [countryPricing, billing]);

  const comparisonRows = useMemo(() => {
    return getComparisonRows(countryPricing.overageRate);
  }, [countryPricing]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Country Selection & Billing Toggles */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 w-full">
        <div className="max-w-container mx-auto px-6 lg:px-8 text-center flex flex-col items-center">
          <ScrollReveal>
            <h1 className="font-display text-display-xl tracking-tight text-ink mb-4">
              Flexible, local pricing
            </h1>
            <p className="text-body-lg text-ink-tertiary max-w-md mx-auto mb-10">
              Answer every call instantly. Scale plans built to fit your business requirements.
            </p>

            <div className="flex items-center justify-center bg-surface border border-line rounded-[24px] p-4 lg:p-6 shadow-sm max-w-xs mx-auto">
              {/* Billing Period Toggle */}
              <div className="flex flex-col text-center">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                  Billing Cycle
                </label>
                <div className="flex items-center gap-1 bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl p-1">
                  <button
                    onClick={() => setBilling("monthly")}
                    className={`px-4 py-2 rounded-lg text-body-sm font-semibold transition-all duration-200 ${
                      billing === "monthly"
                        ? "bg-saffron text-white shadow-sm"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBilling("annual")}
                    className={`px-4 py-2 rounded-lg text-body-sm font-semibold transition-all duration-200 ${
                      billing === "annual"
                        ? "bg-saffron text-white shadow-sm"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    Annual (Save 20%)
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Grid of Tiers */}
      <section className="pb-section-lg w-full">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {tiers.map((tier, idx) => (
              <ScrollReveal key={tier.key} delay={idx * 0.1}>
                <PricingCard
                  name={tier.name}
                  price={tier.price}
                  currencySymbol={tier.currencySymbol}
                  description={tier.description}
                  features={tier.features}
                  popular={tier.popular}
                  overageRate={tier.overageRate}
                  billingPeriod={billing}
                  ctaDestination={ctaDestination}
                  mostPopularBadge={tier.mostPopularBadge}
                  countryCode={country.code}
                />
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={0.3} className="text-center mt-8">
            <p className="text-body-sm text-ink-muted">
              14-day free trial on all plans. No credit card required.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-section-lg lg:py-28 border-t border-line-subtle bg-surface/30 w-full">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="text-center mb-12">
            <h2 className="font-display text-display-md text-ink mb-3">
              Full feature comparison
            </h2>
            <p className="text-body-md text-ink-tertiary">
              See exactly what each tier includes for your region.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="card-bezel max-w-4xl mx-auto">
              <div className="card-bezel-inner overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-left px-6 py-4 text-body-sm font-semibold text-ink-muted">
                        Feature
                      </th>
                      <th className="text-center px-4 py-4 text-body-sm font-semibold text-ink-muted">
                        Starter
                      </th>
                      <th className="text-center px-4 py-4 text-body-sm font-bold text-saffron">
                        Growth
                      </th>
                      <th className="text-center px-4 py-4 text-body-sm font-semibold text-ink-muted">
                        Scale
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.feature} className="border-b border-line-faint last:border-b-0">
                        <td className="px-6 py-3.5 text-body-sm text-ink-secondary">
                          {row.feature}
                        </td>
                        <td className="text-center px-4 py-3.5 text-body-sm text-ink-muted">
                          {row.starter}
                        </td>
                        <td className="text-center px-4 py-3.5 text-body-sm font-medium text-ink">
                          {row.growth}
                        </td>
                        <td className="text-center px-4 py-3.5 text-body-sm text-ink-muted">
                          {row.scale}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-section-lg lg:py-28 border-t border-line-subtle w-full">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <ScrollReveal className="lg:col-span-4">
              <span className="text-label uppercase tracking-widest text-saffron mb-4 block">
                FAQ
              </span>
              <h2 className="font-display text-display-md text-ink mb-4">
                Common questions
              </h2>
              <p className="text-body-md text-ink-tertiary">
                Everything you need to know about plans, billing, and currency support.
              </p>
            </ScrollReveal>

            <div className="lg:col-span-8">
              <div className="flex flex-col">
                {FAQS.map((faq, idx) => (
                  <ScrollReveal key={faq.q} delay={idx * 0.04}>
                    <div className="border-b border-line-subtle">
                      <button
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full flex items-center justify-between py-5 text-left group"
                        aria-expanded={openFaq === idx}
                      >
                        <span className="text-body-md font-medium text-ink group-hover:text-saffron transition-colors pr-4">
                          {faq.q}
                        </span>
                        <CaretDown
                          className={`w-4 h-4 text-ink-muted shrink-0 transition-transform duration-300 ease-premium ${
                            openFaq === idx ? "rotate-180" : ""
                          }`}
                          weight="bold"
                        />
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-400 ease-premium ${
                          openFaq === idx ? "max-h-48 opacity-100 pb-5" : "max-h-0 opacity-0"
                        }`}
                      >
                        <p className="text-body-sm text-ink-tertiary leading-relaxed pr-8">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-section-lg lg:py-20 border-t border-line-subtle bg-surface/30 w-full">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="card-bezel max-w-3xl mx-auto">
              <div className="card-bezel-inner p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-8">
                <div className="w-14 h-14 rounded-2xl bg-saffron-muted border border-saffron-border flex items-center justify-center shrink-0">
                  <Buildings className="w-7 h-7 text-saffron" weight="duotone" />
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-heading-md font-semibold text-ink mb-2">
                    Need custom pricing?
                  </h3>
                  <p className="text-body-sm text-ink-tertiary">
                    Custom enterprise pricing available based on your volume requirements.
                    Contact our team to configure minutes, dedicated SIPS, and white-labels.
                  </p>
                </div>
                <Link
                  href="/enterprise"
                  className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-hover text-white text-body-sm font-semibold px-6 py-3 rounded-button shadow-saffron transition-all duration-300 ease-premium shrink-0"
                >
                  Talk to Sales
                  <ArrowRight className="w-4 h-4" weight="bold" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-section-lg lg:py-20 border-t border-line-subtle w-full">
        <div className="max-w-container mx-auto px-6 lg:px-8 text-center">
          <ScrollReveal>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Headset className="w-6 h-6 text-saffron" weight="duotone" />
              <span className="text-body-md text-ink-tertiary">Still have questions?</span>
            </div>
            <Link
              href="/contact"
              className="text-body-md font-medium text-saffron hover:text-saffron-hover transition-colors"
            >
              Chat with our team
              <ArrowRight className="w-4 h-4 inline ml-1.5" weight="bold" />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
