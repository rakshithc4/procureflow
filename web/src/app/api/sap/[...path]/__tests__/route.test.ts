import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
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
