// Starts the MSW mock SAP server inside the Next.js server process when
// MOCK_SAP=1 (used by `pnpm e2e` — see playwright.config.ts webServer.env).
// Standard Next.js instrumentation hook: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.MOCK_SAP === "1") {
    const { server } = await import("@/mocks/node");
    server.listen({ onUnhandledRequest: "bypass" });
  }
}
