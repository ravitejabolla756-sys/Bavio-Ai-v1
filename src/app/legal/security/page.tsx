"use client";

import React from "react";
import { Lock, ShieldCheck } from "@phosphor-icons/react";

export default function SecurityPolicy() {
  return (
    <div className="w-full relative flex justify-center py-6">
      <div className="w-full max-w-3xl px-6 py-10 md:px-12 md:py-16 text-left bg-white border border-[#F3E4D4] rounded-3xl shadow-sm">
        <span className="text-body-xs font-bold uppercase tracking-widest text-[#FF6B00] bg-[#FFF7ED] px-3.5 py-1.5 rounded-full mb-6 border border-[#F3E4D4] inline-block">
          Legal Documents
        </span>
        <h1 className="font-display font-extrabold text-display-lg text-[#140A02] mb-6 leading-tight">
          Security & <span className="text-[#FF6B00]">Compliance</span>
        </h1>
        <p className="text-body-xs text-[#6E6256] mb-10 uppercase tracking-wider">
          Last Updated: June 2026
        </p>

        <div className="flex flex-col gap-6 text-body-sm text-[#6B5A4C] leading-relaxed">
          <p>
            Bavio AI enforces enterprise-grade security protocols across all voice agents, call queues, data records, and notification systems to keep your business records safe.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div className="bg-[#FFF7ED]/30 border border-[#F3E4D4] p-5 rounded-2xl">
              <Lock className="w-6 h-6 text-[#FF6B00] mb-3" weight="regular" />
              <h4 className="font-bold text-body-sm text-[#140A02] mb-1">Data Encryption</h4>
              <p className="text-body-xs text-[#6B5A4C]">All call recordings and transcripts are end-to-end encrypted with AES-256 at rest and TLS 1.3 in transit.</p>
            </div>
            
            <div className="bg-[#FFF7ED]/30 border border-[#F3E4D4] p-5 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-[#FF6B00] mb-3" weight="regular" />
              <h4 className="font-bold text-body-sm text-[#140A02] mb-1">Compliance Audits</h4>
              <p className="text-body-xs text-[#6B5A4C]">SOC 2 Type II audit report, GDPR data mapping, and HIPAA physical storage audits conducted annually.</p>
            </div>
          </div>

          <h3 className="font-bold text-heading-sm text-[#140A02] mt-4 mb-2">1. Data Isolation</h3>
          <p>
            Customer transcripts and configuration models are isolated on a tenant-by-tenant basis. No data from call files is used to train shared public models, ensuring zero leak of commercial intelligence.
          </p>

          <h3 className="font-bold text-heading-sm text-[#140A02] mt-4 mb-2">2. Local Sovereign Storage</h3>
          <p>
            For regulated clients (such as hospitals or local insurance firms), we deploy call databases strictly on dedicated secure cloud regions, guaranteeing compliance with data residency acts.
          </p>
        </div>
      </div>
    </div>
  );
}
