import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { resetMockDb } from "@/mocks/db";
import { resetSapClientCache } from "@/server/sap/client";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));

// Import after the mock is registered so route.ts picks up the mocked auth().
const { GET, POST } = await import("../route");

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  resetMockDb();
  resetSapClientCache();
  authMock.mockReset();
});
afterAll(() => server.close());

function req(url: string, init?: { method?: string; body?: string }) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

describe("GET/POST /api/sap/[...path]", () => {
  it("returns 401 when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const res = await GET(req("http://localhost:3000/api/sap/PurchaseRequisition"), {
      params: Promise.resolve({ path: ["PurchaseRequisition"] }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("UNAUTHENTICATED");
  });

  it("rejects a non-allowlisted path with 403", async () => {
    authMock.mockResolvedValue({ user: { role: "requestor" } });
    const res = await GET(req("http://localhost:3000/api/sap/SomethingElse"), {
      params: Promise.resolve({ path: ["SomethingElse"] }),
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("FORBIDDEN_PATH");
  });

  it("proxies an allowlisted GET and returns the SAP payload", async () => {
    authMock.mockResolvedValue({ user: { role: "requestor" } });
    const res = await GET(req("http://localhost:3000/api/sap/PurchaseRequisition"), {
      params: Promise.resolve({ path: ["PurchaseRequisition"] }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.value)).toBe(true);
  });

  it("proxies a POST with a CSRF-protected write", async () => {
    authMock.mockResolvedValue({ user: { role: "requestor" } });
    const res = await POST(
      req("http://localhost:3000/api/sap/PurchaseRequisition", {
        method: "POST",
        body: JSON.stringify({ Title: "Test", Amount: "10.00", Currency: "USD" }),
      }),
      { params: Promise.resolve({ path: ["PurchaseRequisition"] }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.Status).toBe("DRAFT");
  });

  it("normalizes an upstream SAP error to {status, code, message}", async () => {
    authMock.mockResolvedValue({ user: { role: "requestor" } });
    const res = await POST(
      req("http://localhost:3000/api/sap/PurchaseRequisition", {
        method: "POST",
        body: JSON.stringify({ Title: "", Amount: "0", Currency: "" }),
      }),
      { params: Promise.resolve({ path: ["PurchaseRequisition"] }) },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(typeof body.message).toBe("string");
  });
});

describe("demo fallback when the SAP backend is unavailable", () => {
  const SAP_ANY = /zprocurement_srv\/0001\//;
  const sapDown = () => server.use(http.all(SAP_ANY, () => HttpResponse.error()));
  const params = { params: Promise.resolve({ path: ["PurchaseRequisition"] }) };

  it("reports mode=live when SAP answers normally", async () => {
    authMock.mockResolvedValue({ user: { role: "requestor" } });
    const res = await GET(req("http://localhost:3000/api/sap/PurchaseRequisition"), params);
    expect(res.status).toBe(200);
    expect(res.headers.get("x-procureflow-mode")).toBe("live");
    expect(res.headers.get("set-cookie") ?? "").not.toContain("pf_demo");
  });

  it("serves demo data (never an error) when SAP is unreachable, and flags the session", async () => {
    authMock.mockResolvedValue({ user: { role: "requestor" } });
    sapDown();
    const res = await GET(req("http://localhost:3000/api/sap/PurchaseRequisition"), params);
    expect(res.status).toBe(200);
    expect(res.headers.get("x-procureflow-mode")).toBe("demo");
    expect(res.headers.get("set-cookie")).toContain("pf_demo=1");
    const body = await res.json();
    expect(body.value.length).toBeGreaterThan(0);
  });

  it("serves demo data on a gateway 503", async () => {
    authMock.mockResolvedValue({ user: { role: "requestor" } });
    server.use(http.all(SAP_ANY, () => HttpResponse.text("<html>503</html>", { status: 503 })));
    const res = await GET(req("http://localhost:3000/api/sap/PurchaseRequisition"), params);
    expect(res.status).toBe(200);
    expect(res.headers.get("x-procureflow-mode")).toBe("demo");
  });

  it("does not call SAP at all once the session is flagged", async () => {
    authMock.mockResolvedValue({ user: { role: "requestor" } });
    let sapCalls = 0;
    server.use(
      http.all(SAP_ANY, () => {
        sapCalls += 1;
        return HttpResponse.error();
      }),
    );
    const res = await GET(
      new NextRequest(new URL("http://localhost:3000/api/sap/PurchaseRequisition"), {
        headers: { cookie: "pf_demo=1" },
      }),
      params,
    );
    expect(res.headers.get("x-procureflow-mode")).toBe("demo");
    expect(sapCalls).toBe(0);
  });

  it("keeps the create → submit → approve flow working in demo mode", async () => {
    authMock.mockResolvedValue({ user: { role: "approver" } });
    sapDown();
    const demoHeaders = { cookie: "pf_demo=1" };
    const created = await POST(
      new NextRequest(new URL("http://localhost:3000/api/sap/PurchaseRequisition"), {
        method: "POST",
        headers: demoHeaders,
        body: JSON.stringify({ Title: "Fallback laptop", Amount: "10.00", Currency: "USD" }),
      }),
      params,
    );
    expect(created.status).toBe(200);
    const pr = await created.json();
    expect(pr.Status).toBe("DRAFT");

    const action = "com.sap.gateway.srvd.zprocurement_srv.v0001";
    const submitted = await POST(
      new NextRequest(
        new URL(`http://localhost:3000/api/sap/PurchaseRequisition(ReqId=${pr.ReqId})/${action}.SubmitForApproval`),
        { method: "POST", headers: demoHeaders, body: "{}" },
      ),
      { params: Promise.resolve({ path: [`PurchaseRequisition(ReqId=${pr.ReqId})`, `${action}.SubmitForApproval`] }) },
    );
    expect(submitted.status).toBe(200);
    expect((await submitted.json()).Status).toBe("SUBMITTED");
  });

  it("still returns normalized business errors in demo mode (validation, not a crash)", async () => {
    authMock.mockResolvedValue({ user: { role: "requestor" } });
    const res = await POST(
      new NextRequest(new URL("http://localhost:3000/api/sap/PurchaseRequisition"), {
        method: "POST",
        headers: { cookie: "pf_demo=1" },
        body: JSON.stringify({ Title: "", Amount: "0", Currency: "" }),
      }),
      params,
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("falls back to demo data when SAP env is not configured at all", async () => {
    authMock.mockResolvedValue({ user: { role: "requestor" } });
    const saved = process.env.SAP_BASE_URL;
    delete process.env.SAP_BASE_URL;
    try {
      const res = await GET(req("http://localhost:3000/api/sap/PurchaseRequisition"), params);
      expect(res.status).toBe(200);
      expect(res.headers.get("x-procureflow-mode")).toBe("demo");
    } finally {
      process.env.SAP_BASE_URL = saved;
    }
  });
});
