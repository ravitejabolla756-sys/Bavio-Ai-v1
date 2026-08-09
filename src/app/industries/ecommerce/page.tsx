"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import IndustryProblem from "@/components/industries/IndustryProblem";
import IndustryFAQ from "@/components/industries/IndustryFAQ";
import IndustryCTA from "@/components/industries/IndustryCTA";
import {
  ArrowRight, PhoneCall, ShoppingCart, CheckCircle,
  Clock, UserList, ShieldCheck, Smiley,
} from "@phosphor-icons/react";

// ── DATA ──────────────────────────────────────────────────────────────────────

type OrderStatus = "in-transit" | "delivered" | "processing" | "resolved";

const recentOrders: { id: string; status: OrderStatus; note: string }[] = [
  { id: "#BV10482", status: "in-transit",  note: "Expected tomorrow" },
  { id: "#BV10479", status: "delivered",   note: "Delivered Aug 7"   },
  { id: "#BV10471", status: "processing",  note: "Est. Aug 11"        },
];

const statusConfig: Record<OrderStatus, { label: string; dot: string; text: string; bg: string; border: string }> = {
  "in-transit": { label: "In Transit",  dot: "bg-[#FF6B00] animate-pulse", text: "text-[#FF6B00]",  bg: "bg-[#FFF7ED]",  border: "border-[#FF6B00]/20" },
  "delivered":  { label: "Delivered",   dot: "bg-[#10B981]",               text: "text-[#059669]",  bg: "bg-[#FAF7F2]",  border: "border-transparent"  },
  "processing": { label: "Processing",  dot: "bg-[#8A7A6E]",               text: "text-[#6B5A4C]",  bg: "bg-white",       border: "border-[#EADFD3]"     },
  "resolved":   { label: "Resolved ✓",  dot: "bg-[#10B981]",               text: "text-[#059669]",  bg: "bg-[#ECFDF5]",  border: "border-[#10B981]/20"  },
};

const problems = [
  { title: "High Support Volume", desc: "Order enquiries, return requests, and product questions flood in simultaneously at scale.", iconKey: "missed" },
  { title: "Long Wait Times", desc: "Customers placed on hold or waiting for callbacks feel underserved and frustrated.", iconKey: "slow" },
  { title: "Repetitive Enquiries", desc: "The same questions about delivery status, returns, and availability repeat endlessly.", iconKey: "unqualified" },
  { title: "After-Hours Support", desc: "Customers shop and face issues at all hours — not just during your support team's working day.", iconKey: "lost" },
];

const faqs = [
  { question: "Can Bavio handle high call volumes during sale events?", answer: "Yes. Bavio runs on concurrent cloud infrastructure and handles unlimited simultaneous calls — so a spike in order enquiries during a sale never results in hold queues." },
  { question: "Can Bavio answer questions about order status?", answer: "Yes. You can configure Bavio to collect order numbers and log enquiries, which your team can resolve with full context using your logistics systems." },
  { question: "Can Bavio handle return and refund requests?", answer: "Yes. Bavio can collect the customer's details, order number, and reason for the return, generating a structured ticket for your support team to process." },
  { question: "Can Bavio answer product questions?", answer: "Yes. Bavio can be trained with your product catalogue, specifications, and availability information to accurately answer common product queries." },
  { question: "Can I use my existing customer support number?", answer: "Yes. Set up call forwarding from your current support number to Bavio — it handles calls when your team is offline or at capacity." },
  { question: "Can I customise how Bavio handles different query types?", answer: "Yes. From your workspace you can configure issue categories, escalation rules, and routing logic to match your specific support workflow." },
];

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function EcommercePage() {
  const [resolved, setResolved] = useState(false);

  const liveStatus = (id: string): OrderStatus => {
    if (id === "#BV10482" && resolved) return "resolved";
    return recentOrders.find((o) => o.id === id)!.status;
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased flex flex-col">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 md:px-8 w-full bg-gradient-to-b from-[#FFF7ED]/25 to-[#FFFDF8]">
        <div className="max-w-[1160px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* Left: Copy */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-[11px] font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-6">
              AI Voice Agent for E-commerce
            </span>
            <h1 className="font-display text-5xl md:text-6xl lg:text-[72px] font-normal tracking-[-0.03em] text-[#140A02] leading-[0.92] mb-6">
              Your Customers<br />Shouldn&apos;t Have<br />to Wait.
            </h1>
            <p className="text-lg text-[#6B5A4C] leading-relaxed mb-8 max-w-md font-sans">
              Bavio answers support calls, looks up order details, and helps your customers get answers — at any hour, at any scale.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#EA580C] text-white px-6 py-3.5 rounded-full font-bold text-sm transition-all shadow-sm hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)]">
                Get Started <ArrowRight className="w-4 h-4" weight="bold" />
              </Link>
              <Link href="/demo" className="inline-flex items-center gap-2 bg-white border border-[#EADFD3] text-[#140A02] px-6 py-3.5 rounded-full font-bold text-sm hover:border-[#FF6B00]/40 transition-all">
                <PhoneCall className="w-4 h-4 text-[#FF6B00]" weight="fill" /> Hear the AI
              </Link>
            </div>
          </motion.div>

          {/* Right: Order Tracking Visual */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <div className="bg-white rounded-[28px] border border-[#EADFD3] shadow-[0_8px_48px_rgba(20,10,2,0.07)] p-6">

              {/* Header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F3E4D4]/60">
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF6B00]">RECENT ORDERS</div>
                  <div className="text-sm font-bold text-[#140A02] mt-0.5">Customer Support Dashboard</div>
                </div>
                <div className="w-9 h-9 bg-[#FFF7ED] rounded-xl flex items-center justify-center border border-[#F3E4D4]">
                  <ShoppingCart className="w-[18px] h-[18px] text-[#FF6B00]" weight="bold" />
                </div>
              </div>

              {/* Order rows */}
              <div className="space-y-2.5 mb-4">
                {recentOrders.map((order, i) => {
                  const s = liveStatus(order.id);
                  const cfg = statusConfig[s];
                  return (
                    <motion.div key={order.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                      className={`rounded-2xl px-4 py-3 flex items-center gap-3 border transition-all duration-500 ${cfg.bg} ${cfg.border}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-[#140A02] font-mono">{order.id}</div>
                        <div className="text-[11px] text-[#6B5A4C]">{s === "resolved" && order.id === "#BV10482" ? "Customer notified · resolved" : order.note}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                        <span className={`text-[11px] font-bold ${cfg.text}`}>{cfg.label}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Support call */}
              {!resolved ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                  className="bg-[#140A02] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-[#FF6B00] flex items-center justify-center shrink-0">
                      <PhoneCall className="w-3 h-3 text-white" weight="fill" />
                    </div>
                    <span className="text-white text-[11px] font-bold uppercase tracking-wider">Support Call — Bavio</span>
                    <div className="ml-auto flex gap-1">
                      {[0, 0.15, 0.3].map((d, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" style={{ animationDelay: `${d}s` }} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="bg-white/10 rounded-xl px-3 py-2 text-[12px] text-white/80">
                      &ldquo;Where is my order? It was supposed to arrive two days ago.&rdquo;
                    </div>
                    <div className="bg-[#FF6B00]/20 border border-[#FF6B00]/15 rounded-xl px-3 py-2 text-[12px] text-[#FF9A50]">
                      &ldquo;I can check that. Can you provide your order number?&rdquo;
                    </div>
                    <div className="bg-white/10 rounded-xl px-3 py-2 text-[12px] text-white/80">
                      &ldquo;It&apos;s BV10482.&rdquo;
                    </div>
                  </div>
                  <button onClick={() => setResolved(true)}
                    className="w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-[12px] font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5" weight="bold" /> Locate &amp; Notify Customer
                  </button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#ECFDF5] border border-[#10B981]/20 rounded-2xl p-4 space-y-2">
                  <div className="text-[10px] font-mono font-bold text-[#059669] uppercase tracking-widest">Support Ticket Resolved</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[["Order", "#BV10482"], ["Status", "In Transit"], ["Delivery", "Tomorrow"], ["Customer", "Notified ✓"]].map(([k, v]) => (
                      <div key={k} className="bg-white rounded-xl px-3 py-2">
                        <div className="text-[10px] text-[#8A7A6E] font-semibold">{k}</div>
                        <div className="text-[12px] font-bold text-[#140A02]">{v}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PAIN POINTS ──────────────────────────────────────────────────── */}
      <IndustryProblem
        heading="Support Backlogs Cost You Customers."
        problemSummary="As order volumes grow, so does support call volume. Customers calling about orders, deliveries, and returns expect an immediate response. When your team is overwhelmed, customers lose trust and move on. Bavio handles the volume — so your team handles the exceptions."
        cards={problems}
      />

      {/* ── SUPPORT FLOW ─────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-[#FFFDF8] border-b border-[#F3E4D4]/45 w-full">
        <div className="max-w-[1160px] mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">

            {/* Left: copy + steps */}
            <div>
              <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-5">Support Flow</span>
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1] mb-10">From Support Call to Resolved Order.</h2>
              <div className="space-y-6">
                {[
                  { n: "01", t: "Customer Calls",  d: "Bavio answers every support call immediately — no hold queues, no wait times." },
                  { n: "02", t: "Order Identified", d: "Order number, issue type, and customer details are captured in under 30 seconds." },
                  { n: "03", t: "Request Logged",   d: "Routine enquiries are handled. Complex issues are escalated to your support team with full context." },
                  { n: "04", t: "Resolution Sent",  d: "Your team receives a structured ticket and follows up with all the information they need." },
                ].map(({ n, t, d }) => (
                  <div key={n} className="flex gap-4">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F3E4D4] flex items-center justify-center shrink-0 text-[11px] font-bold font-mono text-[#FF6B00]">{n}</div>
                    <div>
                      <div className="text-sm font-bold text-[#140A02] mb-1">{t}</div>
                      <div className="text-[13px] text-[#6B5A4C] leading-relaxed">{d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: support categories handled */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
              className="bg-white border border-[#EADFD3] rounded-[24px] p-6 shadow-sm">
              <div className="text-[10px] font-mono font-bold text-[#FF6B00] uppercase tracking-widest mb-5">Support Categories — Handled by Bavio</div>
              <div className="space-y-3">
                {[
                  { cat: "Order Tracking",    desc: "Where is my order? When will it arrive?" },
                  { cat: "Delivery Issues",   desc: "Package not received, wrong address, delay" },
                  { cat: "Returns & Refunds", desc: "How do I return? When will I get my refund?" },
                  { cat: "Product Questions", desc: "Availability, size, colour, compatibility" },
                  { cat: "Account Support",   desc: "Login issues, address changes, order history" },
                ].map(({ cat, desc }, i) => (
                  <motion.div key={cat} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 py-2.5 border-b border-[#F3E4D4]/60 last:border-0">
                    <div className="w-6 h-6 rounded-lg bg-[#FFF7ED] border border-[#F3E4D4] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5 text-[#FF6B00]" weight="bold" />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[#140A02]">{cat}</div>
                      <div className="text-[11px] text-[#6B5A4C]">{desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-[#FFF7ED]/15 border-b border-[#F3E4D4]/45 w-full">
        <div className="max-w-[1160px] mx-auto px-6 md:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-4">Results</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1]">Scale Your Support Without Scaling Your Team.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[980px] mx-auto">
            {[
              { Icon: Clock, t: "24/7 Customer Call Handling", d: "Answer order and delivery queries at any time — including nights, weekends, and sale peaks." },
              { Icon: ShoppingCart, t: "No More Hold Queues", d: "Every customer reaches an instant response — dramatically improving first-contact satisfaction." },
              { Icon: ShieldCheck, t: "Fewer Repetitive Tickets", d: "Routine queries are handled automatically, freeing your team for complex resolutions." },
              { Icon: UserList, t: "Structured Support Tickets", d: "Every call produces a clean, organised support ticket with full context for your team." },
              { Icon: Smiley, t: "Better Customer Retention", d: "Customers who feel heard and served quickly are far more likely to purchase again." },
            ].map(({ Icon, t, d }, i) => (
              <motion.div key={t} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-white border border-[#F3E4D4] rounded-[24px] p-6 flex flex-col gap-4 group hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.04)] transition-all duration-300">
                <div className="w-10 h-10 bg-[#FFF7ED] border border-[#F3E4D4]/60 rounded-xl flex items-center justify-center group-hover:bg-[#FF6B00] transition-colors duration-300 shrink-0">
                  <Icon className="w-5 h-5 text-[#FF6B00] group-hover:text-white transition-colors duration-300" weight="bold" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#140A02] mb-1">{t}</div>
                  <div className="text-[13px] text-[#6B5A4C] leading-relaxed">{d}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <IndustryFAQ heading="Questions About Bavio for E-commerce." faqs={faqs} />
      <IndustryCTA heading="Answer Every Customer Call. At Any Scale." supportingText="Let Bavio handle the support volume so your team focuses on turning issues into loyalty." primaryCtaText="Get Started" secondaryCtaText="Try the Demo" />
      <Footer />
    </div>
  );
}
