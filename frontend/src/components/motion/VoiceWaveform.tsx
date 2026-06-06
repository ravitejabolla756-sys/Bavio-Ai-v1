"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface VoiceWaveformProps {
  isPlaying: boolean;
  barCount?: number; // Kept for compatibility, used as dot count
  className?: string;
  color?: string;
}

export default function VoiceWaveform({
  isPlaying,
  barCount = 12, // Using 12 dots for a clean, premium dashboard wave
  className = "",
  color = "bg-saffron",
}: VoiceWaveformProps) {
  const reduce = useReducedMotion();
  const dots = Array.from({ length: barCount });

  return (
    <div
      className={`flex items-center gap-3.5 h-16 justify-center select-none ${className}`}
      role="img"
      aria-label={isPlaying ? "Voice waveform active" : "Voice waveform idle"}
    >
      {dots.map((_, i) => (
        <motion.div
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${color} shadow-[0_0_4px_rgba(255,107,0,0.2)]`}
          animate={
            isPlaying && !reduce
              ? {
                  y: [-14, 14, -14], // Fluid wavy motion
                }
              : { y: 0 }
          }
          transition={
            isPlaying && !reduce
              ? {
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.08, // Staggered offsets for the ripple wave effect
                }
              : {
                  duration: 0.4,
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </div>
  );
}
