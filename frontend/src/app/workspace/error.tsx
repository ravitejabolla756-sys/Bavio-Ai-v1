"use client";

import React from "react";
import { Warning, ArrowClockwise, House } from "@phosphor-icons/react";
import Link from "next/link";

export default function WorkspaceErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[WorkspaceErrorPage] Route boundary caught error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center max-w-lg mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
        <Warning className="w-7 h-7" />
      </div>

      <h2 className="font-display font-semibold text-xl text-ink mb-2">
        Workspace temporary issue
      </h2>

      <p className="text-xs text-ink-tertiary mb-6 leading-relaxed font-sans">
        Something went wrong while loading this workspace setting. Please try reloading or return to your main dashboard.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-4 py-2.5 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95"
        >
          <ArrowClockwise className="w-4 h-4" />
          Retry Request
        </button>

        <Link
          href="/workspace"
          className="flex items-center gap-2 px-4 py-2.5 border border-line bg-surface hover:bg-canvas text-ink text-xs font-semibold rounded-xl transition-all"
        >
          <House className="w-4 h-4" />
          Workspace Root
        </Link>
      </div>
    </div>
  );
}
