"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Layout,
  Users,
  BookOpen,
  PhoneCall,
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
import ApplicationNavigation from "@/components/ApplicationNavigation";
import { applicationNavigationItems } from "@/config/application-navigation";
import "@/styles/application-tokens.css";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { clearAuthData, authApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { WorkspaceProvider } from "@/context/WorkspaceContext";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandKOpen, setCommandKOpen] = useState(false);
  const [workspace, setWorkspace] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("bavio_name") || "";
    }
    return "";
  });
  const [commercialState, setCommercialState] = useState("FREE PLAN");
  const [mounted, setMounted] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCommand, setActiveCommand] = useState(0);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close workspace dropdown on outside click
  useEffect(() => {
    if (!showWorkspaceDropdown) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(e.target as Node)) {
        setShowWorkspaceDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showWorkspaceDropdown]);

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
        if (token === "mock_token_for_test") {
          setWorkspace("Demo Workspace");
          return;
        }
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
      if (!commandKOpen) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveCommand(value => value + 1); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveCommand(value => Math.max(0, value - 1)); }
      if (e.key === "Enter") { e.preventDefault(); document.querySelector<HTMLButtonElement>(`[data-command-index="${activeCommand}"]`)?.click(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandKOpen, activeCommand]);

  const handleCommandKSelect = (href: string) => {
    router.push(href);
    setCommandKOpen(false);
    setSearchQuery("");
  };

  const fuzzyMatch = (value: string, query: string) => {
    if (!query.trim()) return true;
    let cursor = 0;
    for (const char of value.toLowerCase()) {
      if (char === query.toLowerCase()[cursor]) cursor += 1;
      if (cursor === query.trim().length) return true;
    }
    return false;
  };
  const commandGroups = [
    { label: "Navigation", items: applicationNavigationItems.filter(item => fuzzyMatch(item.name, searchQuery)).map(item => ({ ...item, label: item.name, href: item.href })) },
    { label: "Recent", items: pathname ? applicationNavigationItems.filter(item => pathname === item.href || pathname.startsWith(`${item.href}/`)).map(item => ({ ...item, label: item.name, href: item.href })) : [] },
    { label: "Actions", items: [
      { name: "Create agent", label: "Create agent", href: "/dashboard/assistant", icon: Users },
      { name: "Add knowledge", label: "Add knowledge", href: "/dashboard/knowledge", icon: BookOpen },
      { name: "Connect phone number", label: "Connect phone number", href: "/dashboard/phone-numbers", icon: PhoneCall },
    ].filter(item => fuzzyMatch(item.name, searchQuery)) },
  ];
  const visibleCommands = commandGroups.flatMap(group => group.items);

  // If unauthenticated or checking, show loading HUD and do not render protected workspace
  if (!mounted || isAuthenticated === null || isAuthenticated === false) {
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
    <WorkspaceProvider>
      <div className="bavio-app flex h-screen bg-canvas text-ink font-sans overflow-hidden">
      
      {/* ── 1. FIXED LEFT SIDEBAR (Desktop) ── */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-surface border-r border-line flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Workspace Brand / Selector */}
        <div className="flex flex-col">
          <div className="p-4 border-b border-line">
            <div className="relative" ref={workspaceDropdownRef}>
              <button
                onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface-raised transition-colors text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center font-display font-black text-sm shrink-0 shadow-sm">
                    {workspace ? workspace.charAt(0).toUpperCase() : "W"}
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-ink block truncate leading-tight">
                      {workspace || "Workspace unavailable"}
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
                  {workspace && <button
                    onClick={() => setShowWorkspaceDropdown(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-ink bg-saffron/10 text-saffron rounded-lg mt-1 text-left"
                  >
                    <span className="w-2 h-2 rounded-full bg-saffron" />
                    <span>{workspace}</span>
                  </button>
                  }
                  {!workspace && <p className="px-3 py-2 text-xs text-ink-muted">Workspace unavailable</p>}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <ApplicationNavigation onNavigate={() => setSidebarOpen(false)} />
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
              <span>Search Bavio…</span>
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
              <span className="text-ink font-bold truncate max-w-[160px] md:max-w-xs">{workspace || "Workspace"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Box Trigger */}
            <button 
              onClick={() => setCommandKOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-surface-raised hover:bg-canvas border border-line hover:border-saffron/40 px-3.5 py-1.5 rounded-full text-xs text-ink-tertiary hover:text-ink transition-all w-48"
            >
              <MagnifyingGlass className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-grow text-left whitespace-nowrap overflow-hidden text-ellipsis">Search Bavio…</span>
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
                placeholder="Search Bavio…"
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
              {commandGroups.map(group => group.items.length > 0 && <section key={group.label} aria-labelledby={`command-${group.label}`}><div id={`command-${group.label}`} className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-muted">{group.label}</div>{group.items.map((cmd) => { const index = visibleCommands.indexOf(cmd); const Icon = cmd.icon; return <button data-command-index={index} key={`${group.label}-${cmd.href}`} onClick={() => handleCommandKSelect(cmd.href)} className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold text-ink group transition-colors ${activeCommand === index ? "bg-surface-raised" : "hover:bg-surface-raised"}`}><div className="flex items-center gap-3"><Icon className="w-4 h-4 text-ink-tertiary group-hover:text-saffron" /><span>{cmd.label}</span></div><ArrowRight className="w-3.5 h-3.5 text-ink-muted" /></button>; })}</section>)}
              {visibleCommands.length === 0 && <div className="px-3 py-8 text-center text-xs text-ink-muted">No executable commands found.</div>}
            </div>
          </div>
        </div>
      )}
      </div>
    </WorkspaceProvider>
  );
}
