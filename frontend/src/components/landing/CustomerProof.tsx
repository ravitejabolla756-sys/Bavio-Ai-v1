"use client";

import React from "react";

export default function CustomerProof() {
  if (process.env.NEXT_PUBLIC_SHOW_CUSTOMER_PROOF !== 'true') {
    return null;
  }

  return (
    <section className="py-24 bg-[#FFFDF8] border-b border-[#F3E4D4] w-full text-center">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        <h2 className="font-display text-3xl font-bold text-[#140A02] mb-4">
          Trusted by Businesses Like Yours
        </h2>
        <p className="text-[#6B5A4C] text-sm max-w-lg mx-auto">
          Customer logos and real testimonials will be displayed here once verified business proof is available.
        </p>
      </div>
    </section>
  );
}
