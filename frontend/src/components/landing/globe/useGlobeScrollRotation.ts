"use client";

import { useScroll, useSpring, useTransform } from "framer-motion";

/** 26 degrees per 1000px, reversible without accumulated frame deltas. */
export function useGlobeScrollRotation() {
  const { scrollY } = useScroll();
  const target = useTransform(scrollY, (y) => y * (26 * Math.PI / 180) / 1000);
  return useSpring(target, { stiffness: 48, damping: 24, mass: 1.1 });
}
