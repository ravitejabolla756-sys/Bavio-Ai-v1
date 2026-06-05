import type { Metadata } from "next";
import "./globals.css";
import { instrumentSerif, jetbrainsMono, geistSans, geistMono } from "@/lib/fonts";
import NavigationProgress from "@/components/NavigationProgress";

export const metadata: Metadata = {
  title: "Bavio AI - Autonomous Voice Agents for Business Calls",
  description:
    "Answer every call instantly. Qualify leads in Hindi, English and Hinglish. 24/7 AI voice agents for Indian businesses starting at Rs 1,999 per month.",
  metadataBase: new URL("https://bavio.in"),
  openGraph: {
    title: "Bavio AI - Autonomous Voice Agents for Business Calls",
    description:
      "Answer every call instantly. Qualify leads in Hindi, English and Hinglish. 24/7 AI voice agents for Indian businesses.",
    url: "https://bavio.in",
    siteName: "Bavio AI",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bavio AI - Autonomous Voice Agents",
    description:
      "Answer every call instantly. Qualify leads in Hindi, English and Hinglish.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased bg-canvas text-ink min-h-[100dvh] font-sans noise-overlay">
        <NavigationProgress />
        {children}
      </body>
    </html>
  );
}

