import type { PurchaseOrder, PurchaseRequisition, Status } from "@/lib/pr";

// In-memory fixture store mirroring the ABAP behavior rules in
// abap/behavior/zbp_purchase_req.clas.txt, for MSW to serve in tests and
// Playwright mock mode (no live BTP dependency).

let prs: PurchaseRequisition[] = [];
let pos: PurchaseOrder[] = [];
let counter = 0;

function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter.toString().padStart(4, "0")}`;
}

function now(): string {
  return new Date().toISOString();
}

function seed() {
  prs = [
    {
      ReqId: "seed-0001",
      Title: "Office chairs (x10)",
      Description: "Ergonomic chairs for the new floor",
      Amount: "3200.00",
      Currency: "USD",
      Status: "DRAFT",
      RequestorId: "requestor@demo",
      ApproverId: null,
      ApproverNote: null,
      CreatedAt: now(),
      ChangedAt: now(),
    },
    {
      ReqId: "seed-0002",
      Title: "Annual software license renewal",
      Description: "IDE licenses for the engineering team",
      Amount: "8000.00",
      Currency: "USD",
      Status: "SUBMITTED",
      RequestorId: "requestor@demo",
      ApproverId: null,
      ApproverNote: null,
      CreatedAt: now(),
      ChangedAt: now(),
    },
    {
      ReqId: "seed-0003",
      Title: "Conference sponsorship",
      Description: "Gold tier sponsorship for DevConf",
      Amount: "12000.00",
      Currency: "EUR",
      Status: "APPROVED",
      RequestorId: "requestor@demo",
      ApproverId: "approver@demo",
      ApproverNote: "Approved, aligns with marketing budget",
      CreatedAt: now(),
      ChangedAt: now(),
    },
    {
      ReqId: "seed-0004",
      Title: "Unbudgeted team offsite",
      Description: "Ski trip",
      Amount: "25000.00",
      Currency: "USD",
      Status: "REJECTED",
      RequestorId: "requestor@demo",
      ApproverId: "approver@demo",
      ApproverNote: "Exceeds discretionary budget for this quarter",
      CreatedAt: now(),
      ChangedAt: now(),
    },
  ];
  pos = [];
  counter = 0;
}
seed();

export function resetMockDb() {
  seed();
}

export function listPrs(): PurchaseRequisition[] {
  return [...prs].sort((a, b) => b.ChangedAt.localeCompare(a.ChangedAt));
}

export function getPr(reqId: string): PurchaseRequisition | undefined {
  return prs.find((pr) => pr.ReqId === reqId);
}

export function orderForReq(reqId: string): PurchaseOrder | undefined {
  return pos.find((po) => po.ReqId === reqId);
}

export function withOrder(pr: PurchaseRequisition): PurchaseRequisition {
  return { ...pr, _Order: orderForReq(pr.ReqId) ?? null };
}

export interface MockResult<T> {
  data?: T;
  error?: { status: number; code: string; message: string };
}

export function createPr(input: {
  Title: string;
  Description?: string;
  Amount: string;
  Currency: string;
}): MockResult<PurchaseRequisition> {
  if (!input.Title || Number(input.Amount) <= 0) {
    return { error: { status: 400, code: "VALIDATION_ERROR", message: "Title is required and amount must be greater than 0" } };
  }
  const pr: PurchaseRequisition = {
    ReqId: nextId("req"),
    Title: input.Title,
    Description: input.Description ?? "",
    Amount: input.Amount,
    Currency: input.Currency,
    Status: "DRAFT",
    RequestorId: "requestor@demo",
    ApproverId: null,
    ApproverNote: null,
    CreatedAt: now(),
    ChangedAt: now(),
  };
  prs.push(pr);
  return { data: pr };
}

function requireStatus(reqId: string, expected: Status, errorMessage: string): MockResult<PurchaseRequisition> {
  const pr = getPr(reqId);
  if (!pr) return { error: { status: 404, code: "NOT_FOUND", message: "Purchase requisition not found" } };
  if (pr.Status !== expected) return { error: { status: 400, code: "INVALID_STATUS", message: errorMessage } };
  return { data: pr };
}

export function submitForApproval(reqId: string): MockResult<PurchaseRequisition> {
  const check = requireStatus(reqId, "DRAFT", "Only DRAFT requisitions can be submitted for approval");
  if (check.error) return check;
  const pr = check.data!;
  pr.Status = "SUBMITTED";
  pr.ChangedAt = now();
  return { data: pr };
}

export function approve(reqId: string, note: string): MockResult<PurchaseRequisition> {
  const check = requireStatus(reqId, "SUBMITTED", "Only SUBMITTED requisitions can be approved or rejected");
  if (check.error) return check;
  const pr = check.data!;
  pr.Status = "APPROVED";
  pr.ApproverId = "approver@demo";
  pr.ApproverNote = note;
  pr.ChangedAt = now();
  return { data: pr };
}

export function reject(reqId: string, note: string): MockResult<PurchaseRequisition> {
  if (!note) {
    return { error: { status: 400, code: "VALIDATION_ERROR", message: "A note is required when rejecting a requisition" } };
  }
  const check = requireStatus(reqId, "SUBMITTED", "Only SUBMITTED requisitions can be approved or rejected");
  if (check.error) return check;
  const pr = check.data!;
  pr.Status = "REJECTED";
  pr.ApproverId = "approver@demo";
  pr.ApproverNote = note;
  pr.ChangedAt = now();
  return { data: pr };
}

export function createPurchaseOrder(reqId: string, vendorId: string): MockResult<PurchaseOrder> {
  const check = requireStatus(reqId, "APPROVED", "A purchase order can only be created from an APPROVED requisition");
  if (check.error) return { error: check.error };
  const pr = check.data!;
  if (orderForReq(reqId)) {
    return { error: { status: 400, code: "PO_EXISTS", message: "A purchase order already exists for this requisition" } };
  }
  const po: PurchaseOrder = {
    OrderId: nextId("po"),
    ReqId: reqId,
    VendorId: vendorId,
    OrderAmount: pr.Amount,
    Currency: pr.Currency,
    Status: "CREATED",
    OrderDate: new Date().toISOString().slice(0, 10),
    ApproverId: "approver@demo",
    CreatedAt: now(),
    ChangedAt: now(),
  };
  pos.push(po);
  return { data: po };
}
