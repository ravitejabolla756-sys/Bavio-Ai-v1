import React from "react";

export default function TermsOfService() {
  return (
    <div className="w-full relative flex justify-center py-6">
      <div className="w-full max-w-3xl px-6 py-10 md:px-12 md:py-16 text-left bg-white border border-[#F3E4D4] rounded-3xl shadow-sm">
        <span className="text-body-xs font-bold uppercase tracking-widest text-[#FF6B00] bg-[#FFF7ED] px-3.5 py-1.5 rounded-full mb-6 border border-[#F3E4D4] inline-block">
          Legal Documents
        </span>
        <h1 className="font-display font-extrabold text-display-lg text-[#140A02] mb-6 leading-tight">
          Terms of <span className="text-[#FF6B00]">Service</span>
        </h1>
        <p className="text-body-xs text-[#6E6256] mb-10 uppercase tracking-wider">
          Last Updated: June 2026
        </p>

        <div className="flex flex-col gap-6 text-body-sm text-[#6B5A4C] leading-relaxed">
          <p>
            Please review these Terms of Service (&quot;Terms&quot;) carefully before using the Bavio AI platform, APIs, or voice services. By accessing or using the platform, you agree to comply with these terms.
          </p>

          <h3 className="font-bold text-heading-sm text-[#140A02] mt-6 mb-2">1. Subscription & Account Terms</h3>
          <p>
            You must provide valid, accurate registration details to create an account. You are responsible for keeping your API secret credentials and dashboard logins secure.
          </p>

          <h3 className="font-bold text-heading-sm text-[#140A02] mt-6 mb-2">2. Billing & Overages</h3>
          <p>
            Bavio AI subscriptions are billed monthly. Overage minutes beyond the plan budget are calculated on a per-minute rate and billed at the end of the billing cycle. Failure to settle outstanding invoices may result in temporary suspension of voice services.
          </p>

          <h3 className="font-bold text-heading-sm text-[#140A02] mt-6 mb-2">3. Acceptable Use</h3>
          <p>
            You agree not to use the voice services for unauthorized outbound spam marketing, robocalls, fraud, or violation of local telecommunication guidelines.
          </p>

          <h3 className="font-bold text-heading-sm text-[#140A02] mt-6 mb-2">4. Uptime SLA</h3>
          <p>
            We offer a 99.9% uptime SLA on our call processing pipelines. If uptime drops below the guaranteed SLA, you are eligible for service credits as outlined in our SLA policy document.
          </p>
        </div>
      </div>
    </div>
  );
}
