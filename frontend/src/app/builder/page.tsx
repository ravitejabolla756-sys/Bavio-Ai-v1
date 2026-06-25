"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function BuilderHeroPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = "https://stream.mux.com/T6oQJQ02cQ6N01TR6iHwZkKFkbepS34dkkIc9iukgy400g.m3u8";
  const posterUrl = "https://images.unsplash.com/photo-1647356191320-d7a1f80ca777?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjB0ZWNobm9sb2d5JTIwbmV1cmFsJTIwbmV0d29ya3xlbnwxfHx8fDE3Njg5NzIyNTV8MA&ixlib=rb-4.1.0&q=80&w=1080";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((e) => console.log("Auto-play prevented:", e));
      });
      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoSrc;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch((e) => console.log("Auto-play prevented:", e));
      });
    }
  }, []);

  return (
    <div className="relative w-full min-h-screen text-ink overflow-hidden font-instrument-sans select-none">
      <Navbar />

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center mt-20 px-6 pt-32 pb-24 space-y-12">
        
        {/* Pre-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-instrument-serif text-3xl sm:text-5xl lg:text-[48px] leading-[1.1] text-ink"
        >
          Design at the speed of thought
        </motion.p>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="font-instrument-sans font-semibold text-6xl sm:text-8xl lg:text-[136px] leading-[0.9] tracking-tighter text-ink"
        >
          Build Faster
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="font-instrument-sans text-ink-secondary max-w-xl text-lg sm:text-[20px] leading-[1.65]"
        >
          Create fully functional, SEO-optimized websites in seconds with our advanced AI engine.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          {/* Primary Button */}
          <button
            className="group flex items-center gap-4 bg-saffron text-white pl-6 pr-2 py-2 rounded-full font-medium text-lg font-instrument-sans transition-all duration-300 hover:shadow-saffron hover:scale-105 active:scale-95"
          >
            <span>Start Building Free</span>
            <div className="w-[40px] h-[40px] rounded-full bg-white/20 transition-colors flex items-center justify-center shrink-0">
              <ArrowRight size={20} className="text-white" />
            </div>
          </button>

          {/* Secondary Button */}
          <button
            className="group flex items-center gap-2 text-ink-tertiary hover:text-ink bg-transparent hover:bg-line-subtle/50 border border-line px-5 py-2.5 rounded-full transition-all duration-300 font-instrument-sans font-semibold text-lg active:scale-95"
          >
            <span>See Examples</span>
            <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </motion.div>

      </div>
    </div>
  );
}
