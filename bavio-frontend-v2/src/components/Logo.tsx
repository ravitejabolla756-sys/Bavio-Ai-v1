import React from "react";

export default function Logo({ 
  className = "w-8 h-8", 
  color = "text-saffron" // Kept for API compatibility, though not used by the img tag
}: { 
  className?: string; 
  color?: string;
}) {
  // Extract width and height from className to set inline styles.
  // This guarantees the image is never rendered at its huge natural resolution.
  let width = "2rem"; // 32px
  let height = "2rem"; // 32px

  if (className.includes("w-7")) width = "1.75rem";
  else if (className.includes("w-8")) width = "2rem";
  else if (className.includes("w-9")) width = "2.25rem";
  else if (className.includes("w-10")) width = "2.5rem";
  else if (className.includes("w-12")) width = "3rem";
  else if (className.includes("w-16")) width = "4rem";

  if (className.includes("h-7")) height = "1.75rem";
  else if (className.includes("h-8")) height = "2rem";
  else if (className.includes("h-9")) height = "2.25rem";
  else if (className.includes("h-10")) height = "2.5rem";
  else if (className.includes("h-12")) height = "3rem";
  else if (className.includes("h-16")) height = "4rem";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/bavio-logo.png"
      alt="Bavio Logo"
      className={`${className} object-contain rounded-lg`}
      style={{ width, height }}
    />
  );
}

