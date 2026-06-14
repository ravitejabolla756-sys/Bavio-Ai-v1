"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  CurrencyCircleDollar,
  PhoneCall,
  CheckCircle,
  TrendUp,
  TrendDown,
  Warning,
  Globe,
  ArrowsClockwise,
  Pulse,
  Crown,
  Lightning,
  SortAscending,
  SortDescending,
} from "@phosphor-icons/react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { mockMetrics, type AdminMetrics } from "@/data/mockMetrics";

// ── Design tokens ──
const SAFFRON = "#FF6B00";
const CARD_BG = "#12121C";
const CARD_BORDER = "rgba(255,255,255,0.05)";
const CHART_COLORS = ["#FF6B00", "#FF8A3D", "#3B82F6", "#8B5CF6", "#22C55E"];
const COUNTRY_FLAGS: Record<string, string> = {
  IN: "🇮🇳",
  US: "🇺🇸",
  GB: "🇬🇧",
  AU: "🇦🇺",
  AE: "🇦🇪",
};

// ── Stagger animation ──
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

// ═══════════════════════════════════════════════════
// KPI CARD
// ═══════════════════════════════════════════════════
function KPICard({
  label,
  value,
  secondary,
  change,
  alert,
  icon: Icon,
  index,
}: {
  label: string;
  value: string | number;
  secondary?: string;
  change?: number;
  alert?: boolean;
  icon: React.ComponentType<any>;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group"
      style={{
        background: alert
          ? "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, #12121C 100%)"
          : CARD_BG,
        border: `1px solid ${alert ? "rgba(239,68,68,0.2)" : CARD_BORDER}`,
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${alert ? "rgba(239,68,68,0.06)" : "rgba(255,107,0,0.04)"} 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            {label}
          </span>
          <Icon
            className="w-4 h-4"
            style={{ color: alert ? "#EF4444" : "rgba(255,255,255,0.15)" }}
          />
        </div>

        <div
          className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1"
          style={{
            color: alert ? "#EF4444" : "#FFFFFF",
            fontFamily: "var(--font-instrument-serif), serif",
          }}
        >
          {value}
        </div>

        {secondary && (
          <p className="text-[11px] text-white/30 font-mono mb-2">{secondary}</p>
        )}

        {change !== undefined && (
          <div className="flex items-center gap-1.5">
            {change >= 0 ? (
              <TrendUp className="w-3.5 h-3.5" style={{ color: "#22C55E" }} />
            ) : (
              <TrendDown className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
            )}
            <span
              className="text-[11px] font-bold"
              style={{ color: change >= 0 ? "#22C55E" : "#EF4444" }}
            >
              {change >= 0 ? "+" : ""}
              {change}% from last month
            </span>
          </div>
        )}

        {alert && (
          <div className="flex items-center gap-1.5 mt-2">
            <Warning className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
            <span className="text-[10px] font-bold text-red-400/80">
              Below threshold — investigate
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════
// CHART WRAPPER (consistent card styling)
// ═══════════════════════════════════════════════════
function ChartCard({
  title,
  children,
  index,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  index: number;
  className?: string;
}) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
    >
      <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════
// CUSTOM RECHARTS TOOLTIP
// ═══════════════════════════════════════════════════
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-lg border"
      style={{
        background: "#1A1A28",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <p className="font-mono text-white/40 mb-1 text-[10px]">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: entry.color || "#fff" }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// COUNTRY TABLE
// ═══════════════════════════════════════════════════
function CountryTable({
  countries,
}: {
  countries: AdminMetrics["countries"];
}) {
  const [sortKey, setSortKey] = useState<"customer_count" | "mrr" | "churn">("customer_count");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    return [...countries].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [countries, sortKey, sortDir]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = sortDir === "desc" ? SortDescending : SortAscending;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
            <th className="text-left py-3 px-2 text-white/25 font-bold uppercase tracking-widest text-[10px]">
              Country
            </th>
            {(["customer_count", "mrr", "churn"] as const).map((key) => (
              <th
                key={key}
                className="text-right py-3 px-2 text-white/25 font-bold uppercase tracking-widest text-[10px] cursor-pointer hover:text-white/50 transition-colors"
                onClick={() => toggleSort(key)}
              >
                <div className="flex items-center justify-end gap-1">
                  {key === "customer_count"
                    ? "Customers"
                    : key === "mrr"
                    ? "MRR"
                    : "Churn"}
                  {sortKey === key && <SortIcon className="w-3 h-3" />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((c, i) => (
            <tr
              key={c.code}
              className="transition-colors hover:bg-white/[0.02]"
              style={{
                borderBottom:
                  i < sorted.length - 1
                    ? `1px solid rgba(255,255,255,0.03)`
                    : "none",
              }}
            >
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{COUNTRY_FLAGS[c.code] || "🌍"}</span>
                  <span className="font-semibold text-white/80">{c.name}</span>
                </div>
              </td>
              <td className="text-right py-3 px-2 text-white/70 font-mono">
                {c.customer_count}
              </td>
              <td className="text-right py-3 px-2 text-white/70 font-mono">
                {c.currency}
                {c.mrr.toLocaleString()}
              </td>
              <td className="text-right py-3 px-2 font-mono">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    color: c.churn > 3 ? "#EF4444" : c.churn > 2 ? "#F59E0B" : "#22C55E",
                    background:
                      c.churn > 3
                        ? "rgba(239,68,68,0.1)"
                        : c.churn > 2
                        ? "rgba(245,158,11,0.1)"
                        : "rgba(34,197,94,0.08)",
                  }}
                >
                  {c.churn}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// PEAK HOURS HEATMAP
// ═══════════════════════════════════════════════════
function PeakHoursHeatmap({
  data,
}: {
  data: Record<string, number[]>;
}) {
  const countries = Object.keys(data);
  const maxVal = Math.max(...countries.flatMap((c) => data[c]));

  const getColor = (val: number) => {
    const intensity = maxVal > 0 ? val / maxVal : 0;
    if (intensity === 0) return "rgba(255,255,255,0.02)";
    if (intensity < 0.25) return `rgba(255,107,0,${0.08 + intensity * 0.2})`;
    if (intensity < 0.5) return `rgba(255,107,0,${0.15 + intensity * 0.3})`;
    if (intensity < 0.75) return `rgba(255,107,0,${0.3 + intensity * 0.3})`;
    return `rgba(255,107,0,${0.5 + intensity * 0.4})`;
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Hour labels */}
        <div className="flex mb-1">
          <div className="w-16 shrink-0" />
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              className="flex-1 text-center text-[8px] font-mono text-white/20"
            >
              {i.toString().padStart(2, "0")}
            </div>
          ))}
        </div>
        {/* Country rows */}
        {countries.map((cc) => (
          <div key={cc} className="flex items-center mb-0.5">
            <div className="w-16 shrink-0 flex items-center gap-1.5 text-[10px] font-semibold text-white/50">
              <span>{COUNTRY_FLAGS[cc]}</span>
              <span>{cc}</span>
            </div>
            {data[cc].map((val, hour) => (
              <div
                key={hour}
                className="flex-1 aspect-square rounded-[3px] mx-[1px] transition-colors relative group cursor-default"
                style={{ background: getColor(val) }}
                title={`${cc} ${hour}:00 — ${val} calls`}
              >
                {/* Hover tooltip */}
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 px-2 py-1 rounded-lg text-[9px] font-mono text-white whitespace-nowrap"
                  style={{ background: "#1A1A28", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {val} calls
                </div>
              </div>
            ))}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[9px] text-white/20 font-mono">Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <div
              key={t}
              className="w-3 h-3 rounded-[2px]"
              style={{ background: getColor(t * maxVal) }}
            />
          ))}
          <span className="text-[9px] text-white/20 font-mono">More</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// TOP CUSTOMERS TABLE
// ═══════════════════════════════════════════════════
function TopCustomersTable({
  customers,
}: {
  customers: AdminMetrics["top_customers"];
}) {
  const planColors: Record<string, string> = {
    scale: "#FF6B00",
    growth: "#3B82F6",
    starter: "#22C55E",
    free: "rgba(255,255,255,0.2)",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
            {["#", "Business", "Country", "Plan", "Revenue", "Calls", "Minutes"].map(
              (h) => (
                <th
                  key={h}
                  className={`py-3 px-2 text-white/25 font-bold uppercase tracking-widest text-[10px] ${
                    h === "#" || h === "Business" ? "text-left" : "text-right"
                  }`}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {customers.map((c, i) => (
            <tr
              key={c.id}
              className="transition-colors hover:bg-white/[0.02]"
              style={{
                borderBottom:
                  i < customers.length - 1
                    ? `1px solid rgba(255,255,255,0.03)`
                    : "none",
              }}
            >
              <td className="py-3 px-2 text-white/20 font-mono">{i + 1}</td>
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  {i === 0 && <Crown className="w-3.5 h-3.5" style={{ color: "#FFD700" }} weight="fill" />}
                  <span className="font-semibold text-white/80 truncate max-w-[180px]">
                    {c.business_name}
                  </span>
                </div>
              </td>
              <td className="text-right py-3 px-2">
                <span className="text-sm">{COUNTRY_FLAGS[c.country_code]}</span>
              </td>
              <td className="text-right py-3 px-2">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
                  style={{
                    color: planColors[c.plan] || "#fff",
                    background: `${planColors[c.plan] || "#fff"}15`,
                  }}
                >
                  {c.plan}
                </span>
              </td>
              <td className="text-right py-3 px-2 text-white/70 font-mono">
                {c.currency}
                {c.revenue.toLocaleString()}
              </td>
              <td className="text-right py-3 px-2 text-white/50 font-mono">
                {c.total_calls.toLocaleString()}
              </td>
              <td className="text-right py-3 px-2 text-white/50 font-mono">
                {c.total_minutes.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// LIVE CALL PULSE
// ═══════════════════════════════════════════════════
function LiveCallPulse({ count }: { count: number }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
      style={{
        background: count > 0 ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${count > 0 ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)"}`,
        color: count > 0 ? "#22C55E" : "rgba(255,255,255,0.3)",
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{
          background: count > 0 ? "#22C55E" : "rgba(255,255,255,0.15)",
          boxShadow: count > 0 ? "0 0 8px rgba(34,197,94,0.5)" : "none",
          animation: count > 0 ? "pulse 2s infinite" : "none",
        }}
      />
      <Pulse className="w-3.5 h-3.5" />
      <span>{count} live call{count !== 1 ? "s" : ""}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN DASHBOARD PAGE
// ═══════════════════════════════════════════════════
export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCalls, setActiveCalls] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Fetch metrics (mock fallback)
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/metrics");
      if (response.ok) {
        const json = await response.json();
        setMetrics(json.data || json);
      } else {
        setMetrics(mockMetrics);
      }
    } catch {
      // Fallback to mock data when API is unreachable
      setMetrics(mockMetrics);
    }
    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  // Poll active calls every 10s
  const pollActiveCalls = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/active-calls");
      if (response.ok) {
        const json = await response.json();
        setActiveCalls(json.active_calls || 0);
      }
    } catch {
      // Use mock
      setActiveCalls(Math.floor(Math.random() * 20) + 5);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    pollActiveCalls();

    // Auto-refresh every 5 minutes
    const metricsInterval = setInterval(fetchMetrics, 300000);
    // Poll active calls every 10 seconds
    const callsInterval = setInterval(pollActiveCalls, 10000);

    return () => {
      clearInterval(metricsInterval);
      clearInterval(callsInterval);
    };
  }, [fetchMetrics, pollActiveCalls]);

  // ── Loading skeleton ──
  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-5 h-32 animate-pulse"
              style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
            >
              <div className="w-20 h-2 rounded bg-white/5 mb-4" />
              <div className="w-28 h-6 rounded bg-white/5 mb-2" />
              <div className="w-36 h-2 rounded bg-white/5" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-5 h-72 animate-pulse"
              style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Formatted short date for chart axes
  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl md:text-3xl font-extrabold tracking-tight text-white/95"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            Operations Dashboard
          </h1>
          <p className="text-xs text-white/30 mt-1 font-mono">
            Multi-country business health at a glance
            {lastRefresh && (
              <span className="ml-3">
                · Last updated{" "}
                {lastRefresh.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LiveCallPulse count={activeCalls} />
          <button
            onClick={fetchMetrics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white/40 hover:text-white/70 transition-colors"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <ArrowsClockwise className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* ══ ROW 1 — KPI CARDS ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Customers"
          value={metrics.total_customers.toLocaleString()}
          change={metrics.customer_growth_rate}
          icon={Users}
          index={0}
        />
        <KPICard
          label="Monthly Revenue"
          value={`₹${metrics.mrr_inr.toLocaleString()}`}
          secondary={`≈ $${metrics.mrr_usd.toLocaleString()} USD`}
          change={metrics.mrr_growth_rate}
          icon={CurrencyCircleDollar}
          index={1}
        />
        <KPICard
          label="Calls Today"
          value={metrics.calls_today.toLocaleString()}
          change={metrics.calls_growth}
          icon={PhoneCall}
          index={2}
        />
        <KPICard
          label="Payment Success"
          value={`${metrics.payment_success_rate}%`}
          alert={metrics.payment_success_rate < 95}
          icon={CheckCircle}
          index={3}
        />
      </div>

      {/* ══ ROW 2 — COUNTRY TABLE + REVENUE BAR CHART ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Metrics by Country" index={4}>
          <CountryTable countries={metrics.countries} />
        </ChartCard>

        <ChartCard title="Revenue by Country (USD)" index={5}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.revenue_by_country} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="country"
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue_usd" name="Revenue (USD)" radius={[6, 6, 0, 0]}>
                  {metrics.revenue_by_country.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* ══ ROW 3 — TREND CHARTS + PIE ══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Call Volume Trend */}
        <ChartCard title="Call Volume — 30 Days" index={6}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.call_volume_trend} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatDate}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="calls"
                  name="Calls"
                  stroke={SAFFRON}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: SAFFRON, stroke: "#0F0F18", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* MRR Trend */}
        <ChartCard title="MRR Trend — 30 Days" index={7}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.mrr_trend} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatDate}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  name="MRR (USD)"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#mrrGradient)"
                  activeDot={{ r: 4, fill: "#3B82F6", stroke: "#0F0F18", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Customer Distribution Pie */}
        <ChartCard title="Customer Distribution" index={8}>
          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.countries}
                  dataKey="customer_count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {metrics.countries.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={6}
                  formatter={(value: string) => (
                    <span className="text-[10px] text-white/40 font-mono">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* ══ ROW 4 — PEAK HOURS HEATMAP ══ */}
      <ChartCard title="Peak Call Hours — Last 7 Days" index={9}>
        <PeakHoursHeatmap data={metrics.peak_hours} />
      </ChartCard>

      {/* ══ ROW 5 — TOP CUSTOMERS ══ */}
      <ChartCard title="Top 10 Customers" index={10}>
        <TopCustomersTable customers={metrics.top_customers} />
      </ChartCard>

      {/* ── Pulse animation keyframe (injected) ── */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}
