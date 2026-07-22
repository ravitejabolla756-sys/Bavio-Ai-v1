export interface PricingTierData {
  currency: string;
  currencyCode: string;
  starter: number;
  growth: number;
  scale: number;
  overageRate?: string;
  mostPopularBadge?: string;
}

export const PRICING_BY_COUNTRY: Record<string, PricingTierData> = {
  US: { currency: "$", currencyCode: "USD", starter: 39, growth: 99, scale: 249, mostPopularBadge: "Most popular" },
  DEFAULT: { currency: "$", currencyCode: "USD", starter: 39, growth: 99, scale: 249, mostPopularBadge: "Most popular" },
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
      { text: "200 connected call minutes", included: true },
      { text: "1 local Bavio phone number", included: true },
      { text: "AI call answering", included: true },
      { text: "Business-specific AI receptionist", included: true },
      { text: "Lead qualification", included: true },
      { text: "Call transcripts", included: true },
      { text: "Lead dashboard", included: true },
      { text: "Business knowledge", included: true },
      { text: "Basic usage analytics", included: true }
    ],
    popular: false,
  },
  {
    name: "Growth",
    key: "growth",
    description: "For growing teams that need full-stack voice AI.",
    features: [
      { text: "500 connected call minutes", included: true },
      { text: "Everything in Starter", included: true },
      { text: "Advanced lead-capture fields", included: true },
      { text: "Longer call-record retention", included: true },
      { text: "Detailed usage analytics", included: true },
      { text: "Priority email support", included: true }
    ],
    popular: true,
  },
  {
    name: "Scale",
    key: "scale",
    description: "For enterprises that demand reliability and scale.",
    features: [
      { text: "1,500 connected call minutes", included: true },
      { text: "Everything in Growth", included: true },
      { text: "Higher calling capacity", included: true },
      { text: "Extended data retention", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Priority support", included: true }
    ],
    popular: false,
  },
];

export interface TopupOption {
  id: string;
  name: string;
  price: number;
  minutes: number;
  description: string;
}

export const TOPUP_OPTIONS: TopupOption[] = [
  {
    id: "topup_100",
    name: "100-Minute Top-Up",
    price: 25,
    minutes: 100,
    description: "100 prepaid connected call minutes",
  },
  {
    id: "topup_250",
    name: "250-Minute Top-Up",
    price: 55,
    minutes: 250,
    description: "250 prepaid connected call minutes",
  },
];

export interface ComparisonRow {
  feature: string;
  starter: string;
  growth: string;
  scale: string;
}

export const getComparisonRows = (): ComparisonRow[] => [
  { feature: "Minutes included", starter: "200", growth: "500", scale: "1,500" },
  { feature: "Local phone numbers", starter: "1 local number", growth: "1 local number", scale: "1 local number" },
  { feature: "Support", starter: "Email", growth: "Priority Email", scale: "Priority Support" },
  { feature: "Analytics", starter: "Basic", growth: "Detailed", scale: "Advanced" },
  { feature: "Email notifications", starter: "Yes", growth: "Yes", scale: "Yes" },
  { feature: "Call transcripts", starter: "Yes", growth: "Yes", scale: "Yes" },
  { feature: "Overage billing", starter: "None (Prepaid)", growth: "None (Prepaid)", scale: "None (Prepaid)" },
];

export const FAQS = [
  {
    q: "What happens when I use all my included minutes?",
    a: "AI call handling pauses automatically when both your monthly allowance and any prepaid top-up balance reach zero. You can purchase a prepaid top-up from your billing dashboard to resume immediately.",
  },
  {
    q: "Is there any postpaid overage or surprise billing?",
    a: "No. Bavio uses a strictly prepaid model. You are never billed after the fact for minutes you did not purchase in advance.",
  },
  {
    q: "What are minute top-ups and how do they work?",
    a: "Top-ups are one-time prepaid minute bundles available to active subscribers: 100 minutes for $25 or 250 minutes for $55. Top-up minutes are used after your monthly allowance is consumed and carry over indefinitely.",
  },
  {
    q: "Do top-up minutes roll over month to month?",
    a: "Yes. Prepaid top-up minutes never expire and carry over to the next billing period.",
  },
  {
    q: "Can I change plans anytime?",
    a: "Yes. Upgrade or downgrade instantly from your dashboard.",
  },
  {
    q: "Do I get a dedicated phone number?",
    a: "Yes. Each plan includes one local virtual business phone number.",
  },
  {
    q: "Which currencies do you support?",
    a: "Bavio bills in USD.",
  },
];
