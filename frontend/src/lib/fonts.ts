import { Instrument_Serif, Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

// Primary Editorial Display Font
export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["400"],
  style: ["normal", "italic"],
});

// Primary Functional Body Font
export const geistSans = GeistSans;

// Primary Technical Metadata Font
export const geistMono = GeistMono;

// Fallback Sans
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

// Backward compatibility exports mapping to core fonts
export const playfairDisplay = instrumentSerif;
export const cormorantGaramond = instrumentSerif;
export const bodoniModa = instrumentSerif;
export const syne = geistSans;
export const dmSans = geistSans;
export const jetbrainsMono = geistMono;
