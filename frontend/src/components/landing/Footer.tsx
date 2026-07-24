"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="bg-[#FFFDF8] border-t border-[#F3E4D4] py-16 w-full font-sans">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 text-left mb-12">
          {/* Logo & Pitch */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <Logo className="w-9 h-9" />
              <span className="font-display text-xl font-extrabold tracking-tight text-[#140A02]">
                Bavio
              </span>
            </Link>
            <p className="text-xs text-[#6B5A4C] leading-relaxed max-w-[200px]">
              AI receptionists for inbound business calls. Answer enquiries, qualify leads and organize conversations.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-[12px] text-[#140B06] font-bold uppercase tracking-wider mb-4 font-sans">Product</h4>
            <ul className="space-y-2.5 text-sm text-[#6B5A4C] font-sans">
              <li><Link href="/how-it-works" className="hover:text-[#FF6B00] transition-colors">How It Works</Link></li>
              <li><Link href="/pricing" className="hover:text-[#FF6B00] transition-colors">Pricing</Link></li>
              <li><Link href="/demo" className="hover:text-[#FF6B00] transition-colors">Demo</Link></li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-[12px] text-[#140B06] font-bold uppercase tracking-wider mb-4 font-sans">Company</h4>
            <ul className="space-y-2.5 text-sm text-[#6B5A4C] font-sans">
              <li><Link href="/company" className="hover:text-[#FF6B00] transition-colors">About</Link></li>
              <li><Link href="/company#contact" className="hover:text-[#FF6B00] transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-[12px] text-[#140B06] font-bold uppercase tracking-wider mb-4 font-sans">Legal</h4>
            <ul className="space-y-2.5 text-sm text-[#6B5A4C] font-sans">
              <li><Link href="/privacy" className="hover:text-[#FF6B00] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#FF6B00] transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund-policy" className="hover:text-[#FF6B00] transition-colors">Refund Policy</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-[#FF6B00] transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4 className="text-[12px] text-[#140B06] font-bold uppercase tracking-wider mb-4 font-sans">Support</h4>
            <ul className="space-y-2.5 text-sm text-[#6B5A4C] font-sans">
              <li><a href="mailto:hello@bavio.in" className="hover:text-[#FF6B00] transition-colors font-bold">hello@bavio.in</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#F3E4D4]/60 pt-8 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-[11px] text-[#6B5A4C]/70 font-medium">
            Copyright &copy; 2026 Bavio
          </p>
        </div>
      </div>
    </footer>
  );
}
