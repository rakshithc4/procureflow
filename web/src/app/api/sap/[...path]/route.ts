import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sapFetch, SapError } from "@/server/sap/client";
import { demoFetch } from "@/server/sap/demo";

// This is the ONLY place SAP is called from — no component fetches SAP directly.
const ALLOWLIST = /^(PurchaseRequisition|PurchaseOrder|\$metadata)(\(|\/|\?|$)/;

function toSapPath(segments: string[], search: string): string {
  const path = segments.join("/");
  return search ? `${path}${search}` : path;
}

type Method = "GET" | "POST" | "PATCH";
type Mode = "live" | "demo";

// When SAP is unreachable the session is flagged with this cookie and served
// from the in-memory demo store until it expires (then SAP is tried again).
// Not httpOnly on purpose: the UI reads it to show the "demo data" banner.
const DEMO_COOKIE = "pf_demo";
const DEMO_TTL_SECONDS = 15 * 60;

function respond(res: NextResponse, mode: Mode, flagSession: boolean): NextResponse {
  res.headers.set("x-procureflow-mode", mode);
  if (flagSession) {
    res.cookies.set(DEMO_COOKIE, "1", {
      path: "/",
      maxAge: DEMO_TTL_SECONDS,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return res;
}

async function handle(req: NextRequest, path: string[], method: Method) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { status: 401, code: "UNAUTHENTICATED", message: "Sign in required" },
      { status: 401 },
    );
  }

  if (!ALLOWLIST.test(path.join("/"))) {
    return NextResponse.json(
      { status: 403, code: "FORBIDDEN_PATH", message: "This SAP path is not allowed" },
      { status: 403 },
    );
  }

  const sapPath = toSapPath(path, req.nextUrl.search);
  const body = method === "GET" ? undefined : await req.json().catch(() => undefined);
  const alreadyDemo = req.cookies.get(DEMO_COOKIE)?.value === "1";
  let mode: Mode = alreadyDemo ? "demo" : "live";

  try {
    let data: unknown;
    if (mode === "live") {
      try {
        data = await sapFetch(sapPath, { method, body });
      } catch (err) {
        // Backend asleep/unreachable/misconfigured: serve demo data instead of
        // an error. Business errors from a healthy SAP still pass through.
        if (err instanceof SapError && err.unavailable) mode = "demo";
        else throw err;
      }
    }
    if (mode === "demo") data = await demoFetch(sapPath, { method, body });
    return respond(NextResponse.json(data ?? {}), mode, mode === "demo" && !alreadyDemo);
  } catch (err) {
    if (err instanceof SapError) {
      return respond(
        NextResponse.json({ status: err.status, code: err.code, message: err.message }, { status: err.status }),
        mode,
        false,
      );
    }
    return respond(
      NextResponse.json(
        { status: 502, code: "UPSTREAM_ERROR", message: "Unexpected error contacting SAP" },
        { status: 502 },
      ),
      mode,
      false,
    );
  }
}

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return handle(req, path, "GET");
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return handle(req, path, "POST");
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return handle(req, path, "PATCH");
}
