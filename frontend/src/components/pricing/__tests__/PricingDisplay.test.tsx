import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CurrencyConverter, PricingCard, PricingGrid } from "../PricingDisplay";
import { useCountry } from "@/context/CountryContext";

// Mock the Country Context hook
jest.mock("@/context/CountryContext", () => ({
  useCountry: jest.fn(),
  countries: [
    { code: "US", name: "United States", currency: "usd", symbol: "$", dialCode: "+1", flag: "🇺🇸" },
    { code: "GB", name: "United Kingdom", currency: "gbp", symbol: "£", dialCode: "+44", flag: "🇬🇧" },
    { code: "AU", name: "Australia", currency: "aud", symbol: "AUD", dialCode: "+61", flag: "🇦🇺" },
    { code: "AE", name: "United Arab Emirates", currency: "aed", symbol: "AED", dialCode: "+971", flag: "🇦🇪" },
  ],
}));

// Mock phosphor icons to avoid rendering complexities
jest.mock("@phosphor-icons/react", () => ({
  CheckCircle: () => <div data-testid="check-circle" />,
  Minus: () => <div data-testid="minus" />,
  CaretDown: () => <div data-testid="caret-down" />,
  Buildings: () => <div data-testid="buildings" />,
  Headset: () => <div data-testid="headset" />,
  ArrowRight: () => <div data-testid="arrow-right" />,
}));

// Mock framer-motion to prevent animation loops in testing
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock CountrySelector dropdown
jest.mock("@/components/onboarding/CountrySelector", () => {
  return function MockCountrySelector() {
    return <div data-testid="mock-country-selector">Country Selector</div>;
  };
});

// Mock auth utility
jest.mock("@/lib/auth-utils", () => ({
  useCTADestination: () => "/signup",
}));

describe("CurrencyConverter Utility", () => {
  test("formats EUR currency correctly with no decimals", () => {
    const res = CurrencyConverter.format(1999, "€");
    expect(res).toBe("€1,999");
  });

  test("formats USD currency correctly", () => {
    const res = CurrencyConverter.format(39, "$");
    expect(res).toBe("$39");
  });

  test("formats GBP currency correctly", () => {
    const res = CurrencyConverter.format(99, "£");
    expect(res).toBe("£99");
  });

  test("adds space for multi-character currencies like AUD", () => {
    const res = CurrencyConverter.format(199, "AUD");
    expect(res).toBe("AUD 199");
  });

  test("adds space for AED", () => {
    const res = CurrencyConverter.format(499, "AED");
    expect(res).toBe("AED 499");
  });
});

describe("PricingCard Component", () => {
  const defaultProps = {
    name: "Growth",
    price: 79,
    currencySymbol: "$",
    description: "For growing teams that need full-stack voice AI.",
    features: [
      { text: "500 minutes", included: true },
      { text: "Email alerts", included: false },
    ],
    popular: true,
    overageRate: "$0.10/min",
    billingPeriod: "monthly" as const,
    ctaDestination: "/signup",
    mostPopularBadge: "Most popular in USA",
    countryCode: "US",
  };

  test("renders card title, description, and dynamic price", () => {
    render(<PricingCard {...defaultProps} />);
    expect(screen.getByText("Growth")).toBeInTheDocument();
    expect(screen.getByText("For growing teams that need full-stack voice AI.")).toBeInTheDocument();
    expect(screen.getByText("$79")).toBeInTheDocument();
    expect(screen.getByText("/month")).toBeInTheDocument();
  });

  test("renders features lists with appropriate indicators", () => {
    render(<PricingCard {...defaultProps} />);
    expect(screen.getByText("500 minutes")).toBeInTheDocument();
    expect(screen.getByText("Email alerts")).toBeInTheDocument();
    expect(screen.queryAllByTestId("check-circle").length).toBe(1);
    expect(screen.queryAllByTestId("minus").length).toBe(1);
  });

  test("renders country-specific popularity badge if set and tier is popular", () => {
    render(<PricingCard {...defaultProps} />);
    expect(screen.getByText("Most popular in USA")).toBeInTheDocument();
  });

  test("does not render popularity badge if popular is false", () => {
    render(<PricingCard {...defaultProps} popular={false} />);
    expect(screen.queryByText("Most popular in USA")).not.toBeInTheDocument();
  });
});

describe("PricingGrid Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders UK pricing when country is GB", () => {
    (useCountry as jest.Mock).mockReturnValue({
      country: { code: "GB", name: "United Kingdom", currency: "gbp", symbol: "£" },
      isLoading: false,
    });

    render(<PricingGrid />);

    // Growth plan monthly price for UK is £59
    expect(screen.getByText("£59")).toBeInTheDocument();
    expect(screen.getByText("Overage: £0.08/min")).toBeInTheDocument();
  });

  test("renders USA pricing when country is US", () => {
    (useCountry as jest.Mock).mockReturnValue({
      country: { code: "US", name: "United States", currency: "usd", symbol: "$" },
      isLoading: false,
    });

    render(<PricingGrid />);

    // Growth plan monthly price for USA is $79
    expect(screen.getByText("$79")).toBeInTheDocument();
    expect(screen.getByText("Overage: $0.10/min")).toBeInTheDocument();
  });

  test("calculates 20% discount when annual billing is selected", () => {
    (useCountry as jest.Mock).mockReturnValue({
      country: { code: "US", name: "United States", currency: "usd", symbol: "$" },
      isLoading: false,
    });

    render(<PricingGrid />);

    // Toggle to annual billing
    const annualButton = screen.getByRole("button", { name: /Annual/i });
    fireEvent.click(annualButton);

    // Monthly price is $79. Annual calculation: Math.round(79 * 12 * 0.8) = $758
    expect(screen.getByText("$758")).toBeInTheDocument();
    expect(screen.getAllByText("/year").length).toBeGreaterThan(0);
  });
});
