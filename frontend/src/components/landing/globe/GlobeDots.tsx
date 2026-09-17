"use client";

import { useEffect, useId, useRef } from "react";
import type { MotionValue } from "framer-motion";
import type { Globe } from "cobe";
import styles from "./hero-globe.module.css";

interface Props { rotation: MotionValue<number>; active: boolean; reduced: boolean }

export default function GlobeDots({ rotation, active, reduced }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const globe = useRef<Globe | null>(null);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    let observer: ResizeObserver | undefined;
    // COBE owns its canvas wrapper. Keep it outside React's child reconciliation.
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;display:block";
    element.appendChild(canvas);
    const context = canvas.getContext("webgl2", { alpha: true, antialias: false })
      || canvas.getContext("webgl", { alpha: true, antialias: false });
    if (!context) { canvas.remove(); return; }
    import("cobe").then(({ default: createGlobe }) => {
      if (disposed) return;
      globe.current = createGlobe(canvas, {
        width: element.clientWidth, height: element.clientHeight,
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
        phi: 0.55, theta: 0.22, dark: 0, diffuse: 1.3,
        mapSamples: 18000, mapBrightness: 5, mapBaseBrightness: 0.035,
        baseColor: [0.72, 0.69, 0.64], markerColor: [1, 0.42, 0],
        glowColor: [0.99, 0.98, 0.96], markers: [], scale: 1,
        context: { alpha: true, antialias: false },
      });
      element.dataset.ready = "true";
      observer = new ResizeObserver(() => {
        globe.current?.update({ width: element.clientWidth, height: element.clientHeight });
      });
      observer.observe(element);
    }).catch(() => { /* The static dotted sphere remains visible if WebGL fails. */ });
    return () => {
      disposed = true;
      observer?.disconnect();
      globe.current?.destroy();
      globe.current = null;
      element.replaceChildren();
      delete element.dataset.ready;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    globe.current?.update({ phi: 0.55 });
    if (reduced) return;
    let frame = 0;
    const draw = () => {
      globe.current?.update({ phi: 0.55 + rotation.get() });
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [rotation, active, reduced]);

  return (
    <div className={styles.sphere}>
      <div ref={host} className={styles.canvas} />
      <svg className={styles.fallback} viewBox="0 0 400 400">
        <defs>
          <pattern id={`${id}-dots`} width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="#aaa297" />
          </pattern>
          <radialGradient id={`${id}-shade`} cx="40%" cy="35%">
            <stop stopColor="#FFFDF9" /><stop offset="1" stopColor="#E7E0D6" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="158" fill={`url(#${id}-shade)`} />
        <circle cx="200" cy="200" r="158" fill={`url(#${id}-dots)`} opacity="0.6" />
      </svg>
    </div>
  );
}
