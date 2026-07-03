import { env } from "@/env";

export class SapError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "SapError";
    this.status = status;
    this.code = code;
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
  const base = env.SAP_BASE_URL.replace(/\/?$/, "/");
  const servicePath = env.SAP_SERVICE_PATH.replace(/^\//, "").replace(/\/?$/, "/");
  return new URL(servicePath + path.replace(/^\//, ""), base).toString();
}

function authHeader(): string {
  return "Basic " + Buffer.from(`${env.SAP_USER}:${env.SAP_PASS}`).toString("base64");
}

function extractCookie(res: Response): string {
  const getSetCookie = (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const setCookie = getSetCookie ? getSetCookie.call(res.headers) : [];
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function fetchCsrfSession(): Promise<CsrfSession> {
  const res = await fetch(serviceUrl(""), {
    headers: { Authorization: authHeader(), "x-csrf-token": "fetch" },
  });
  const token = res.headers.get("x-csrf-token");
  if (!token) {
    throw new SapError(502, "CSRF_FETCH_FAILED", "Could not obtain a CSRF token from SAP");
  }
  return { token, cookie: extractCookie(res) };
}

async function getCsrfSession(): Promise<CsrfSession> {
  cachedSession ??= await fetchCsrfSession();
  return cachedSession;
}

const MODIFYING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export interface SapRequestInit {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
}

export async function sapFetch(path: string, init: SapRequestInit = {}): Promise<unknown> {
  const method = init.method ?? "GET";
  const isModifying = MODIFYING_METHODS.has(method);

  async function attempt(): Promise<Response> {
    const headers: Record<string, string> = {
      Authorization: authHeader(),
      Accept: "application/json",
    };
    if (isModifying) {
      const session = await getCsrfSession();
      headers["x-csrf-token"] = session.token;
      if (session.cookie) headers["Cookie"] = session.cookie;
      headers["Content-Type"] = "application/json";
    }
    return fetch(serviceUrl(path), {
      method,
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
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

async function normalizeError(res: Response): Promise<SapError> {
  let message = res.statusText || "SAP request failed";
  let code = String(res.status);
  try {
    const body = (await res.json()) as {
      error?: { code?: string; message?: string | { value?: string } };
    };
    if (body?.error) {
      code = body.error.code ?? code;
      message =
        typeof body.error.message === "string"
          ? body.error.message
          : (body.error.message?.value ?? message);
    }
  } catch {
    // non-JSON error body — keep the statusText fallback
  }
  return new SapError(res.status, code, message);
}
