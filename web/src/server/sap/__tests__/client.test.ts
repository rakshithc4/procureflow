import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { delay, http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { resetMockDb } from "@/mocks/db";
import { resetSapClientCache, sapFetch, SapError } from "../client";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  resetMockDb();
  resetSapClientCache();
});
afterAll(() => server.close());

describe("sapFetch", () => {
  it("performs a plain GET without fetching a CSRF token", async () => {
    const result = (await sapFetch("PurchaseRequisition")) as { value: unknown[] };
    expect(result.value.length).toBeGreaterThan(0);
  });

  it("fetches a CSRF token and replays cookies for a modifying request", async () => {
    const created = (await sapFetch("PurchaseRequisition", {
      method: "POST",
      body: { Title: "Laptops", Amount: "10.00", Currency: "USD" },
    })) as { Title: string; Status: string };
    expect(created).toMatchObject({ Title: "Laptops", Status: "DRAFT" });
  });

  it("caches the CSRF session across multiple modifying requests", async () => {
    let csrfFetchCount = 0;
    const listener = ({ request }: { request: Request }) => {
      if (request.headers.get("x-csrf-token") === "fetch") csrfFetchCount += 1;
    };
    server.events.on("request:start", listener);

    await sapFetch("PurchaseRequisition", {
      method: "POST",
      body: { Title: "A", Amount: "1.00", Currency: "USD" },
    });
    await sapFetch("PurchaseRequisition", {
      method: "POST",
      body: { Title: "B", Amount: "1.00", Currency: "USD" },
    });

    server.events.removeListener("request:start", listener);
    expect(csrfFetchCount).toBe(1);
  });

  it("normalizes an upstream OData error into {status, code, message}", async () => {
    await expect(
      sapFetch("PurchaseRequisition", {
        method: "POST",
        body: { Title: "", Amount: "0", Currency: "" },
      }),
    ).rejects.toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
  });

  it("throws a SapError instance on failure", async () => {
    try {
      await sapFetch("PurchaseRequisition", { method: "POST", body: { Title: "", Amount: "0", Currency: "" } });
      throw new Error("expected sapFetch to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(SapError);
    }
  });
});

describe("sapFetch availability classification", () => {
  const SAP = /zprocurement_srv\/0001\/PurchaseRequisition/;

  afterEach(() => {
    delete process.env.SAP_TIMEOUT_MS;
  });

  it("flags a network failure as unavailable", async () => {
    server.use(http.get(SAP, () => HttpResponse.error()));
    await expect(sapFetch("PurchaseRequisition")).rejects.toMatchObject({
      unavailable: true,
      code: "SAP_UNREACHABLE",
    });
  });

  it("flags a gateway 503 with a non-OData body as unavailable", async () => {
    server.use(http.get(SAP, () => HttpResponse.text("<html>Service Unavailable</html>", { status: 503 })));
    await expect(sapFetch("PurchaseRequisition")).rejects.toMatchObject({ status: 503, unavailable: true });
  });

  it("flags a non-OData error body (e.g. a 404 from a stopped system) as unavailable", async () => {
    server.use(http.get(SAP, () => HttpResponse.text("Not Found", { status: 404 })));
    await expect(sapFetch("PurchaseRequisition")).rejects.toMatchObject({ unavailable: true });
  });

  it("flags a timeout as unavailable", async () => {
    process.env.SAP_TIMEOUT_MS = "50";
    server.use(
      http.get(SAP, async () => {
        await delay("infinite");
        return HttpResponse.json({});
      }),
    );
    await expect(sapFetch("PurchaseRequisition")).rejects.toMatchObject({
      unavailable: true,
      code: "SAP_TIMEOUT",
    });
  });

  it("does NOT flag an OData business error as unavailable", async () => {
    await expect(
      sapFetch("PurchaseRequisition", { method: "POST", body: { Title: "", Amount: "0", Currency: "" } }),
    ).rejects.toMatchObject({ status: 400, unavailable: false });
  });

  it("does NOT flag an OData 404 (entity not found) as unavailable", async () => {
    await expect(sapFetch("PurchaseRequisition(ReqId=does-not-exist)")).rejects.toMatchObject({
      status: 404,
      unavailable: false,
    });
  });
});
