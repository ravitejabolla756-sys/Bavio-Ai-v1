import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { instrumentSerif, geistSans, geistMono, inter } from "@/lib/fonts";
import NavigationProgress from "@/components/NavigationProgress";
import { CountryProvider } from "@/context/CountryContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AuthHashHandler from "@/components/AuthHashHandler";
import SmoothScrollProvider from "@/components/marketing/SmoothScrollProvider";

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
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${inter.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var p = window.location.pathname || '';
                  var isWorkspace = p.startsWith('/workspace') || p.startsWith('/dashboard') || p.startsWith('/app');
                  if (isWorkspace) {
                    var saved = localStorage.getItem('theme') || localStorage.getItem('bavio_theme');
                    if (saved === 'dark' || (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                      document.documentElement.classList.add('dark');
                      document.documentElement.style.colorScheme = 'dark';
                      return;
                    }
                  }
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground min-h-[100dvh] font-sans noise-overlay">
        <Suspense fallback={null}>
          <ThemeProvider>
            <CountryProvider>
              <AuthHashHandler />
              <NavigationProgress />
              <SmoothScrollProvider>
                {children}
              </SmoothScrollProvider>
            </CountryProvider>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}
