import React from "react";

export default function CookiesPolicy() {
  return (
    <div className="w-full relative flex justify-center py-6">
      <div className="w-full max-w-3xl px-6 py-10 md:px-12 md:py-16 text-left bg-surface border border-line rounded-3xl shadow-premium">
        <span className="text-body-xs font-bold uppercase tracking-widest text-saffron bg-saffron-muted px-3.5 py-1.5 rounded-full mb-6 border border-saffron-border inline-block">
          Legal Documents
        </span>
        <h1 className="font-display font-extrabold text-display-lg text-ink mb-6 leading-tight">
          Cookie <span className="text-saffron">Policy</span>
        </h1>
        <p className="text-body-xs text-ink-muted mb-10 uppercase tracking-wider">
          Last Updated: June 2026
        </p>

        <div className="flex flex-col gap-6 text-body-sm text-ink-tertiary leading-relaxed">
          <p>
            Bavio AI uses cookies and local browser storage to run our web interfaces, authenticate developer dashboards, and improve performance.
          </p>

          <h3 className="font-bold text-heading-sm text-ink mt-6 mb-2">1. Essential Cookies</h3>
          <p>
            These cookies are strictly required to support user sessions, protect accounts, and authenticate dashboard operations. Removing or blocking essential cookies will break session routing.
          </p>

          <h3 className="font-bold text-heading-sm text-ink mt-6 mb-2">2. Analytics & Preference Cookies</h3>
          <p>
            We use basic analysis scripts to track usage volumes, click flows, and currency preference settings (INR vs USD) to serve optimized resources.
          </p>

          <h3 className="font-bold text-heading-sm text-ink mt-6 mb-2">3. Modifying Cookie Settings</h3>
          <p>
            You can modify your browser settings to decline or accept cookies. Declining analytics cookies will not affect dashboard operations.
          </p>
        </div>
      </div>
    </div>
  );
}
