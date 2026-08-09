import React from "react";

export default function RefundPolicy() {
  return (
    <div className="w-full relative flex justify-center py-6">
      <div className="w-full max-w-3xl px-6 py-10 md:px-12 md:py-16 text-left bg-surface border border-line rounded-3xl shadow-premium">
        <span className="text-body-xs font-bold uppercase tracking-widest text-saffron bg-saffron-muted px-3.5 py-1.5 rounded-full mb-6 border border-saffron-border inline-block">
          Legal Documents
        </span>
        <h1 className="font-display font-extrabold text-display-lg text-ink mb-6 leading-tight">
          Refund <span className="text-saffron">Policy</span>
        </h1>
        <p className="text-body-xs text-ink-muted mb-10 uppercase tracking-wider">
          Last Updated: June 2026
        </p>

        <div className="flex flex-col gap-6 text-body-sm text-ink-tertiary leading-relaxed">
          <p>
            Bavio (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to providing a reliable voice answering platform. This Refund Policy describes the refund terms for monthly subscriptions and prepaid minute top-ups.
          </p>

          <h3 className="font-bold text-heading-sm text-ink mt-6 mb-2">1. Subscriptions</h3>
          <p>
            All subscription plans are billed on a monthly recurring basis. You may cancel your subscription at any time through your billing settings. Subscriptions are non-refundable, but you will retain access to your plan benefits until the end of the current billing cycle.
          </p>

          <h3 className="font-bold text-heading-sm text-ink mt-6 mb-2">2. Prepaid Minute Top-ups</h3>
          <p>
            Prepaid top-up minutes do not expire as long as your active subscription is maintained. Purchased top-up minutes are non-refundable. If you cancel your subscription, any remaining top-up minutes will be stored and become available again when you reactivate your subscription.
          </p>
        </div>
      </div>
    </div>
  );
}
