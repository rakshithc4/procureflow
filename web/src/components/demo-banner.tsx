"use client";

import { useQueryClient } from "@tanstack/react-query";
import { clearDemoMode, useDemoMode } from "@/lib/demo-mode";

// Shown whenever the proxy had to fall back to demo data because the SAP
// trial system is asleep (they hibernate nightly) or gone.
export function DemoBanner() {
  const demo = useDemoMode();
  const queryClient = useQueryClient();
  if (!demo) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-chart-3/30 bg-chart-3/10 px-6 py-1.5 text-center text-xs text-chart-3"
    >
      <span>SAP backend asleep (trial system) — showing demo data.</span>
      <button
        type="button"
        onClick={() => {
          clearDemoMode();
          queryClient.invalidateQueries();
        }}
        className="font-medium underline underline-offset-2 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chart-3"
      >
        Retry live backend
      </button>
    </div>
  );
}
