"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChartBar,
  GlobeHemisphereWest,
  Users,
  CreditCard,
  Gear,
  CaretLeft,
  Bell,
  Clock,
  ArrowsClockwise,
  List,
  X,
  Pulse,
} from "@phosphor-icons/react";

const adminNavItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: ChartBar },
  { name: "Customers", href: "/admin/dashboard", icon: Users, badge: "Soon" },
  { name: "Billing", href: "/admin/dashboard", icon: CreditCard, badge: "Soon" },
  { name: "Regions", href: "/admin/dashboard", icon: GlobeHemisphereWest, badge: "Soon" },
  { name: "Settings", href: "/admin/dashboard", icon: Gear, badge: "Soon" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [refreshCountdown, setRefreshCountdown] = useState(300);

  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) return 300;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "#0A0A10" }}>
      {/* ── MOBILE HEADER ── */}
      <div
        className="md:hidden w-full px-4 py-3 flex items-center justify-between z-40 relative border-b"
        style={{ background: "#0F0F18", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white" style={{ background: "#FF6B00" }}>
            B
          </div>
          <span className="text-xs font-bold tracking-wide text-white/90">
            Bavio <span style={{ color: "#FF6B00" }}>Admin</span>
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-white/50 hover:text-white transition-colors"
          aria-label="Toggle Navigation"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <List className="w-5 h-5" />}
        </button>
      </div>

      {/* ── LEFT SIDEBAR ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-60 z-50 flex flex-col justify-between transition-transform duration-300
          md:translate-x-0 md:static md:h-screen border-r
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ background: "#0F0F18", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex flex-col gap-6 p-4 overflow-y-auto flex-grow">
          {/* Brand */}
          <div className="flex items-center gap-2.5 px-1 pt-1">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
              style={{ background: "#FF6B00" }}
            >
              B
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-wide text-white/90">
                Bavio <span style={{ color: "#FF6B00" }}>Admin</span>
              </span>
              <span className="text-[9px] text-white/30 font-mono tracking-widest">
                OPS CONSOLE
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 px-3 mb-1">
              Operations
            </span>
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href && !item.badge;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all relative ${
                    isActive
                      ? "text-white"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                  }`}
                  style={
                    isActive
                      ? { background: "rgba(255,107,0,0.08)", color: "#FF6B00" }
                      : {}
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className="w-4 h-4"
                      weight={isActive ? "fill" : "regular"}
                      style={isActive ? { color: "#FF6B00" } : {}}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.04] text-white/25 tracking-wide">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="adminSidebarActive"
                      className="absolute right-3 w-1.5 h-1.5 rounded-full"
                      style={{ background: "#FF6B00" }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                </Link>
              );
            })}

            <div className="h-px my-3" style={{ background: "rgba(255,255,255,0.04)" }} />

            <Link
              href="/workspace"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-all"
            >
              <CaretLeft className="w-4 h-4" />
              <span>Back to Workspace</span>
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer — Status */}
        <div
          className="p-4 border-t flex flex-col gap-2"
          style={{ borderColor: "rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-white/25">
            <div className="flex items-center gap-1.5">
              <Pulse className="w-3 h-3" style={{ color: "#22c55e" }} />
              <span>System Healthy</span>
            </div>
            <span>v2.1.0</span>
          </div>
        </div>
      </aside>

      {/* MOBILE BACKDROP */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex-grow flex flex-col overflow-y-auto h-screen z-10 relative">
        {/* Top bar */}
        <header
          className="hidden md:flex items-center justify-between border-b px-8 py-3 sticky top-0 z-20"
          style={{
            background: "rgba(15,15,24,0.85)",
            backdropFilter: "blur(12px)",
            borderColor: "rgba(255,255,255,0.04)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-white/25 tracking-wide">ADMIN</span>
            <span className="text-white/10 text-xs">/</span>
            <span className="text-xs font-bold text-white/80 tracking-wide">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Auto-refresh countdown */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/25">
              <ArrowsClockwise className="w-3 h-3" />
              <span>Refresh in {formatCountdown(refreshCountdown)}</span>
            </div>
            {/* Live clock */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/30 border-l pl-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <Clock className="w-3.5 h-3.5" />
              <span>{currentTime}</span>
            </div>
            {/* Alert bell */}
            <button className="p-2 text-white/30 hover:text-white/70 rounded-full hover:bg-white/[0.04] relative transition-all">
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse" style={{ background: "#FF6B00" }} />
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-grow p-5 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
