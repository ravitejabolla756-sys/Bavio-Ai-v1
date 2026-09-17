"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Arc, Globe, Marker } from "cobe";
import styles from "./hero-globe.module.css";

const orange: [number, number, number] = [1, 0.42, 0];
const markers: Marker[] = [
  { id: "north-america", location: [40.7, -74], size: 0.012 },
  { id: "west-america", location: [37.6, -122.4], size: 0.011 },
  { id: "europe", location: [51.5, -0.1], size: 0.011 },
  { id: "south-america", location: [-23.5, -46.6], size: 0.012 },
  { id: "asia", location: [35.7, 139.7], size: 0.01 },
];
const arcs: Arc[] = [
  { id: "north-america-europe", from: [40.7, -74], to: [51.5, -0.1] },
  { id: "north-america-south-america", from: [40.7, -74], to: [-23.5, -46.6] },
  { id: "europe-asia", from: [51.5, -0.1], to: [35.7, 139.7] },
  { id: "west-america-asia", from: [37.6, -122.4], to: [35.7, 139.7] },
];

interface BavioCobeGlobeProps {
  heroRef: RefObject<HTMLElement | null>;
}

export default function BavioCobeGlobe({ heroRef }: BavioCobeGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<Globe | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const basePhi = -0.45;
  const rotationRef = useRef({ phi: basePhi, theta: 0.2 });
  const targetPhiRef = useRef(basePhi);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let frame = 0;
    let observer: ResizeObserver | undefined;
    let scrollFrame = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 900px)").matches;
    const activeMarkers = mobile ? markers.slice(0, 3) : markers;
    const activeArcs = mobile ? arcs.slice(0, 2) : arcs;

    const resize = () => {
      const size = Math.max(1, Math.floor(canvas.parentElement?.clientWidth || 520));
      globeRef.current?.update({ width: size, height: size });
    };

    const updateScrollTarget = () => {
      if (reduced) return;
      const hero = heroRef.current;
      if (!hero) return;
      const progress = Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / Math.max(1, hero.offsetHeight)));
      targetPhiRef.current = basePhi + progress * Math.PI * 2.4;
    };

    const handleScroll = () => {
      updateScrollTarget();
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
      });
    };
    updateScrollTarget();
    window.addEventListener("scroll", handleScroll, { passive: true });

    import("cobe").then(({ default: createGlobe }) => {
      if (disposed) return;
      const size = Math.max(1, Math.floor(canvas.parentElement?.clientWidth || 520));
      globeRef.current = createGlobe(canvas, {
        width: size,
        height: size,
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        phi: rotationRef.current.phi,
        theta: rotationRef.current.theta,
        dark: 0,
        diffuse: 1.2,
        mapSamples: 18000,
        mapBrightness: 1.2,
        mapBaseBrightness: 0.02,
        baseColor: [1, 1, 1],
        markerColor: orange,
        glowColor: [0.96, 0.94, 0.91],
        markers: activeMarkers,
        arcs: activeArcs,
        arcColor: [1, 0.62, 0.32],
        arcWidth: 0.16,
        arcHeight: 0.2,
        markerElevation: 0.015,
        opacity: 0.96,
        scale: 1,
        context: { alpha: true, antialias: false },
      });
      canvas.dataset.ready = "true";
      observer = new ResizeObserver(resize);
      observer.observe(canvas.parentElement || canvas);

      const draw = () => {
        if (disposed) return;
        if (!reduced) {
          rotationRef.current.phi += (targetPhiRef.current - rotationRef.current.phi) * 0.085;
        }
        globeRef.current?.update(rotationRef.current);
        frame = requestAnimationFrame(draw);
      };
      draw();
    }).catch(() => undefined);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener("scroll", handleScroll);
      observer?.disconnect();
      globeRef.current?.destroy();
      globeRef.current = null;
    };
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    pointerRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.style.cursor = "grabbing";
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const previous = pointerRef.current;
    if (!previous) return;
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    rotationRef.current.phi += dx / 300;
    rotationRef.current.theta = Math.max(-0.8, Math.min(0.8, rotationRef.current.theta + dy / 1000));
    pointerRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    pointerRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    event.currentTarget.style.cursor = "grab";
  };

  return (
    <div className={styles.cobeArtwork}>
      <canvas
        ref={canvasRef}
        className={styles.cobeCanvas}
        aria-label="Scroll-responsive Bavio global voice network globe"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
