"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  CreditCard, 
  Bank, 
  Wallet, 
  Check, 
  Spinner, 
  Warning, 
  ShieldCheck, 
  ArrowRight,
  DeviceMobile,
  Buildings,
} from "@phosphor-icons/react";

interface RazorpayCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number; // base amount
  planName?: string;
  topupMinutes?: number;
  onSuccess: (invoiceNumber: string) => void;
}

export default function RazorpayCheckout({
  isOpen,
  onClose,
  amount,
  planName,
  topupMinutes,
  onSuccess,
}: RazorpayCheckoutProps) {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Checkout UI step: "select_method" | "processing" | "otp_verify" | "success"
  const [paymentStep, setPaymentStep] = useState<"select_method" | "processing" | "otp_verify" | "success">("select_method");
  const [selectedMethod, setSelectedMethod] = useState<"card" | "upi" | "netbanking">("card");
  
  // Card inputs
  const [cardNumber, setCardNumber] = useState("4319 8000 1200 4021");
  const [cardExpiry, setCardExpiry] = useState("12/29");
  const [cardCvv, setCardCvv] = useState("123");
  
  // UPI inputs
  const [upiId, setUpiId] = useState("operations@okaxis");

  // GST inputs
  const [includeGst, setIncludeGst] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [gstBusinessName, setGstBusinessName] = useState("");

  // OTP Verification
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);

  // Billing math
  const gstAmount = Math.round(amount * 0.18);
  const totalAmount = amount + gstAmount;

  // Fetch Order ID from backend
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setPaymentStep("select_method");
      setOrderId(null);
      setOtpCode("");
      setOtpError(null);
      
      const createOrder = async () => {
        try {
          setLoadingOrder(true);
          const token = localStorage.getItem("bavio_token");
          const res = await fetch("/api/billing/razorpay/create-order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token || ""}`,
            },
            body: JSON.stringify({
              planName,
              topupMinutes,
              amount: totalAmount,
            }),
          });

          if (!res.ok) {
            throw new Error("Could not create Razorpay payment order.");
          }

          const result = await res.json();
          if (result.success) {
            setOrderId(result.id);
          } else {
            throw new Error(result.error || "Order creation failed.");
          }
        } catch (err: any) {
          console.error("[RAZORPAY] Create Order Error:", err);
          setErrorMsg(err.message || "Failed to initialize secure checkout window.");
        } finally {
          setLoadingOrder(false);
        }
      };

      createOrder();
    }
  }, [isOpen, amount, planName, topupMinutes, totalAmount]);

  const handlePayNow = () => {
    // Basic validation
    if (selectedMethod === "card") {
      if (!cardNumber || !cardExpiry || !cardCvv) {
        setErrorMsg("Please fill in card details.");
        return;
      }
    } else if (selectedMethod === "upi") {
      if (!upiId || !upiId.includes("@")) {
        setErrorMsg("Please enter a valid UPI VPA ID.");
        return;
      }
    }
    
    setErrorMsg(null);
    setPaymentStep("processing");
    
    // Simulate transaction processing & trigger OTP
    setTimeout(() => {
      setPaymentStep("otp_verify");
    }, 1800);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    if (otpCode.length !== 6) {
      setOtpError("OTP code must be a 6-digit number.");
      return;
    }

    try {
      setPaymentStep("processing");
      const token = localStorage.getItem("bavio_token");
      const mockPayId = "pay_" + Math.random().toString(36).substring(2, 12);
      const mockSig = "sig_" + Math.random().toString(36).substring(2, 14);

      const res = await fetch("/api/billing/razorpay/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: mockPayId,
          razorpay_signature: mockSig,
          planName,
          topupMinutes,
          amount: totalAmount,
          gstNumber: includeGst ? gstNumber : undefined,
          gstBusinessName: includeGst ? gstBusinessName : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Razorpay signature validation failed.");
      }

      const result = await res.json();
      if (result.success) {
        setPaymentStep("success");
        setTimeout(() => {
          onSuccess(result.invoiceNumber);
          onClose();
          // Dispatch custom event to notify parent elements to reload
          window.dispatchEvent(new Event("bavio_payment_success"));
        }, 1500);
      } else {
        throw new Error(result.error || "Payment verification failed.");
      }
    } catch (err: any) {
      console.error("[RAZORPAY] Verification Error:", err);
      setOtpError(err.message || "Failed to verify transaction signature.");
      setPaymentStep("otp_verify");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="bg-white border border-[#E5E0D8] rounded-[24px] w-full max-w-[480px] shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]"
        >
          {/* Header */}
          <div className="bg-[#14141D] text-white p-5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="bg-[#FF6B00] text-white w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                R
              </span>
              <div>
                <h3 className="text-body-sm font-bold leading-none">Razorpay Secure Checkout</h3>
                <span className="text-[10px] text-white/50 font-mono mt-0.5 block">
                  Order ID: {orderId || "Generating secured token..."}
                </span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
              disabled={paymentStep === "processing"}
            >
              <X className="w-5 h-5" weight="bold" />
            </button>
          </div>

          {/* Loader Overlay */}
          {loadingOrder && (
            <div className="flex-grow flex flex-col items-center justify-center p-6 text-[#8A8A96]">
              <Spinner className="w-10 h-10 text-[#FF6B00] animate-spin mb-4" />
              <span className="text-body-xs font-mono font-bold uppercase tracking-wider">Generating payment receipt...</span>
            </div>
          )}

          {!loadingOrder && (
            <div className="flex-grow flex flex-col p-6 text-left">
              {/* Payment Details HUD */}
              {paymentStep !== "success" && (
                <div className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl p-4 mb-5 flex justify-between items-center text-body-xs">
                  <div>
                    <span className="font-bold text-[#14141A]">
                      {planName ? `${planName.toUpperCase()} Subscription` : `${topupMinutes} Minutes Pack`}
                    </span>
                    <span className="text-[#8A8A96] block text-[10px] mt-0.5">
                      Base: ₹{amount} + 18% GST (₹{gstAmount})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-body-sm text-[#FF6B00]">₹{totalAmount}</span>
                    <span className="text-[9px] text-[#8A8A96] block uppercase tracking-wider font-bold">Total Payable</span>
                  </div>
                </div>
              )}

              {/* Steps Viewport */}
              {paymentStep === "select_method" && (
                <div className="flex-grow flex flex-col justify-between">
                  <div className="flex flex-col gap-4">
                    {/* Method Selector Tabs */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "card", label: "Card", icon: CreditCard },
                        { id: "upi", label: "UPI", icon: DeviceMobile },
                        { id: "netbanking", label: "Bank", icon: Bank },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isSel = selectedMethod === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSelectedMethod(tab.id as any)}
                            className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all text-body-xs font-bold ${
                              isSel 
                                ? "bg-[#FF6B00]/5 border-[#FF6B00] text-[#FF6B00]" 
                                : "bg-[#FAF7F2] border-[#E5E0D8] text-[#5A5A66] hover:bg-white"
                            }`}
                          >
                            <Icon className="w-4.5 h-4.5" />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Method Details inputs */}
                    <div className="border border-[#E5E0D8] p-4 rounded-2xl flex flex-col gap-3.5 bg-white">
                      {selectedMethod === "card" && (
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] uppercase font-bold text-[#8A8A96]">Card Number</label>
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              className="w-full bg-[#FAF7F2] border border-[#E5E0D8] rounded-lg py-2 px-3 text-body-xs font-bold font-mono outline-none text-[#14141A]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold text-[#8A8A96]">Expiry Date</label>
                              <input
                                type="text"
                                placeholder="MM/YY"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                className="w-full bg-[#FAF7F2] border border-[#E5E0D8] rounded-lg py-2 px-3 text-body-xs font-bold font-mono outline-none text-[#14141A]"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold text-[#8A8A96]">CVV / CVC</label>
                              <input
                                type="password"
                                placeholder="•••"
                                maxLength={3}
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value)}
                                className="w-full bg-[#FAF7F2] border border-[#E5E0D8] rounded-lg py-2 px-3 text-body-xs font-bold font-mono outline-none text-[#14141A]"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedMethod === "upi" && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-[#8A8A96]">UPI ID / VPA</label>
                          <input
                            type="text"
                            placeholder="username@bank"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="w-full bg-[#FAF7F2] border border-[#E5E0D8] rounded-lg py-2 px-3 text-body-xs font-bold font-mono outline-none text-[#14141A]"
                          />
                          <span className="text-[9px] text-[#8A8A96] mt-1">
                            A simulated payment request will be sent to this handle.
                          </span>
                        </div>
                      )}

                      {selectedMethod === "netbanking" && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold text-[#8A8A96]">Select Bank</label>
                          <select className="w-full bg-[#FAF7F2] border border-[#E5E0D8] rounded-lg py-2 px-3 text-body-xs font-bold outline-none text-[#14141A] cursor-pointer">
                            <option>HDFC Bank</option>
                            <option>ICICI Bank</option>
                            <option>State Bank of India</option>
                            <option>Axis Bank</option>
                            <option>Kotak Mahindra Bank</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* GST Section */}
                    <div className="border border-[#E5E0D8]/80 p-3.5 rounded-2xl bg-[#FAF7F2]/40">
                      <div 
                        className="flex items-center gap-2.5 cursor-pointer select-none"
                        onClick={() => setIncludeGst(!includeGst)}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                          includeGst ? "bg-[#FF6B00] border-[#FF6B00] text-white" : "border-[#C8C2B8] bg-white"
                        }`}>
                          {includeGst && <Check className="w-3 h-3" weight="bold" />}
                        </div>
                        <span className="text-body-xs font-bold text-[#14141A] flex items-center gap-1.5">
                          <Buildings className="w-3.5 h-3.5 text-[#8A8A96]" />
                          Add GST Registration Number
                        </span>
                      </div>
                      
                      {includeGst && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="flex flex-col gap-2.5 mt-3 pt-3 border-t border-[#E5E0D8] text-body-xs"
                        >
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] uppercase font-bold text-[#8A8A96]">GSTIN (15 Digits)</label>
                            <input
                              type="text"
                              maxLength={15}
                              placeholder="29AAAAA1111A1Z1"
                              value={gstNumber}
                              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                              className="w-full bg-white border border-[#E5E0D8] rounded-lg py-1.5 px-3 font-mono font-bold text-[#14141A]"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] uppercase font-bold text-[#8A8A96]">GST Business Name</label>
                            <input
                              type="text"
                              placeholder="Acme Realty Private Limited"
                              value={gstBusinessName}
                              onChange={(e) => setGstBusinessName(e.target.value)}
                              className="w-full bg-white border border-[#E5E0D8] rounded-lg py-1.5 px-3 font-semibold text-[#14141A]"
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="text-[11px] font-bold text-state-error mt-3">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handlePayNow}
                    className="w-full bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-[0_4px_16px_rgba(255,107,0,0.2)] mt-5 flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Pay ₹{totalAmount}</span>
                    <ArrowRight className="w-4 h-4" weight="bold" />
                  </button>
                </div>
              )}

              {paymentStep === "processing" && (
                <div className="flex-grow flex flex-col items-center justify-center py-10 text-[#8A8A96]">
                  <Spinner className="w-10 h-10 text-[#FF6B00] animate-spin mb-4" />
                  <span className="text-body-xs font-mono font-bold uppercase tracking-wider">Securing authorization bridge...</span>
                </div>
              )}

              {paymentStep === "otp_verify" && (
                <form onSubmit={handleVerifyOtp} className="flex-grow flex flex-col justify-between">
                  <div className="flex flex-col gap-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-saffron/10 text-saffron flex items-center justify-center mx-auto mb-2 border border-saffron/20">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    
                    <h4 className="text-body-md font-bold text-[#14141A]">Enter 3D-Secure OTP</h4>
                    <p className="text-body-xs text-[#5A5A66] max-w-sm mx-auto leading-relaxed">
                      A simulated 6-digit transaction confirmation passcode has been sent to your linked banking device. Enter it below.
                    </p>

                    <div className="relative w-44 mx-auto mt-2">
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                        className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 px-4 text-center text-body-lg font-mono font-black tracking-[0.4em] outline-none text-[#14141A]"
                      />
                    </div>
                    
                    <span className="text-[10px] text-[#8A8A96]">
                      Enter any 6 digits (e.g. <span className="font-bold">123456</span>) to authorize.
                    </span>

                    {otpError && (
                      <div className="text-body-xs font-bold text-state-error mt-2">
                        {otpError}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#14141A] hover:bg-[#3A3A42] text-white text-body-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all mt-6"
                  >
                    Authorize Payment
                  </button>
                </form>
              )}

              {paymentStep === "success" && (
                <div className="flex-grow flex flex-col items-center justify-center py-10 text-center animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#10B981] flex items-center justify-center mb-5 shadow-[0_4px_20px_rgba(16,185,129,0.12)]">
                    <Check className="w-7 h-7" weight="bold" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#14141A] mb-1">Payment Successful</h3>
                  <p className="text-body-xs text-[#5A5A66] leading-relaxed max-w-xs mx-auto">
                    Your balance has been updated and the subscription settings applied. Returning to dashboard...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer security tag */}
          {paymentStep !== "success" && (
            <div className="bg-[#FAF7F2] border-t border-[#E5E0D8] p-3 text-center text-[10px] font-semibold text-[#8A8A96] flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-[#10B981]" weight="fill" />
              <span>PCI-DSS Compliant &bull; 256-bit SSL encrypted connection</span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
