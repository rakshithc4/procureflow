import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sapFetch, SapError } from "@/server/sap/client";

// This is the ONLY place SAP is called from — no component fetches SAP directly.
const ALLOWLIST = /^(PurchaseRequisition|PurchaseOrder|\$metadata)(\(|\/|\?|$)/;

function toSapPath(segments: string[], search: string): string {
  const path = segments.join("/");
  return search ? `${path}${search}` : path;
}

type Method = "GET" | "POST" | "PATCH";

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

  try {
    const body = method === "GET" ? undefined : await req.json().catch(() => undefined);
    const data = await sapFetch(toSapPath(path, req.nextUrl.search), { method, body });
    return NextResponse.json(data ?? {});
  } catch (err) {
    if (err instanceof SapError) {
      return NextResponse.json({ status: err.status, code: err.code, message: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { status: 502, code: "UPSTREAM_ERROR", message: "Unexpected error contacting SAP" },
      { status: 502 },
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
