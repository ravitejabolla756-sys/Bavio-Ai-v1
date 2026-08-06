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
    <div className="theme-bavio-light flex flex-col min-h-[100dvh] bg-[#FFFDF8] text-[#140A02] font-sans selection:bg-[#FF6B00]/15 selection:text-[#FF6B00]">
      <Navbar />
      <main className="flex-1 w-full relative flex flex-col items-center pt-28 pb-20">
        
        {/* Ambient mesh blobs */}
        <div className="absolute top-[5%] -left-[15%] w-[600px] h-[600px] rounded-full bg-[#F97316] opacity-[0.06] filter blur-[120px] pointer-events-none" />
        <div className="absolute top-[40%] -right-[12%] w-[500px] h-[500px] rounded-full bg-[#EA580C] opacity-[0.06] filter blur-[130px] pointer-events-none" />

        <section className="w-full max-w-7xl px-6 text-center flex flex-col items-center relative z-10">
          <span className="text-body-xs font-bold uppercase tracking-widest text-[#FF6B00] bg-[#FFF7ED] px-3.5 py-1.5 rounded-full mb-6 border border-[#F3E4D4]">
            Get in Touch
          </span>
          <h1 className="font-display font-extrabold text-display-lg md:text-display-xl text-[#140A02] mb-6 max-w-3xl leading-[1.08] tracking-tight">
            Sales & Partnership <span className="text-[#FF6B00]">Inquiries</span>
          </h1>
          <p className="text-body-lg text-[#6B5A4C] mb-12 max-w-xl leading-relaxed">
            Contact our team for billing arrangements, customized voice alignments, or partnership inquiries.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full max-w-4xl text-left items-start">
            {/* Left Cards */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <a href="mailto:hello@bavio.in" className="bg-white border border-[#F3E4D4] rounded-2xl p-6 shadow-sm hover:border-[#FF6B00]/30 transition-all block group hover:shadow-md">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-[#FFF7ED] text-[#FF6B00] rounded-xl flex items-center justify-center border border-[#F3E4D4] group-hover:scale-105 transition-transform">
                    <Envelope className="w-5 h-5" weight="regular" />
                  </div>
                  <div>
                    <h4 className="font-bold text-body-xs uppercase tracking-wider text-[#6B5A4C]">General Support</h4>
                    <span className="text-body-sm font-semibold text-[#140A02] mt-0.5 block hover:text-[#FF6B00] transition-colors">hello@bavio.in</span>
                  </div>
                </div>
              </a>

              <a href="mailto:raviteja@bavio.in" className="bg-white border border-[#F3E4D4] rounded-2xl p-6 shadow-sm hover:border-[#FF6B00]/30 transition-all block group hover:shadow-md">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-[#FFF7ED] text-[#FF6B00] rounded-xl flex items-center justify-center border border-[#F3E4D4] group-hover:scale-105 transition-transform">
                    <Envelope className="w-5 h-5" weight="regular" />
                  </div>
                  <div>
                    <h4 className="font-bold text-body-xs uppercase tracking-wider text-[#6B5A4C]">Founder Contact</h4>
                    <span className="text-body-sm font-semibold text-[#140A02] mt-0.5 block hover:text-[#FF6B00] transition-colors">raviteja@bavio.in</span>
                  </div>
                </div>
              </a>

              <a href="mailto:praneeth@bavio.in" className="bg-white border border-[#F3E4D4] rounded-2xl p-6 shadow-sm hover:border-[#FF6B00]/30 transition-all block group hover:shadow-md">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-[#FFF7ED] text-[#FF6B00] rounded-xl flex items-center justify-center border border-[#F3E4D4] group-hover:scale-105 transition-transform">
                    <Envelope className="w-5 h-5" weight="regular" />
                  </div>
                  <div>
                    <h4 className="font-bold text-body-xs uppercase tracking-wider text-[#6B5A4C]">Business & Partnerships</h4>
                    <span className="text-body-sm font-semibold text-[#140A02] mt-0.5 block hover:text-[#FF6B00] transition-colors">praneeth@bavio.in</span>
                  </div>
                </div>
              </a>

              <div className="bg-white border border-[#F3E4D4] rounded-2xl p-6 shadow-sm">
                <h4 className="font-bold text-body-xs uppercase tracking-wider text-[#6B5A4C] mb-3.5">Official Socials</h4>
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
                        className="w-10 h-10 rounded-xl border border-[#F3E4D4] flex items-center justify-center text-[#6E6256] hover:text-[#FF6B00] hover:border-[#FF6B00]/40 hover:bg-[#FFF7ED]/40 transition-all"
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
                <div className="bg-white border border-[#F3E4D4] rounded-3xl p-8 text-center shadow-sm flex flex-col items-center gap-4">
                  <CheckCircle className="w-16 h-16 text-[#10B981] animate-bounce" weight="fill" />
                  <h3 className="font-display font-extrabold text-heading-lg text-[#140A02]">Inquiry Sent</h3>
                  <p className="text-body-sm text-[#6B5A4C] max-w-sm">
                    We have received your message. A client success manager will email you at <span className="font-semibold text-[#140A02]">{formData.email}</span> within 2 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white border border-[#F3E4D4] rounded-3xl p-8 shadow-sm flex flex-col gap-6 w-full">
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-body-xs font-bold uppercase tracking-wider text-[#6B5A4C]">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Sarah Jenkins"
                      className="bg-[#FAF7F2] border border-[#F3E4D4] rounded-xl px-4 py-3 text-body-sm focus:outline-none focus:border-[#FF6B00] text-[#140A02] placeholder:text-[#6E6256]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-body-xs font-bold uppercase tracking-wider text-[#6B5A4C]">Work Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="e.g. sarah@acmerealty.com"
                      className="bg-[#FAF7F2] border border-[#F3E4D4] rounded-xl px-4 py-3 text-body-sm focus:outline-none focus:border-[#FF6B00] text-[#140A02] placeholder:text-[#6E6256]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-body-xs font-bold uppercase tracking-wider text-[#6B5A4C]">Inquiry Type</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="bg-[#FAF7F2] border border-[#F3E4D4] rounded-xl px-4 py-3 text-body-sm focus:outline-none focus:border-[#FF6B00] text-[#140A02]"
                    >
                      <option value="sales">Sales & Custom Quote</option>
                      <option value="developer">Technical Support</option>
                      <option value="partnership">Business Partnership</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-body-xs font-bold uppercase tracking-wider text-[#6B5A4C]">Message</label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      rows={4}
                      placeholder="What questions can we answer for you?"
                      className="bg-[#FAF7F2] border border-[#F3E4D4] rounded-xl px-4 py-3 text-body-sm focus:outline-none focus:border-[#FF6B00] text-[#140A02] placeholder:text-[#6E6256] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#FF6B00] hover:bg-[#FF8C3A] text-white py-4 rounded-xl font-bold uppercase tracking-wider text-body-xs shadow-[0_8px_24px_rgba(255,107,0,0.25)] transition-all"
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
