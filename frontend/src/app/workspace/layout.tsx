"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Layout, 
  Users, 
  CreditCard, 
  Gear,
  CaretDown,
  MagnifyingGlass,
  Command,
  Pulse,
  SignOut,
  Sparkle,
  List,
  X,
  Bell,
  Cpu,
  Coins,
  Building,
  ArrowRight
} from "@phosphor-icons/react";

const workspaceNavigationItems = [
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandKOpen, setCommandKOpen] = useState(false);
  const [workspace, setWorkspace] = useState("");
  const [planName, setPlanName] = useState("Free Trial");
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("bavio_token");
        if (!token) return;
        const res = await fetch("/api/auth/profile", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data?.user) {
            const user = result.data.user;
            if (user.name) {
              setWorkspace(user.name);
            }
            if (user.plan_name === "free_trial") {
              setPlanName("Free Trial");
            } else if (user.plan_name === "starter") {
              setPlanName("Starter Plan");
            } else if (user.plan_name === "growth") {
              setPlanName("Growth Plan");
            } else if (user.plan_name === "scale") {
              setPlanName("Scale Plan");
            } else if (user.plan === "free") {
              setPlanName("Free Plan");
            } else {
              setPlanName(user.plan_name || "Free Trial");
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile in layout:", err);
      }
    };
    fetchProfile();

    // Also listen to storage changes for custom updates
    const handleStorageChange = () => {
      fetchProfile();
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("bavio_payment_success", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("bavio_payment_success", handleStorageChange);
    };
  }, []);

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

  const filteredNavItems = [
    ...workspaceNavigationItems,
    { name: "Voice Dashboard", href: "/dashboard", icon: Sparkle }
  ].filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-transparent text-ink flex flex-col md:flex-row relative font-sans noise-overlay">
      
      {/* Background Subtle mesh orbs (removed to use body background) */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-saffron/3 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-saffron/2 blur-[100px] pointer-events-none z-0" />

      {/* MOBILE HEADER BAR */}
      <div className="md:hidden w-full bg-surface border-b border-line px-4 py-3 flex items-center justify-between z-40 relative">
        <Link href="/workspace" className="flex items-center gap-2">
          <Logo className="w-7 h-7" color="text-saffron" />
          <span className="font-display font-extrabold text-base tracking-tight text-ink">
            Bavio AI<span className="text-saffron">.workspace</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
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

      {/* LEFT SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-surface border-r border-line z-50 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 md:static md:h-screen
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col gap-6 p-4 overflow-y-auto flex-grow">
          {/* Brand header / Workspace switcher */}
          <div className="relative">
            <button 
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="w-full flex items-center justify-between bg-surface-raised border border-line hover:border-saffron/40 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-5 h-5 bg-saffron rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {workspace.charAt(0)}
                </div>
                <span className="text-xs font-semibold tracking-wide text-ink truncate">
                  {workspace}
                </span>
              </div>
              <CaretDown className="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
            </button>

            {/* Dropdown list */}
            <AnimatePresence>
              {showWorkspaceDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowWorkspaceDropdown(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-surface-raised border border-line rounded-xl p-1.5 shadow-premium z-20"
                  >
                    {/* Only show the user's own real workspace — no mock workspaces */}
                    <div className="px-3 py-2 rounded-lg bg-saffron/10">
                      <span className="text-xs font-bold text-saffron block">{workspace || "My Workspace"}</span>
                      <span className="text-[9px] text-ink-muted mt-0.5 block">{planName} · Active</span>
                    </div>
                    <div className="border-t border-line my-1.5" />
                    <button
                      onClick={() => {
                        setShowWorkspaceDropdown(false);
                        localStorage.removeItem("bavio_token");
                        window.location.href = "/login";
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-ink-secondary hover:bg-line-subtle/50 hover:text-state-error transition-all flex items-center gap-2"
                    >
                      <SignOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted px-3 mb-1">
              Workspace OS
            </span>
            {workspaceNavigationItems.map((item) => {
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
                      layoutId="activeWorkspaceSidebarIndicator" 
                      className="absolute right-3 w-1.5 h-1.5 bg-saffron rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                </Link>
              );
            })}

            <div className="h-px bg-line/60 my-2" />

            <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted px-3 mb-1">
              Voice Operations
            </span>
            <Link
              href="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-saffron/5 border border-saffron/10 hover:bg-saffron/10 hover:border-saffron/20 text-saffron transition-all relative"
            >
              <div className="flex items-center gap-3">
                <Sparkle className="w-4 h-4 text-saffron" weight="fill" />
                <span>AI Voice Dashboard</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
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
          <Link 
            href="/"
            onClick={() => {
              // Clear cookies for testing purposes if desired
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-ink-tertiary hover:text-state-error transition-colors"
          >
            <SignOut className="w-4 h-4" />
            <span>Sign Out</span>
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

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow flex flex-col overflow-y-auto h-screen z-10 relative">
        
        {/* TOP BAR SEARCH HEADER */}
        <header className="hidden md:flex items-center justify-between border-b border-line px-8 py-4 bg-surface/65 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-ink-tertiary">Workspaces</span>
            <span className="text-ink-muted text-xs">/</span>
            <span className="text-xs font-bold text-ink tracking-wide">{workspace}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Box Trigger */}
            <button 
              onClick={() => setCommandKOpen(true)}
              className="flex items-center gap-2 bg-surface-raised hover:bg-canvas border border-line hover:border-saffron/40 px-3.5 py-1.5 rounded-full text-xs text-ink-tertiary hover:text-ink transition-all w-52"
            >
              <MagnifyingGlass className="w-3.5 h-3.5" />
              <span className="flex-grow text-left">Search Workspace...</span>
              <kbd className="font-mono text-[9px] bg-white/5 border border-line px-1.5 py-0.5 rounded text-ink-muted">Ctrl K</kbd>
            </button>

            {/* Notification alert */}
            <button className="p-2 text-ink-tertiary hover:text-ink border border-line rounded-full hover:bg-line-subtle/50 relative transition-all">
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-saffron animate-pulse" />
              <Bell className="w-4 h-4" />
            </button>
            
            {/* Upgrade banner mini */}
            <Link 
              href="/workspace/subscription"
              className="bg-saffron/10 border border-saffron-border hover:bg-saffron text-saffron hover:text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all"
            >
              {planName} Active
            </Link>
          </div>
        </header>

        {/* PAGE BODY INJECT */}
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
              <div className="p-4 border-b border-line flex items-center gap-3">
                <MagnifyingGlass className="w-5 h-5 text-saffron" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search workspace sections..."
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
              </div>

              <div className="p-3 bg-surface-raised border-t border-line flex justify-between items-center text-[10px] text-ink-muted font-mono">
                <span>Select with arrows &bull; Execute with Enter</span>
                <span>Bavio Workspace OS v1.0.0</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
