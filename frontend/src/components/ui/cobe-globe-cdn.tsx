"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import createGlobe from "cobe";

export interface CdnMarker {
  id: string;
  location: [number, number];
  region: string;
  label?: string;
}

export interface CdnArc {
  id: string;
  from: [number, number];
  to: [number, number];
  label?: string;
}

export interface GlobeCdnProps {
  markers?: CdnMarker[];
  arcs?: CdnArc[];
  className?: string;
  speed?: number;
}

const defaultMarkers: CdnMarker[] = [
  { id: "cdn-iad", location: [38.95, -77.45], region: "US East (IAD)", label: "+1 (555) 019-2834" },
  { id: "cdn-sfo", location: [37.62, -122.38], region: "US West (SFO)", label: "sip.yourcompany.com" },
  { id: "cdn-cdg", location: [49.01, 2.55], region: "EU Central (CDG)", label: "Connected" },
  { id: "cdn-hnd", location: [35.55, 139.78], region: "AP East (HND)", label: "Voice Route Active" },
  { id: "cdn-syd", location: [-33.95, 151.18], region: "AP South (SYD)", label: "Inbound / Outbound" },
  { id: "cdn-gru", location: [-23.43, -46.47], region: "SA East (GRU)", label: "Carrier SIP" },
  { id: "cdn-sin", location: [1.36, 103.99], region: "AP SE (SIN)", label: "Low Latency Node" },
  { id: "cdn-bom", location: [19.09, 72.87], region: "IN West (BOM)", label: "Auto-Routed" },
];

const defaultArcs: CdnArc[] = [
  { id: "cdn-arc-1", from: [38.95, -77.45], to: [49.01, 2.55], label: "SIP Trunk Primary" },
  { id: "cdn-arc-2", from: [37.62, -122.38], to: [35.55, 139.78], label: "Voice Stream Arc" },
  { id: "cdn-arc-3", from: [49.01, 2.55], to: [1.36, 103.99], label: "Global Route" },
  { id: "cdn-arc-4", from: [38.95, -77.45], to: [-23.43, -46.47], label: "LatAm Uplink" },
  { id: "cdn-arc-5", from: [35.55, 139.78], to: [-33.95, 151.18], label: "PacRim SIP" },
  { id: "cdn-arc-6", from: [49.01, 2.55], to: [19.09, 72.87], label: "Eurasia Carrier" },
];

export function GlobeCdn({
  markers = defaultMarkers,
  arcs = defaultArcs,
  className = "",
  speed = 0.003,
}: GlobeCdnProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);

  const [activeMarker, setActiveMarker] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMarker((prev) => (prev + 1) % markers.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [markers.length]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    isPausedRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        };
      }
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerUp]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationId: number;
    let phi = 0;

    function init() {
      const width = canvas.offsetWidth;
      if (width === 0 || globe) return;

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width: width * 2,
        height: width * 2,
        phi: 0,
        theta: 0.2,
        dark: 0,
        diffuse: 1.4,
        mapSamples: 16000,
        mapBrightness: 8,
        baseColor: [0.96, 0.95, 0.93], // Warm Bavio ivory base
        markerColor: [1.0, 0.42, 0.0], // Bavio Orange #FF6B00
        glowColor: [0.97, 0.95, 0.92], // Warm ambient glow
        markerElevation: 0.03,
        markers: markers.map((m) => ({ location: m.location, size: 0.03 })),
        arcs: arcs.map((a) => ({ from: a.from, to: a.to })),
        arcColor: [0.08, 0.48, 0.45], // Bavio Teal #167A72
        arcWidth: 0.7,
        arcHeight: 0.25,
        opacity: 0.85,
      });

      function animate() {
        if (!isPausedRef.current) phi += speed;
        if (globe) {
          globe.update({
            phi: phi + phiOffsetRef.current + dragOffset.current.phi,
            theta: 0.2 + thetaOffsetRef.current + dragOffset.current.theta,
          });
        }
        animationId = requestAnimationFrame(animate);
      }
      animate();
      setTimeout(() => canvas && (canvas.style.opacity = "1"), 50);
    }

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          ro.disconnect();
          init();
        }
      });
      ro.observe(canvas);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (globe) globe.destroy();
    };
  }, [markers, arcs, speed]);

  return (
    <div className={`relative aspect-square select-none w-full max-w-[540px] mx-auto flex items-center justify-center ${className}`}>
      {/* Soft Ambient Radial Background Glow */}
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(22,122,114,0.12)_0%,rgba(255,107,0,0.06)_50%,transparent_75%)] pointer-events-none" />

      {/* Cobe Interactive WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="w-full h-full cursor-grab opacity-0 transition-opacity duration-1000 rounded-full touch-none relative z-10"
        style={{ width: "100%", height: "100%" }}
      />

      {/* INTEGRATED FLOATING MINIMAL TELEPHONY BADGES */}
      {/* Badge 1: Top Left - Incoming Calls */}
      <div className="absolute top-4 left-0 sm:-left-2 bg-white/95 backdrop-blur-md border border-[#D5E8E4] shadow-[0_8px_24px_rgba(22,122,114,0.1)] rounded-full px-4 py-2 flex items-center gap-2.5 z-20 transition-all hover:scale-[1.03]">
        <span className="text-sm">🇺🇸</span>
        <div className="text-left font-mono">
          <span className="text-[9px] text-[#167A72] font-bold uppercase block leading-none">INCOMING CALLS</span>
          <span className="text-xs font-bold text-[#0A0A0A]">+1 (555) 019-2834</span>
        </div>
      </div>

      {/* Badge 2: Bottom Right - SIP Trunk */}
      <div className="absolute bottom-4 right-0 sm:-right-2 bg-white/95 backdrop-blur-md border border-[#D5E8E4] shadow-[0_8px_24px_rgba(22,122,114,0.1)] rounded-full px-4 py-2 flex items-center gap-2.5 z-20 transition-all hover:scale-[1.03]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] animate-pulse" />
        <div className="text-left font-mono">
          <span className="text-[9px] text-[#FF6B00] font-bold uppercase block leading-none">SIP TRUNK ENGINE</span>
          <span className="text-xs font-bold text-[#0A0A0A]">sip.yourcompany.com</span>
        </div>
      </div>

      {/* Badge 3: Top Right - Status Pill */}
      <div className="absolute top-6 right-2 sm:right-0 bg-white/95 backdrop-blur-md border border-emerald-200 shadow-sm rounded-full px-3.5 py-1.5 flex items-center gap-2 z-20 font-mono text-[11px] font-bold text-emerald-700">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Connected &amp; Routed</span>
      </div>

      {/* Badge 4: Bottom Left - Active Node Highlight */}
      <div className="absolute bottom-6 left-2 bg-white/95 backdrop-blur-md border border-[#E7E0D6] shadow-sm rounded-full px-3.5 py-1.5 flex items-center gap-2 z-20 font-mono text-[11px] font-bold text-[#0A0A0A]">
        <span className="w-2 h-2 rounded-full bg-[#167A72]" />
        <span>{markers[activeMarker]?.region} • {markers[activeMarker]?.label}</span>
      </div>
    </div>
  );
}
