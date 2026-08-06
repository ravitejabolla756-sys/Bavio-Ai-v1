"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import {
  LinkedinLogo,
  XLogo,
  GithubLogo,
  Envelope,
} from "@phosphor-icons/react";

const footerColumns = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/product" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
      { label: "Security", href: "/legal/security" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/company" },
      { label: "Customers", href: "/customers" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Cookie Policy", href: "/legal/cookies" },
      { label: "Compliance", href: "/legal/security" },
    ],
  },
];

const socialLinks = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/bavio-ai-a34bb93ba/",
    icon: LinkedinLogo,
  },
  {
    label: "Twitter",
    href: "https://x.com/BavioAi",
    icon: XLogo,
  },
  {
    label: "GitHub",
    href: "https://github.com",
    icon: GithubLogo,
  },
  {
    label: "Email",
    href: "mailto:hello@bavio.ai",
    icon: Envelope,
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-[#F3E4D4] bg-[#FFFDF8] font-sans">
      <div className="max-w-container mx-auto px-6 lg:px-8 pt-20 pb-10">
        {/* Final CTA Block */}
        <div className="flex flex-col items-center text-center pb-20 border-b border-[#F3E4D4]/60 mb-16">
          <h2 className="font-display text-3xl md:text-[36px] font-extrabold text-[#140A02] tracking-tight mb-4">
            Ready to answer every call?
          </h2>
          <p className="text-[#6E6256] text-body-md max-w-md mb-8">
            Start your free trial. No credit card needed.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-sm font-bold px-8 py-3.5 rounded-full shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              Try Free for 14 Days
            </Link>
            <Link
              href="/contact"
              className="text-[#FF6B00] hover:underline text-body-xs font-semibold"
            >
              Schedule a demo
            </Link>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 items-start">
          {/* Brand Info */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <Logo className="w-10 h-10 transition-transform duration-300 ease-premium group-hover:scale-105" color="text-[#FF6B00]" />
              <span className="font-display text-2xl font-extrabold tracking-tight text-[#140A02] group-hover:text-[#FF6B00] transition-colors">
                bavio
              </span>
            </Link>
            <p className="text-body-sm text-[#6E6256] max-w-sm leading-relaxed">
              Deploy autonomous voice receptionists that qualify leads, schedule bookings, and sync with your CRM 24/7.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full border border-[#F3E4D4] flex items-center justify-center text-[#6E6256] hover:text-[#FF6B00] hover:border-[#FF6B00] transition-all duration-250 hover:scale-105 active:scale-95"
                  >
                    <Icon className="w-5 h-5" weight="bold" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links Columns */}
          {footerColumns.map((col) => (
            <div key={col.heading} className="flex flex-col gap-5">
              <span className="text-label uppercase tracking-widest text-[#140A02]/50 font-bold">
                {col.heading}
              </span>
              <nav className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-body-sm text-[#6E6256] hover:text-[#FF6B00] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom copyright */}
        <div className="mt-16 pt-8 border-t border-[#F3E4D4]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-body-xs text-[#6E6256]/50">
            © 2026 Bavio AI. All rights reserved.
          </p>
          <p className="text-body-xs text-[#6E6256]/50 font-medium">
            Made for global teams.
          </p>
        </div>
      </div>
    </footer>
  );
}
