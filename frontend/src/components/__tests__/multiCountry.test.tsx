import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CountryProvider, useCountry, CURRENCY_MAP } from "../shared/CountryContext";
import { PricingSelector, PRICING_DATA } from "../pricing/PricingSelector";
import { PhoneSetup } from "../numbers/PhoneSetup";

// Mock the Country Context for testing components in isolation
jest.mock("../shared/CountryContext", () => {
  const actual = jest.requireActual("../shared/CountryContext");
  return {
    ...actual,
    useCountry: jest.fn(),
  };
});

describe("CountryContext Currency Mapping", () => {
  test("resolves correct currency codes per country code", () => {
    expect(CURRENCY_MAP.IN).toBe("INR");
    expect(CURRENCY_MAP.US).toBe("USD");
    expect(CURRENCY_MAP.GB).toBe("GBP");
    expect(CURRENCY_MAP.AU).toBe("AUD");
    expect(CURRENCY_MAP.AE).toBe("AED");
  });
});

describe("PricingSelector Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders India localized pricing, currency, and badge when country is IN", () => {
    (useCountry as jest.Mock).mockReturnValue({
      country: "IN",
      loading: false,
    });

    render(<PricingSelector onSelectPlan={jest.fn()} />);

    // Check India currency symbol and growth price (₹3,999)
    expect(screen.getByText("₹3,999")).toBeInTheDocument();
    // Check Indian operator custom badge
    expect(screen.getByText("Most popular in India")).toBeInTheDocument();
  });

  test("renders US localized pricing, currency, and badge when country is US", () => {
    (useCountry as jest.Mock).mockReturnValue({
      country: "US",
      loading: false,
    });

    render(<PricingSelector onSelectPlan={jest.fn()} />);

    // Check US currency symbol and growth price ($79)
    expect(screen.getByText("$79")).toBeInTheDocument();
    expect(screen.getByText("Most popular in USA / Canada")).toBeInTheDocument();
  });

  test("calculates 20% discount correctly when annual billing is selected", () => {
    (useCountry as jest.Mock).mockReturnValue({
      country: "US",
      loading: false,
    });

    render(<PricingSelector onSelectPlan={jest.fn()} />);

    // Toggle annual billing
    const annualBtn = screen.getByText(/Annual Billing/i);
    fireEvent.click(annualBtn);

    // US growth base price is $79. Annual calculation with 20% discount: Math.round(79 * 12 * 0.8) = $758
    expect(screen.getByText("$758")).toBeInTheDocument();
    expect(screen.getAllByText("/year").length).toBeGreaterThan(0);
  });
});

describe("PhoneSetup Telephony & Dial Code Generation", () => {
  const mockNumber = "+91 80802 74248";
  const cleanNumber = "918080274248";

  beforeEach(() => {
    jest.clearAllMocks();
    (useCountry as jest.Mock).mockReturnValue({
      country: "IN",
      loading: false,
    });
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { phone_number: mockNumber } }),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("triggers API number assignment and displays virtual number on click", async () => {
    render(<PhoneSetup onComplete={jest.fn()} />);

    const assignBtn = screen.getByRole("button", { name: /Allocate Virtual Number/i });
    fireEvent.click(assignBtn);

    await waitFor(() => {
      expect(screen.getByText(mockNumber)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/numbers/assign", expect.any(Object));
  });

  test("generates operator USSD dial code dynamically for Airtel in India", async () => {
    render(<PhoneSetup onComplete={jest.fn()} />);

    // Assign number first
    const assignBtn = screen.getByRole("button", { name: /Allocate Virtual Number/i });
    fireEvent.click(assignBtn);

    await waitFor(() => {
      expect(screen.getByText(mockNumber)).toBeInTheDocument();
    });

    // Select Airtel operator (which is the default, but let's change value to be sure)
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "Airtel" } });

    // Airtel code is *567*. Code should be *567* + clean number + #
    // cleanNumber = 918080274248
    const expectedDialCode = `*567*${cleanNumber}#`;
    expect(screen.getByText(expectedDialCode)).toBeInTheDocument();
  });

  test("simulates call-forward verification handshake successfully", async () => {
    render(<PhoneSetup onComplete={jest.fn()} />);

    // Assign number
    const assignBtn = screen.getByRole("button", { name: /Allocate Virtual Number/i });
    fireEvent.click(assignBtn);

    await waitFor(() => {
      expect(screen.getByText(mockNumber)).toBeInTheDocument();
    });

    // Click verify
    const verifyBtn = screen.getByRole("button", { name: /Verify Routing Forward Setup/i });
    fireEvent.click(verifyBtn);

    // Should transition to loading verification state
    expect(screen.getByText(/Verifying Forwarding Status/i)).toBeInTheDocument();

    // Fast-forward timeout
    await waitFor(
      () => {
        expect(screen.getByText("Forwarding Verified")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
