"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Warning, ArrowClockwise } from "@phosphor-icons/react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[DashboardErrorBoundary] Caught uncaught error:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-surface border border-line rounded-2xl p-8 my-6 shadow-sm text-center max-w-xl mx-auto flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
            <Warning className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-ink">
              {this.props.fallbackTitle || "Unable to load this section"}
            </h3>
            <p className="text-xs text-ink-tertiary mt-1 max-w-md font-sans leading-relaxed">
              {this.props.fallbackMessage || "Something went wrong while retrieving your workspace data."}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95"
          >
            <ArrowClockwise className="w-4 h-4" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
