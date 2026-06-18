'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  MapPin, 
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Phone,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Lead {
  id: string;
  name?: string;
  phone?: string;
  caller_number?: string;
  intent?: string;
  budget?: string;
  location?: string;
  status?: string;
  notes?: string;
  caller_name?: string;
  appointment_time?: string;
  full_transcript?: string;
  summary?: string;
  call_duration?: number;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  converted:  'bg-green-500/10 text-green-400 border-green-500/25',
  qualified:  'bg-blue-500/10 text-blue-400 border-blue-500/25',
  lost:       'bg-red-500/10 text-red-400 border-red-500/25',
  contacted:  'bg-amber-500/10 text-amber-400 border-amber-500/25',
  new:        'bg-orange-500/10 text-orange-400 border-orange-500/25',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const token = localStorage.getItem('bavio_token');
      const userStr = localStorage.getItem('bavio_user');
      if (!token || !userStr) return;

      const user = JSON.parse(userStr);
      const clientId = user.id;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/leads/${clientId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (res.ok) {
        const data = await res.json();
        setLeads(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load leads. Please try again.');
      }
    } catch (err) {
      console.error('[LeadsPage] fetch error:', err);
      setError('Network error. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleStatusChange(leadId: string, newStatus: string) {
    try {
      const token = localStorage.getItem('bavio_token');
      if (!token) return;

      // Optimistic update
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (!res.ok) {
        console.error('Failed to update status on server');
        fetchLeads();
      }
    } catch (err) {
      console.error('[LeadsPage] status update error:', err);
      fetchLeads();
    }
  }

  function toggleExpandRow(id: string) {
    setExpandedLeadId(expandedLeadId === id ? null : id);
  }

  function formatDateTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function parseNotes(notesStr?: string) {
    if (!notesStr) return null;
    try {
      const parsed = JSON.parse(notesStr);
      return typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  const filteredLeads = leads.filter(lead => {
    const phone = lead.phone || lead.caller_number || '';
    const matchesSearch =
      (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.intent || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.location || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Captured Leads</h2>
          <p className="text-sm text-gray-400 mt-1">Manage qualified client inquiries automatically identified by Bavio AI.</p>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-[#11111a] border border-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 animate-pulse">Loading leads...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Captured Leads</h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage qualified client inquiries automatically identified by Bavio AI.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="hidden sm:inline text-xs text-gray-500 font-semibold">
            {leads.length} total
          </span>
          <button
            onClick={() => fetchLeads(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#11111a] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 text-sm font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── Filter / Search Bar ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#11111a] border border-gray-800 rounded-2xl p-4">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, phone, intent or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0f] border border-gray-800 rounded-xl text-white text-sm focus:border-orange-500 focus:outline-none transition-all placeholder:text-gray-600"
          />
        </div>
        <div className="w-full sm:w-44 flex-shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-gray-800 rounded-xl text-white text-sm focus:border-orange-500 focus:outline-none transition-all font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* ── Empty State ──────────────────────────────────────────────────── */}
      {filteredLeads.length === 0 ? (
        <div className="py-20 border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-[#11111a]/35 mt-4">
          <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-5">
            <Users size={26} />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">
            {searchTerm || statusFilter !== 'all' ? 'No matching leads' : 'No leads captured yet'}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
            {searchTerm || statusFilter !== 'all'
              ? 'No leads match your current filters. Try adjusting your search.'
              : 'Call your Bavio number to test — leads captured during AI calls will appear here automatically.'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <div className="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#11111a] border border-gray-800 text-sm text-gray-400">
              <Phone size={14} className="text-orange-400" />
              Call your Bavio number to test
            </div>
          )}
        </div>
      ) : (

        /* ── Leads Table ──────────────────────────────────────────────────── */
        <div className="bg-[#11111a] border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase font-semibold tracking-wider bg-[#0c0c12]/40">
                  <th className="py-4 px-5 w-8" />
                  <th className="py-4 px-5">Name</th>
                  <th className="py-4 px-5">Phone</th>
                  <th className="py-4 px-5">Intent</th>
                  <th className="py-4 px-5">Location</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Captured</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-sm">
                {filteredLeads.map((lead) => {
                  const isExpanded = expandedLeadId === lead.id;
                  const parsedNotes = parseNotes(lead.notes);
                  const phone = lead.phone || lead.caller_number || '—';
                  const statusKey = (lead.status || 'new') as keyof typeof STATUS_STYLES;

                  return (
                    <React.Fragment key={lead.id}>
                      <tr
                        className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${isExpanded ? 'bg-white/[0.015]' : ''}`}
                        onClick={() => toggleExpandRow(lead.id)}
                      >
                        <td className="py-4 px-5 text-center text-gray-500">
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </td>
                        <td className="py-4 px-5 font-semibold text-white whitespace-nowrap">
                          {lead.name || <span className="text-gray-600 font-normal italic">Not provided</span>}
                        </td>
                        <td className="py-4 px-5 text-gray-300 font-mono text-xs whitespace-nowrap">
                          {phone}
                        </td>
                        <td className="py-4 px-5 text-gray-400 max-w-[180px] truncate">
                          {lead.intent || '—'}
                        </td>
                        <td className="py-4 px-5 text-gray-400 whitespace-nowrap">
                          {lead.location ? (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="text-gray-600 flex-shrink-0" />
                              {lead.location}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-4 px-5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.status || 'new'}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none transition-all ${STATUS_STYLES[statusKey] || STATUS_STYLES.new}`}
                          >
                            <option value="new"      className="bg-[#11111a] text-orange-400">New</option>
                            <option value="contacted" className="bg-[#11111a] text-amber-400">Contacted</option>
                            <option value="qualified" className="bg-[#11111a] text-blue-400">Qualified</option>
                            <option value="converted" className="bg-[#11111a] text-green-400">Converted</option>
                            <option value="lost"      className="bg-[#11111a] text-red-400">Lost</option>
                          </select>
                        </td>
                        <td className="py-4 px-5 text-right text-xs text-gray-500 font-semibold whitespace-nowrap">
                          {formatDateTime(lead.created_at)}
                        </td>
                      </tr>

                      {/* ── Expandable details panel ──────────────────────── */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="overflow-hidden bg-[#0c0c12]/50 border-b border-gray-800/80 px-6 py-5 space-y-5"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                  {/* Left: Qualification details */}
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
                                      <ClipboardList size={13} />
                                      Lead Qualification Details
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 text-sm bg-[#11111a] border border-gray-800 p-4 rounded-xl">
                                      <div>
                                        <p className="text-gray-500 text-xs font-semibold mb-1">Location</p>
                                        <p className="text-white flex items-center gap-1 font-semibold">
                                          <MapPin size={11} className="text-gray-500" />
                                          {lead.location || 'Not provided'}
                                        </p>
                                      </div>
                                      <div className="col-span-2 pt-3 border-t border-gray-800/60">
                                        <p className="text-gray-500 text-xs font-semibold mb-1">Full Intent</p>
                                        <p className="text-white font-medium leading-snug">
                                          {lead.intent || 'Not recorded'}
                                        </p>
                                      </div>
                                      {lead.appointment_time && (
                                        <div className="col-span-2 pt-3 border-t border-gray-800/60">
                                          <p className="text-gray-500 text-xs font-semibold mb-1">Appointment Scheduled</p>
                                          <p className="text-white flex items-center gap-1 font-semibold">
                                            <Calendar size={11} className="text-gray-500" />
                                            {formatDateTime(lead.appointment_time)}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right: AI Summary */}
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
                                      <FileText size={13} />
                                      AI Conversation Summary
                                    </div>
                                    <div className="bg-[#11111a] border border-gray-800 p-4 rounded-xl text-sm min-h-[7rem]">
                                      {lead.summary ? (
                                        <p className="text-gray-300 leading-relaxed">{lead.summary}</p>
                                      ) : lead.intent ? (
                                        <p className="text-gray-400 leading-relaxed italic">
                                          Customer called to inquire about: &quot;{lead.intent}&quot;.
                                        </p>
                                      ) : (
                                        <p className="text-gray-600 leading-relaxed italic">No summary recorded.</p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Raw metadata tags */}
                                {parsedNotes && (
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Metadata Parameters</p>
                                    <div className="flex flex-wrap gap-2">
                                      {Object.entries(parsedNotes).map(([k, v]) => (
                                        <span key={k} className="text-xs bg-[#0a0a0f] border border-gray-800 text-gray-400 rounded-lg px-2.5 py-1 font-mono">
                                          <strong className="text-gray-300 font-semibold">{k}:</strong> {String(v)}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer count */}
          <div className="px-5 py-3 border-t border-gray-800/60 bg-[#0c0c12]/30">
            <p className="text-xs text-gray-600 font-semibold">
              Showing {filteredLeads.length} of {leads.length} lead{leads.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
