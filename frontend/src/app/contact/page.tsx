"use client";

import React, { useState } from "react";
import { Envelope, Phone, MapPin, CheckCircle, InstagramLogo, XLogo, LinkedinLogo } from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Contact() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "sales",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-canvas text-ink">
      <Navbar />
      <main className="flex-1 w-full relative flex flex-col items-center pt-28 pb-20">
        <section className="w-full max-w-7xl px-6 text-center flex flex-col items-center">
          <span className="text-body-xs font-bold uppercase tracking-widest text-saffron bg-saffron-muted px-3.5 py-1.5 rounded-full mb-6 border border-saffron-border">
            Get in Touch
          </span>
          <h1 className="font-display font-extrabold text-display-lg md:text-display-xl text-ink mb-6 max-w-3xl leading-[1.08] tracking-tight">
            Sales & Partnership <span className="text-saffron">Inquiries</span>
          </h1>
          <p className="text-body-lg text-ink-tertiary mb-12 max-w-xl leading-relaxed">
            Contact our team for billing arrangements, customized voice alignments, or integration partnerships.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full max-w-4xl text-left items-start">
            {/* Left Cards */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <a href="mailto:hello@bavio.in" className="bg-surface border border-line rounded-2xl p-6 shadow-premium hover:border-saffron/30 transition-all block group">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-saffron-muted text-saffron rounded-xl flex items-center justify-center border border-saffron-border group-hover:scale-105 transition-transform">
                    <Envelope className="w-5 h-5" weight="regular" />
                  </div>
                  <div>
                    <h4 className="font-bold text-body-xs uppercase tracking-wider text-ink-tertiary">General Support</h4>
                    <span className="text-body-sm font-semibold text-ink mt-0.5 block hover:text-saffron transition-colors">hello@bavio.in</span>
                  </div>
                </div>
              </a>

              <a href="mailto:raviteja@bavio.in" className="bg-surface border border-line rounded-2xl p-6 shadow-premium hover:border-saffron/30 transition-all block group">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-saffron-muted text-saffron rounded-xl flex items-center justify-center border border-saffron-border group-hover:scale-105 transition-transform">
                    <Envelope className="w-5 h-5" weight="regular" />
                  </div>
                  <div>
                    <h4 className="font-bold text-body-xs uppercase tracking-wider text-ink-tertiary">Founder Contact</h4>
                    <span className="text-body-sm font-semibold text-ink mt-0.5 block hover:text-saffron transition-colors">raviteja@bavio.in</span>
                  </div>
                </div>
              </a>

              <a href="mailto:praneeth@bavio.in" className="bg-surface border border-line rounded-2xl p-6 shadow-premium hover:border-saffron/30 transition-all block group">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-saffron-muted text-saffron rounded-xl flex items-center justify-center border border-saffron-border group-hover:scale-105 transition-transform">
                    <Envelope className="w-5 h-5" weight="regular" />
                  </div>
                  <div>
                    <h4 className="font-bold text-body-xs uppercase tracking-wider text-ink-tertiary">Business & Partnerships</h4>
                    <span className="text-body-sm font-semibold text-ink mt-0.5 block hover:text-saffron transition-colors">praneeth@bavio.in</span>
                  </div>
                </div>
              </a>

              <div className="bg-surface border border-line rounded-2xl p-6 shadow-premium">
                <h4 className="font-bold text-body-xs uppercase tracking-wider text-ink-tertiary mb-3.5">Official Socials</h4>
                <div className="flex items-center gap-3">
                  {[
                    { icon: InstagramLogo, url: "https://www.instagram.com/bavio.ai/", label: "Instagram" },
                    { icon: XLogo, url: "https://x.com/BavioAi", label: "X (Twitter)" },
                    { icon: LinkedinLogo, url: "https://www.linkedin.com/in/bavio-ai-a34bb93ba/", label: "LinkedIn" }
                  ].map((social, sIdx) => {
                    const SocialIcon = social.icon;
                    return (
                      <a
                        key={sIdx}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="w-10 h-10 rounded-xl border border-line flex items-center justify-center text-ink-muted hover:text-saffron hover:border-saffron-border hover:bg-saffron/5 transition-all"
                      >
                        <SocialIcon className="w-5 h-5" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Form */}
            <div className="lg:col-span-7 w-full">
              {formSubmitted ? (
                <div className="bg-surface border border-line rounded-3xl p-8 text-center shadow-premium flex flex-col items-center gap-4">
                  <CheckCircle className="w-16 h-16 text-state-success animate-bounce" weight="fill" />
                  <h3 className="font-display font-extrabold text-heading-lg text-ink">Inquiry Sent</h3>
                  <p className="text-body-sm text-ink-tertiary max-w-sm">
                    We have received your message. A client success manager will email you at <span className="font-semibold text-ink">{formData.email}</span> within 2 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-3xl p-8 shadow-premium flex flex-col gap-6 w-full">
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-body-xs font-bold uppercase tracking-wider text-ink-tertiary">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Sarah Jenkins"
                      className="bg-surface-raised border border-line rounded-xl px-4 py-3 text-body-sm focus:outline-none focus:border-saffron text-ink placeholder:text-ink-muted"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-body-xs font-bold uppercase tracking-wider text-ink-tertiary">Work Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="e.g. sarah@acmerealty.com"
                      className="bg-surface-raised border border-line rounded-xl px-4 py-3 text-body-sm focus:outline-none focus:border-saffron text-ink placeholder:text-ink-muted"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-body-xs font-bold uppercase tracking-wider text-ink-tertiary">Inquiry Type</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="bg-surface-raised border border-line rounded-xl px-4 py-3 text-body-sm focus:outline-none focus:border-saffron text-ink"
                    >
                      <option value="sales">Sales & Custom Quote</option>
                      <option value="developer">Developer Integration Help</option>
                      <option value="partnership">Business Partnership</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-body-xs font-bold uppercase tracking-wider text-ink-tertiary">Message</label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      rows={4}
                      placeholder="What questions can we answer for you?"
                      className="bg-surface-raised border border-line rounded-xl px-4 py-3 text-body-sm focus:outline-none focus:border-saffron text-ink placeholder:text-ink-muted resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-saffron text-white py-4 rounded-xl font-bold uppercase tracking-wider text-body-xs shadow-saffron hover:bg-saffron-hover transition-all"
                  >
                    Send Message
                  </button>

                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
