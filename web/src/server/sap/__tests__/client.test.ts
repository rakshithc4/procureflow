import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
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
