"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="bg-[#F7F4EE] border-t border-[#E7E0D6] py-16 w-full font-sans">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">

        {/* Footer Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 text-left mb-12">

          {/* Brand Identity */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <Logo className="w-8 h-8" />
              <span className="font-sans text-xl font-bold tracking-tight text-[#0A0A0A]">
                Bavio
              </span>
            </Link>
            <p className="text-xs text-[#706A63] leading-relaxed max-w-[220px]">
              Autonomous AI voice agents for business calls. Answer inquiries, qualify leads, and trigger automated workflows 24/7.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-mono font-bold text-[#0A0A0A] uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm text-[#706A63] font-medium">
              <li><Link href="/product#builder" className="hover:text-[#FF6B00] transition-colors">Agent Builder</Link></li>
              <li><Link href="/product#voice" className="hover:text-[#FF6B00] transition-colors">Live Voice Engine</Link></li>
              <li><Link href="/product#actions" className="hover:text-[#FF6B00] transition-colors">Action Trace</Link></li>
              <li><Link href="/product#telephony" className="hover:text-[#FF6B00] transition-colors">Phone Numbers</Link></li>
            </ul>
          </div>

          {/* Solutions links */}
          <div>
            <h4 className="text-xs font-mono font-bold text-[#0A0A0A] uppercase tracking-wider mb-4">Solutions</h4>
            <ul className="space-y-2.5 text-sm text-[#706A63] font-medium">
              <li><Link href="/solutions#sales" className="hover:text-[#FF6B00] transition-colors">Sales Qualification</Link></li>
              <li><Link href="/solutions#appointments" className="hover:text-[#FF6B00] transition-colors">Appointment Booking</Link></li>
              <li><Link href="/solutions#support" className="hover:text-[#FF6B00] transition-colors">Customer Reception</Link></li>
              <li><Link href="/industries/real-estate" className="hover:text-[#FF6B00] transition-colors">Real Estate &amp; Home Services</Link></li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-xs font-mono font-bold text-[#0A0A0A] uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm text-[#706A63] font-medium">
              <li><Link href="/company" className="hover:text-[#FF6B00] transition-colors">About Us</Link></li>
              <li><Link href="/pricing" className="hover:text-[#FF6B00] transition-colors">Pricing</Link></li>
              <li><Link href="/how-it-works" className="hover:text-[#FF6B00] transition-colors">Resources</Link></li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-xs font-mono font-bold text-[#0A0A0A] uppercase tracking-wider mb-4">Legal &amp; Support</h4>
            <ul className="space-y-2.5 text-sm text-[#706A63] font-medium">
              <li><Link href="/legal/privacy" className="hover:text-[#FF6B00] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/terms" className="hover:text-[#FF6B00] transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/cookies" className="hover:text-[#FF6B00] transition-colors">Cookie Policy</Link></li>
              <li><Link href="/legal/refund-policy" className="hover:text-[#FF6B00] transition-colors">Refund Policy</Link></li>
              <li><Link href="/legal" className="hover:text-[#FF6B00] transition-colors">Legal library</Link></li>
              <li><a href="mailto:hello@bavio.in" className="hover:text-[#FF6B00] transition-colors font-bold text-[#0A0A0A]">hello@bavio.in</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#E7E0D6] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-[#706A63]">
          <p>
            © 2026 Bavio. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
