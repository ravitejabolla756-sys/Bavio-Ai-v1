"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Layout, 
  Users, 
  PhoneCall, 
  ChartBar, 
  BookOpen, 
  GitFork, 
  CreditCard, 
  Gear,
  CaretDown,
  CaretUp,
  MagnifyingGlass,
  Command,
  Pulse,
  SignOut,
  Sparkle,
  List,
  X,
  Bell,
  ArrowLeft,
  IdentificationCard,
  Circle,
  CheckCircle,
  Sun,
  Moon,
} from "@phosphor-icons/react";
import { 
  authApi, 
  assistantsApi, 
  knowledgeBaseApi, 
  numbersApi, 
  callsApi, 
  demoApi, 
  getClientId 
} from "@/lib/api";

const consoleNavigationItems = [
  { name: "Overview", href: "/dashboard", icon: Layout },
  { name: "Calls", href: "/dashboard/calls", icon: PhoneCall },
  { name: "Leads", href: "/dashboard/leads", icon: IdentificationCard },
  { name: "AI Employees", href: "/dashboard/assistant", icon: Users },
  { name: "Knowledge", href: "/dashboard/knowledge", icon: BookOpen },
  { name: "Phone Numbers", href: "/dashboard/phone-numbers", icon: GitFork },
];

const accountNavigationItems = [
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Gear },
];

const allNavigationItems = [...consoleNavigationItems, ...accountNavigationItems];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandKOpen, setCommandKOpen] = useState(false);
  const [workspace, setWorkspace] = useState("Medcare Hospitals");
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Theme Switcher State
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bavio_theme") as "light" | "dark";
      if (saved) {
        setTheme(saved);
        if (saved === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    }
  }, []);

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const isDark = theme === "dark";
    const nextTheme = isDark ? "light" : "dark";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTheme(nextTheme);
      localStorage.setItem("bavio_theme", nextTheme);
      document.documentElement.classList.toggle("dark");
      return;
    }

    const btn = event.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const maxRadius = Math.hypot(
      Math.max(x, w - x),
      Math.max(y, h - y)
    );

    // Fallback if View Transitions API is not supported
    if (!document.startViewTransition) {
      setTheme(nextTheme);
      localStorage.setItem("bavio_theme", nextTheme);
      document.documentElement.classList.toggle("dark");
      return;
    }

    const style = document.createElement("style");
    style.id = "theme-clip-style";
    style.innerHTML = `
      ::view-transition-new(root) {
        clip-path: circle(0px at ${x}px ${y}px);
      }
      ::view-transition-old(root) {
        clip-path: none;
      }
    `;
    document.head.appendChild(style);

    const transition = document.startViewTransition(() => {
      setTheme(nextTheme);
      localStorage.setItem("bavio_theme", nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 650,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          pseudoElement: "::view-transition-new(root)"
        }
      ).onfinish = () => {
        const appended = document.getElementById("theme-clip-style");
        if (appended) appended.remove();
      };
    });
  };

  // Checklist State
  const [checklist, setChecklist] = useState({
    demoCompleted: false,
    profileCompleted: false,
    assistantCompleted: false,
    knowledgeCompleted: false,
    phoneCompleted: false,
    firstCallCompleted: false,
  });
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const clientId = getClientId();

  const checkChecklistState = React.useCallback(async () => {
    if (!clientId) return;
    try {
      const [profileData, assistantsData, knowledgeData, phoneData, callsData, demoData] = await Promise.all([
        authApi.getProfile().catch(() => null),
        assistantsApi.list(clientId).catch(() => []),
        knowledgeBaseApi.list().catch(() => []),
        numbersApi.list(clientId).catch(() => []),
        callsApi.list(clientId).catch(() => []),
        demoApi.getStatus().catch(() => null),
      ]);

      const demoCompleted = !!(
        demoData?.session?.call_status === "completed" || 
        (demoData?.session?.call_duration && demoData.session.call_duration > 0) || 
        (demoData?.transcript && demoData.transcript.length > 0) ||
        localStorage.getItem("bavio_demo_call_done") === "true"
      );

      const profileCompleted = !!(profileData?.name && profileData?.industry);
      const assistantCompleted = assistantsData && assistantsData.length > 0;
      const knowledgeCompleted = knowledgeData && knowledgeData.length > 0;
      const phoneCompleted = phoneData && phoneData.some((p: any) => p.assistant_id !== null);
      const firstCallCompleted = callsData && callsData.length > 0;

      setChecklist({
        demoCompleted,
        profileCompleted,
        assistantCompleted,
        knowledgeCompleted,
        phoneCompleted,
        firstCallCompleted,
      });
    } catch (err) {
      console.error("Failed to calculate onboarding checklist state:", err);
    } finally {
      setChecklistLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const collapsed = localStorage.getItem("bavio_checklist_collapsed") === "true";
      const dismissed = localStorage.getItem("bavio_checklist_dismissed") === "true";
      setIsCollapsed(collapsed);
      setIsDismissed(dismissed);
    }
    
    checkChecklistState();
    const interval = setInterval(checkChecklistState, 10000);
    return () => clearInterval(interval);
  }, [checkChecklistState]);

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("bavio_checklist_collapsed", String(next));
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("bavio_checklist_dismissed", "true");
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const isAllCompleted = completedCount === 6;

  // Handle hotkeys (Cmd/Ctrl + K) and workspace name sync
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("bavio_name");
      if (savedName) {
        setWorkspace(savedName);
      }
      
      const token = localStorage.getItem("bavio_token");
      if (token) {
        fetch("/api/auth/profile", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.name) {
              setWorkspace(data.name);
              localStorage.setItem("bavio_name", data.name);
            }
          })
          .catch(err => console.error("Failed to load workspace name:", err));
      }
    }

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

  const filteredNavItems = allNavigationItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-transparent text-ink flex flex-col md:flex-row relative font-sans noise-overlay">
      
      {/* Background Subtle mesh orbs (removed to use body background) */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-saffron/3 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-saffron/2 blur-[100px] pointer-events-none z-0" />

      {/* MOBILE HEADER BAR */}
      <div className="md:hidden w-full bg-surface border-b border-line px-4 py-3 flex items-center justify-between z-40 relative">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo className="w-7 h-7" color="text-saffron" />
          <span className="font-display font-extrabold text-base tracking-tight text-ink">
            Bavio AI<span className="text-saffron">.dashboard</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-1.5 text-ink-tertiary hover:text-ink border border-line rounded-lg hover:bg-line-subtle/50 relative transition-all"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-saffron" /> : <Moon className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setCommandKOpen(true)}
            className="p-1.5 text-ink-tertiary hover:text-ink transition-colors"
            aria-label="Command search"
          >
            <MagnifyingGlass className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-ink-tertiary hover:text-ink transition-colors"
            aria-label="Toggle Navigation"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <List className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* LEFT SIDEBAR (Desktop & Mobile Drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-surface border-r border-line z-50 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 md:static md:h-screen
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col gap-6 p-4 overflow-y-auto flex-grow">
          {/* Brand header / Workspace switcher */}
          <div className="relative">
            <div 
              className="w-full flex items-center justify-between bg-surface-raised border border-line px-3.5 py-2.5 rounded-xl text-left"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-5 h-5 bg-saffron rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {workspace.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold tracking-wide text-ink truncate font-display font-black">
                  {workspace}
                </span>
              </div>
            </div>
          </div>

          {/* Back to Workspace button */}
          <div className="mt-1 mb-2">
            <Link
              href="/workspace"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-ink-secondary hover:text-saffron hover:bg-saffron/5 border border-dashed border-line hover:border-saffron/20 transition-all text-left"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Workspace</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted px-3 mb-1">
              Voice Console
            </span>
            {consoleNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all relative ${
                    isActive 
                      ? "text-saffron" 
                      : "text-ink-secondary hover:bg-line-subtle/50 hover:text-ink"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-saffron" : "text-ink-tertiary"}`} />
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeSidebarIndicator" 
                      className="absolute right-3 w-1.5 h-1.5 bg-saffron rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                </Link>
              );
            })}

            <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted px-3 mt-4 mb-1">
              Account
            </span>
            {accountNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all relative ${
                    isActive 
                      ? "text-saffron" 
                      : "text-ink-secondary hover:bg-line-subtle/50 hover:text-ink"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-saffron" : "text-ink-tertiary"}`} />
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeSidebarIndicator" 
                      className="absolute right-3 w-1.5 h-1.5 bg-saffron rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-line bg-surface-raised/40 flex flex-col gap-3">
          {/* Heartbeat Status Indicator */}
          <div className="flex items-center justify-between bg-canvas/45 border border-line rounded-xl px-3 py-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-state-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-state-success"></span>
              </span>
              <span className="text-[10px] font-mono text-ink-secondary truncate">System Operational</span>
            </div>
          </div>

          {/* Quick command reminder */}
          <button 
            onClick={() => setCommandKOpen(true)}
            className="w-full flex items-center justify-between text-left text-[10px] text-ink-tertiary hover:text-ink border border-dashed border-line hover:border-saffron/40 px-3 py-2 rounded-xl transition-all hover:bg-line-subtle/50"
          >
            <div className="flex items-center gap-1.5">
              <Command className="w-3 h-3" />
              <span>Search menu</span>
            </div>
            <span className="font-mono text-[9px] bg-white/10 px-1 rounded text-ink-secondary">Ctrl+K</span>
          </button>

          {/* Logout button */}
          <Link 
            href="/workspace"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-ink-tertiary hover:text-state-error transition-colors"
          >
            <SignOut className="w-4 h-4" />
            <span>Exit Dashboard</span>
          </Link>
        </div>
      </aside>

      {/* MOBILE DRAWER BACKDROP */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-canvas/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN WORKSPACE WRAPPER */}
      <div className="flex-grow flex flex-col overflow-y-auto h-screen z-10 relative">
        
        {/* TOP BAR SEARCH HEADER */}
        <header className="hidden lg:flex items-center justify-between border-b border-line px-8 py-4 bg-surface/65 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 border-r border-line pr-4">
              <span className="text-[10px] font-mono text-ink-muted uppercase">Workspace:</span>
              <span className="text-xs font-bold text-ink tracking-wide">{workspace}</span>
            </div>
            
            {/* Live Metrics / Agent Status */}
            <div className="flex items-center gap-4 text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-state-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-state-success"></span>
                </span>
                <span className="text-ink-secondary">System Operational</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Box Trigger */}
            <button 
              onClick={() => setCommandKOpen(true)}
              className="flex items-center gap-2 bg-surface-raised hover:bg-canvas border border-line hover:border-saffron/40 px-3.5 py-1.5 rounded-full text-xs text-ink-tertiary hover:text-ink transition-all w-48"
            >
              <MagnifyingGlass className="w-3.5 h-3.5" />
              <span className="flex-grow text-left">Search Dashboard...</span>
              <kbd className="font-mono text-[9px] bg-white/5 border border-line px-1.5 py-0.5 rounded text-ink-muted">Ctrl K</kbd>
            </button>

            {/* Theme switcher toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-ink-tertiary hover:text-ink border border-line rounded-full hover:bg-line-subtle/50 relative transition-all"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-saffron" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification alert */}
            <button className="p-2 text-ink-tertiary hover:text-ink border border-line rounded-full hover:bg-line-subtle/50 relative transition-all">
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-saffron animate-pulse" />
              <Bell className="w-4 h-4" />
            </button>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 border-l border-line pl-4">
            </div>
          </div>
        </header>

        {/* DASHBOARD PAGE INJECT */}
        <main className="flex-grow p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* COMMAND-K DIALOG PORTAL */}
      <AnimatePresence>
        {commandKOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay background */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-canvas/85 backdrop-blur-md"
              onClick={() => setCommandKOpen(false)}
            />

            {/* Search Panel box */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="w-full max-w-xl bg-surface border border-line rounded-2xl shadow-premium overflow-hidden z-10 relative max-h-[460px] flex flex-col"
            >
              {/* Double Bezel Inner Refraction */}
              <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none" />

              <div className="p-4 border-b border-line flex items-center gap-3">
                <MagnifyingGlass className="w-5 h-5 text-saffron" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type a command or search sections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-grow bg-transparent text-sm text-ink focus:outline-none placeholder:text-ink-muted font-sans"
                />
                <button 
                  onClick={() => setCommandKOpen(false)}
                  className="text-xs text-ink-muted hover:text-ink font-mono bg-white/5 border border-line px-2 py-0.5 rounded hover:bg-line-subtle/50"
                >
                  ESC
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-2.5 flex flex-col gap-1.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted px-2.5 py-1">
                  Navigate Workspace
                </span>

                {filteredNavItems.length > 0 ? (
                  filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.name}
                        onClick={() => handleCommandKSelect(item.href)}
                        className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl hover:bg-saffron/10 text-xs font-semibold tracking-wide text-ink-secondary hover:text-ink transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-ink-tertiary group-hover:text-saffron transition-colors" />
                          <span>Go to {item.name}</span>
                        </div>
                        <kbd className="font-mono text-[9px] text-ink-muted group-hover:text-saffron-light">Jump ↵</kbd>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-xs text-ink-muted font-mono">
                    No results found for &ldquo;{searchQuery}&rdquo;
                  </div>
                )}
                
                {/* Advanced Quick Actions Removed */}
              </div>

              <div className="p-3 bg-surface-raised border-t border-line flex justify-between items-center text-[10px] text-ink-muted font-mono">
                <span>Select with arrows &bull; Execute with Enter</span>
                <span>Bavio Operator v1.0.5</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ONBOARDING CHECKLIST FLOATING CARD / BOTTOM DRAWER */}
      <AnimatePresence>
        {!isDismissed ? (
          <>
            {/* Desktop Onboarding Checklist: hidden on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="hidden md:block fixed bottom-6 right-6 w-[340px] bg-white border border-line rounded-2xl shadow-xl z-50 overflow-hidden font-sans text-left"
            >
              {/* Header */}
              <div className="bg-canvas/15 border-b border-line/45 p-4 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider">
                    {isAllCompleted ? "Setup Complete" : "Get started with Bavio"}
                  </span>
                  <h4 className="font-bold text-xs text-ink font-sans">
                    {completedCount} of 6 completed
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleCollapsed}
                    className="p-1 hover:bg-canvas rounded-lg text-ink-tertiary hover:text-ink transition-colors"
                  >
                    {isCollapsed ? <CaretUp className="w-3.5 h-3.5" /> : <CaretDown className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="p-1 hover:bg-canvas rounded-lg text-ink-tertiary hover:text-ink transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1 bg-canvas/30">
                <div
                  className="bg-saffron h-full transition-all duration-300"
                  style={{ width: `${(completedCount / 6) * 100}%` }}
                />
              </div>

              {/* Tasks List */}
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-white"
                  >
                    <div className="p-4 space-y-3.5">
                      {isAllCompleted ? (
                        <div className="text-center py-4 space-y-2">
                          <CheckCircle className="w-8 h-8 text-state-success mx-auto" />
                          <h5 className="font-bold text-xs text-ink font-sans">Bavio setup complete</h5>
                          <p className="text-[10px] text-ink-tertiary font-sans">
                            You have successfully completed all onboarding setups.
                          </p>
                          <button
                            onClick={handleDismiss}
                            className="px-4 py-1.5 bg-saffron hover:bg-saffron-dark text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-saffron mt-2"
                          >
                            Dismiss Checklist
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {[
                            {
                              id: "demo",
                              label: "Try a live demo",
                              completed: checklist.demoCompleted,
                              href: "/workspace/demo",
                            },
                            {
                              id: "profile",
                              label: "Add your business information",
                              completed: checklist.profileCompleted,
                              href: "/dashboard/settings",
                            },
                            {
                              id: "assistant",
                              label: "Create your first AI Employee",
                              completed: checklist.assistantCompleted,
                              href: "/dashboard/assistant",
                            },
                            {
                              id: "knowledge",
                              label: "Add business knowledge",
                              completed: checklist.knowledgeCompleted,
                              href: "/dashboard/knowledge",
                            },
                            {
                              id: "phone",
                              label: "Connect a phone number",
                              completed: checklist.phoneCompleted,
                              href: "/dashboard/phone-numbers",
                            },
                            {
                              id: "first_call",
                              label: "Make your first real call",
                              completed: checklist.firstCallCompleted,
                              href: "/dashboard/calls",
                            },
                          ].map(task => (
                            <Link
                              key={task.id}
                              href={task.href}
                              className={`flex items-center justify-between group p-1.5 rounded-lg hover:bg-canvas/20 transition-all ${
                                task.completed ? "pointer-events-none" : ""
                              }`}
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                {task.completed ? (
                                  <CheckCircle className="w-4 h-4 text-state-success shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-ink-tertiary group-hover:text-saffron shrink-0" />
                                )}
                                <span className={`text-[11px] font-sans truncate ${
                                  task.completed 
                                    ? "line-through text-ink-muted opacity-60" 
                                    : "font-semibold text-ink-secondary group-hover:text-saffron transition-colors"
                                }`}>
                                  {task.label}
                                </span>
                              </div>
                              {!task.completed && (
                                <ArrowLeft className="w-3.5 h-3.5 rotate-180 opacity-0 group-hover:opacity-100 text-saffron transition-all" />
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Mobile Onboarding Sheet/Drawer: shown only on mobile screen */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="md:hidden fixed inset-x-0 bottom-0 bg-white border-t border-line rounded-t-3xl shadow-[0_-8px_30px_rgba(20,10,2,0.12)] z-50 p-5 text-left font-sans flex flex-col gap-4"
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider">
                    {isAllCompleted ? "Setup Complete" : "Get started with Bavio"}
                  </span>
                  <h4 className="font-bold text-sm text-ink">
                    {completedCount} of 6 completed
                  </h4>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 hover:bg-canvas rounded-full text-ink-tertiary hover:text-ink border border-line"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Line */}
              <div className="w-full h-1 bg-canvas/30 rounded-full overflow-hidden">
                <div
                  className="bg-saffron h-full"
                  style={{ width: `${(completedCount / 6) * 100}%` }}
                />
              </div>

              {/* Tasks List */}
              <div className="space-y-2 mt-2 max-h-[220px] overflow-y-auto pr-1">
                {isAllCompleted ? (
                  <div className="text-center py-4 space-y-2">
                    <CheckCircle className="w-8 h-8 text-state-success mx-auto" />
                    <h5 className="font-bold text-xs text-ink font-sans">Bavio setup complete</h5>
                    <p className="text-[10px] text-ink-tertiary font-sans">
                      You have successfully completed all onboarding setups.
                    </p>
                    <button
                      onClick={handleDismiss}
                      className="px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-saffron w-full mt-2"
                    >
                      Dismiss Checklist
                    </button>
                  </div>
                ) : (
                  [
                    {
                      id: "demo",
                      label: "Try a live demo",
                      completed: checklist.demoCompleted,
                      href: "/workspace/demo",
                    },
                    {
                      id: "profile",
                      label: "Add your business information",
                      completed: checklist.profileCompleted,
                      href: "/dashboard/settings",
                    },
                    {
                      id: "assistant",
                      label: "Create your first AI Employee",
                      completed: checklist.assistantCompleted,
                      href: "/dashboard/assistant",
                    },
                    {
                      id: "knowledge",
                      label: "Add business knowledge",
                      completed: checklist.knowledgeCompleted,
                      href: "/dashboard/knowledge",
                    },
                    {
                      id: "phone",
                      label: "Connect a phone number",
                      completed: checklist.phoneCompleted,
                      href: "/dashboard/phone-numbers",
                    },
                    {
                      id: "first_call",
                      label: "Make your first real call",
                      completed: checklist.firstCallCompleted,
                      href: "/dashboard/calls",
                    },
                  ].map(task => (
                    <Link
                      key={task.id}
                      href={task.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between p-2 rounded-xl bg-canvas/10 border border-line/45 ${
                        task.completed ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {task.completed ? (
                          <CheckCircle className="w-4 h-4 text-state-success shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-ink-tertiary shrink-0" />
                        )}
                        <span className={`text-[11px] truncate ${
                          task.completed ? "line-through text-ink-muted" : "font-semibold text-ink"
                        }`}>
                          {task.label}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          </>
        ) : (
          /* Launcher Button when collapsed/dismissed */
          <button
            onClick={() => {
              setIsDismissed(false);
              setIsCollapsed(false);
            }}
            className="fixed bottom-6 right-6 z-50 bg-saffron hover:bg-saffron-dark text-white border border-saffron/20 shadow-lg p-3 rounded-full hover:scale-105 transition-all flex items-center justify-center gap-1.5"
            title="Setup Checklist"
          >
            <Sparkle className="w-5 h-5 text-white" />
            <span className="text-[10px] font-bold uppercase tracking-wider pr-1 hidden md:inline">Setup</span>
          </button>
        )}
      </AnimatePresence>
    </div>
  );
}
