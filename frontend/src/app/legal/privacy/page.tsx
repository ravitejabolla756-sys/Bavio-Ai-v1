import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="w-full relative flex justify-center py-6">
      <div className="w-full max-w-3xl px-6 py-10 md:px-12 md:py-16 text-left bg-white border border-[#F3E4D4] rounded-3xl shadow-sm">
        <span className="text-body-xs font-bold uppercase tracking-widest text-[#FF6B00] bg-[#FFF7ED] px-3.5 py-1.5 rounded-full mb-6 border border-[#F3E4D4] inline-block">
          Legal Documents
        </span>
        <h1 className="font-display font-extrabold text-display-lg text-[#140A02] mb-6 leading-tight">
          Privacy <span className="text-[#FF6B00]">Policy</span>
        </h1>
        <p className="text-body-xs text-[#6E6256] mb-10 uppercase tracking-wider">
          Last Updated: June 2026
        </p>

        <div className="flex flex-col gap-6 text-body-sm text-[#6B5A4C] leading-relaxed">
          <p>
            Bavio AI (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) values the privacy of our corporate clients and their end callers. This Privacy Policy details how we collect, process, and secure call recordings, transcripts, and metadata during the operations of our autonomous voice agent platform.
          </p>

          <h3 className="font-bold text-heading-sm text-[#140A02] mt-6 mb-2">1. Data We Collect</h3>
          <p>
            We process data on behalf of our clients. This data includes:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-2 text-[#6B5A4C]">
            <li>Call audio streams and temporary recording files.</li>
            <li>Real-time voice transcripts.</li>
            <li>Structured contact card information (Names, intent, phone numbers, budgets).</li>
          </ul>

          <h3 className="font-bold text-heading-sm text-[#140A02] mt-6 mb-2">2. Processing Consent</h3>
          <p>
            Our clients are solely responsible for acquiring valid processing consents from end callers where required by local regulations (such as GDPR or data privacy guidelines).
          </p>

          <h3 className="font-bold text-heading-sm text-[#140A02] mt-6 mb-2">3. Data Security & Storage</h3>
          <p>
            All transcript records are end-to-end encrypted at rest and in transit. By default, data is hosted in secure, ISO-certified local sovereign clouds depending on client configuration options.
          </p>

          <h3 className="font-bold text-heading-sm text-[#140A02] mt-6 mb-2">4. Client Rights & Deletion</h3>
          <p>
            Clients can purge call records and lead transcripts instantly from their dashboard at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
