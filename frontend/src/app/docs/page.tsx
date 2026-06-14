"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Lightning,
  Key,
  Robot,
  BookOpen,
  Globe,
  ListBullets,
  Plug,
  Warning,
  Copy,
  Check,
  CaretRight,
} from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* ─────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────── */
interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
}

/* ─────────────────────────────────────────────────
   SIDEBAR SECTIONS
───────────────────────────────────────────────── */
const sections: Section[] = [
  { id: "quickstart",   label: "Quick Start",           icon: Lightning   },
  { id: "auth",         label: "Authentication",        icon: Key         },
  { id: "agent",        label: "Create Agent",          icon: Robot       },
  { id: "knowledge",    label: "Knowledge Base Upload", icon: BookOpen    },
  { id: "webhook",      label: "Webhook Setup",         icon: Globe     },
  { id: "calllogs",     label: "Call Logs API",         icon: ListBullets },
  { id: "integrations", label: "Integrations",          icon: Plug        },
  { id: "errors",       label: "Error Codes",           icon: Warning     },
];

/* ─────────────────────────────────────────────────
   COPY BUTTON
───────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="absolute top-3 right-3 flex items-center gap-1.5 text-ink-muted hover:text-ink bg-surface-raised border border-line px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all duration-200"
    >
      {copied ? <Check className="w-3 h-3 text-state-success" weight="bold" /> : <Copy className="w-3 h-3" weight="bold" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/* ─────────────────────────────────────────────────
   CODE BLOCK
───────────────────────────────────────────────── */
function CodeBlock({ code, lang = "json" }: { code: string; lang?: string }) {
  return (
    <div className="relative group">
      <div className="flex items-center justify-between bg-[#0d0d0f] border border-line rounded-t-xl px-4 py-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="bg-[#111114] border border-t-0 border-line rounded-b-xl px-5 py-4 overflow-x-auto text-[12px] leading-[1.75] font-mono text-ink-tertiary whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   METHOD BADGE
───────────────────────────────────────────────── */
function MethodBadge({ method }: { method: "GET" | "POST" | "DELETE" | "PUT" }) {
  const colors: Record<string, string> = {
    GET:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    POST:   "bg-sky-500/10 text-sky-400 border-sky-500/20",
    PUT:    "bg-amber-500/10 text-amber-400 border-amber-500/20",
    DELETE: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase tracking-widest ${colors[method]}`}>
      {method}
    </span>
  );
}

/* ─────────────────────────────────────────────────
   ENDPOINT ROW
───────────────────────────────────────────────── */
function Endpoint({ method, path, description }: { method: "GET"|"POST"|"DELETE"|"PUT"; path: string; description: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-surface-raised border border-line rounded-xl">
      <MethodBadge method={method} />
      <code className="text-body-xs font-mono text-saffron flex-1">{path}</code>
      <span className="text-body-xs text-ink-muted">{description}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   SECTION HEADING
───────────────────────────────────────────────── */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-display-sm text-ink mb-2 mt-1">{children}</h2>;
}
function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-body-md font-bold text-ink mt-8 mb-3">{children}</h3>;
}
function Prose({ children }: { children: React.ReactNode }) {
  return <p className="text-body-sm text-ink-tertiary leading-relaxed mb-5">{children}</p>;
}

/* ─────────────────────────────────────────────────
   SECTION CONTENT MAP
───────────────────────────────────────────────── */
function SectionContent({ id }: { id: string }) {
  switch (id) {

    /* ── QUICK START ── */
    case "quickstart":
      return (
        <div>
          <SectionHeading>Quick Start</SectionHeading>
          <Prose>Get your first AI receptionist answering calls in under 10 minutes. No code required for basic setup — use the API for advanced automation.</Prose>

          <SubHeading>Base URL</SubHeading>
          <CodeBlock lang="text" code="https://api.bavio.in/v1" />

          <SubHeading>Step 1 — Get your API key</SubHeading>
          <Prose>Log in to your Bavio dashboard and navigate to <strong className="text-ink">Settings → API Keys</strong>. Generate a key and store it securely. Keys are shown only once.</Prose>

          <SubHeading>Step 2 — Make your first request</SubHeading>
          <CodeBlock lang="bash" code={`curl -X GET https://api.bavio.in/v1/agents \\
  -H "Authorization: Bearer bv_live_sk_••••••••••••" \\
  -H "Content-Type: application/json"`} />

          <SubHeading>Step 3 — Expected response</SubHeading>
          <CodeBlock lang="json" code={`{
  "success": true,
  "data": [],
  "meta": {
    "total": 0,
    "page": 1
  }
}`} />

          <SubHeading>SDK support</SubHeading>
          <Prose>Official SDKs for Node.js and Python are in development. For now, use any HTTP client against the REST API directly.</Prose>
        </div>
      );

    /* ── AUTH ── */
    case "auth":
      return (
        <div>
          <SectionHeading>Authentication</SectionHeading>
          <Prose>All API requests must be authenticated using a secret API key sent as a Bearer token in the Authorization header.</Prose>

          <SubHeading>Header format</SubHeading>
          <CodeBlock lang="http" code={`Authorization: Bearer bv_live_sk_••••••••••••`} />

          <SubHeading>Key types</SubHeading>
          <div className="flex flex-col gap-3 mb-6">
            {[
              { prefix: "bv_live_sk_", label: "Live secret key", desc: "Full API access. Use only in server-side environments." },
              { prefix: "bv_test_sk_", label: "Test secret key", desc: "Sandboxed. Calls are simulated, not routed to real numbers." },
              { prefix: "bv_pub_",     label: "Publishable key",  desc: "Read-only, safe for client-side widgets." },
            ].map(k => (
              <div key={k.prefix} className="flex flex-col sm:flex-row sm:items-center gap-2 p-4 bg-surface-raised border border-line rounded-xl">
                <code className="text-[11px] font-mono text-saffron w-36 shrink-0">{k.prefix}…</code>
                <span className="text-body-xs font-semibold text-ink w-36 shrink-0">{k.label}</span>
                <span className="text-body-xs text-ink-muted">{k.desc}</span>
              </div>
            ))}
          </div>

          <SubHeading>Error response (invalid key)</SubHeading>
          <CodeBlock lang="json" code={`{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired API key."
  }
}`} />

          <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mt-4">
            <Warning className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" weight="fill" />
            <p className="text-body-xs text-ink-secondary">Never expose your live secret key in client-side JavaScript or version control. Rotate keys immediately if compromised.</p>
          </div>
        </div>
      );

    /* ── CREATE AGENT ── */
    case "agent":
      return (
        <div>
          <SectionHeading>Create Agent</SectionHeading>
          <Prose>An agent is an AI receptionist instance tied to a phone number, language, and knowledge base. You can run multiple agents per workspace.</Prose>

          <SubHeading>Endpoint</SubHeading>
          <Endpoint method="POST" path="/v1/agents" description="Create a new AI agent" />

          <SubHeading>Request body</SubHeading>
          <CodeBlock lang="json" code={`{
  "name": "Sunstar Properties Assistant",
  "language": "english-us",
  "voice": "sarah-v1",
  "greeting": "Hello! I am speaking on behalf of Sunstar Properties.",
  "timezone": "America/New_York",
  "business_hours": {
    "enabled": false,
    "schedule": {
      "mon": ["09:00", "17:00"],
      "tue": ["09:00", "17:00"],
      "sat": ["10:00", "16:00"]
    }
  },
  "fallback_action": "voicemail"
}`} />

          <SubHeading>Response</SubHeading>
          <CodeBlock lang="json" code={`{
  "success": true,
  "data": {
    "agent_id": "ag_7f3k29mx",
    "name": "Sunstar Properties Assistant",
    "language": "english-us",
    "voice": "sarah-v1",
    "status": "inactive",
    "created_at": "2026-06-03T12:30:00Z"
  }
}`} />

          <SubHeading>Supported languages</SubHeading>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {["english-us", "english-gb", "spanish", "french", "german", "italian"].map(l => (
              <code key={l} className="text-[11px] font-mono text-ink-secondary bg-surface-raised border border-line px-3 py-2 rounded-lg">{l}</code>
            ))}
          </div>

          <SubHeading>Other agent endpoints</SubHeading>
          <div className="flex flex-col gap-2">
            <Endpoint method="GET"    path="/v1/agents"           description="List all agents" />
            <Endpoint method="GET"    path="/v1/agents/:agent_id" description="Get agent details" />
            <Endpoint method="PUT"    path="/v1/agents/:agent_id" description="Update agent config" />
            <Endpoint method="DELETE" path="/v1/agents/:agent_id" description="Delete agent" />
          </div>
        </div>
      );

    /* ── KNOWLEDGE BASE ── */
    case "knowledge":
      return (
        <div>
          <SectionHeading>Knowledge Base Upload</SectionHeading>
          <Prose>Upload documents, FAQs, and service descriptions that your AI agent uses to answer caller questions. Supported formats: PDF, DOCX, TXT, and plain JSON.</Prose>

          <SubHeading>Upload a document</SubHeading>
          <Endpoint method="POST" path="/v1/agents/:agent_id/knowledge" description="Upload knowledge document" />

          <SubHeading>Multipart request (file)</SubHeading>
          <CodeBlock lang="bash" code={`curl -X POST https://api.bavio.in/v1/agents/ag_7f3k29mx/knowledge \\
  -H "Authorization: Bearer bv_live_sk_••••••••••••" \\
  -F "file=@services.pdf" \\
  -F "label=Services Brochure" \\
  -F "tags=pricing,services"`} />

          <SubHeading>Or upload structured JSON</SubHeading>
          <CodeBlock lang="json" code={`{
  "label": "FAQs",
  "content": [
    {
      "question": "What are your office hours?",
      "answer": "We are open Monday to Friday, 9 AM to 5 PM EST."
    },
    {
      "question": "Do you offer home visits?",
      "answer": "Yes, we schedule site visits every Saturday between 10 AM and 4 PM."
    }
  ]
}`} />

          <SubHeading>Response</SubHeading>
          <CodeBlock lang="json" code={`{
  "success": true,
  "data": {
    "doc_id": "doc_93p1zq",
    "label": "FAQs",
    "status": "processing",
    "chunks": 2,
    "created_at": "2026-06-03T12:31:00Z"
  }
}`} />

          <Prose>Processing typically completes in under 30 seconds. Once <code className="text-saffron text-[11px] font-mono">status</code> changes to <code className="text-saffron text-[11px] font-mono">ready</code>, the agent begins using the document in calls.</Prose>

          <SubHeading>List and delete documents</SubHeading>
          <div className="flex flex-col gap-2">
            <Endpoint method="GET"    path="/v1/agents/:agent_id/knowledge"          description="List all knowledge docs" />
            <Endpoint method="DELETE" path="/v1/agents/:agent_id/knowledge/:doc_id"  description="Delete a document" />
          </div>
        </div>
      );

    /* ── WEBHOOK SETUP ── */
    case "webhook":
      return (
        <div>
          <SectionHeading>Webhook Setup</SectionHeading>
          <Prose>Bavio sends a POST request to your registered endpoint immediately after each call ends. Use webhooks to push leads to your CRM, trigger WhatsApp messages, or store call summaries.</Prose>

          <SubHeading>Register a webhook</SubHeading>
          <Endpoint method="POST" path="/v1/webhooks" description="Register webhook endpoint" />

          <CodeBlock lang="json" code={`{
  "url": "https://your-server.com/bavio/events",
  "events": ["call.completed", "call.failed", "lead.captured"],
  "secret": "whsec_your_signing_secret"
}`} />

          <SubHeading>Webhook payload — call.completed</SubHeading>
          <CodeBlock lang="json" code={`{
  "event": "call.completed",
  "timestamp": "2026-06-03T14:22:10Z",
  "call_id": "call_4p9x1n",
  "agent_id": "ag_7f3k29mx",
  "duration_seconds": 94,
  "caller_number": "+1 512 555 0199",
  "transcript_url": "https://api.bavio.in/v1/calls/call_4p9x1n/transcript",
  "lead": {
    "name": "Alex Mercer",
    "intent": "Property inquiry — 3-bedroom",
    "budget": "$1.4–1.7M",
    "location": "Austin, Texas",
    "sentiment": "interested",
    "follow_up": "site_visit_requested"
  },
  "summary": "Caller inquired about 3-bedroom availability in Austin. Budget confirmed. Requested Saturday site visit."
}`} />

          <SubHeading>Signature verification</SubHeading>
          <Prose>Every webhook request includes an <code className="text-saffron text-[11px] font-mono">X-Bavio-Signature</code> header. Verify it server-side to reject forged requests.</Prose>
          <CodeBlock lang="javascript" code={`const crypto = require("crypto");

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return \`sha256=\${expected}\` === signature;
}

// In your Express handler:
app.post("/bavio/events", (req, res) => {
  const sig = req.headers["x-bavio-signature"];
  const raw = JSON.stringify(req.body);
  if (!verifyWebhook(raw, sig, process.env.BAVIO_WEBHOOK_SECRET)) {
    return res.status(401).send("Invalid signature");
  }
  // Process event...
  res.sendStatus(200);
});`} />

          <SubHeading>Retry policy</SubHeading>
          <Prose>Failed deliveries (non-2xx response or timeout {">"} 10s) are retried at 30s, 5 min, 30 min, and 2h intervals. After 4 failures the event is marked <code className="text-saffron text-[11px] font-mono">dead</code> and visible in your webhook logs.</Prose>
        </div>
      );

    /* ── CALL LOGS ── */
    case "calllogs":
      return (
        <div>
          <SectionHeading>Call Logs API</SectionHeading>
          <Prose>Retrieve full call history, transcripts, lead captures, and audio recordings programmatically.</Prose>

          <SubHeading>List call logs</SubHeading>
          <Endpoint method="GET" path="/v1/calls" description="Paginated call history" />

          <CodeBlock lang="bash" code={`curl "https://api.bavio.in/v1/calls?agent_id=ag_7f3k29mx&limit=20&page=1&from=2026-06-01" \\
  -H "Authorization: Bearer bv_live_sk_••••••••••••"`} />

          <SubHeading>Response</SubHeading>
          <CodeBlock lang="json" code={`{
  "success": true,
  "data": [
    {
      "call_id": "call_4p9x1n",
      "agent_id": "ag_7f3k29mx",
      "caller_number": "+1 512 555 0199",
      "direction": "inbound",
      "duration_seconds": 94,
      "status": "completed",
      "lead_captured": true,
      "started_at": "2026-06-03T14:20:36Z",
      "ended_at": "2026-06-03T14:22:10Z"
    }
  ],
  "meta": {
    "total": 142,
    "page": 1,
    "limit": 20
  }
}`} />

          <SubHeading>Get single call with transcript</SubHeading>
          <Endpoint method="GET" path="/v1/calls/:call_id" description="Full call detail + transcript" />

          <CodeBlock lang="json" code={`{
  "success": true,
  "data": {
    "call_id": "call_4p9x1n",
    "transcript": [
      { "role": "agent",  "text": "Hello! I am speaking on behalf of Sunstar Properties.", "t": 0.0 },
      { "role": "caller", "text": "Yes, I was looking for info on 3-bedroom apartments in Austin.", "t": 3.4 },
      { "role": "agent",  "text": "Sure. What is your budget range?", "t": 5.1 }
    ],
    "audio_url": "https://api.bavio.in/v1/calls/call_4p9x1n/audio",
    "lead": {
      "name": "Alex Mercer",
      "intent": "Property inquiry — 3-bedroom",
      "budget": "$1.4–1.7M"
    }
  }
}`} />

          <SubHeading>Query parameters</SubHeading>
          <div className="overflow-x-auto">
            <table className="w-full text-body-xs border border-line rounded-xl overflow-hidden">
              <thead className="bg-surface-raised">
                <tr>
                  {["Parameter", "Type", "Description"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-ink-muted font-semibold border-b border-line">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["agent_id",  "string",  "Filter by agent"],
                  ["status",    "string",  "completed | failed | missed"],
                  ["from",      "ISO date","Start of date range"],
                  ["to",        "ISO date","End of date range"],
                  ["limit",     "integer", "Results per page (max 100)"],
                  ["page",      "integer", "Page number"],
                ].map(([p, t, d]) => (
                  <tr key={p} className="border-b border-line-faint last:border-b-0 hover:bg-surface-raised/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-saffron">{p}</td>
                    <td className="px-4 py-3 text-ink-muted">{t}</td>
                    <td className="px-4 py-3 text-ink-secondary">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    /* ── INTEGRATIONS ── */
    case "integrations":
      return (
        <div>
          <SectionHeading>Integrations</SectionHeading>
          <Prose>Connect Bavio to your existing tools in minutes. Integrations are configured per-agent and trigger actions when calls complete or leads are captured.</Prose>

          <SubHeading>List available integrations</SubHeading>
          <Endpoint method="GET" path="/v1/integrations" description="All supported integrations" />

          <SubHeading>Connect an integration</SubHeading>
          <Endpoint method="POST" path="/v1/agents/:agent_id/integrations" description="Attach integration to agent" />

          <CodeBlock lang="json" code={`{
  "integration": "hubspot",
  "config": {
    "api_key": "pat-na1-••••••••",
    "pipeline_id": "default",
    "stage": "New Lead",
    "field_mapping": {
      "firstname":  "lead.name",
      "phone":      "caller_number",
      "hs_note":    "summary"
    }
  },
  "trigger": "call.completed"
}`} />

          <SubHeading>Supported integrations</SubHeading>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {[
              { name: "HubSpot",         category: "CRM"       },
              { name: "Zoho CRM",        category: "CRM"       },
              { name: "Salesforce",      category: "CRM"       },
              { name: "Google Calendar", category: "Calendar"  },
              { name: "Calendly",        category: "Calendar"  },
              { name: "WhatsApp",        category: "Messaging" },
              { name: "Slack",           category: "Messaging" },
              { name: "Google Sheets",   category: "Storage"   },
              { name: "Zapier",          category: "Automation"},
              { name: "Make (Integromat)",category:"Automation"},
              { name: "Twilio",          category: "Telephony" },
              { name: "Webhook",         category: "Custom"    },
            ].map(int => (
              <div key={int.name} className="flex flex-col p-3 bg-surface-raised border border-line rounded-xl">
                <span className="text-body-xs font-semibold text-ink mb-0.5">{int.name}</span>
                <span className="text-[10px] text-ink-muted uppercase tracking-wider">{int.category}</span>
              </div>
            ))}
          </div>

          <SubHeading>Remove an integration</SubHeading>
          <Endpoint method="DELETE" path="/v1/agents/:agent_id/integrations/:integration_id" description="Detach integration" />
        </div>
      );

    /* ── ERROR CODES ── */
    case "errors":
      return (
        <div>
          <SectionHeading>Error Codes</SectionHeading>
          <Prose>All errors follow a consistent envelope. HTTP status codes map to error categories. Application-level error codes are in the <code className="text-saffron text-[11px] font-mono">error.code</code> field.</Prose>

          <SubHeading>Error envelope</SubHeading>
          <CodeBlock lang="json" code={`{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The field 'language' must be one of: english-us, english-gb, spanish.",
    "field": "language"
  }
}`} />

          <SubHeading>HTTP status code reference</SubHeading>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-body-xs border border-line rounded-xl overflow-hidden">
              <thead className="bg-surface-raised">
                <tr>
                  {["Status", "Meaning"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-ink-muted font-semibold border-b border-line">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["200", "OK — Request succeeded"],
                  ["201", "Created — Resource created"],
                  ["400", "Bad Request — Invalid parameters"],
                  ["401", "Unauthorized — Missing or invalid API key"],
                  ["403", "Forbidden — Insufficient permissions"],
                  ["404", "Not Found — Resource does not exist"],
                  ["409", "Conflict — Resource already exists"],
                  ["422", "Unprocessable — Validation failed"],
                  ["429", "Rate Limited — Too many requests"],
                  ["500", "Server Error — Contact support"],
                ].map(([s, m]) => (
                  <tr key={s} className="border-b border-line-faint last:border-b-0 hover:bg-surface-raised/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-saffron w-20">{s}</td>
                    <td className="px-4 py-3 text-ink-secondary">{m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SubHeading>Application error codes</SubHeading>
          <div className="flex flex-col gap-2">
            {[
              { code: "UNAUTHORIZED",      desc: "API key is missing, invalid, or expired." },
              { code: "FORBIDDEN",         desc: "Key does not have permission for this action." },
              { code: "NOT_FOUND",         desc: "Requested resource ID does not exist." },
              { code: "VALIDATION_ERROR",  desc: "One or more request fields failed validation." },
              { code: "RATE_LIMITED",      desc: "You have exceeded the API rate limit (100 req/min)." },
              { code: "AGENT_INACTIVE",    desc: "The agent is not active. Activate it before assigning calls." },
              { code: "KNOWLEDGE_PROCESSING", desc: "Document is still being processed. Retry after a few seconds." },
              { code: "WEBHOOK_UNREACHABLE", desc: "Your webhook URL returned a non-2xx response repeatedly." },
              { code: "INSUFFICIENT_QUOTA", desc: "Monthly call minutes have been exhausted. Upgrade your plan." },
            ].map(e => (
              <div key={e.code} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3.5 bg-surface-raised border border-line rounded-xl">
                <code className="text-[11px] font-mono text-rose-400 shrink-0 w-52">{e.code}</code>
                <span className="text-body-xs text-ink-muted">{e.desc}</span>
              </div>
            ))}
          </div>

          <SubHeading>Rate limits</SubHeading>
          <Prose>The default rate limit is 100 requests per minute per API key. Webhook delivery and file uploads have separate limits. Contact support to request a higher rate limit for production workloads.</Prose>
        </div>
      );

    default:
      return null;
  }
}

/* ─────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────── */
export default function DocsPage() {
  const [active, setActive] = useState("quickstart");
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset scroll on section change
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [active]);

  const activeSection = sections.find(s => s.id === active);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-canvas text-ink">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1400px] mx-auto w-full px-4 lg:px-8 pt-24 pb-20 gap-8">

        {/* ── SIDEBAR ── */}
        <aside className="lg:w-64 xl:w-72 shrink-0">
          <div className="lg:sticky lg:top-28 card-bezel">
            <div className="card-bezel-inner p-4">
              {/* Header */}
              <div className="px-2 pb-4 mb-4 border-b border-line-subtle">
                <span className="text-label uppercase tracking-widest text-saffron block mb-1">Bavio API</span>
                <p className="text-body-xs text-ink-muted">v1 · REST · JSON</p>
              </div>

              {/* Nav items */}
              <nav className="flex flex-col gap-1">
                {sections.map(s => {
                  const Icon = s.icon;
                  const isActive = active === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActive(s.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-xs font-medium text-left transition-all duration-200 group ${
                        isActive
                          ? "bg-saffron text-white shadow-sm"
                          : "text-ink-tertiary hover:text-ink hover:bg-surface-raised"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-ink-muted group-hover:text-saffron"}`} weight="duotone" />
                      {s.label}
                      {isActive && <CaretRight className="w-3 h-3 ml-auto text-white/60" weight="bold" />}
                    </button>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-line-subtle px-2">
                <p className="text-[10px] text-ink-faint leading-relaxed">
                  Questions? Email{" "}
                  <a href="mailto:hello@bavio.in" className="text-saffron hover:underline">hello@bavio.in</a>
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── CONTENT PANE ── */}
        <main
          ref={contentRef}
          className="flex-1 min-w-0"
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-body-xs text-ink-muted mb-6">
            <span>Docs</span>
            <CaretRight className="w-3 h-3" weight="bold" />
            <span className="text-ink font-medium">{activeSection?.label}</span>
          </div>

          {/* Content card */}
          <div className="card-bezel">
            <div className="card-bezel-inner p-7 lg:p-10">
              <SectionContent id={active} />
            </div>
          </div>

          {/* Prev / Next navigation */}
          <div className="flex justify-between items-center mt-6 gap-4">
            {sections.findIndex(s => s.id === active) > 0 ? (
              <button
                type="button"
                onClick={() => setActive(sections[sections.findIndex(s => s.id === active) - 1].id)}
                className="flex items-center gap-2 text-body-xs font-medium text-ink-tertiary hover:text-ink transition-colors"
              >
                ← {sections[sections.findIndex(s => s.id === active) - 1].label}
              </button>
            ) : <div />}
            {sections.findIndex(s => s.id === active) < sections.length - 1 ? (
              <button
                type="button"
                onClick={() => setActive(sections[sections.findIndex(s => s.id === active) + 1].id)}
                className="flex items-center gap-2 text-body-xs font-medium text-saffron hover:text-saffron-hover transition-colors"
              >
                {sections[sections.findIndex(s => s.id === active) + 1].label} →
              </button>
            ) : <div />}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
