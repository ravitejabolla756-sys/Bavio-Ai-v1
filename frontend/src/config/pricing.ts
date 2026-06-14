export interface PricingTierData {
  currency: string;
  starter: number;
  growth: number;
  scale: number;
  overageRate: string;
  mostPopularBadge?: string;
}

export const PRICING_BY_COUNTRY: Record<string, PricingTierData> = {
  IN: { currency: "₹", starter: 2599, growth: 5199, scale: 10399, overageRate: "₹5.20 - ₹10.40/min", mostPopularBadge: "Most popular in India" },
  US: { currency: "$", starter: 39, growth: 79, scale: 149, overageRate: "$0.10/min", mostPopularBadge: "Most popular in USA" },
  CA: { currency: "$", starter: 39, growth: 79, scale: 149, overageRate: "$0.10/min", mostPopularBadge: "Most popular in Canada" },
  GB: { currency: "£", starter: 29, growth: 59, scale: 99, overageRate: "£0.08/min", mostPopularBadge: "Most popular in UK" },
  AU: { currency: "AUD ", starter: 49, growth: 99, scale: 199, overageRate: "AUD 0.12/min", mostPopularBadge: "Most popular in Australia" },
  AE: { currency: "AED ", starter: 149, growth: 299, scale: 499, overageRate: "AED 0.40/min", mostPopularBadge: "Most popular in UAE" },
  DEFAULT: { currency: "$", starter: 39, growth: 79, scale: 149, overageRate: "$0.10/min", mostPopularBadge: "Most popular" },
};

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanDetails {
  name: string;
  key: "starter" | "growth" | "scale";
  description: string;
  features: PlanFeature[];
  popular: boolean;
}

export const PLANS: PlanDetails[] = [
  {
    name: "Starter",
    key: "starter",
    description: "For small businesses starting with voice automation.",
    features: [
      { text: "250 minutes/month", included: true },
      { text: "1 AI agent", included: true },
      { text: "Email support", included: true },
      { text: "Basic analytics", included: true },
      { text: "Integrations", included: false },
      { text: "Webhook API", included: false },
      { text: "WhatsApp routing", included: false },
    ],
    popular: false,
  },
  {
    name: "Growth",
    key: "growth",
    description: "For growing teams that need full-stack voice AI.",
    features: [
      { text: "600 minutes/month", included: true },
      { text: "Unlimited agents", included: true },
      { text: "24/7 phone support", included: true },
      { text: "Full analytics + exports", included: true },
      { text: "20+ integrations", included: true },
      { text: "Webhook API", included: true },
      { text: "SMS/WhatsApp routing", included: true },
    ],
    popular: true,
  },
  {
    name: "Scale",
    key: "scale",
    description: "For enterprises that demand reliability and scale.",
    features: [
      { text: "2,000 minutes/month", included: true },
      { text: "Everything in Growth", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom integrations", included: true },
      { text: "Priority support", included: true },
      { text: "White-label options", included: true },
    ],
    popular: false,
  },
];

export interface ComparisonRow {
  feature: string;
  starter: string;
  growth: string;
  scale: string;
}

export const getComparisonRows = (overageRate: string): ComparisonRow[] => [
  { feature: "Minutes included", starter: "250", growth: "600", scale: "2,000" },
  { feature: "AI agents", starter: "1", growth: "Unlimited", scale: "Unlimited" },
  { feature: "Support", starter: "Email", growth: "24/7 Phone", scale: "Priority + Dedicated" },
  { feature: "Analytics", starter: "Basic", growth: "Full + Export", scale: "Full + Custom" },
  { feature: "Integrations", starter: "None", growth: "20+", scale: "50+ Custom" },
  { feature: "Webhook API", starter: "No", growth: "Yes", scale: "Yes" },
  { feature: "WhatsApp/SMS routing", starter: "No", growth: "Yes", scale: "Yes" },
  { feature: "White-label", starter: "No", growth: "No", scale: "Yes" },
  { 
    feature: "Overage rate", 
    starter: overageRate.includes("₹") ? "₹10.40/min" : overageRate, 
    growth: overageRate.includes("₹") ? "₹8.60/min" : overageRate, 
    scale: overageRate.includes("₹") ? "₹5.20/min" : overageRate 
  },
];

export const FAQS = [
  {
    q: "What happens when I exceed my minutes?",
    a: "Overage is billed at the specified rate per extra minute depending on your plan. Active calls never drop due to overage. You will receive an email alert at 80% usage.",
  },
  {
    q: "Can I change plans anytime?",
    a: "Yes. Upgrade or downgrade instantly from your dashboard. Prorated billing is applied immediately. No lock-in contracts.",
  },
  {
    q: "Is there a setup fee?",
    a: "No setup fee whatsoever. Start immediately after sign-up. Dedicated phone numbers are assigned within 60 seconds.",
  },
  {
    q: "Do I get a dedicated phone number?",
    a: "Yes. Each business receives a unique virtual phone number. Growth and Scale plans also support international numbers.",
  },
  {
    q: "How accurate is lead capture?",
    a: "Bavio captures caller name, phone number, and stated intent from every call. Accuracy depends on call quality, language clarity, and knowledge base setup.",
  },
  {
    q: "Can I add team members?",
    a: "Growth and Scale plans support unlimited users with role-based access control. Starter plan is single-user.",
  },
  {
    q: "Do you offer annual billing discounts?",
    a: "Yes. Pay annually and save 20% on any plan. Annual billing is available from the billing settings in your dashboard.",
  },
  {
    q: "Can I white-label Bavio?",
    a: "Yes, on the Scale plan. Custom branding, your domain name, and branded call experiences. Contact sales for enterprise white-label.",
  },
  {
    q: "Is there a trial period?",
    a: "14 days free trial on every plan. No credit card required. Full access to all features during the trial. Cancel anytime.",
  },
];
