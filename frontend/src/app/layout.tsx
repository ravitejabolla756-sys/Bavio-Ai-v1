import type { Metadata } from "next";
import "./globals.css";
import { instrumentSerif, jetbrainsMono, geistSans, geistMono, syne, dmSans, playfairDisplay, cormorantGaramond, inter } from "@/lib/fonts";
import NavigationProgress from "@/components/NavigationProgress";
import { CountryProvider } from "@/context/CountryContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AuthHashHandler from "@/components/AuthHashHandler";

export const metadata: Metadata = {
  title: "Bavio AI - Autonomous Voice Agents for Business Calls",
  description:
    "Answer every call instantly. Qualify leads instantly. 24/7 AI voice agents starting at $39 per month.",
  metadataBase: new URL("https://bavio.in"),
  openGraph: {
    title: "Bavio AI - Autonomous Voice Agents for Business Calls",
    description:
      "Answer every call instantly. Qualify leads instantly. 24/7 AI voice agents for your business.",
    url: "https://bavio.in",
    siteName: "Bavio AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bavio AI - Autonomous Voice Agents",
    description:
      "Answer every call instantly. Qualify leads instantly with autonomous voice AI.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${syne.variable} ${dmSans.variable} ${playfairDisplay.variable} ${cormorantGaramond.variable} ${inter.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('bavio_theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-canvas text-ink min-h-[100dvh] font-sans noise-overlay">
        <ThemeProvider>
          <CountryProvider>
            <AuthHashHandler />
            <NavigationProgress />
            {children}
          </CountryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}



