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
  Cpu, 
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
  ArrowLeft,
  IdentificationCard
} from "@phosphor-icons/react";

const navigationItems = [
  { name: "Overview", href: "/dashboard", icon: Layout },
  { name: "Agents", href: "/dashboard/agents", icon: Users },
  { name: "Leads", href: "/dashboard/leads", icon: IdentificationCard },
  { name: "Calls", href: "/dashboard/calls", icon: PhoneCall },
  { name: "Analytics", href: "/dashboard/analytics", icon: ChartBar },
  { name: "Knowledge Base", href: "/dashboard/knowledge-base", icon: BookOpen },
  { name: "Workflows", href: "/dashboard/workflows", icon: GitFork },
  { name: "Integrations Monitor", href: "/dashboard/integrations", icon: Cpu },
  { name: "Settings", href: "/dashboard/settings", icon: Gear },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandKOpen, setCommandKOpen] = useState(false);
  const [workspace, setWorkspace] = useState("Sunstar Real Estate");
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredNavItems = navigationItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col md:flex-row relative font-sans">
      
      {/* Background Subtle mesh orbs */}
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
            <button 
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="w-full flex items-center justify-between bg-surface-raised border border-line hover:border-saffron/40 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-5 h-5 bg-saffron rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  S
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
                    {["Sunstar Real Estate", "Apex Healthcare", "Bavio Dev Space"].map((name) => (
                      <button
                        key={name}
                        onClick={() => {
                          setWorkspace(name);
                          setShowWorkspaceDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          workspace === name 
                            ? "bg-saffron/10 text-saffron" 
                            : "text-ink-secondary hover:bg-line-subtle/50 hover:text-ink"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
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
            {navigationItems.map((item) => {
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
              <span className="text-[10px] font-mono text-ink-secondary truncate">Gateway Active</span>
            </div>
            <span className="text-[8px] font-mono text-ink-muted bg-white/5 px-1.5 py-0.5 rounded">IN-MUM</span>
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
                <span className="text-ink-secondary">Agents: <span className="font-bold text-ink">2 Online</span></span>
              </div>
              <div className="flex items-center gap-1.5 border-l border-line pl-4">
                <Pulse className="w-3.5 h-3.5 text-saffron animate-pulse" />
                <span className="text-ink-secondary">Live latency: <span className="font-bold text-ink">420ms</span></span>
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

            {/* Notification alert */}
            <button className="p-2 text-ink-tertiary hover:text-ink border border-line rounded-full hover:bg-line-subtle/50 relative transition-all">
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-saffron animate-pulse" />
              <Bell className="w-4 h-4" />
            </button>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 border-l border-line pl-4">
              <Link
                href="/dashboard/agents?action=create"
                className="bg-white hover:bg-canvas border border-line text-ink-secondary text-[10px] font-bold uppercase tracking-wider py-2 px-3 rounded-lg transition-all"
              >
                Create Agent
              </Link>
              <Link
                href="/dashboard/workflows"
                className="bg-white hover:bg-canvas border border-line text-ink-secondary text-[10px] font-bold uppercase tracking-wider py-2 px-3 rounded-lg transition-all"
              >
                Deploy Agent
              </Link>
              <Link
                href="/dashboard/calls?action=campaign"
                className="bg-saffron hover:bg-saffron-hover text-white text-[10px] font-bold uppercase tracking-wider py-2 px-3.5 rounded-lg shadow-saffron transition-all"
              >
                Start Campaign
              </Link>
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
                
                {/* Advanced Quick Actions */}
                {searchQuery === "" && (
                  <>
                    <hr className="border-line my-1" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted px-2.5 py-1">
                      Quick Operations
                    </span>
                    <button 
                      onClick={() => handleCommandKSelect("/dashboard/agents?action=create")}
                      className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl hover:bg-line-subtle/50 text-xs font-semibold text-ink-secondary hover:text-ink transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkle className="w-4 h-4 text-saffron" />
                        <span>Deploy new Voice Agent</span>
                      </div>
                      <kbd className="font-mono text-[9px] text-ink-muted">A</kbd>
                    </button>
                    <button 
                      onClick={() => handleCommandKSelect("/dashboard/calls?action=test")}
                      className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl hover:bg-line-subtle/50 text-xs font-semibold text-ink-secondary hover:text-ink transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Pulse className="w-4 h-4 text-state-success" />
                        <span>Initiate SIP Test Trunk Call</span>
                      </div>
                      <kbd className="font-mono text-[9px] text-ink-muted">T</kbd>
                    </button>
                  </>
                )}
              </div>

              <div className="p-3 bg-surface-raised border-t border-line flex justify-between items-center text-[10px] text-ink-muted font-mono">
                <span>Select with arrows &bull; Execute with Enter</span>
                <span>Bavio Operator v1.0.5</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
