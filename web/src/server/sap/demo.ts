import { getResponse } from "msw";
import { handlers } from "@/mocks/handlers";
import { normalizeError, SapError, type SapRequestInit } from "./client";

// Demo mode: answers SAP requests from the in-memory MSW fixture store
// (src/mocks/) when the real backend is asleep or gone. The handlers are
// invoked directly via getResponse() instead of patching global fetch, so it
// applies per request (the proxy decides per session) and never touches real
// SAP traffic. The host below is never contacted — it only has to contain the
// service path segment the handlers match on.
const DEMO_SERVICE_URL =
  "https://demo.invalid/sap/opu/odata4/sap/zui_procurement_o4/srvd/sap/zprocurement_srv/0001/";

export async function demoFetch(path: string, init: SapRequestInit = {}): Promise<unknown> {
  const request = new Request(new URL(path.replace(/^\//, ""), DEMO_SERVICE_URL), {
    method: init.method ?? "GET",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  const res = await getResponse(handlers, request);
  if (!res) throw new SapError(404, "NOT_FOUND", "Not found");
  if (!res.ok) throw await normalizeError(res);
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
