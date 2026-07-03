import { describe, expect, it } from "vitest";
import {
  STATUSES,
  ROLES,
  allowedActions,
  canPerform,
  statusIntent,
  createRequisitionSchema,
  rejectDecisionSchema,
  createPoInputSchema,
  listQuery,
  readQuery,
  type Status,
  type Role,
} from "@/lib/pr";

// Full role × status × hasOrder truth table — every branch in allowedActions
// must be hit exactly once by this matrix.
const EXPECTED: Record<Role, Record<Status, { noOrder: string[]; withOrder: string[] }>> = {
  requestor: {
    DRAFT: { noOrder: ["edit", "delete", "submit"], withOrder: ["edit", "delete", "submit"] },
    SUBMITTED: { noOrder: [], withOrder: [] },
    APPROVED: { noOrder: [], withOrder: [] },
    REJECTED: { noOrder: [], withOrder: [] },
  },
  approver: {
    DRAFT: { noOrder: ["edit", "delete", "submit"], withOrder: ["edit", "delete", "submit"] },
    SUBMITTED: { noOrder: ["approve", "reject"], withOrder: ["approve", "reject"] },
    APPROVED: { noOrder: ["createPo"], withOrder: [] },
    REJECTED: { noOrder: [], withOrder: [] },
  },
};

describe("allowedActions matrix", () => {
  for (const role of ROLES) {
    for (const status of STATUSES) {
      for (const hasOrder of [false, true]) {
        const expected = hasOrder ? EXPECTED[role][status].withOrder : EXPECTED[role][status].noOrder;
        it(`role=${role} status=${status} hasOrder=${hasOrder}`, () => {
          expect(allowedActions(role, status, hasOrder).sort()).toEqual([...expected].sort());
        });
      }
    }
  }
});

describe("canPerform", () => {
  it("mirrors allowedActions for a true case", () => {
    expect(canPerform("submit", "requestor", "DRAFT", false)).toBe(true);
  });
  it("mirrors allowedActions for a false case", () => {
    expect(canPerform("approve", "requestor", "SUBMITTED", false)).toBe(false);
  });
  it("approver cannot create a second PO", () => {
    expect(canPerform("createPo", "approver", "APPROVED", true)).toBe(false);
  });
});

describe("statusIntent", () => {
  it("maps plain statuses to lowercase intents", () => {
    expect(statusIntent("DRAFT", false)).toBe("draft");
    expect(statusIntent("SUBMITTED", false)).toBe("submitted");
    expect(statusIntent("REJECTED", false)).toBe("rejected");
  });
  it("maps APPROVED without an order to approved", () => {
    expect(statusIntent("APPROVED", false)).toBe("approved");
  });
  it("maps APPROVED with an order to poCreated", () => {
    expect(statusIntent("APPROVED", true)).toBe("poCreated");
  });
});

describe("createRequisitionSchema", () => {
  it("accepts a valid requisition", () => {
    const result = createRequisitionSchema.safeParse({
      title: "Laptops",
      description: "5x developer laptops",
      amount: 1500,
      currency: "USD",
    });
    expect(result.success).toBe(true);
  });

  it("rejects amount <= 0", () => {
    const result = createRequisitionSchema.safeParse({ title: "x", amount: 0, currency: "USD" });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = createRequisitionSchema.safeParse({ title: "", amount: 10, currency: "USD" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 100 chars", () => {
    const result = createRequisitionSchema.safeParse({
      title: "a".repeat(101),
      amount: 10,
      currency: "USD",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-3-letter currency", () => {
    const result = createRequisitionSchema.safeParse({ title: "x", amount: 10, currency: "US" });
    expect(result.success).toBe(false);
  });
});

describe("rejectDecisionSchema", () => {
  it("requires a non-empty note", () => {
    expect(rejectDecisionSchema.safeParse({ note: "" }).success).toBe(false);
    expect(rejectDecisionSchema.safeParse({ note: "Budget exceeded" }).success).toBe(true);
  });
});

describe("createPoInputSchema", () => {
  it("requires a vendor id up to 10 chars", () => {
    expect(createPoInputSchema.safeParse({ vendor_id: "" }).success).toBe(false);
    expect(createPoInputSchema.safeParse({ vendor_id: "V001" }).success).toBe(true);
    expect(createPoInputSchema.safeParse({ vendor_id: "12345678901" }).success).toBe(false);
  });
});

describe("listQuery", () => {
  it("always orders by ChangedAt desc", () => {
    expect(listQuery()).toContain("%24orderby=ChangedAt+desc");
  });
  it("adds a status filter", () => {
    expect(listQuery({ status: "SUBMITTED" })).toContain("Status+eq+%27SUBMITTED%27");
  });
  it("adds a search term", () => {
    expect(listQuery({ search: "laptop" })).toContain("%24search=laptop");
  });
});

describe("readQuery", () => {
  it("expands _Order", () => {
    expect(readQuery("abc-123")).toBe("PurchaseRequisition(ReqId=abc-123)?$expand=_Order");
  });
});
