"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Layout,
  CreditCard,
  Gear,
  Sparkle,
  SignOut,
  Command,
  CaretDown,
  Bell,
  List,
  X,
  MagnifyingGlass,
  ArrowRight,
  ShieldCheck,
  Spinner
} from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { clearAuthData, authApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const navigation = [
  { name: "Overview", href: "/workspace", icon: Layout },
  { name: "Subscription & Billing", href: "/workspace/subscription", icon: CreditCard },
  { name: "Settings & Profile", href: "/workspace/settings", icon: Gear },
];

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    if (typeof window !== "undefined") {
      return Boolean(localStorage.getItem("bavio_token"));
    }
    return null;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandKOpen, setCommandKOpen] = useState(false);
  const [workspace, setWorkspace] = useState("My Workspace");
  const [commercialState, setCommercialState] = useState("FREE PLAN");
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Strict Authentication Guard
  useEffect(() => {
    const token = localStorage.getItem("bavio_token");
    if (!token) {
      setIsAuthenticated(false);
      clearAuthData();
      router.replace("/login");
      return;
    }

    setIsAuthenticated(true);
    fetchProfile(token);
  }, [router]);

  const fetchProfile = async (tokenOverride?: string) => {
    try {
      const token = tokenOverride || localStorage.getItem("bavio_token");
      if (!token) return;

      const res = await fetch("/api/auth/profile", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const result = await res.json();
        if (result && result.id) {
          if (result.name) {
            setWorkspace(result.name);
          }
          if (result.subscription_status === "active") {
            setCommercialState("ACTIVE PLAN");
          } else if (result.demo_status === "eligible" || result.demo_status === "failed") {
            setCommercialState("DEMO AVAILABLE");
          } else {
            setCommercialState("FREE PLAN");
          }
        }
      } else if (res.status === 401) {
        handleSignOut();
      } else {
        // Self-healing fallback from localStorage
        const storedName = localStorage.getItem("bavio_name");
        if (storedName) setWorkspace(storedName);
      }
    } catch (err) {
      console.error("Failed to fetch profile in workspace layout:", err);
      const storedName = localStorage.getItem("bavio_name");
      if (storedName) setWorkspace(storedName);
    }
  };

  const handleSignOut = async () => {
    clearAuthData();
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    router.replace("/login");
  };

  // Handle hotkeys (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandKOpen(prev => !prev);
      }
      if (e.key === "Escape") {
        setCommandKOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCommandKSelect = (href: string) => {
    router.push(href);
    setCommandKOpen(false);
    setSearchQuery("");
  };

  // If unauthenticated or checking, show loading HUD and do not render protected workspace
  if (isAuthenticated === null || isAuthenticated === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-canvas text-ink">
        <Spinner className="w-10 h-10 text-saffron animate-spin mb-4" />
        <span className="text-body-xs font-mono font-bold uppercase tracking-wider text-ink-muted">
          Verifying Session...
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-canvas text-ink font-sans overflow-hidden">
      
      {/* ── 1. FIXED LEFT SIDEBAR (Desktop) ── */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-surface border-r border-line flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Workspace Brand / Selector */}
        <div className="flex flex-col">
          <div className="p-4 border-b border-line">
            <div className="relative">
              <button
                onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface-raised transition-colors text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center font-display font-black text-sm shrink-0 shadow-sm">
                    {workspace.charAt(0).toUpperCase() || "B"}
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-ink block truncate leading-tight">
                      {workspace || "Bavio Workspace"}
                    </span>
                    <span className="text-[10px] text-ink-muted flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-state-success" />
                      Online
                    </span>
                  </div>
                </div>
                <CaretDown className="w-3.5 h-3.5 text-ink-tertiary group-hover:text-ink shrink-0 transition-transform" />
              </button>

              {/* Workspace drop-down menu */}
              {showWorkspaceDropdown && (
                <div className="absolute top-full left-0 w-full mt-2 bg-surface border border-line rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-line text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                    Switch Workspace
                  </div>
                  <button
                    onClick={() => setShowWorkspaceDropdown(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-ink bg-saffron/10 text-saffron rounded-lg mt-1 text-left"
                  >
                    <span className="w-2 h-2 rounded-full bg-saffron" />
                    <span>{workspace || "Bavio Workspace"}</span>
                  </button>
                  <Link
                    href="/dashboard"
                    onClick={() => setShowWorkspaceDropdown(false)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-ink-secondary hover:text-ink hover:bg-surface-raised rounded-lg text-left transition-colors"
                  >
                    <span>Switch to Voice Console</span>
                    <ArrowRight className="w-3 h-3 text-ink-tertiary" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-ink-muted block py-2">
              Workspace OS
            </span>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-surface-raised border border-line font-bold text-ink shadow-sm"
                      : "text-ink-secondary hover:text-ink hover:bg-surface-raised"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-saffron" : "text-ink-tertiary"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <div className="pt-4 pb-2">
              <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-ink-muted block py-1">
                Voice Operations
              </span>
            </div>

            {/* AI Voice Dashboard Link */}
            <Link
              href="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-ink-secondary hover:text-ink hover:bg-surface-raised transition-all group"
            >
              <div className="flex items-center gap-3">
                <Sparkle className="w-4 h-4 text-saffron" />
                <span>AI Voice Dashboard</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-ink-tertiary group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Web Call link */}
            <Link
              href="/workspace/demo"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                pathname === "/workspace/demo"
                  ? "bg-saffron/10 border border-saffron/20 text-saffron shadow-sm"
                  : "bg-saffron/5 border border-saffron/10 hover:bg-saffron/10 text-saffron"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkle className="w-4 h-4 text-saffron" weight="fill" />
                <span>Web Call</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono font-black tracking-wider bg-saffron text-white px-1.5 py-0.5 rounded leading-none">
                  3 MIN
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-saffron" />
              </div>
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-line bg-surface-raised/40 flex flex-col gap-3">
          {/* Quick command reminder */}
          <button 
            onClick={() => setCommandKOpen(true)}
            className="w-full flex items-center justify-between text-left text-[10px] text-ink-tertiary hover:text-ink border border-dashed border-line hover:border-saffron/40 px-3 py-2 rounded-xl transition-all hover:bg-line-subtle/50"
          >
            <div className="flex items-center gap-1.5">
              <Command className="w-3 h-3" />
              <span>Search workspace</span>
            </div>
            <span className="font-mono text-[9px] bg-white/10 px-1 rounded text-ink-secondary">Ctrl+K</span>
          </button>

          {/* Logout button */}
          <button 
            id="workspace-signout-btn"
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-ink-tertiary hover:text-state-error transition-colors w-full text-left"
          >
            <SignOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER BACKDROP */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-canvas/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── 2. MAIN CONTENT WRAPPER ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-canvas">
        
        {/* TOP HUD BAR */}
        <header className="h-16 border-b border-line bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 text-ink-secondary hover:text-ink md:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <List className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-ink-muted">
              <span>Workspaces</span>
              <span>/</span>
              <span className="text-ink font-bold truncate max-w-[160px] md:max-w-xs">{workspace}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Box Trigger */}
            <button 
              onClick={() => setCommandKOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-surface-raised hover:bg-canvas border border-line hover:border-saffron/40 px-3.5 py-1.5 rounded-full text-xs text-ink-tertiary hover:text-ink transition-all w-48"
            >
              <MagnifyingGlass className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-grow text-left whitespace-nowrap overflow-hidden text-ellipsis">Search Workspace...</span>
              <kbd className="font-mono text-[9px] bg-white/5 border border-line px-1.5 py-0.5 rounded text-ink-muted whitespace-nowrap shrink-0">Ctrl K</kbd>
            </button>

            {/* Theme switcher toggle */}
            <ThemeToggle variant="header" />

            {/* Notification alert */}
            <button className="p-2 text-ink-tertiary hover:text-ink border border-line rounded-full hover:bg-line-subtle/50 relative transition-all">
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-saffron animate-pulse" />
              <Bell className="w-4 h-4" />
            </button>
            
            {/* Upgrade banner mini */}
            <Link 
              href="/workspace/subscription"
              className="bg-saffron/10 border border-saffron/20 hover:bg-saffron text-saffron hover:text-white text-[10px] font-mono font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all"
            >
              {commercialState}
            </Link>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* ── 3. CMD + K COMMAND PALETTE MODAL ── */}
      {commandKOpen && (
        <div className="fixed inset-0 bg-canvas/80 backdrop-blur-md z-50 flex items-start justify-center pt-24 p-4">
          <div className="bg-surface border border-line rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="p-4 border-b border-line flex items-center gap-3">
              <MagnifyingGlass className="w-5 h-5 text-saffron shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or jump to page..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted font-medium"
              />
              <button 
                onClick={() => setCommandKOpen(false)}
                className="text-ink-muted hover:text-ink text-xs font-mono px-2 py-1 bg-surface-raised rounded border border-line"
              >
                ESC
              </button>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                Navigation
              </div>
              {[
                { title: "Overview Dashboard", href: "/workspace", icon: Layout },
                { title: "Live Web Call & Demo", href: "/workspace/demo", icon: Sparkle },
                { title: "Subscription & Billing", href: "/workspace/subscription", icon: CreditCard },
                { title: "Settings & Profile", href: "/workspace/settings", icon: Gear },
                { title: "AI Voice Console", href: "/dashboard", icon: ArrowRight },
              ]
                .filter(cmd => cmd.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((cmd, idx) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleCommandKSelect(cmd.href)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-raised text-xs font-semibold text-ink group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-ink-tertiary group-hover:text-saffron transition-colors" />
                        <span>{cmd.title}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
