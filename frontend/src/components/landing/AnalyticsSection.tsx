"use client";

import React from "react";
import { motion } from "framer-motion";
import { Phone, Users, Clock, Percent, Activity, DollarSign, ArrowUpRight } from "lucide-react";

const stats = [
  {
    icon: Phone,
    title: "Calls Answered",
    value: "14,892",
    change: "+28% vs last month",
    color: "#FF6B00",
    sparkline: [20, 30, 25, 40, 35, 50, 48, 62]
  },
  {
    icon: Users,
    title: "Qualified Leads",
    value: "3,124",
    change: "+42% lead sync",
    color: "#FF8C3A",
    sparkline: [10, 15, 12, 22, 18, 30, 28, 38]
  },
  {
    icon: Clock,
    title: "Average Duration",
    value: "1m 32s",
    change: "Optimized response time",
    color: "#FF6B00",
    sparkline: [15, 12, 14, 11, 10, 13, 12, 11]
  },
  {
    icon: Percent,
    title: "Conversion Rate",
    value: "84.3%",
    change: "+12.1% booking rate",
    color: "#FF8C3A",
    sparkline: [60, 65, 62, 70, 72, 80, 78, 84]
  },
  {
    icon: Activity,
    title: "Peak Hours Load",
    value: "5:00 - 8:00 PM",
    change: "99.9% trunk uptime",
    color: "#FF6B00",
    sparkline: [10, 20, 15, 45, 50, 90, 85, 95]
  },
  {
    icon: DollarSign,
    title: "Revenue Recovered",
    value: "$42,000",
    change: "Estimated missed call value",
    color: "#FF6B00",
    sparkline: [30, 40, 35, 55, 48, 70, 68, 80]
  }
];

export default function AnalyticsSection() {
  return (
    <section className="py-[120px] bg-[#FFFDF8] w-full relative">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] mb-4">
            Analytics & Reports
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#140A02] mb-6 leading-tight">
            See What&apos;s Actually Happening.
          </h2>
          <p className="text-[#6E6256] text-lg font-normal leading-relaxed max-w-[620px] mx-auto">
            Deep conversation metrics and lead analytics that show you exactly what is working in your campaigns.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white border border-[#F3E4D4] rounded-[32px] p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300 min-h-[220px] text-left relative overflow-hidden"
            >
              <div>
                {/* Icon & Growth indicator */}
                <div className="flex justify-between items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#FFF7ED] flex items-center justify-center text-[#FF6B00]">
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#FF6B00] font-bold">
                    <span>{stat.change}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="text-[11px] text-[#6E6256] font-bold uppercase tracking-wider mb-2">
                  {stat.title}
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-[#140A02] font-display">
                  {stat.value}
                </div>
              </div>

              {/* Sparkline Drawing */}
              <div className="mt-6 flex items-end gap-1 h-12 w-full">
                {stat.sparkline.map((val, i) => {
                  const percentHeight = `${(val / 100) * 100}%`;
                  return (
                    <div
                      key={i}
                      style={{ height: percentHeight }}
                      className="flex-1 bg-[#FF6B00]/15 rounded-t-sm group relative hover:bg-[#FF6B00] transition-colors"
                    >
                      {/* Tooltip */}
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-[#140A02] text-white text-[8px] font-bold px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity mb-1 pointer-events-none">
                        {val}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
