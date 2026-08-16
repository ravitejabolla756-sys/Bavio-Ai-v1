"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MarketingMessage {
  id: string;
  line1: string;
  highlight: string;
}

const MARKETING_MESSAGES: MarketingMessage[] = [
  {
    id: "never-miss-lead",
    line1: "Never miss",
    highlight: "a lead.",
  },
  {
    id: "answer-every-call",
    line1: "Answer every",
    highlight: "call.",
  },
  {
    id: "appointments-auto",
    line1: "Appointments,",
    highlight: "automatically.",
  },
  {
    id: "receptionist-always-on",
    line1: "Your AI receptionist,",
    highlight: "always on.",
  },
  {
    id: "calls-to-customers",
    line1: "Turn calls into",
    highlight: "customers.",
  },
  {
    id: "follow-up-sleep",
    line1: "Follow up",
    highlight: "while you sleep.",
  },
  {
    id: "every-convo-handled",
    line1: "Every conversation,",
    highlight: "handled.",
  },
  {
    id: "team-always-available",
    line1: "Your team,",
    highlight: "always available.",
  },
  {
    id: "qualify-leads-auto",
    line1: "Qualify leads",
    highlight: "automatically.",
  },
  {
    id: "customer-support-247",
    line1: "Customer support,",
    highlight: "24/7.",
  },
  {
    id: "one-ai-workforce",
    line1: "One AI workforce.",
    highlight: "Every conversation.",
  },
  {
    id: "business-stay-connected",
    line1: "Let your business",
    highlight: "stay connected.",
  },
];

export default function RotatingAuthHeader() {
  const [index, setIndex] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const isMounted = useRef(false);

  // Initialize index from localStorage on mount for non-repeating reload variation
  useEffect(() => {
    isMounted.current = true;

    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
    }

    try {
      const savedIndex = localStorage.getItem("bavio_auth_msg_index");
      let nextIndex: number;
      if (savedIndex !== null) {
        nextIndex = (parseInt(savedIndex, 10) + 1) % MARKETING_MESSAGES.length;
      } else {
        nextIndex = Math.floor(Math.random() * MARKETING_MESSAGES.length);
      }
      setIndex(nextIndex);
      localStorage.setItem("bavio_auth_msg_index", nextIndex.toString());
    } catch {
      setIndex(Math.floor(Math.random() * MARKETING_MESSAGES.length));
    }
  }, []);

  // Interval timer every 5 seconds (5000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => {
        const next = (prevIndex + 1) % MARKETING_MESSAGES.length;
        try {
          localStorage.setItem("bavio_auth_msg_index", next.toString());
        } catch {}
        return next;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const currentMessage = MARKETING_MESSAGES[index] || MARKETING_MESSAGES[0];

  return (
    <div className="relative z-20 max-w-[500px] w-full my-auto py-4 text-left select-none">
      {/* Eyebrow */}
      <span className="text-[#FF6B00] uppercase tracking-[0.12em] font-bold text-[11px] lg:text-[12px] block mb-3 font-sans">
        BAVIO AI WORKFORCE
      </span>

      {/* Rotating Message Container with 3D perspective */}
      <div 
        className="relative min-h-[92px] sm:min-h-[100px] lg:min-h-[110px] flex items-center overflow-hidden"
        style={{ perspective: "1000px" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.h2
            key={currentMessage.id}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { rotateX: -70, opacity: 0, y: 12, transformOrigin: "50% 50%" }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { rotateX: 0, opacity: 1, y: 0, transformOrigin: "50% 50%" }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { rotateX: 70, opacity: 0, y: -12, transformOrigin: "50% 50%" }
            }
            transition={{
              duration: prefersReducedMotion ? 0.2 : 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="font-serif text-[34px] sm:text-[38px] md:text-[42px] lg:text-[46px] leading-[1.06] tracking-tight font-normal text-white text-left w-full"
            style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
          >
            {currentMessage.line1} <br />
            <span className="text-[#FF6B00] inline-block">{currentMessage.highlight}</span>
          </motion.h2>
        </AnimatePresence>
      </div>

      {/* Static Supporting Text */}
      <p className="text-[15px] lg:text-[16px] text-white/70 font-sans leading-[1.5] max-w-[430px] mt-4 lg:mt-5">
        AI employees that answer, qualify, book, and support — 24/7.
      </p>
    </div>
  );
}
