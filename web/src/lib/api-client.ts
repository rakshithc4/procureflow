import type { CreateRequisitionInput, ListQueryParams, PurchaseRequisition } from "@/lib/pr";
import { listQuery, readQuery } from "@/lib/pr";

const ACTION = "com.sap.gateway.srvd.zprocurement_srv.v0001";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/sap/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.status ?? res.status, body.code ?? "UNKNOWN", body.message ?? "Request failed");
  }
  return body as T;
}

export const api = {
  listRequisitions: (params?: ListQueryParams) =>
    request<{ value: PurchaseRequisition[] }>(listQuery(params)),

  getRequisition: (id: string) => request<PurchaseRequisition>(readQuery(id)),

  createRequisition: (input: CreateRequisitionInput) =>
    request<PurchaseRequisition>("PurchaseRequisition", {
      method: "POST",
      body: JSON.stringify({
        Title: input.title,
        Description: input.description,
        Amount: String(input.amount),
        Currency: input.currency,
      }),
    }),

  submitForApproval: (id: string) =>
    request<PurchaseRequisition>(`PurchaseRequisition(ReqId=${id})/${ACTION}.SubmitForApproval`, {
      method: "POST",
      body: "{}",
    }),

  approve: (id: string, note: string) =>
    request<PurchaseRequisition>(`PurchaseRequisition(ReqId=${id})/${ACTION}.Approve`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),

  reject: (id: string, note: string) =>
    request<PurchaseRequisition>(`PurchaseRequisition(ReqId=${id})/${ACTION}.Reject`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),

  createPo: (id: string, vendorId: string) =>
    request<PurchaseRequisition>(`PurchaseRequisition(ReqId=${id})/${ACTION}.CreatePurchaseOrder`, {
      method: "POST",
      body: JSON.stringify({ vendor_id: vendorId }),
    }),
};
