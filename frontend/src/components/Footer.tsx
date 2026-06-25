"use client";

import React, { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import {
  LinkedinLogo,
  XLogo,
  InstagramLogo,
  ArrowRight,
} from "@phosphor-icons/react";

const footerColumns = [
  {
    heading: "Product",
    links: [
      { label: "How it Works", href: "/how-it-works" },
      { label: "Features", href: "/product" },
      { label: "Integrations", href: "/integrations" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    heading: "Use Cases",
    links: [
      { label: "Real Estate", href: "/use-cases/real-estate" },
      { label: "Restaurants", href: "/use-cases/restaurants" },
      { label: "Healthcare", href: "/use-cases/healthcare" },
      { label: "E-Commerce", href: "/use-cases/e-commerce" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/company" },
      { label: "Customers", href: "/customers" },
      { label: "Contact", href: "/contact" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Cookie Policy", href: "/legal/cookies" },
      { label: "Security & Compliance", href: "/legal/security" },
    ],
  },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/bavio.ai/",
    icon: InstagramLogo,
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/BavioAi",
    icon: XLogo,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/bavio-ai-a34bb93ba/",
    icon: LinkedinLogo,
  },
];

export default function Footer({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <footer className={`relative border-t ${dark ? 'border-darkBorder bg-darkBg text-darkText' : 'border-line-subtle bg-canvas'}`}>
      <div className="max-w-container mx-auto px-6 lg:px-8 pt-20 pb-10">
        {/* Top section: brand + newsletter | link columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12">
          {/* Brand + newsletter column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <Logo className="w-9 h-9 transition-transform duration-300 ease-premium group-hover:scale-105" color="text-saffron" />
              <span className={`font-display text-xl font-extrabold tracking-tight ${dark ? 'text-darkText' : 'text-ink'}`}>
                Bavio AI
              </span>
            </Link>

            <p className={`text-body-sm max-w-xs leading-relaxed ${dark ? 'text-darkTextMuted' : 'text-ink-tertiary'}`}>
              Autonomous AI voice receptionists for business calls. Answer every call.
              Capture every lead. 24/7.
            </p>

            {/* Newsletter */}
            <div className="flex flex-col gap-2.5">
              <span className={`text-label uppercase tracking-widest ${dark ? 'text-darkTextMuted/80' : 'text-ink-muted'}`}>
                Product updates
              </span>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="hello@bavio.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`flex-1 rounded-button px-4 py-2.5 text-body-sm focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 transition-all duration-200 ${
                    dark 
                      ? 'bg-darkSurface border-darkBorder text-darkText placeholder:text-darkTextMuted' 
                      : 'bg-surface border-line text-ink placeholder:text-ink-muted'
                  }`}
                />
                <button
                  type="submit"
                  className="bg-saffron hover:bg-saffron-hover text-white px-4 py-2.5 rounded-button text-body-sm font-semibold transition-all duration-200 active:scale-[0.97] flex items-center gap-1.5 shrink-0"
                >
                  {subscribed ? "Sent" : "Join"}
                  {!subscribed && (
                    <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                  )}
                </button>
              </form>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all duration-200 ${
                      dark 
                        ? 'border-darkBorder text-darkTextMuted hover:text-saffron hover:border-saffron/30' 
                        : 'border-line text-ink-muted hover:text-saffron hover:border-saffron-border'
                    }`}
                  >
                    <Icon className="w-4 h-4" weight="regular" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-10 lg:gap-8">
            {footerColumns.map((col) => (
              <div key={col.heading} className="flex flex-col gap-4">
                <span className={`text-label uppercase tracking-widest ${dark ? 'text-darkTextMuted/80' : 'text-ink-muted'}`}>
                  {col.heading}
                </span>
                <nav className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`text-body-sm transition-colors duration-200 ${
                        dark 
                          ? 'text-darkTextMuted hover:text-darkText' 
                          : 'text-ink-tertiary hover:text-ink'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className={`mt-16 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${dark ? 'border-darkBorder' : 'border-line-subtle'}`}>
          <p className={`text-body-xs ${dark ? 'text-darkTextMuted' : 'text-ink-muted'}`}>
            2026 Bavio AI. All rights reserved.
          </p>
          <p className={`text-body-xs ${dark ? 'text-darkTextMuted' : 'text-ink-muted'}`}>
            Bavio AI | Global AI Receptionist
          </p>
        </div>
      </div>
    </footer>
  );
}
