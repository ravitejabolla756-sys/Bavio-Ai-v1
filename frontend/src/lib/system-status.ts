"use client";

import { useEffect, useState } from "react";

export type SystemStatus = "Operational" | "Degraded" | "Unavailable" | "Checking";

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus>("Checking");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    fetch("/api/health", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        setStatus(response.ok && payload?.status === "ok" ? "Operational" : "Degraded");
      })
      .catch(() => setStatus("Unavailable"))
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return status;
}
