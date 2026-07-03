import { z } from "zod";

// Domain types, schemas, and the role×status action matrix for ProcureFlow.
// UI components never re-declare these; role×status logic lives only here.

export const STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"] as const;
export type Status = (typeof STATUSES)[number];

export const ROLES = ["requestor", "approver"] as const;
export type Role = (typeof ROLES)[number];

export const purchaseOrderSchema = z.object({
  OrderId: z.string(),
  ReqId: z.string(),
  VendorId: z.string(),
  OrderAmount: z.string(),
  Currency: z.string(),
  Status: z.literal("CREATED"),
  OrderDate: z.string(),
  ApproverId: z.string(),
  CreatedAt: z.string(),
  ChangedAt: z.string(),
});
export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;

export const purchaseRequisitionSchema = z.object({
  ReqId: z.string(),
  Title: z.string(),
  Description: z.string().nullable().default(""),
  Amount: z.string(),
  Currency: z.string(),
  Status: z.enum(STATUSES),
  RequestorId: z.string(),
  ApproverId: z.string().nullable(),
  ApproverNote: z.string().nullable(),
  CreatedAt: z.string(),
  ChangedAt: z.string(),
  _Order: purchaseOrderSchema.nullable().optional(),
});
export type PurchaseRequisition = z.infer<typeof purchaseRequisitionSchema>;

// US1 AC1: amount > 0, title 1-100 chars, currency is 3-letter ISO.
export const createRequisitionSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or fewer"),
  description: z.string().max(255, "Description must be 255 characters or fewer").optional().default(""),
  amount: z.coerce.number({ message: "Amount is required" }).gt(0, "Amount must be greater than 0"),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO code")
    .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO code"),
});
export type CreateRequisitionInput = z.infer<typeof createRequisitionSchema>;

// US3 AC2: reject requires a note; approve note is optional (PRD §13 item 4).
export const decisionSchema = z.object({
  note: z.string().optional().default(""),
});
export const rejectDecisionSchema = z.object({
  note: z.string().min(1, "A note is required when rejecting a requisition"),
});

export const createPoInputSchema = z.object({
  vendor_id: z.string().min(1, "Vendor ID is required").max(10, "Vendor ID must be 10 characters or fewer"),
});
export type CreatePoInput = z.infer<typeof createPoInputSchema>;

// ---- Status → UI intent (badge system, see status.* colors in globals.css) ----

export type StatusIntent = "draft" | "submitted" | "approved" | "rejected" | "poCreated";

export function statusIntent(status: Status, hasOrder: boolean): StatusIntent {
  if (status === "APPROVED" && hasOrder) return "poCreated";
  return status.toLowerCase() as StatusIntent;
}

export const STATUS_LABEL: Record<StatusIntent, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  poCreated: "PO Created",
};

// ---- Role × status action matrix (US2, US3, US4; PRD §4 role table) ----

export type Action = "edit" | "submit" | "approve" | "reject" | "createPo" | "delete";

export function allowedActions(role: Role, status: Status, hasOrder: boolean): Action[] {
  const actions: Action[] = [];

  if (status === "DRAFT") {
    actions.push("edit", "delete", "submit");
  }
  if (role === "approver") {
    if (status === "SUBMITTED") {
      actions.push("approve", "reject");
    }
    if (status === "APPROVED" && !hasOrder) {
      actions.push("createPo");
    }
  }
  return actions;
}

export function canPerform(action: Action, role: Role, status: Status, hasOrder: boolean): boolean {
  return allowedActions(role, status, hasOrder).includes(action);
}

// ---- OData query builders (PRD §8) ----

export interface ListQueryParams {
  status?: Status;
  search?: string;
}

export function listQuery(params: ListQueryParams = {}): string {
  const query = new URLSearchParams();
  query.set("$orderby", "ChangedAt desc");

  const filters: string[] = [];
  if (params.status) filters.push(`Status eq '${params.status}'`);
  if (filters.length) query.set("$filter", filters.join(" and "));
  if (params.search) query.set("$search", params.search);

  return `PurchaseRequisition?${query.toString()}`;
}

export function readQuery(reqId: string): string {
  return `PurchaseRequisition(ReqId=${reqId})?$expand=_Order`;
}
