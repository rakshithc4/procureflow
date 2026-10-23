import { getEnv } from "@/env";
// Hosted mock mode: the Next.js instrumentation hook doesn't reliably run on
// Vercel, so start the MSW mock SAP server lazily on first use instead.
let mockStart: Promise<void> | null = null;
function ensureMockServer(): Promise<void> {
  if (process.env.MOCK_SAP !== "1") return Promise.resolve();
  mockStart ??= import("@/mocks/node").then(({ server }) => {
    server.listen({ onUnhandledRequest: "bypass" });
    console.log("[sap-client] mock SAP server started");
  });
  return mockStart;
}

export class SapError extends Error {
  status: number;
  code: string;
  // True when the backend itself is unreachable/asleep/misconfigured (network
  // failure, timeout, gateway 5xx, or a non-OData error body) as opposed to
  // SAP answering with a business error. The proxy falls back to demo data
  // for these only.
  unavailable: boolean;

  constructor(status: number, code: string, message: string, unavailable = false) {
    super(message);
    this.name = "SapError";
    this.status = status;
    this.code = code;
    this.unavailable = unavailable;
  }
}

const DEFAULT_TIMEOUT_MS = 6000;

// One deadline for the whole call (CSRF fetch + request), so a hung trial
// system can't outlive a serverless function's time limit.
function timeoutMs(): number {
  const n = Number(process.env.SAP_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS;
}

function loadEnv() {
  try {
    return getEnv();
  } catch {
    throw new SapError(503, "SAP_NOT_CONFIGURED", "SAP backend is not configured", true);
  }
}

interface CsrfSession {
  token: string;
  cookie: string;
}

// One shared technical communication user for the whole app (PRD §3) —
// a single module-level cache, not per NextAuth session.
let cachedSession: CsrfSession | null = null;

export function resetSapClientCache() {
  cachedSession = null;
}

function serviceUrl(path: string): string {
  const env = loadEnv();
  const base = env.SAP_BASE_URL.replace(/\/?$/, "/");
  const servicePath = env.SAP_SERVICE_PATH.replace(/^\//, "").replace(/\/?$/, "/");
  return new URL(servicePath + path.replace(/^\//, ""), base).toString();
}

function authHeader(): string {
  const env = loadEnv();
  return "Basic " + Buffer.from(`${env.SAP_USER}:${env.SAP_PASS}`).toString("base64");
}

function extractCookie(res: Response): string {
  const getSetCookie = (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const setCookie = getSetCookie ? getSetCookie.call(res.headers) : [];
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function fetchCsrfSession(signal: AbortSignal): Promise<CsrfSession> {
  const res = await fetch(serviceUrl(""), {
    headers: { Authorization: authHeader(), "x-csrf-token": "fetch" },
    signal,
  });
  const token = res.headers.get("x-csrf-token");
  if (!token) {
    throw new SapError(502, "CSRF_FETCH_FAILED", "Could not obtain a CSRF token from SAP", true);
  }
  return { token, cookie: extractCookie(res) };
}

async function getCsrfSession(signal: AbortSignal): Promise<CsrfSession> {
  cachedSession ??= await fetchCsrfSession(signal);
  return cachedSession;
}

const MODIFYING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export interface SapRequestInit {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
}

export async function sapFetch(path: string, init: SapRequestInit = {}): Promise<unknown> {
  try {
    return await sapFetchOnce(path, init);
  } catch (err) {
    if (err instanceof SapError) throw err;
    // Anything else here came from fetch/abort/body parsing: the backend is
    // unreachable, too slow, or answered with something that isn't OData.
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    throw new SapError(
      timedOut ? 504 : 503,
      timedOut ? "SAP_TIMEOUT" : "SAP_UNREACHABLE",
      timedOut ? "SAP did not respond in time" : "Could not reach SAP",
      true,
    );
  }
}

async function sapFetchOnce(path: string, init: SapRequestInit): Promise<unknown> {
  await ensureMockServer();
  const method = init.method ?? "GET";
  const isModifying = MODIFYING_METHODS.has(method);
  const signal = AbortSignal.timeout(timeoutMs());

  async function attempt(): Promise<Response> {
    const headers: Record<string, string> = {
      Authorization: authHeader(),
      Accept: "application/json",
    };
    if (isModifying) {
      const session = await getCsrfSession(signal);
      headers["x-csrf-token"] = session.token;
      if (session.cookie) headers["Cookie"] = session.cookie;
      headers["Content-Type"] = "application/json";
    }
    return fetch(serviceUrl(path), {
      method,
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal,
    });
  }

  let res = await attempt();

  // Session/CSRF token expired mid-run: refetch once and retry.
  if (isModifying && res.status === 403 && res.headers.get("x-csrf-token") === "Required") {
    resetSapClientCache();
    res = await attempt();
  }

  if (!res.ok) {
    throw await normalizeError(res);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function normalizeError(res: Response): Promise<SapError> {
  let message = res.statusText || "SAP request failed";
  let code = String(res.status);
  let hasODataError = false;
  try {
    const body = (await res.json()) as {
      error?: { code?: string; message?: string | { value?: string } };
    };
    if (body?.error) {
      hasODataError = true;
      code = body.error.code ?? code;
      message =
        typeof body.error.message === "string"
          ? body.error.message
          : (body.error.message?.value ?? message);
    }
  } catch {
    // non-JSON error body — keep the statusText fallback
  }
  // Gateway-class statuses, or any failure without an OData error envelope
  // (HTML from a stopped system's router, wrong creds on the edge, ...), mean
  // the backend isn't really answering — not a business error.
  const unavailable = [502, 503, 504].includes(res.status) || !hasODataError;
  return new SapError(res.status, code, message, unavailable);
}
