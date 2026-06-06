"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  UploadSimple,
  FileText,
  MagnifyingGlass,
  Plus,
  Database,
  CheckCircle,
  Clock,
  Sparkle,
  Trash,
  Warning,
  X,
} from "@phosphor-icons/react";
import { knowledgeBaseApi, getClientId, KnowledgeDoc, SearchResult } from "@/lib/api";

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDocUploadForm, setShowDocUploadForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // New doc form
  const [newDocName, setNewDocName] = useState("");
  const [newDocText, setNewDocText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Search
  const [vectorQuery, setVectorQuery] = useState("");
  const [vectorSearchResults, setVectorSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const clientId = getClientId();

  const fetchDocs = useCallback(async () => {
    try {
      const res = await knowledgeBaseApi.list();
      setDocuments(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const filteredDocs = useMemo(
    () => documents.filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [documents, searchQuery]
  );

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !newDocText) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const created = await knowledgeBaseApi.create({ name: newDocName, content: newDocText });
      setDocuments(prev => [created, ...prev]);
      setNewDocName("");
      setNewDocText("");
      setShowDocUploadForm(false);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await knowledgeBaseApi.delete(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete document");
    } finally {
      setDeleting(null);
    }
  };

  const handleSearch = async () => {
    if (!vectorQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await knowledgeBaseApi.search(vectorQuery);
      setVectorSearchResults(Array.isArray(results) ? results : []);
    } catch (err: any) {
      setSearchError(err.message || "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Knowledge Base</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Loading documents...</p>
        </div>
        <div className="card-bezel animate-pulse"><div className="card-bezel-inner h-64 bg-surface-raised/20" /></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Knowledge Base</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Upload business documents that your AI agent uses to answer caller questions accurately.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-ink-muted">{documents.length} / 50 documents</span>
          <span className="w-1.5 h-1.5 rounded-full bg-state-success" />
        </div>
      </div>

      {error && (
        <div className="card-bezel border-state-error/40">
          <div className="card-bezel-inner p-4 flex items-center gap-3">
            <Warning className="w-5 h-5 text-state-error shrink-0" />
            <span className="text-body-xs text-state-error">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4 text-ink-muted" /></button>
          </div>
        </div>
      )}

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* LEFT: DOCUMENT LIST */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="card-bezel">
            <div className="card-bezel-inner p-6 bg-surface text-left flex flex-col gap-5">
              {/* Header + search */}
              <div className="flex justify-between items-center border-b border-line pb-4">
                <div>
                  <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Document Archive</h3>
                  <p className="text-[10px] text-ink-tertiary mt-0.5 font-mono">Text documents indexed for agent recall.</p>
                </div>
                <button
                  onClick={() => setShowDocUploadForm(!showDocUploadForm)}
                  className="bg-saffron text-white text-[9px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg hover:bg-saffron-hover transition-all active:scale-95 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" weight="bold" />
                  Add Doc
                </button>
              </div>

              {/* Search filter */}
              <div className="relative">
                <MagnifyingGlass className="w-4 h-4 text-ink-tertiary absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter documents by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-raised border border-line rounded-xl pl-11 pr-4 py-2.5 text-body-xs focus:outline-none focus:border-saffron text-ink placeholder:text-ink-muted font-sans"
                />
              </div>

              {/* Upload form */}
              <AnimatePresence>
                {showDocUploadForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <form onSubmit={handleUploadSubmit} className="flex flex-col gap-3.5 bg-surface-raised border border-saffron-border p-5 rounded-2xl">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-ink">Add New Document</h4>
                        <button type="button" onClick={() => setShowDocUploadForm(false)}>
                          <X className="w-4 h-4 text-ink-muted hover:text-ink" />
                        </button>
                      </div>
                      {uploadError && <p className="text-[10px] text-state-error font-mono">{uploadError}</p>}
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-ink-tertiary">Document Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. business_faq.txt"
                          value={newDocName}
                          onChange={(e) => setNewDocName(e.target.value)}
                          className="bg-canvas border border-line rounded-lg px-3 py-2 text-body-xs focus:outline-none focus:border-saffron text-ink placeholder:text-ink-muted font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[8px] font-bold uppercase tracking-widest text-ink-tertiary">Document Content</label>
                          <span className="text-[8px] font-mono text-ink-muted">{newDocText.length} chars</span>
                        </div>
                        <textarea
                          required
                          rows={6}
                          placeholder="Paste your document text here. The AI agent will use this to answer customer questions..."
                          value={newDocText}
                          onChange={(e) => setNewDocText(e.target.value)}
                          className="bg-canvas border border-line rounded-lg px-3 py-2 text-body-xs focus:outline-none focus:border-saffron text-ink placeholder:text-ink-muted resize-none leading-relaxed"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isUploading || !newDocName || !newDocText}
                        className="w-full bg-saffron text-white text-[9px] font-bold uppercase tracking-wider py-2.5 rounded-lg hover:bg-saffron-hover transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isUploading ? (
                          <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</>
                        ) : (
                          <><UploadSimple className="w-3.5 h-3.5" weight="bold" /> Upload &amp; Index Document</>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Document list */}
              {filteredDocs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Sparkle className="w-8 h-8 text-saffron/40" weight="fill" />
                  <div>
                    <p className="text-xs font-bold text-ink mb-1">No documents yet</p>
                    <p className="text-[10px] text-ink-tertiary max-w-xs">Add text documents your AI agent will use to answer caller questions accurately.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredDocs.map((doc) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-surface-raised border border-line p-4 rounded-xl flex items-center justify-between gap-4 hover:border-saffron-border transition-all duration-200"
                    >
                      <div className="flex items-start gap-3 flex-grow overflow-hidden">
                        <div className="w-8 h-8 bg-saffron-muted border border-saffron-border rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-4 h-4 text-saffron" />
                        </div>
                        <div className="text-left overflow-hidden">
                          <h4 className="text-xs font-bold text-ink truncate font-mono">{doc.name}</h4>
                          <div className="flex gap-3 text-[9px] font-mono text-ink-muted mt-1">
                            <span>{doc.word_count ? `${doc.word_count} words` : "—"}</span>
                            <span>•</span>
                            <span>{new Date(doc.created_at).toLocaleDateString("en-IN")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[9px] font-mono text-state-success bg-state-success/15 px-2 py-0.5 rounded font-bold uppercase border border-state-success/20">
                          Indexed
                        </span>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          disabled={deleting === doc.id}
                          className="p-1.5 hover:bg-state-error/10 border border-line hover:border-state-error/30 rounded-lg text-ink-muted hover:text-state-error transition-all disabled:opacity-50"
                          aria-label="Delete document"
                        >
                          {deleting === doc.id
                            ? <span className="w-3.5 h-3.5 border-2 border-state-error border-t-transparent rounded-full animate-spin block" />
                            : <Trash className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: SEARCH PANEL */}
        <div className="lg:col-span-5 card-bezel">
          <div className="card-bezel-inner p-6 flex flex-col gap-5 bg-surface text-left h-full">
            <div className="flex justify-between items-center border-b border-line pb-4">
              <div>
                <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Knowledge Search</h3>
                <p className="text-[10px] text-ink-tertiary mt-0.5">Test what your AI agent knows.</p>
              </div>
              <Database className="w-4 h-4 text-saffron" />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask a question e.g. 'What are your office hours?'"
                value={vectorQuery}
                onChange={(e) => setVectorQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-grow bg-surface-raised border border-line rounded-xl px-4 py-2.5 text-body-xs focus:outline-none focus:border-saffron text-ink placeholder:text-ink-muted font-sans"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !vectorQuery.trim()}
                className="bg-saffron text-white text-[9px] font-bold uppercase px-3 py-2.5 rounded-xl hover:bg-saffron-hover transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
              >
                {isSearching ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin block" /> : "Search"}
              </button>
            </div>

            {searchError && <p className="text-[10px] text-state-error font-mono">{searchError}</p>}

            {vectorSearchResults.length > 0 ? (
              <div className="flex flex-col gap-3">
                {vectorSearchResults.map((result, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-surface-raised border border-line rounded-xl p-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-mono text-ink-muted truncate max-w-[60%]">{result.source}</span>
                      <span className="text-[9px] font-mono text-saffron bg-saffron-muted border border-saffron-border px-2 py-0.5 rounded">{result.confidence}</span>
                    </div>
                    <p className="text-[11px] text-ink-secondary leading-relaxed">{result.chunk}</p>
                  </motion.div>
                ))}
              </div>
            ) : !isSearching && vectorQuery.trim().length > 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <MagnifyingGlass className="w-6 h-6 text-ink-muted/40" />
                <p className="text-[10px] text-ink-muted">No matching content found. Try a different query.</p>
              </div>
            ) : !vectorQuery.trim() ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Sparkle className="w-6 h-6 text-saffron/30" weight="fill" />
                <p className="text-[10px] text-ink-muted">
                  {documents.length === 0
                    ? "Add documents first, then search your knowledge base."
                    : "Enter a query to search your indexed documents."
                  }
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
