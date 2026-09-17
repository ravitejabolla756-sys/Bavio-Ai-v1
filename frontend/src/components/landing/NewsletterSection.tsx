"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.4 });
  const shouldReduceMotion = useReducedMotion();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <section
      ref={sectionRef}
      className="w-full bg-[#FFFDF8] border-t border-[#E7E0D6] py-20 lg:py-28 font-sans overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT COLUMN: Headline, Copy, Form */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif tracking-tight text-[#0A0A0A] font-normal leading-[1.15]">
                Subscribe for updates
              </h2>
              <p className="text-base md:text-lg text-[#5F5A52] leading-relaxed max-w-lg font-sans">
                Get the latest Bavio product updates, launch notes, and new features in your inbox.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md pt-2">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-full px-5 py-3.5 text-sm bg-white border border-[#E7E0D6] text-[#0A0A0A] placeholder:text-[#8A847A] focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition-all shadow-sm"
              />
              <button
                type="submit"
                className="bg-[#FF6B00] hover:bg-[#E56000] text-white px-7 py-3.5 rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 shadow-sm"
              >
                {subscribed ? (
                  <>
                    <span>Subscribed</span>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-[#8A847A] font-medium flex items-center gap-1.5">
              <span>No spam. Unsubscribe anytime.</span>
            </p>
          </div>

          {/* RIGHT COLUMN: Envelope Illustration with One-Time Scroll Animation */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[360px] sm:max-w-[420px] lg:max-w-[500px]">
              
              {/* Envelope + Paper Plane Illustration */}
              <motion.div
                initial={shouldReduceMotion ? { opacity: 1, y: 0, x: 0, scale: 1 } : { opacity: 0, y: 24, x: -20, scale: 0.95 }}
                animate={isInView || shouldReduceMotion ? { opacity: 1, y: 0, x: 0, scale: 1 } : {}}
                transition={{
                  duration: shouldReduceMotion ? 0 : 1.5,
                  ease: [0.16, 1, 0.3, 1], // Smooth ease-out
                }}
                className="relative z-10 w-full h-auto"
              >
                <Image
                  src="/images/newsletter-envelope.png"
                  alt="Bavio Newsletter Envelope Illustration"
                  width={1000}
                  height={667}
                  priority
                  className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-sm"
                />

                {/* Subtle Orange Trail Dots behind the paper plane path */}
                {!shouldReduceMotion && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={isInView ? { opacity: [0, 0.85, 0.5], scale: [0.5, 1.05, 1] } : {}}
                    transition={{ duration: 1.4, delay: 0.45, ease: "easeOut" }}
                    className="absolute top-[23%] right-[19%] pointer-events-none flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#FF6B00]/70" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]/50" />
                    <span className="w-1 h-1 rounded-full bg-[#FF6B00]/30" />
                  </motion.div>
                )}
              </motion.div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
