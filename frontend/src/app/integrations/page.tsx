"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Integrations() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [codeTab, setCodeTab] = useState<"node" | "python">("node");

  const categories = [
    "All", "CRM", "Calendar", "Communication", "Data", "Workflow", "Telephony"
  ];

  const integrationList = [
    { name: "HubSpot", category: "CRM", desc: "Sync contact data and call logs to HubSpot CRM automatically.", time: "2 mins", status: "Connected" },
    { name: "Salesforce", category: "CRM", desc: "Create opportunities and update prospect records from call records.", time: "5 mins", status: "Not Connected" },
    { name: "Zoho CRM", category: "CRM", desc: "Push caller information, budgets, and sentiment details instantly.", time: "3 mins", status: "Not Connected" },
    { name: "Pipedrive", category: "CRM", desc: "Automatically create custom pipeline deals based on lead scores.", time: "4 mins", status: "Not Connected" },
    { name: "Google Calendar", category: "Calendar", desc: "Check calendar slots and schedule calls directly on GCal.", time: "1 min", status: "Connected" },
    { name: "Outlook Cal", category: "Calendar", desc: "Read and write corporate scheduling events instantly.", time: "2 mins", status: "Not Connected" },
    { name: "Cal.com", category: "Calendar", desc: "Natively book available appointment openings during call streams.", time: "1 min", status: "Connected" },
    { name: "WhatsApp", category: "Communication", desc: "Send summary notifications and follow-up templates on WhatsApp.", time: "3 mins", status: "Connected" },
    { name: "Twilio", category: "Telephony", desc: "Forward, buy, and manage custom business numbers through Twilio.", time: "5 mins", status: "Connected" },
    { name: "Slack", category: "Communication", desc: "Receive immediate notifications when new leads get qualified.", time: "2 mins", status: "Connected" },
    { name: "Google Sheets", category: "Data", desc: "Append contact names, budgets, and phone numbers in rows.", time: "1 min", status: "Connected" },
    { name: "Zapier", category: "Workflow", desc: "Connect Bavio to 5,000+ business applications natively.", time: "2 mins", status: "Connected" },
    { name: "Make", category: "Workflow", desc: "Create robust custom multi-step triggers from webhook data.", time: "2 mins", status: "Not Connected" },
    { name: "n8n", category: "Workflow", desc: "Self-host workflow triggers to handle complex database checks.", time: "3 mins", status: "Not Connected" },
    { name: "Exotel", category: "Telephony", desc: "Sync calls and manage telecom routing with Exotel numbers.", time: "5 mins", status: "Not Connected" },
  ];

  const nodeCode = `// Node.js Webhook Handler
const express = require('express');
const app = express();
app.use(express.json());

app.post('/bavio-webhook', (req, res) => {
  const { call_id, lead_data, sentiment } = req.body;
  
  console.log(\`Received qualified lead from Call #\${call_id}\`);
  console.log(\`Lead Name: \${lead_data.name}, Budget: \${lead_data.budget}\`);
  
  // Push details directly to your proprietary databases
  
  res.status(200).json({ success: true, message: 'Lead Sync Complete' });
});

app.listen(3000, () => console.log('Server running on port 3000'));`;

  const pythonCode = `# Python Webhook Handler
from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route('/bavio-webhook', methods=['POST'])
def bavio_webhook():
    data = request.json
    call_id = data.get('call_id')
    lead_data = data.get('lead_data', {})
    
    print(f"Received qualified lead from Call #{call_id}")
    print(f"Lead Name: {lead_data.get('name')}, Budget: {lead_data.get('budget')}")
    
    # Process information and insert into your databases
    
    return jsonify({"success": True, "message": "Lead Sync Complete"}), 200

if __name__ == '__main__':
    app.run(port=3000)`;

  const filteredList = activeCategory === "All"
    ? integrationList
    : integrationList.filter(item => item.category === activeCategory);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-canvas text-ink">
      <Navbar />

      <main className="flex-grow w-full relative flex flex-col items-center pt-28 pb-20">
        
        {/* HERO SECTION */}
        <section className="w-full relative flex justify-center">
          <div className="w-full max-w-5xl px-6 pt-12 pb-16 text-center flex flex-col items-center">
            <span className="text-body-xs font-bold uppercase tracking-widest text-saffron bg-saffron-muted px-3.5 py-1.5 rounded-full mb-6 border border-saffron-border">
              Ecosystem Connectivity
            </span>
            <h1 className="font-display font-bold text-display-lg md:text-display-xl text-ink mb-6 max-w-3xl leading-tight tracking-tight">
              Connect Bavio to Your <span className="text-saffron">Entire Stack</span>
            </h1>
            <p className="text-body-lg text-ink-tertiary mb-12 max-w-2xl leading-relaxed">
              50+ integrations to sync qualified call logs, lead scores, scheduling info, and automated WhatsApp texts dynamically.
            </p>

            {/* Categories Tab */}
            <div className="flex gap-2 bg-surface-raised p-1.5 border border-line rounded-full mb-16 overflow-x-auto max-w-full select-none scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full text-body-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                    activeCategory === cat 
                      ? "bg-saffron text-white shadow-premium" 
                      : "text-ink-tertiary hover:text-ink"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* INTEGRATIONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl text-left mb-24">
              {filteredList.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-surface border border-line rounded-3xl p-6 flex flex-col justify-between shadow-premium hover:border-saffron hover:shadow-premium-hover transition-all duration-300 group"
                >
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div className="w-12 h-12 bg-surface-raised border border-line text-ink rounded-xl flex items-center justify-center font-display font-bold text-sm group-hover:scale-105 transition-transform duration-200">
                        {item.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        item.status === "Connected" 
                          ? "bg-state-success/10 text-state-success border border-state-success/20" 
                          : "bg-surface-raised text-ink-muted border border-line"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-heading-sm text-ink mb-2">{item.name}</h3>
                    <p className="text-body-xs text-ink-tertiary leading-relaxed mb-6">
                      {item.desc}
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-line pt-4 text-body-xs font-semibold text-ink-tertiary uppercase">
                    <span>Setup: {item.time}</span>
                    <span className="text-saffron group-hover:underline cursor-pointer flex items-center gap-1">
                      Configure &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CUSTOM INTEGRATIONS WEBHOOK API */}
        <section className="w-full bg-surface border-y border-line py-20 px-6 flex justify-center">
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="flex flex-col items-start text-left">
              <h2 className="font-display font-bold text-heading-lg text-ink mb-4 leading-tight">
                Don&apos;t See Your CRM? Use Webhooks.
              </h2>
              <p className="text-body-sm text-ink-tertiary leading-relaxed mb-6">
                Connect Bavio to custom enterprise databases or proprietary backend servers. Configure your destination HTTP URL inside the dashboard, and we will send secure JSON payloads as soon as calls finish.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/docs"
                  className="bg-canvas hover:bg-surface-raised text-ink text-body-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-full border border-line transition-all flex items-center gap-1.5"
                >
                  Read Webhook Docs
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Interactive Code Switcher Block */}
            <div className="bg-[#12121A] text-white border border-line rounded-3xl overflow-hidden shadow-premium flex flex-col">
              <div className="bg-[#1A1A28] border-b border-[#2A2A38] px-4 py-2.5 flex justify-between items-center text-xs select-none">
                <span className="font-mono text-ink-tertiary">webhook_example.js</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCodeTab("node")}
                    className={`px-3 py-1 rounded transition-all font-semibold ${
                      codeTab === "node" ? "bg-white/10 text-white" : "text-ink-tertiary hover:text-white"
                    }`}
                  >
                    Node.js
                  </button>
                  <button
                    onClick={() => setCodeTab("python")}
                    className={`px-3 py-1 rounded transition-all font-semibold ${
                      codeTab === "python" ? "bg-white/10 text-white" : "text-ink-tertiary hover:text-white"
                    }`}
                  >
                    Python
                  </button>
                </div>
              </div>
              <pre className="p-5 font-mono text-[10px] md:text-xs text-white/80 overflow-x-auto bg-[#12121A]/40 leading-relaxed max-h-[300px]">
                <code>{codeTab === "node" ? nodeCode : pythonCode}</code>
              </pre>
            </div>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
