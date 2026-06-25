"use client";

import React, { useEffect, useRef, useState } from "react";
import { useInView, animate } from "framer-motion";

interface CountUpProps {
  value: string;
  duration?: number;
}

export default function CountUp({ value, duration = 0.8 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (!isInView) return;

    // Parse values like: "2M+", "500K+", "150+", "99.9%", "Rs 10,000"
    // Extract the raw number. We look for any digit sequences, possibly including dots and commas.
    const cleanValue = value.replace(/,/g, ""); // Remove commas for parsing
    const match = cleanValue.match(/^(.*?)(\d+\.?\d*)(.*)$/);

    if (!match) {
      setDisplayValue(value);
      return;
    }

    const prefix = match[1];
    const target = parseFloat(match[2]);
    const suffix = match[3];
    const isDecimal = match[2].includes(".");

    const controls = animate(0, target, {
      duration: duration,
      ease: "easeOut",
      onUpdate(latest) {
        let formattedNum = "";
        if (isDecimal) {
          formattedNum = latest.toFixed(1);
        } else {
          formattedNum = Math.floor(latest).toLocaleString("en-US");
        }
        setDisplayValue(`${prefix}${formattedNum}${suffix}`);
      },
      onComplete() {
        setDisplayValue(value); // Force set to exactly the original value (with commas restored)
      },
    });

    return () => controls.stop();
  }, [isInView, value, duration]);

  return <span ref={ref}>{displayValue}</span>;
}
