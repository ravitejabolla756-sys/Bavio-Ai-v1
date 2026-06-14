"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coins, 
  CreditCard, 
  Check, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Calendar,
  FileText,
  Spinner,
  Buildings,
  ShieldCheck,
  CheckCircle,
  X,
  Printer
} from "@phosphor-icons/react";

interface PaymentLog {
  id: number;
  dodoPaymentId: string;
  amount: number;
  currency: string;
  status: string;
  planName: string | null;
  invoiceNumber: string | null;
  paymentType: string;
  periodStart: string | null;
  periodEnd: string | null;
  date: string;
}

interface InvoiceDetail {
  invoiceNumber: string;
  date: string;
  status: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    country: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    currency: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  paymentMethod: string;
  dodoPaymentId: string;
  periodStart: string;
  periodEnd: string;
  company: {
    name: string;
    email: string;
    website: string;
    address: string;
  };
}

export default function WorkspaceBilling() {
  const [profile, setProfile] = useState<any>(null);
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  
  // GST settings state
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [gstBusinessName, setGstBusinessName] = useState("");
  const [gstSaving, setGstSaving] = useState(false);
  const [gstSuccess, setGstSuccess] = useState(false);

  // Auto-renew setting
  const [autoRenew, setAutoRenew] = useState(true);

  // Invoice modal
  const [activeInvoice, setActiveInvoice] = useState<InvoiceDetail | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bavio_token");
      if (!token) return;

      // 1. Fetch Profile
      const profRes = await fetch("/api/auth/profile", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!profRes.ok) throw new Error("Failed to load profile");
      const profData = await profRes.json();
      const user = profData.data?.user;
      setProfile(user);

      // Extract GST if present in business_description
      if (user.business_description && user.business_description.includes("GST:")) {
        setGstEnabled(true);
        const matches = user.business_description.match(/GST:\s*([A-Z0-9]+)\s*\(([^)]+)\)/);
        if (matches) {
          setGstNumber(matches[1]);
          setGstBusinessName(matches[2]);
        }
      }

      // 2. Fetch Payments History
      const paymentsRes = await fetch(`/api/billing/payments/${user.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData.payments || []);
      }
    } catch (err) {
      console.error("[BILLING] Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleUpdateGst = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGstSaving(true);
      setGstSuccess(false);
      const token = localStorage.getItem("bavio_token");
      
      const newDesc = `${profile.business_description || ""}\nGST: ${gstNumber} (${gstBusinessName})`;
      
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || ""}`
        },
        body: JSON.stringify({
          business_description: newDesc
        })
      });

      if (res.ok) {
        setGstSuccess(true);
        setTimeout(() => setGstSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save GST details:", err);
    } finally {
      setGstSaving(false);
    }
  };

  const handleViewInvoice = async (paymentId: number) => {
    try {
      setLoadingInvoice(true);
      setDownloadingId(paymentId);
      const token = localStorage.getItem("bavio_token");
      const res = await fetch(`/api/billing/invoice/${paymentId}`, {
        headers: { "Authorization": `Bearer ${token || ""}` }
      });

      if (!res.ok) throw new Error("Could not load invoice data");
      
      const result = await res.json();
      if (result.success && result.invoice) {
        setActiveInvoice(result.invoice);
      }
    } catch (err) {
      alert("Error loading invoice: " + err);
    } finally {
      setLoadingInvoice(false);
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-ink-muted">
        <Spinner className="w-10 h-10 text-[#FF6B00] animate-spin mb-4" />
        <span className="text-body-xs font-mono font-bold uppercase tracking-wider">Loading Ledger Account...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      
      {/* Header */}
      <div className="text-left">
        <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Billing & Ledger</h1>
        <p className="text-body-xs text-ink-tertiary mt-1">Review your compute statements, download official PDF invoices, and inspect raw transaction histories.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Invoices and Transactions */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Invoice History */}
          <div className="card-bezel">
            <div className="card-bezel-inner p-6 text-left">
              <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-4 pb-2 border-b border-line">Invoice History</h3>
              
              {payments.length === 0 ? (
                <div className="text-center py-10 text-body-xs text-ink-muted font-mono">
                  No payment invoices registered in this cycle.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-body-xs font-semibold">
                    <thead>
                      <tr className="border-b border-line/60 text-[9px] uppercase tracking-wider text-ink-muted">
                        <th className="py-3 pr-4">Invoice ID</th>
                        <th className="py-3 px-4">Billing Date</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4 text-right">Amount Paid</th>
                        <th className="py-3 pl-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((inv) => (
                        <tr key={inv.id} className="border-b border-line/45 hover:bg-surface-raised/40 transition-colors">
                          <td className="py-3.5 pr-4 font-mono font-bold text-ink">{inv.invoiceNumber || `INV-RP-${inv.id}`}</td>
                          <td className="py-3.5 px-4 text-ink-secondary">
                            {new Date(inv.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="py-3.5 px-4 uppercase text-[9px] font-mono font-black text-ink-secondary">{inv.paymentType}</td>
                          <td className="py-3.5 px-4 text-right text-ink font-mono font-bold">${inv.amount}</td>
                          <td className="py-3.5 pl-4 text-right">
                            <button
                              onClick={() => handleViewInvoice(inv.id)}
                              disabled={downloadingId !== null}
                              className="inline-flex items-center gap-1.5 text-[#FF6B00] hover:text-[#FF8C3A] text-[10px] font-bold uppercase tracking-wider transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{downloadingId === inv.id ? "Loading..." : "Invoice"}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Ledger */}
          <div className="card-bezel">
            <div className="card-bezel-inner p-6 text-left">
              <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-4 pb-2 border-b border-line">Transaction Statements</h3>
              
              {payments.length === 0 ? (
                <div className="text-center py-10 text-body-xs text-ink-muted font-mono">
                  No logged transactions.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {payments.map((tx) => (
                    <div key={tx.id} className="bg-surface border border-line/60 hover:border-saffron-border p-3.5 rounded-xl flex items-center justify-between gap-4 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-canvas border border-line flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-saffron" />
                        </div>
                        <div className="text-left overflow-hidden">
                          <span className="text-xs font-bold text-ink block leading-tight truncate">
                            {tx.paymentType === "subscription" 
                              ? `Monthly subscription (${tx.planName || "Pro"})` 
                              : `Minutes Pack Credit (+${tx.planName === "topup" ? "Topup" : tx.planName || "Add"})`}
                          </span>
                          <span className="text-[9px] text-ink-muted font-semibold mt-0.5 block">
                            {new Date(tx.date).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-bold text-[#FF6B00]">-${tx.amount}</span>
                        <span className="text-[9px] text-ink-muted block font-mono">ID: {tx.dodoPaymentId}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Payment Method and Top-up quick link */}
        <div className="flex flex-col gap-6 text-left">
          
          {/* Payment Method */}
          <div className="border border-line bg-white/80 p-6 rounded-[22px] shadow-premium">
            <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-4 pb-2 border-b border-line flex items-center gap-2">
              <CreditCard className="w-4.5 h-4.5 text-saffron" />
              <span>Primary Gateway</span>
            </h3>

            <div className="bg-[#14141A] text-white p-5 rounded-2xl shadow-md relative overflow-hidden mb-5">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6B00]/25 to-transparent pointer-events-none" />
              <div className="absolute top-2 right-2 font-display text-[9px] font-bold text-white/50 tracking-wider">DODO PAYMENTS</div>
              
              <span className="text-[9px] font-mono tracking-widest text-white/40 block mb-6">VISA / MC / AMEX SECURED</span>
              <span className="text-sm font-mono tracking-[0.2em] font-bold block mb-4">•••• •••• •••• 4021</span>
              
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[8px] text-white/40 block uppercase">Client Workspace</span>
                  <span className="text-[10px] font-bold tracking-wide truncate max-w-[130px] block">{profile?.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-white/40 block uppercase">Verify signature</span>
                  <span className="text-[10px] font-mono font-bold">SECURE</span>
                </div>
              </div>
            </div>

            {/* Auto-renew Setting */}
            <div className="flex items-center justify-between p-3.5 bg-[#FAF7F2] rounded-xl mb-4 border border-[#E5E0D8]">
              <span className="text-body-xs font-bold text-[#14141A]">Auto-Renew Subscriptions</span>
              <button
                type="button"
                onClick={() => setAutoRenew(!autoRenew)}
                className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                  autoRenew ? "bg-[#FF6B00]" : "bg-[#C8C2B8]"
                }`}
              >
                <div 
                  className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    autoRenew ? "translate-x-4" : "translate-x-0"
                  }`} 
                />
              </button>
            </div>
          </div>



          {/* Quick compute top up */}
          <div className="border border-line bg-[#FAF7F2] p-6 rounded-[22px]">
            <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-2 flex items-center gap-2">
              <Coins className="w-4.5 h-4.5 text-saffron" />
              <span>Minutes Top-Up</span>
            </h3>
            <p className="text-body-xs text-ink-tertiary mb-5 leading-relaxed font-semibold">
              Buy additional compute minutes to allow continuous call handling when quota ends.
            </p>
            <Link
              href="/workspace/topup"
              className="w-full bg-saffron hover:bg-saffron-hover text-white font-bold text-[10px] uppercase tracking-wider py-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-[0_2px_6px_rgba(255,107,0,0.15)]"
            >
              <span>Buy Minute Packages</span>
              <ArrowUpRight className="w-3.5 h-3.5" weight="bold" />
            </Link>
          </div>

        </div>

      </div>

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {activeInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E5E0D8] rounded-[24px] w-full max-w-2xl shadow-2xl relative p-8 text-left my-8"
            >
              <button
                type="button"
                onClick={() => setActiveInvoice(null)}
                className="absolute top-5 right-5 text-[#8A8A96] hover:text-[#14141A] transition-colors print:hidden"
              >
                <X className="w-5 h-5" weight="bold" />
              </button>

              {/* Printable Invoice Container */}
              <div id="printable-invoice-content" className="flex flex-col gap-6">
                
                {/* Invoice Top Header */}
                <div className="flex justify-between items-start border-b border-[#E5E0D8] pb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-[#FF6B00] text-white w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm">
                        B
                      </span>
                      <span className="font-display text-lg font-black tracking-tight text-[#14141A]">Bavio AI</span>
                    </div>
                    <span className="text-[10px] text-[#8A8A96] block leading-relaxed font-semibold">
                      billing@bavio.in &bull; www.bavio.in
                    </span>
                  </div>
                  <div className="text-right">
                    <h2 className="font-display font-black text-2xl text-[#14141A] tracking-tight uppercase">Invoice</h2>
                    <span className="text-body-xs font-mono font-bold text-[#8A8A96] mt-1 block">
                      Number: {activeInvoice.invoiceNumber}
                    </span>
                    <span className="text-body-xs text-[#8A8A96] mt-0.5 block">
                      Date: {new Date(activeInvoice.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Bill To & From Grid */}
                <div className="grid grid-cols-2 gap-6 border-b border-[#E5E0D8] pb-6 text-body-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-[#8A8A96] block mb-2">Invoice To:</span>
                    <span className="font-bold text-[#14141A] block mb-0.5">{activeInvoice.customer.name}</span>
                    <span className="text-[#5A5A66] block mb-0.5 font-semibold">{activeInvoice.customer.email}</span>
                    <span className="text-[#5A5A66] block font-semibold">{activeInvoice.customer.phone}</span>
                    {profile?.business_description?.includes("GST:") && (
                      <span className="text-[#FF6B00] font-black block mt-2">
                        GST: {profile.business_description.match(/GST:\s*([A-Z0-9]+)/)?.[1]}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-[#8A8A96] block mb-2">Billing Method:</span>
                    <span className="font-bold text-[#14141A] block mb-0.5">Dodo Payments</span>
                    <span className="text-[#8A8A96] block font-mono text-[10px]">TXN Ref: {activeInvoice.dodoPaymentId}</span>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left border-collapse text-body-xs">
                  <thead>
                    <tr className="border-b border-[#E5E0D8] text-[9px] uppercase tracking-wider text-[#8A8A96] font-bold">
                      <th className="py-2.5">Description</th>
                      <th className="py-2.5 px-4 text-center">Qty</th>
                      <th className="py-2.5 px-4 text-right">Unit Price</th>
                      <th className="py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeInvoice.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-[#E5E0D8]/45">
                        <td className="py-3 font-bold text-[#14141A]">{item.description}</td>
                        <td className="py-3 px-4 text-center font-bold text-[#5A5A66]">{item.quantity}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#5A5A66]">${item.unitPrice}</td>
                        <td className="py-3 text-right font-mono font-black text-[#14141A]">${item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Subtotals */}
                <div className="flex justify-end pt-4 border-t border-[#E5E0D8]">
                  <div className="w-64 text-body-xs font-semibold flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-[#8A8A96]">Subtotal</span>
                      <span className="font-mono text-[#14141A]">${activeInvoice.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A8A96]">Sales Tax (0%)</span>
                      <span className="font-mono text-[#14141A]">$0</span>
                    </div>
                    <div className="flex justify-between border-t border-[#E5E0D8]/65 pt-2 text-body-sm font-black">
                      <span className="text-[#FF6B00]">Total Paid</span>
                      <span className="font-mono text-[#FF6B00]">${activeInvoice.total}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-[#E5E0D8] print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-[#14141A] hover:bg-[#3A3A42] text-white text-body-xs font-bold uppercase tracking-wider py-3 px-5 rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInvoice(null)}
                  className="bg-[#FAF7F2] hover:bg-[#EBE6DD] border border-[#E5E0D8] text-[#5A5A66] text-body-xs font-bold uppercase tracking-wider py-3 px-5 rounded-xl transition-all"
                >
                  Close Invoice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
