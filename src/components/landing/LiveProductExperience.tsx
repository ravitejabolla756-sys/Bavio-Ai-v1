"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, MessageSquare, CheckCircle2 } from "lucide-react";

export default function LiveProductExperience() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTranscript, setShowTranscript] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const updateProgress = () => {
      if (audioRef.current) {
        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration;
        setCurrentTime(current);
        setProgress(total ? (current / total) * 100 : 0);
      }
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateProgress);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  // Hide in production unless flag is true
  if (process.env.NEXT_PUBLIC_SHOW_LIVE_EXPERIENCE !== 'true') {
    return null;
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Handle play promise nicely
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
             // If audio source is missing, just toggle state to simulate
             console.log("Audio file missing, simulating play");
          });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <section className="py-24 bg-[#FFFDF8] w-full relative border-b border-[#F3E4D4]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316] mb-4 uppercase tracking-wider">
            LIVE PRODUCT EXPERIENCE
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-[56px] font-extrabold tracking-[-0.04em] text-[#140A02] mb-6 leading-[0.9]">
            Hear Bavio Handle a Real Business Call
          </h2>
          <p className="text-[#6B5A4C] text-[20px] font-normal leading-[1.7] max-w-[720px] mx-auto font-sans">
            Listen to a short example and see how Bavio turns an inbound conversation into structured lead information.
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Side: Audio Player */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white border border-[#F3E4D4] rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.04)] p-8 flex flex-col justify-center h-full relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F97316]/5 rounded-full filter blur-[60px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-8">
              <div className="w-20 h-20 bg-[#FFF7ED] rounded-full flex items-center justify-center shadow-[inset_0_2px_10px_rgba(249,115,22,0.1)] border border-[#F97316]/20">
                <Volume2 className="w-8 h-8 text-[#F97316]" />
              </div>

              <div>
                <h3 className="font-display text-2xl font-bold text-[#140A02] mb-2">
                  Sample Business Inquiry
                </h3>
                <p className="text-sm text-[#6B5A4C] font-medium mb-6">
                  Recorded using Bavio’s live calling system
                </p>
              </div>

              {/* Audio Element - No auto play, accessible controls via custom buttons */}
              <audio
                ref={audioRef}
                src="/assets/audio/demo-call.mp3"
                onEnded={handleEnded}
                className="hidden"
                aria-hidden="true"
              />

              {/* Custom Controls */}
              <div className="w-full max-w-sm flex items-center gap-4 bg-[#FFFDF8] border border-[#F3E4D4] p-3 rounded-full shadow-sm">
                <button
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause audio" : "Play audio"}
                  className="w-12 h-12 flex-shrink-0 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-full flex items-center justify-center transition-colors shadow-[0_4px_12px_rgba(249,115,22,0.2)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316]"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                </button>

                <div className="flex-grow flex flex-col justify-center" aria-hidden="true">
                  <div className="w-full h-1.5 bg-[#EADFD3] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#F97316] rounded-full transition-all duration-100 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div 
                  className="text-xs font-bold text-[#6E6256] w-12 text-right tabular-nums"
                  aria-label={`Audio duration: ${formatTime(currentTime)}`}
                >
                  {formatTime(currentTime)}
                </div>
              </div>

              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-xs font-bold text-[#6E6256] hover:text-[#F97316] flex items-center gap-1.5 transition-colors uppercase tracking-wider mt-4 focus:outline-none focus:ring-2 focus:ring-offset-4 focus:ring-offset-white focus:ring-[#F97316] rounded px-2 py-1"
                aria-expanded={showTranscript}
                aria-controls="transcript-content"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {showTranscript ? "Hide Transcript" : "Show Transcript"}
              </button>

              <div className="mt-8 text-[10px] uppercase font-bold tracking-widest text-[#6E6256]/50 bg-[#F3E4D4]/30 px-3 py-1 rounded">
                Product demonstration using test business data.
              </div>
            </div>
          </motion.div>

          {/* Right Side: Transcript & Extraction */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-6"
          >
            <AnimatePresence>
              {showTranscript && (
                <motion.div
                  id="transcript-content"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#140A02] text-[#F3E4D4] rounded-[24px] shadow-lg p-6 md:p-8 overflow-hidden relative font-sans text-sm leading-relaxed"
                >
                  <div className="flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-wider text-[#F97316]">
                    <MessageSquare className="w-4 h-4" />
                    <span>Live Transcript</span>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#F3E4D4]/10 flex items-center justify-center shrink-0 font-bold text-xs" aria-hidden="true">C</div>
                      <div>
                        <span className="text-[#F3E4D4]/50 text-xs font-bold mb-1 block">Caller</span>
                        <p>Hi, I&apos;m calling to ask if you have any 2-bedroom apartments available starting next month. My budget is around $2,500.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#F97316] text-white flex items-center justify-center shrink-0 font-bold text-xs" aria-hidden="true">B</div>
                      <div>
                        <span className="text-[#F97316] text-xs font-bold mb-1 block">Bavio</span>
                        <p>Hello! Yes, we have a few upcoming 2-bedroom units that fit that budget. May I get your name so I can have our leasing agent send you the details?</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#F3E4D4]/10 flex items-center justify-center shrink-0 font-bold text-xs" aria-hidden="true">C</div>
                      <div>
                        <span className="text-[#F3E4D4]/50 text-xs font-bold mb-1 block">Caller</span>
                        <p>Sure, my name is Alex Carter.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white border border-[#F3E4D4] rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 md:p-8 flex-grow">
              <h4 className="font-display text-lg font-bold text-[#140A02] mb-6 border-b border-[#F3E4D4] pb-4 flex items-center justify-between">
                <span>Extracted Lead Data</span>
                <span className="bg-[#E6F4EA] text-[#137333] text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Captured
                </span>
              </h4>
              
              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                <div>
                  <span className="text-[10px] text-[#6E6256] font-bold uppercase tracking-wider block mb-1">Name</span>
                  <span className="text-sm font-semibold text-[#140A02]">Alex Carter</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6E6256] font-bold uppercase tracking-wider block mb-1">Requirement</span>
                  <span className="text-sm font-semibold text-[#140A02]">2-Bedroom Apartment</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6E6256] font-bold uppercase tracking-wider block mb-1">Budget</span>
                  <span className="text-sm font-semibold text-[#140A02]">$2,500/month</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6E6256] font-bold uppercase tracking-wider block mb-1">Timeline</span>
                  <span className="text-sm font-semibold text-[#140A02]">Next Month</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6E6256] font-bold uppercase tracking-wider block mb-1">Lead Status</span>
                  <span className="text-sm font-semibold text-[#F97316]">Qualified</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
