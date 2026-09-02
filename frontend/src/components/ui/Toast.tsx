"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, ShieldWarning, Warning, Info, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info", title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => toast(message, "success", title), [toast]);
  const error = useCallback((message: string, title?: string) => toast(message, "error", title), [toast]);
  const warning = useCallback((message: string, title?: string) => toast(message, "warning", title), [toast]);
  const info = useCallback((message: string, title?: string) => toast(message, "info", title), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start gap-3 backdrop-blur-md text-xs text-left ${
                t.type === "success"
                  ? "bg-emerald-900/90 text-emerald-50 border-emerald-700/50"
                  : t.type === "error"
                  ? "bg-rose-900/90 text-rose-50 border-rose-700/50"
                  : t.type === "warning"
                  ? "bg-amber-900/90 text-amber-50 border-amber-700/50"
                  : "bg-stone-900/90 text-stone-50 border-stone-700/50"
              }`}
            >
              {t.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {t.type === "error" && <ShieldWarning className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
              {t.type === "warning" && <Warning className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
              {t.type === "info" && <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}

              <div className="flex-1">
                {t.title && <h5 className="font-bold text-xs mb-0.5">{t.title}</h5>}
                <p className="leading-relaxed font-sans opacity-95">{t.message}</p>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="opacity-70 hover:opacity-100 transition-opacity p-0.5 -mr-1"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      toast: (msg: string) => console.log("[Toast]", msg),
      success: (msg: string) => console.log("[Toast Success]", msg),
      error: (msg: string) => console.error("[Toast Error]", msg),
      warning: (msg: string) => console.warn("[Toast Warning]", msg),
      info: (msg: string) => console.log("[Toast Info]", msg),
    };
  }
  return context;
}
