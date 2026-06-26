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
                bavio
              </span>
            </Link>
            <p className="text-xs text-[#6B5A4C] leading-relaxed max-w-[200px]">
              Autonomous AI voice receptionists for Indian SMBs. Answer, qualify, and capture leads 24x7.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-[11px] text-[#140A02] font-bold uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs text-[#6B5A4C]">
              <li><Link href="/how-it-works" className="hover:text-[#F97316] transition-colors">How it Works</Link></li>
              <li><Link href="/pricing" className="hover:text-[#F97316] transition-colors">Pricing</Link></li>
              <li><Link href="/demo" className="hover:text-[#F97316] transition-colors">Demo</Link></li>
              <li><Link href="/pricing#faq" className="hover:text-[#F97316] transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-[11px] text-[#140A02] font-bold uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5 text-xs text-[#6B5A4C]">
              <li><Link href="/company" className="hover:text-[#F97316] transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="hover:text-[#F97316] transition-colors">Careers</Link></li>
              <li><Link href="/blog" className="hover:text-[#F97316] transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Resources links */}
          <div>
            <h4 className="text-[11px] text-[#140A02] font-bold uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2.5 text-xs text-[#6B5A4C]">
              <li><Link href="/docs" className="hover:text-[#F97316] transition-colors">Documentation</Link></li>
              <li><Link href="/api" className="hover:text-[#F97316] transition-colors">API</Link></li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-[11px] text-[#140A02] font-bold uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2.5 text-xs text-[#6B5A4C]">
              <li><Link href="/legal/privacy" className="hover:text-[#F97316] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/terms" className="hover:text-[#F97316] transition-colors">Terms of Service</Link></li>
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
