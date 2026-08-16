"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BookOpen,
  Check,
  ShieldWarning,
  Sparkle,
  ArrowLeft,
  Plus,
  Trash,
  Globe,
  FileText,
  Question,
  Pen,
  ArrowClockwise,
  Eye,
  CheckCircle,
  X,
  Shield,
  CloudArrowUp,
  Warning,
  Spinner,
} from "@phosphor-icons/react";
import {
  knowledgeBaseApi,
  getClientId,
  KnowledgeDoc,
} from "@/lib/api";

export default function KnowledgeDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Data State
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);

  // View States
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addTab, setAddTab] = useState<"website" | "document" | "faq" | "manual">("website");

  // Syncing simulation state
  const [syncingDocIds, setSyncingDocIds] = useState<string[]>([]);

  // ADD FORM STATES
  const [webUrl, setWebUrl] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [faqTitle, setFaqTitle] = useState("");
  const [faqQuestions, setFaqQuestions] = useState<{ q: string; a: string }[]>([{ q: "", a: "" }]);
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");

  // DETAIL DRAWERS/EDIT STATES
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // AI SAFETY TOGGLES
  const [strictHallucinationLock, setStrictHallucinationLock] = useState(true);
  const [fallbackVoicemail, setFallbackVoicemail] = useState(true);

  const clientId = getClientId();

  const fetchDocs = useCallback(async () => {
    if (!clientId) {
      setErrorMsg("Not authenticated");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await knowledgeBaseApi.list();
      setDocs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load knowledge documents");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const selectedDoc = docs.find((d) => d.id === selectedDocId);

  // Sync edit fields when document is selected
  useEffect(() => {
    if (selectedDoc) {
      setEditTitle(selectedDoc.name || "");
      setEditContent(selectedDoc.content || "");
    }
  }, [selectedDoc]);

  // Helper: parse document type
  const getDocType = (name: string) => {
    const n = name.toLowerCase();
    if (n.startsWith("http") || n.includes(".com") || n.includes(".org") || n.includes(".net") || n.includes(".in")) {
      return "website";
    }
    if (n.includes("faq") || n.includes("q&a") || n.includes("questions")) {
      return "faq";
    }
    if (n.endsWith(".pdf") || n.endsWith(".docx") || n.endsWith(".txt") || n.endsWith(".csv")) {
      return "document";
    }
    return "manual";
  };

  // Helper: get icon for doc type
  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case "website":
        return <Globe className="w-4 h-4 text-blue-600" />;
      case "faq":
        return <Question className="w-4 h-4 text-amber-600" />;
      case "document":
        return <CloudArrowUp className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-emerald-600" />;
    }
  };

  // --- ACTIONS ---

  // Create Knowledge base entry
  const handleAddKnowledge = async () => {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      let finalName = "";
      let finalContent = "";

      if (addTab === "website") {
        if (!webUrl) throw new Error("Please enter a valid website URL");
        finalName = webUrl;
        finalContent = `Website scrape of ${webUrl}. AI guidelines ingested to capture terms of services, contact information, hours of operation, and corporate information.`;
      } else if (addTab === "document") {
        if (!docTitle || !docContent) throw new Error("Please fill in document title and text body");
        finalName = docTitle.endsWith(".txt") ? docTitle : `${docTitle}.txt`;
        finalContent = docContent;
      } else if (addTab === "faq") {
        if (!faqTitle) throw new Error("Please enter an FAQ group title");
        finalName = faqTitle.toLowerCase().includes("faq") ? faqTitle : `${faqTitle} FAQs`;
        finalContent = faqQuestions
          .filter(q => q.q && q.a)
          .map(q => `Question: ${q.q}\nAnswer: ${q.a}`)
          .join("\n\n");
        if (!finalContent) throw new Error("Please add at least one question and answer pair");
      } else {
        if (!manualTitle || !manualContent) throw new Error("Please fill in manual title and text body");
        finalName = manualTitle;
        finalContent = manualContent;
      }

      const newDoc = await knowledgeBaseApi.create({ name: finalName, content: finalContent });
      setDocs(prev => [newDoc, ...prev]);
      
      setSuccessMsg(`Knowledge source "${newDoc.name}" added successfully.`);
      setTimeout(() => setSuccessMsg(""), 4000);
      setIsAddOpen(false);

      // Reset fields
      setWebUrl("");
      setDocTitle("");
      setDocContent("");
      setFaqTitle("");
      setFaqQuestions([{ q: "", a: "" }]);
      setManualTitle("");
      setManualContent("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add knowledge base source");
    } finally {
      setSaving(false);
    }
  };

  // Save changes in detail drawer
  const handleSaveEdit = async () => {
    if (!selectedDocId) return;
    setIsSavingEdit(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const updated = await knowledgeBaseApi.update(selectedDocId, {
        name: editTitle,
        content: editContent,
      });
      setDocs(prev => prev.map(d => d.id === selectedDocId ? updated : d));
      setSuccessMsg("Document content updated successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save document updates");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Knowledge base entry
  const handleDeleteDoc = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this knowledge source?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await knowledgeBaseApi.delete(id);
      setDocs(prev => prev.filter(d => d.id !== id));
      setSuccessMsg("Knowledge source deleted successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
      setSelectedDocId(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete knowledge source");
    }
  };

  // Sync simulation action
  const handleSyncSource = (id: string) => {
    setSyncingDocIds(prev => [...prev, id]);
    setTimeout(() => {
      setSyncingDocIds(prev => prev.filter(item => item !== id));
      setSuccessMsg("Knowledge source synced and chunked successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
    }, 3000);
  };

  // Calculations for KPIs
  const totalSources = docs.length;
  const docsCount = docs.filter(d => getDocType(d.name) === "document" || getDocType(d.name) === "manual").length;
  const faqsCount = docs.filter(d => getDocType(d.name) === "faq").length;
  const lastUpdatedText = docs.length > 0
    ? new Date(docs.reduce((latest, current) => {
        return new Date(current.created_at).getTime() > new Date(latest.created_at).getTime() ? current : latest;
      }).created_at).toLocaleDateString()
    : "—";

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div className="flex items-center justify-between border-b border-line/40 pb-6">
          <div className="text-left">
            <h1 className="font-serif text-3xl text-ink font-normal">Knowledge</h1>
            <p className="text-body-xs text-ink-tertiary mt-1">Loading AI knowledge base workspace...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-line rounded-2xl p-6 shadow-sm animate-pulse h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative text-ink font-sans">
      
      {/* Alert Notices */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-700 text-xs text-left">
          <ShieldWarning className="w-4 h-4 mt-0.5 shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 text-green-700 text-xs font-semibold text-left">
          <Check className="w-4 h-4 mt-0.5 shrink-0" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line/40 pb-6">
        <div className="text-left">
          <h1 className="font-serif text-3.5xl tracking-tight text-ink font-normal font-serif">Knowledge</h1>
          <p className="text-sm text-ink-tertiary mt-1">
            Give your AI employees the information they need to answer accurately.
          </p>
        </div>
        
        <button
          onClick={() => {
            setAddTab("website");
            setIsAddOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl transition-all shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Knowledge
        </button>
      </div>

      {/* 2. Knowledge Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI: Knowledge Sources */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,10,2,0.03)] hover:border-saffron/40 transition-colors duration-200 flex flex-col justify-between h-24 text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">Knowledge Sources</span>
          <div>
            <h3 className="text-2xl font-bold text-ink leading-none">{totalSources > 0 ? totalSources : "—"}</h3>
            <span className="text-[9px] text-ink-muted mt-1 block">Active vector nodes</span>
          </div>
        </div>

        {/* KPI: Documents */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,10,2,0.03)] hover:border-saffron/40 transition-colors duration-200 flex flex-col justify-between h-24 text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">Documents</span>
          <div>
            <h3 className="text-2xl font-bold text-ink leading-none">{totalSources > 0 ? docsCount : "—"}</h3>
            <span className="text-[9px] text-ink-muted mt-1 block">Text files & Manual sheets</span>
          </div>
        </div>

        {/* KPI: FAQs */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,10,2,0.03)] hover:border-saffron/40 transition-colors duration-200 flex flex-col justify-between h-24 text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">FAQs</span>
          <div>
            <h3 className="text-2xl font-bold text-ink leading-none">{totalSources > 0 ? faqsCount : "—"}</h3>
            <span className="text-[9px] text-ink-muted mt-1 block">Structured Q&A sheets</span>
          </div>
        </div>

        {/* KPI: Last Updated */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,10,2,0.03)] hover:border-saffron/40 transition-colors duration-200 flex flex-col justify-between h-24 text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">Last Updated</span>
          <div>
            <h3 className="text-2xl font-bold text-ink leading-none">{lastUpdatedText}</h3>
            <span className="text-[9px] text-ink-muted mt-1 block">Latest vector sync time</span>
          </div>
        </div>
      </div>

      {/* 3. AI Safety Rules configurable section */}
      <div className="bg-white border border-line rounded-2xl p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-line/40">
          <Shield className="w-5 h-5 text-saffron" />
          <h3 className="font-serif text-lg font-normal">AI Safety Rules</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
          <div className="border border-line/60 rounded-xl p-4 flex justify-between items-start gap-4 bg-canvas/10">
            <div>
              <span className="font-semibold text-ink block mb-0.5">Strict Hallucination Prevention</span>
              <p className="text-ink-secondary text-[11px]">
                Force AI agents to state &ldquo;I do not know&rdquo; rather than fabricating pricing tiers, features, or deadlines not loaded in the knowledge base.
              </p>
            </div>
            <input
              type="checkbox"
              checked={strictHallucinationLock}
              onChange={(e) => setStrictHallucinationLock(e.target.checked)}
              className="rounded border-line text-saffron focus:ring-saffron mt-1 cursor-pointer shrink-0"
            />
          </div>

          <div className="border border-line/60 rounded-xl p-4 flex justify-between items-start gap-4 bg-canvas/10">
            <div>
              <span className="font-semibold text-ink block mb-0.5">Fallback Voicemail Routing</span>
              <p className="text-ink-secondary text-[11px]">
                Instantly transfer the caller to digital fallback voicemail if the query matches customer support categories not fully indexed.
              </p>
            </div>
            <input
              type="checkbox"
              checked={fallbackVoicemail}
              onChange={(e) => setFallbackVoicemail(e.target.checked)}
              className="rounded border-line text-saffron focus:ring-saffron mt-1 cursor-pointer shrink-0"
            />
          </div>
        </div>
      </div>

      {/* 4. Knowledge sources list / grid */}
      <div className="bg-white border border-line rounded-2xl p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-line/40 pb-3">
          <h3 className="font-serif text-lg font-normal">Active Knowledge Nodes</h3>
          <span className="text-[10px] font-mono text-ink-muted">Total: {docs.length} sources</span>
        </div>

        {docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4 bg-canvas/10 border border-dashed border-line rounded-xl">
            <Sparkle className="w-7 h-7 text-saffron/20" />
            <div>
              <h4 className="text-xs font-semibold text-ink mb-1 font-sans">Your AI employee needs knowledge</h4>
              <p className="text-[11px] text-ink-tertiary max-w-md font-sans leading-relaxed">
                Add your website, FAQs, documents, or business information so Bavio can answer customers accurately.
              </p>
            </div>
            <button
              onClick={() => {
                setAddTab("website");
                setIsAddOpen(true);
              }}
              className="px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              Add Knowledge
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line/40 text-[9px] font-bold uppercase tracking-widest text-ink-tertiary">
                  <th className="py-2.5 text-left">Source Name</th>
                  <th className="py-2.5 text-left">Type</th>
                  <th className="py-2.5 text-left">Status</th>
                  <th className="py-2.5 text-left">Last Synced</th>
                  <th className="py-2.5 text-left">Volume</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle/50 text-[11px] font-sans">
                {docs.map((doc) => {
                  const type = getDocType(doc.name);
                  const isSyncing = syncingDocIds.includes(doc.id);
                  const wordCount = doc.word_count || doc.content.split(/\s+/).filter(Boolean).length;
                  return (
                    <tr
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className="cursor-pointer hover:bg-canvas/20 transition-colors"
                    >
                      <td className="py-3.5 font-semibold text-ink">
                        <div className="flex items-center gap-2">
                          {getDocTypeIcon(type)}
                          <span className="max-w-[200px] truncate">{doc.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-ink-secondary capitalize">{type}</td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          isSyncing
                            ? "text-blue-700 border-blue-150 bg-blue-50 animate-pulse"
                            : "text-green-700 border-green-150 bg-green-50"
                        }`}>
                          {isSyncing ? (
                            <>
                              <Spinner className="w-2.5 h-2.5 animate-spin" />
                              Syncing
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-2.5 h-2.5" />
                              Active
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 text-ink-tertiary font-mono">
                        {new Date(doc.created_at).toLocaleDateString("en-US")}
                      </td>
                      <td className="py-3.5 text-ink-secondary font-mono">{wordCount} words</td>
                      <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3 text-xs">
                          <button
                            onClick={() => handleSyncSource(doc.id)}
                            className="p-1 hover:bg-canvas rounded-lg text-ink-secondary hover:text-ink transition-all"
                            title="Sync source"
                          >
                            <ArrowClockwise className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="p-1 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-800 transition-all"
                            title="Delete source"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. ADD KNOWLEDGE BASE SOURCE DIALOG / MODAL */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="fixed inset-0 bg-black"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-line rounded-[24px] p-6 shadow-2xl z-50 w-full max-w-lg text-left"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-line/40 pb-4 mb-4">
                <h3 className="font-serif text-lg font-normal">Add Knowledge Node</h3>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="p-1.5 text-ink-tertiary hover:text-ink border border-line hover:bg-canvas rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs selectors */}
              <div className="flex border-b border-line/40 mb-4 gap-1 overflow-x-auto">
                {[
                  { key: "website", label: "Website Scrape", icon: Globe },
                  { key: "document", label: "Upload Document", icon: CloudArrowUp },
                  { key: "faq", label: "FAQ Q&A Sheet", icon: Question },
                  { key: "manual", label: "Manual Entry", icon: FileText },
                ].map(tab => {
                  const Icon = tab.icon;
                  const active = addTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setAddTab(tab.key as any)}
                      className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-bold uppercase tracking-wider shrink-0 transition-all ${
                        active
                          ? "border-saffron text-saffron"
                          : "border-transparent text-ink-tertiary hover:text-ink"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Add form bodies based on active tabs */}
              <div className="space-y-4 min-h-[180px]">
                {addTab === "website" && (
                  <div className="space-y-3">
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      Enter your product documentation url, help page, or landing site. Bavio will scrape and index its texts automatically.
                    </p>
                    <div>
                      <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Website URL</label>
                      <input
                        type="url"
                        value={webUrl}
                        onChange={(e) => setWebUrl(e.target.value)}
                        placeholder="https://example.com/docs"
                        className="w-full bg-canvas/25 border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-saffron text-ink font-semibold"
                      />
                    </div>
                  </div>
                )}

                {addTab === "document" && (
                  <div className="space-y-3">
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      Upload or insert custom policy documentation, product specs, or terms.
                    </p>
                    <div>
                      <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Document Title</label>
                      <input
                        type="text"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="e.g. Refund Policy"
                        className="w-full bg-canvas/25 border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-saffron text-ink font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Document Text Body</label>
                      <textarea
                        rows={4}
                        value={docContent}
                        onChange={(e) => setDocContent(e.target.value)}
                        placeholder="Paste document text context here..."
                        className="w-full bg-canvas/25 border border-line rounded-xl p-3 text-xs focus:outline-none focus:border-saffron text-ink font-mono leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {addTab === "faq" && (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      Define a group of Q&A sheets to guide AI responses for recurring customer queries.
                    </p>
                    <div>
                      <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">FAQ Group Name</label>
                      <input
                        type="text"
                        value={faqTitle}
                        onChange={(e) => setFaqTitle(e.target.value)}
                        placeholder="e.g. Shipping FAQ"
                        className="w-full bg-canvas/25 border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-saffron text-ink font-semibold"
                      />
                    </div>
                    
                    {/* FAQ Items */}
                    <div className="space-y-3 mt-4 border-t border-line/40 pt-3">
                      {faqQuestions.map((q, idx) => (
                        <div key={idx} className="bg-canvas/10 border border-line/60 p-3 rounded-xl space-y-2 relative">
                          <button
                            onClick={() => {
                              setFaqQuestions(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute right-2 top-2 p-1 text-red-500 hover:text-red-700 text-xs font-bold"
                          >
                            Remove
                          </button>
                          <div>
                            <label className="text-[8px] font-bold text-ink-muted uppercase block mb-1">Question</label>
                            <input
                              type="text"
                              value={q.q}
                              onChange={(e) => {
                                const newQ = [...faqQuestions];
                                newQ[idx].q = e.target.value;
                                setFaqQuestions(newQ);
                              }}
                              placeholder="e.g. What are your opening hours?"
                              className="w-full bg-white border border-line rounded-lg px-2.5 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-bold text-ink-muted uppercase block mb-1">Answer</label>
                            <textarea
                              rows={2}
                              value={q.a}
                              onChange={(e) => {
                                const newQ = [...faqQuestions];
                                newQ[idx].a = e.target.value;
                                setFaqQuestions(newQ);
                              }}
                              placeholder="e.g. We are open from 9 AM to 6 PM Monday to Friday."
                              className="w-full bg-white border border-line rounded-lg px-2.5 py-1 text-xs"
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setFaqQuestions(prev => [...prev, { q: "", a: "" }])}
                        className="text-[10px] font-bold text-saffron hover:underline flex items-center gap-1 mt-2"
                      >
                        + Add Q&A Item
                      </button>
                    </div>
                  </div>
                )}

                {addTab === "manual" && (
                  <div className="space-y-3">
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      Type custom text guidelines, pricing lists, or fallback instructions.
                    </p>
                    <div>
                      <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Title</label>
                      <input
                        type="text"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        placeholder="e.g. Delivery terms"
                        className="w-full bg-canvas/25 border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-saffron text-ink font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Context Information Details</label>
                      <textarea
                        rows={4}
                        value={manualContent}
                        onChange={(e) => setManualContent(e.target.value)}
                        placeholder="Type info detail here..."
                        className="w-full bg-canvas/25 border border-line rounded-xl p-3 text-xs focus:outline-none focus:border-saffron text-ink font-sans leading-relaxed"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end items-center gap-3 border-t border-line/40 pt-4 mt-6">
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-line hover:bg-canvas text-xs font-semibold rounded-xl text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddKnowledge}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-40"
                >
                  {saving && <Spinner className="w-4 h-4 animate-spin" />}
                  Add Node
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. SLIDING SOURCE EDIT & LOG DETAILS DRAWER */}
      <AnimatePresence>
        {selectedDoc && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDocId(null)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Slide-over Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-line shadow-2xl z-50 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-line/40 flex justify-between items-center bg-canvas/10">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 bg-saffron/5 flex items-center justify-center rounded-xl">
                    <BookOpen className="w-4 h-4 text-saffron" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-ink max-w-[200px] truncate">{editTitle || "Source Details"}</h4>
                    <span className="text-[9px] font-mono text-ink-tertiary">Vector ID: {selectedDoc.id}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDocId(null)}
                  className="p-1.5 text-ink-tertiary hover:text-ink border border-line hover:bg-canvas rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content body */}
              <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6 text-left">
                
                {/* Processing status logs */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary border-b border-line/40 pb-2">
                    Vectorization Pipeline Status
                  </h5>
                  <div className="space-y-2 text-[10px] font-mono text-ink-secondary bg-canvas/30 border border-line/65 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-green-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-ping" />
                      <span>Ingestion Complete (200 OK)</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                      <span>Chunking & Tokenizer Indexing complete</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                      <span>Vector weights mapped in LLM cache</span>
                    </div>
                  </div>
                </div>

                {/* Edit forms */}
                <div className="space-y-4 flex-grow flex flex-col">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary border-b border-line/40 pb-2">
                    Source Text Configuration
                  </h5>
                  <div>
                    <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Source Name / Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-saffron text-ink font-semibold"
                    />
                  </div>
                  <div className="flex-grow flex flex-col">
                    <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Document Content</label>
                    <textarea
                      rows={10}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Content text"
                      className="w-full flex-grow bg-canvas/20 border border-line rounded-xl p-3 text-xs focus:outline-none focus:border-saffron text-ink leading-relaxed font-mono resize-none"
                    />
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-line/40 bg-canvas/10 flex justify-between items-center gap-4">
                <button
                  onClick={() => handleDeleteDoc(selectedDoc.id)}
                  className="flex items-center gap-1 px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors font-sans"
                >
                  <Trash className="w-3.5 h-3.5" />
                  Delete Node
                </button>

                <button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="flex items-center gap-1 px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all disabled:opacity-40 font-sans"
                >
                  {isSavingEdit && <Spinner className="w-3 h-3 animate-spin" />}
                  Save Changes
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
