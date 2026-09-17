"use client";

import React from "react";
import { motion } from "framer-motion";

export default function EnvelopeIllustration({
  isInView = true,
  shouldReduceMotion = false,
}: {
  isInView?: boolean;
  shouldReduceMotion?: boolean;
}) {
  return (
    <div className="relative w-[300px] sm:w-[350px] lg:w-[380px] h-[210px] sm:h-[240px] flex items-center justify-start pointer-events-none select-none">
      
      {/* Subtle Restrained Ambient Radial Glow */}
      <div className="absolute inset-0 bg-[#FF6B00]/[0.08] blur-[55px] rounded-full pointer-events-none" />

      {/* Crisp High-DPI Vector SVG Composition */}
      <svg
        viewBox="0 0 420 270"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_12px_28px_rgba(80,50,20,0.06)] relative z-10"
      >
        <defs>
          <linearGradient id="envBodyGrad" x1="60" y1="100" x2="340" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FAF4EC" />
            <stop offset="100%" stopColor="#EAD8CA" />
          </linearGradient>

          <linearGradient id="letterGrad" x1="100" y1="40" x2="300" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FFFDF9" />
          </linearGradient>

          <linearGradient id="planeGrad" x1="280" y1="30" x2="360" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFDF9" />
            <stop offset="100%" stopColor="#F4E6D8" />
          </linearGradient>

          <filter id="softShadow" x="30" y="190" width="340" height="70" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="12" result="blur" />
          </filter>
        </defs>

        {/* Envelope Ground Shadow */}
        <ellipse cx="200" cy="225" rx="140" ry="16" fill="#4A3420" fillOpacity="0.09" filter="url(#softShadow)" />

        {/* Envelope Back Interior Panel */}
        <path
          d="M60 120 L200 190 L340 120 L340 220 C340 230 330 238 320 238 L80 238 C70 238 60 230 60 220 Z"
          fill="#E2CFC0"
        />

        {/* Floating Letter Paper inside Envelope */}
        <motion.g
          initial={shouldReduceMotion ? { y: 0 } : { y: 15 }}
          animate={isInView || shouldReduceMotion ? { y: 0 } : {}}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <rect x="95" y="55" width="210" height="135" rx="12" fill="url(#letterGrad)" stroke="#E4D5C8" strokeWidth="1.5" />
          
          {/* Bavio Brand Accent Icon on Letter */}
          <rect x="118" y="75" width="24" height="24" rx="6" fill="#FF6B00" />
          <path d="M125 87 L130 92 L137 83" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Letter Text Lines */}
          <rect x="152" y="80" width="130" height="6" rx="3" fill="#D5C4B6" />
          <rect x="152" y="93" width="95" height="5" rx="2.5" fill="#E4D4C7" />

          <rect x="118" y="115" width="164" height="4.5" rx="2" fill="#EFE4DA" />
          <rect x="118" y="126" width="140" height="4.5" rx="2" fill="#EFE4DA" />
          <rect x="118" y="137" width="110" height="4.5" rx="2" fill="#EFE4DA" />
        </motion.g>

        {/* Envelope Front Main Pocket Cover */}
        <path
          d="M60 135 L190 205 C196 208 204 208 210 205 L340 135 L340 220 C340 230 330 238 320 238 L80 238 C70 238 60 230 60 220 Z"
          fill="url(#envBodyGrad)"
          stroke="#DDD0C3"
          strokeWidth="1"
        />

        {/* Envelope Bottom Triangle Fold Overlap */}
        <path
          d="M60 230 L165 160 C185 146 215 146 235 160 L340 230"
          fill="#F3E5D8"
          fillOpacity="0.85"
          stroke="#DACAC0"
          strokeWidth="1"
        />

        {/* Paper Plane Element Flying Upward Right */}
        <motion.g
          initial={shouldReduceMotion ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: -18, y: 16 }}
          animate={isInView || shouldReduceMotion ? { opacity: 1, x: 0, y: 0 } : {}}
          transition={{ duration: 1.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Trail Dots */}
          <circle cx="280" cy="115" r="2" fill="#FF6B00" fillOpacity="0.4" />
          <circle cx="295" cy="103" r="2.5" fill="#FF6B00" fillOpacity="0.6" />
          <circle cx="312" cy="90" r="3" fill="#FF6B00" fillOpacity="0.8" />

          {/* Paper Plane Main Body */}
          <g transform="translate(315, 35) rotate(-12)">
            <path
              d="M0 35 L55 0 L40 45 L22 36 Z"
              fill="url(#planeGrad)"
              stroke="#D6C7BC"
              strokeWidth="1"
            />
            <path
              d="M0 35 L55 0 L22 36 Z"
              fill="#EFE1D4"
            />
            <path
              d="M22 36 L30 52 L36 38 Z"
              fill="#FF6B00"
            />
          </g>
        </motion.g>
      </svg>
    </div>
  );
}
