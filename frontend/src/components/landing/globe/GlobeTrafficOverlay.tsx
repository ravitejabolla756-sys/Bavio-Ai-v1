"use client";

import styles from "./hero-globe.module.css";
import type { CSSProperties } from "react";

const routes = [
  { id: "inbound", d: "M118 282 C194 194 302 155 406 192", duration: "12s", delay: "-3s" },
  { id: "workflow", d: "M170 410 C286 326 418 294 548 328", duration: "16s", delay: "-9s" },
  { id: "voice", d: "M238 538 C318 455 434 430 574 474", duration: "19s", delay: "-5s" },
  { id: "routing", d: "M412 170 C468 230 541 252 620 224", duration: "22s", delay: "-14s" },
  { id: "outbound", d: "M300 238 C374 292 476 390 605 508", duration: "26s", delay: "-18s" },
] as const;

export default function GlobeTrafficOverlay() {
  return (
    <div className={styles.trafficArtwork} aria-hidden="true">
      <svg className={styles.trafficOverlay} viewBox="0 0 740 740" preserveAspectRatio="none" focusable="false">
        <defs>
          {routes.map((route) => <path key={route.id} id={`traffic-${route.id}`} d={route.d} />)}
          <radialGradient id="traffic-node-glow">
            <stop offset="0" stopColor="#ff6b00" stopOpacity=".35" />
            <stop offset="1" stopColor="#ff6b00" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="traffic-packet-tail" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ff6b00" stopOpacity="0" />
            <stop offset=".45" stopColor="#ff6b00" stopOpacity=".3" />
            <stop offset="1" stopColor="#ff8a3d" stopOpacity="1" />
          </linearGradient>
          <filter id="traffic-soft-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>
        {routes.map((route, index) => (
          <g key={route.id}>
            <use href={`#traffic-${route.id}`} className={`${styles.trafficRoute} ${index > 2 ? styles.trafficRouteRear : ""} ${index > 1 ? styles.trafficOptional : ""}`} />
            <g className={`${styles.trafficMarker} ${index > 1 ? styles.trafficOptional : ""}`} style={{ "--traffic-duration": route.duration, "--traffic-delay": route.delay } as CSSProperties}>
              <path d="M-38 0 C-28 -5 -15 -7 0 -5 C7 -4 12 -1 16 0 C12 1 7 4 0 5 C-15 7 -28 5 -38 0Z" fill="url(#traffic-packet-tail)" filter="url(#traffic-soft-glow)" />
              <path d="M-24 0 C-15 -3.2 -6 -4 4 -2 C9 -1 13 0 16 0 C13 0 9 1 4 2 C-6 4 -15 3.2 -24 0Z" fill="url(#traffic-packet-tail)" />
              <circle cx="13" cy="0" r="5.2" fill="#ff8a3d" fillOpacity=".35" filter="url(#traffic-soft-glow)" />
              <circle cx="13" cy="0" r="4.2" fill="#fff1e6" />
              <circle cx="13" cy="0" r="3.2" fill="#ff6b00" />
              <animateMotion dur={route.duration} begin={route.delay} repeatCount="indefinite" rotate="auto">
                <mpath href={`#traffic-${route.id}`} />
              </animateMotion>
            </g>
          </g>
        ))}
        <g className={styles.trafficNodes}>
          <circle cx="118" cy="282" r="6" fill="url(#traffic-node-glow)" /><circle cx="118" cy="282" r="2" />
          <circle cx="406" cy="192" r="6" fill="url(#traffic-node-glow)" /><circle cx="406" cy="192" r="2" />
          <circle cx="548" cy="328" r="6" fill="url(#traffic-node-glow)" /><circle cx="548" cy="328" r="2" />
          <circle cx="574" cy="474" r="6" fill="url(#traffic-node-glow)" /><circle cx="574" cy="474" r="2" />
        </g>
        <g className={styles.trafficLabels}>
          <g transform="translate(92 254)"><rect width="56" height="20" rx="6" /><text x="8" y="13">Inbound</text></g>
          <g transform="translate(536 296)"><rect width="65" height="20" rx="6" /><text x="8" y="13">Workflow</text></g>
        </g>
      </svg>
    </div>
  );
}
