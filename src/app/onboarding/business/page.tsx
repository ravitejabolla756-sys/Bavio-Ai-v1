"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingStepper from "@/components/onboarding/OnboardingStepper";
import { authApi } from "@/lib/api";
import { ArrowRight, Building, Globe, Phone, Clock, MapPin, Briefcase } from "@phosphor-icons/react";

export default function BusinessStepPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  // Form Fields
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("Healthcare");
  const [businessDescription, setBusinessDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("US");
  const [timezone, setTimezone] = useState("UTC");
  const [businessPhone, setBusinessPhone] = useState("");
  const [officeHours, setOfficeHours] = useState("Mon-Fri 9:00 AM - 5:00 PM");
  const [locationsServed, setLocationsServed] = useState("");
  const [servicesProvided, setServicesProvided] = useState("");

  // Access Control & Data Pre-fill
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("bavio_token");
        if (!token) {
          router.replace("/signup");
          return;
        }

        const profile = await authApi.getProfile();
        if (!profile || !profile.id) {
          router.replace("/signup");
          return;
        }

        const p = profile as any;
        if (p.subscription_status === "pending") {
          router.replace("/payment-processing");
          return;
        }

        if (p.subscription_status !== "active") {
          router.replace("/pricing");
          return;
        }

        // Pre-fill existing data
        if (p.businessName || p.name) setBusinessName(p.businessName || p.name);
        if (p.industry) setIndustry(p.industry);
        if (p.business_description) setBusinessDescription(p.business_description);
        if (p.phone) setBusinessPhone(p.phone);
        if (p.country_code || p.country) setCountry(p.country_code || p.country);
      } catch (err) {
        console.error("Access verification failed:", err);
        router.replace("/signup");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setServerError("Please enter your business name.");
      return;
    }
    if (!industry.trim()) {
      setServerError("Please select or specify your industry.");
      return;
    }

    setSubmitting(true);
    setServerError("");

    try {
      const token = localStorage.getItem("bavio_token");
      const res = await fetch("/api/onboarding/business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          businessName: businessName.trim(),
          industry: industry.trim(),
          businessDescription: businessDescription.trim(),
          website: website.trim(),
          country,
          timezone,
          businessPhone: businessPhone.trim(),
          officeHours: officeHours.trim(),
          locationsServed: locationsServed.trim(),
          servicesProvided: servicesProvided.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to save business details.");
      }

      router.push("/onboarding/knowledge");
    } catch (err: any) {
      console.error("Failed to save step 1:", err);
      setServerError(err.message || "Failed to save business details.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FF6B00]/30 border-t-[#FF6B00] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#14141A] font-sans flex flex-col">
      <OnboardingStepper currentStep={1} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <div className="bg-white border border-[#E5E0D8] rounded-[28px] p-8 md:p-12 shadow-premium">
          <div className="mb-8">
            <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold block mb-1">
              Step 1 of 6 — Business Details
            </span>
            <h1 className="font-display text-3xl font-bold text-[#14141A] tracking-tight">
              Tell us about your business
            </h1>
            <p className="text-body-xs text-[#5A5A66] mt-2">
              Your AI receptionist uses these details to speak accurately about your company, schedule calls, and serve callers.
            </p>
          </div>

          {serverError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-xs font-semibold">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Name */}
              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Health Clinic"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3.5 pl-4 pr-10 text-body-xs outline-none"
                  />
                  <Building className="w-5 h-5 text-[#8A8A96] absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Industry Sector <span className="text-red-500">*</span>
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3.5 px-4 text-body-xs outline-none"
                >
                  <option value="Healthcare">Healthcare & Medical</option>
                  <option value="Real Estate">Real Estate & Property</option>
                  <option value="Legal Services">Legal & Financial Services</option>
                  <option value="Restaurants & Hospitality">Restaurants & Hospitality</option>
                  <option value="Automotive">Automotive Services</option>
                  <option value="Home Services">Home Services & Contracting</option>
                  <option value="Technology">Technology & Software</option>
                  <option value="Other">Other / Professional Services</option>
                </select>
              </div>

              {/* Website */}
              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Website URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://yourbusiness.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3.5 pl-4 pr-10 text-body-xs outline-none"
                  />
                  <Globe className="w-5 h-5 text-[#8A8A96] absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3.5 px-4 text-body-xs outline-none"
                >
                  <option value="US">🇺🇸 United States (+1)</option>
                  <option value="GB">🇬🇧 United Kingdom (+44)</option>
                  <option value="AU">🇦🇺 Australia (+61)</option>
                </select>
              </div>

              {/* Business Phone */}
              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Primary Mobile / Contact Phone
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+1 555 019 2831"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3.5 pl-4 pr-10 text-body-xs outline-none"
                  />
                  <Phone className="w-5 h-5 text-[#8A8A96] absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Office Hours */}
              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Office Hours
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Mon-Fri 9:00 AM - 5:00 PM EST"
                    value={officeHours}
                    onChange={(e) => setOfficeHours(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3.5 pl-4 pr-10 text-body-xs outline-none"
                  />
                  <Clock className="w-5 h-5 text-[#8A8A96] absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Business Description */}
            <div>
              <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                Business Overview & Mission
              </label>
              <textarea
                rows={3}
                placeholder="Briefly describe what your business does and what services or products you provide..."
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl p-4 text-body-xs outline-none resize-none"
              />
            </div>

            {/* Locations Served & Services Provided */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Locations / Areas Served
                </label>
                <input
                  type="text"
                  placeholder="e.g. Greater New York Area, Downtown Brooklyn"
                  value={locationsServed}
                  onChange={(e) => setLocationsServed(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3.5 px-4 text-body-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Services Provided
                </label>
                <input
                  type="text"
                  placeholder="e.g. Consultations, Emergencies, General Appointments"
                  value={servicesProvided}
                  onChange={(e) => setServicesProvided(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3.5 px-4 text-body-xs outline-none"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-[#E5E0D8] flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:opacity-50 text-white font-bold px-8 py-4 rounded-xl text-body-xs uppercase tracking-wider transition-all duration-200 shadow-md"
              >
                {submitting ? (
                  <span>Saving Step 1...</span>
                ) : (
                  <>
                    <span>Continue to Step 2 — Knowledge</span>
                    <ArrowRight className="w-4 h-4" weight="bold" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
