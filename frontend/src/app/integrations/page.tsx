"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, MagnifyingGlass, Plug } from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/motion/ScrollReveal";

interface IntegrationItem {
  name: string;
  category: "CRM" | "Calendar" | "SMS" | "Telephony" | "Helpdesk" | "Data" | "Workflow";
  desc: string;
  time: string;
  status: "Connected" | "Not Connected";
}

// Exactly 50 integration items
const INTEGRATION_LIST: IntegrationItem[] = [
  { name: "HubSpot", category: "CRM", desc: "Sync contact data and qualified call logs to HubSpot CRM automatically.", time: "2 mins", status: "Connected" },
  { name: "Salesforce", category: "CRM", desc: "Create opportunities and update prospect records from call records.", time: "5 mins", status: "Not Connected" },
  { name: "Zoho CRM", category: "CRM", desc: "Push caller information, budgets, and sentiment details instantly.", time: "3 mins", status: "Not Connected" },
  { name: "Pipedrive", category: "CRM", desc: "Automatically create custom pipeline deals based on lead scores.", time: "4 mins", status: "Not Connected" },
  { name: "Copper", category: "CRM", desc: "Integrate call statistics directly into G-Suite Copper pipelines.", time: "3 mins", status: "Not Connected" },
  { name: "Capsule CRM", category: "CRM", desc: "Organize client contacts and log telephony interactions easily.", time: "2 mins", status: "Not Connected" },
  { name: "Freshsales", category: "CRM", desc: "Empower sales forces with direct transcripts and scheduling pings.", time: "3 mins", status: "Not Connected" },
  { name: "Keap", category: "CRM", desc: "Automate marketing campaigns and CRM leads from calls.", time: "4 mins", status: "Not Connected" },
  { name: "ActiveCampaign", category: "CRM", desc: "Trigger email automation workflows as soon as a lead is qualified.", time: "3 mins", status: "Not Connected" },
  { name: "Mailchimp", category: "CRM", desc: "Add qualified call contacts directly to newsletter lists.", time: "2 mins", status: "Not Connected" },
  
  { name: "Google Calendar", category: "Calendar", desc: "Check calendar slots and schedule calls directly on GCal.", time: "1 min", status: "Connected" },
  { name: "Outlook Calendar", category: "Calendar", desc: "Read and write corporate scheduling events instantly.", time: "2 mins", status: "Not Connected" },
  { name: "Cal.com", category: "Calendar", desc: "Natively book available appointment openings during call streams.", time: "1 min", status: "Connected" },
  { name: "Calendly", category: "Calendar", desc: "Check availability links and book slots in Calendly from transcripts.", time: "2 mins", status: "Not Connected" },
  { name: "Acuity Scheduling", category: "Calendar", desc: "Sync client scheduling details for local services and clinics.", time: "3 mins", status: "Not Connected" },
  
  { name: "WhatsApp Business", category: "SMS", desc: "Send summary notifications and follow-up templates on WhatsApp.", time: "3 mins", status: "Connected" },
  { name: "Slack Notifications", category: "SMS", desc: "Receive immediate notifications when new leads get qualified.", time: "2 mins", status: "Connected" },
  { name: "Telegram Bot", category: "SMS", desc: "Forward caller alerts and lead credentials to Telegram channels.", time: "2 mins", status: "Not Connected" },
  { name: "Discord Webhooks", category: "SMS", desc: "Post call summaries and recordings to Discord support channels.", time: "2 mins", status: "Not Connected" },
  { name: "SendGrid SMS", category: "SMS", desc: "Trigger conversational SMS texts automatically after calls.", time: "3 mins", status: "Not Connected" },
  
  { name: "Enterprise Voice Trunking", category: "Telephony", desc: "Forward, buy, and manage custom business numbers through enterprise-grade voice networks.", time: "5 mins", status: "Connected" },
  { name: "Carrier SIP Trunking", category: "Telephony", desc: "Sync calls and manage telecom routing with compliant virtual numbers.", time: "5 mins", status: "Not Connected" },
  { name: "Advanced AI Voice Engine", category: "Telephony", desc: "Stream speech packets via proprietary low-latency speech processing models.", time: "4 mins", status: "Connected" },
  { name: "Retell AI", category: "Telephony", desc: "Integrate voice protocols for dedicated SIP trunk systems.", time: "5 mins", status: "Not Connected" },
  { name: "ElevenLabs Voice", category: "Telephony", desc: "Connect automated pipelines to manage automated business dials.", time: "4 mins", status: "Not Connected" },
  { name: "Bland AI Calling", category: "Telephony", desc: "Trigger volume enterprise outbound calls with AI voice agents.", time: "5 mins", status: "Not Connected" },
  { name: "Natural Voice Synthesis", category: "Telephony", desc: "Sync natural accent synthesizers for regional accents.", time: "3 mins", status: "Connected" },
  { name: "Plivo Telephony", category: "Telephony", desc: "Rent international landline and toll-free numbers via Plivo APIs.", time: "4 mins", status: "Not Connected" },
  { name: "SignalWire SIP", category: "Telephony", desc: "Route call transcripts and recordings using elastic SIP trunks.", time: "5 mins", status: "Not Connected" },
  { name: "MessageBird", category: "Telephony", desc: "Scale voice calls and SMS alerts through unified networks.", time: "4 mins", status: "Not Connected" },
  { name: "Sinch Voice", category: "Telephony", desc: "Streamline customer notifications via cloud calling networks.", time: "4 mins", status: "Not Connected" },
  { name: "RingCentral", category: "Telephony", desc: "Link corporate telephone setups with AI receptionist agents.", time: "5 mins", status: "Not Connected" },
  { name: "Vonage API", category: "Telephony", desc: "Integrate call streams and custom voice agents via Vonage.", time: "5 mins", status: "Not Connected" },
  
  { name: "Zendesk Support", category: "Helpdesk", desc: "Auto-create support tickets and attach call recording logs.", time: "3 mins", status: "Not Connected" },
  { name: "Freshdesk", category: "Helpdesk", desc: "Sync customer inquiries and log clinic/service tickets.", time: "3 mins", status: "Not Connected" },
  { name: "Intercom App", category: "Helpdesk", desc: "Update customer records and initiate live chat follow-ups.", time: "4 mins", status: "Not Connected" },
  { name: "Help Scout", category: "Helpdesk", desc: "Assign call transcripts to support mailboxes automatically.", time: "2 mins", status: "Not Connected" },
  { name: "Jira Service Desk", category: "Helpdesk", desc: "Log bug tickets and client issues from call transcripts.", time: "4 mins", status: "Not Connected" },
  { name: "Gorgias", category: "Helpdesk", desc: "Manage e-commerce reservation cancellations and tickets.", time: "3 mins", status: "Not Connected" },
  
  { name: "Google Sheets", category: "Data", desc: "Append contact names, budgets, and phone numbers in rows.", time: "1 min", status: "Connected" },
  { name: "Airtable Sync", category: "Data", desc: "Build rich lead directories and scheduling databases easily.", time: "2 mins", status: "Connected" },
  { name: "Notion Database", category: "Data", desc: "Append call transcripts and customer details into Notion workspaces.", time: "2 mins", status: "Not Connected" },
  { name: "Google BigQuery", category: "Data", desc: "Sync large call metrics to analytical cloud tables.", time: "5 mins", status: "Not Connected" },
  { name: "Snowflake Analytics", category: "Data", desc: "Route voice transcripts for business intelligence querying.", time: "5 mins", status: "Not Connected" },
  
  { name: "Zapier workflows", category: "Workflow", desc: "Connect Bavio to 5,000+ business applications natively.", time: "2 mins", status: "Connected" },
  { name: "Make automation", category: "Workflow", desc: "Create robust custom multi-step triggers from webhook data.", time: "2 mins", status: "Not Connected" },
  { name: "n8n Self-Host", category: "Workflow", desc: "Self-host workflow triggers to handle complex database checks.", time: "3 mins", status: "Not Connected" },
  { name: "IFTTT Applets", category: "Workflow", desc: "Create simple triggers between voice calls and smart devices.", time: "2 mins", status: "Not Connected" },
  { name: "Power Automate", category: "Workflow", desc: "Sync leads into Microsoft Office 365 workflow files.", time: "4 mins", status: "Not Connected" },
  { name: "Webhooks Integration", category: "Workflow", desc: "Dispatch custom JSON payloads to external systems and APIs.", time: "1 min", status: "Connected" }
];

export default function Integrations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [codeTab, setCodeTab] = useState<"node" | "python">("node");

  const categories = [
    "All", "CRM", "Calendar", "SMS", "Telephony", "Helpdesk", "Data", "Workflow"
  ];

  const filteredList = useMemo(() => {
    return INTEGRATION_LIST.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const nodeCode = `// Node.js Webhook Handler
const express = require('express');
const app = express();
app.use(express.json());

app.post('/bavio-webhook', (req, res) => {
  const { call_id, lead_data, sentiment } = req.body;
  
  console.log(\`Received qualified lead from Call #\${call_id}\`);
  console.log(\`Lead Name: \${lead_data.name}, Phone: \${lead_data.phone}\`);
  
  // Custom sync with proprietary databases
  res.status(200).json({ success: true, message: 'Sync Complete' });
});

app.listen(3000, () => console.log('Webhook server active on port 3000'));`;

  const pythonCode = `# Python Webhook Handler
from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route('/bavio-webhook', methods=['POST'])
def bavio_webhook():
    data = request.json
    call_id = data.get('call_id')
    lead_data = data.get('lead_data', {})
    
    print(f"Received qualified lead from Call #{call_id}")
    print(f"Name: {lead_data.get('name')}, Phone: {lead_data.get('phone')}")
    
    # Process information and insert into your databases
    return jsonify({"success": True, "message": "Sync Complete"}), 200

if __name__ == '__main__':
    app.run(port=3000)`;

  return (
    <div className="relative bg-[#0a0a0a] text-[#F5F0E8] min-h-[100dvh] flex flex-col font-sans overflow-x-hidden noise-overlay">
      <Navbar />

      {/* Radial center backdrop glow */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-saffron/5 rounded-full blur-[140px] pointer-events-none" />

      <main className="flex-grow w-full relative flex flex-col items-center pt-28 pb-20 z-10">
        
        {/* HERO & SEARCH BAR */}
        <section className="w-full relative flex justify-center">
          <div className="w-full max-w-5xl px-6 pt-12 pb-16 text-center flex flex-col items-center">
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-saffron/20 text-saffron text-[10px] font-mono font-bold uppercase tracking-wider mb-6">
              Ecosystem Connectivity
            </div>

            <h1 className="font-display text-[40px] md:text-[56px] font-black text-white mb-6 leading-tight tracking-tight">
              Connect Bavio to Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron to-orange-400">Entire Stack</span>
            </h1>

            <p className="text-body-md md:text-body-lg text-darkTextMuted mb-10 max-w-xl leading-relaxed">
              Sync qualified call logs, lead scores, scheduling info, and automated WhatsApp texts dynamically with 50+ integrations.
            </p>

            {/* Search Input Box */}
            <div className="relative w-full max-w-md mb-8">
              <input
                type="text"
                placeholder="Search integrations (e.g. HubSpot, WhatsApp)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#050505] border border-[#2a2a2a] rounded-button pl-11 pr-4 py-3.5 text-body-xs text-white placeholder:text-darkTextMuted focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 transition-all duration-200"
              />
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-darkTextMuted" />
            </div>

            {/* Categories filter tabs */}
            <div className="flex gap-2 bg-darkSurface border border-darkBorder rounded-full p-1.5 mb-16 overflow-x-auto max-w-full select-none scrollbar-thin">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-body-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                    activeCategory === cat 
                      ? "bg-saffron text-white shadow-saffron" 
                      : "text-darkTextMuted hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid of 50 Integration cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl text-left mb-24">
              {filteredList.map((item) => (
                <ScrollReveal key={item.name}>
                  <div
                    className="card-bezel border-darkBorder bg-[#0f0f0f] h-full group"
                  >
                    <div className="card-bezel-inner border-darkBorder bg-[#0f0f0f] p-6 flex flex-col justify-between h-[230px]">
                      <div>
                        <div className="flex justify-between items-center mb-5">
                          <div className="w-10 h-10 bg-darkBg border border-darkBorder text-saffron rounded-lg flex items-center justify-center font-display font-bold text-xs group-hover:scale-105 transition-transform duration-200">
                            {item.name.substring(0, 2).toUpperCase()}
                          </div>
                          
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            item.status === "Connected" 
                              ? "bg-green-500/10 text-green-500 border-green-500/20" 
                              : "bg-[#2a2a2a]/20 text-darkTextMuted border-[#2a2a2a]/30"
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        <h3 className="font-bold text-body-sm text-white mb-2">{item.name}</h3>
                        <p className="text-body-xs text-darkTextMuted leading-relaxed">
                          {item.desc}
                        </p>
                      </div>

                      <div className="flex justify-between items-center border-t border-[#2a2a2a]/55 pt-3.5 mt-4 text-[10px] font-mono text-darkTextMuted uppercase">
                        <span>Setup: {item.time}</span>
                        <Link href="/signup" className="text-saffron hover:underline flex items-center gap-1">
                          Connect
                          <ArrowRight className="w-3 h-3" weight="bold" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}

              {filteredList.length === 0 && (
                <div className="col-span-full text-center py-12 text-darkTextMuted italic text-body-sm">
                  No integrations found matching your search.
                </div>
              )}
            </div>

          </div>
        </section>

        {/* WEBHOOK API BLOCK */}
        <section className="w-full bg-[#0f0f0f]/40 border-y border-[#2a2a2a] py-20 px-6 flex justify-center">
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="flex flex-col items-start text-left">
              <h2 className="font-display font-extrabold text-[28px] md:text-[36px] text-white mb-4 leading-tight">
                Don&apos;t See Your CRM? <br />Use Webhooks.
              </h2>
              <p className="text-body-xs md:text-body-sm text-darkTextMuted leading-relaxed mb-8">
                Connect Bavio to custom enterprise databases or proprietary backend servers. Configure your destination HTTP URL inside the dashboard, and we will send secure JSON payloads as soon as calls finish.
              </p>
              
              <Link
                href="/docs"
                className="inline-flex items-center gap-1.5 border border-saffron/40 hover:border-saffron text-saffron hover:text-white bg-transparent text-body-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-button transition-all duration-200"
              >
                Read Webhook Docs
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Interactive Code Switcher Panel */}
            <div className="bg-[#050505] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-2xl flex flex-col w-full max-w-md mx-auto">
              
              <div className="bg-[#0f0f0f] border-b border-[#2a2a2a] px-4 py-3 flex justify-between items-center text-[10px] font-mono select-none">
                <span className="text-darkTextMuted">webhook_receiver.js</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCodeTab("node")}
                    className={`px-2.5 py-1 rounded transition-colors font-bold uppercase ${
                      codeTab === "node" ? "bg-saffron text-white" : "text-darkTextMuted hover:text-white"
                    }`}
                  >
                    Node.js
                  </button>
                  <button
                    onClick={() => setCodeTab("python")}
                    className={`px-2.5 py-1 rounded transition-colors font-bold uppercase ${
                      codeTab === "python" ? "bg-saffron text-white" : "text-darkTextMuted hover:text-white"
                    }`}
                  >
                    Python
                  </button>
                </div>
              </div>

              <pre className="p-5 font-mono text-[10px] md:text-xs text-white/80 overflow-x-auto bg-[#050505] leading-relaxed max-h-[250px] scrollbar-thin">
                <code>{codeTab === "node" ? nodeCode : pythonCode}</code>
              </pre>

            </div>

          </div>
        </section>

      </main>

      <Footer dark={true} />
    </div>
  );
}
