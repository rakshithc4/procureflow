import { useSyncExternalStore } from "react";

// Client-side view of "the proxy is serving demo data for this session".
// The proxy sets the `pf_demo` cookie and an `x-procureflow-mode` response
// header (see src/app/api/sap/[...path]/route.ts); api-client.ts feeds the
// header into markDemoMode(), and the cookie covers first paint after reload.
const COOKIE = "pf_demo";

let flagged = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function cookieFlagged(): boolean {
  return typeof document !== "undefined" && document.cookie.split("; ").includes(`${COOKIE}=1`);
}

export function markDemoMode(on: boolean) {
  if (flagged === on) return;
  flagged = on;
  notify();
}

// Drop the session flag so the next request tries the live backend again.
export function clearDemoMode() {
  document.cookie = `${COOKIE}=; Max-Age=0; Path=/`;
  flagged = false;
  notify();
}

export function useDemoMode(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => flagged || cookieFlagged(),
    () => false,
  );
}
