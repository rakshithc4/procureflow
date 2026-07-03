import { http, HttpResponse } from "msw";
import {
  approve,
  createPr,
  createPurchaseOrder,
  getPr,
  listPrs,
  reject,
  submitForApproval,
  withOrder,
} from "./db";

const ACTION_PREFIX = "com.sap.gateway.srvd.zprocurement_srv.v0001.";
const SERVICE_MARKER = "/zprocurement_srv/0001/";

function relativePath(url: URL): string {
  const idx = url.pathname.indexOf(SERVICE_MARKER);
  return idx >= 0 ? url.pathname.slice(idx + SERVICE_MARKER.length) : url.pathname;
}

function extractKey(segment: string): string | null {
  const match = /^PurchaseRequisition\(ReqId=([^)]+)\)/.exec(segment);
  return match ? match[1] : null;
}

function errorBody(code: string, message: string) {
  return { error: { code, message: { value: message } } };
}

export const handlers = [
  http.get(new RegExp(`${SERVICE_MARKER}\\$metadata$`), () => {
    return HttpResponse.text(
      "<edmx:Edmx><EntityType Name=\"PurchaseRequisition\"/><EntityType Name=\"PurchaseOrder\"/></edmx:Edmx>",
      { headers: { "Content-Type": "application/xml" } },
    );
  }),

  // CSRF token fetch: GET on the bare service root.
  http.get(new RegExp(`${SERVICE_MARKER}$`), ({ request }) => {
    if (request.headers.get("x-csrf-token") === "fetch") {
      return new HttpResponse(null, {
        status: 200,
        headers: {
          "x-csrf-token": "mock-csrf-token",
          "Set-Cookie": "sap-sessionid=mock-session; Path=/",
        },
      });
    }
    return new HttpResponse(null, { status: 200 });
  }),

  http.get(new RegExp(`${SERVICE_MARKER}PurchaseRequisition(\\?|$)`), ({ request }) => {
    const url = new URL(request.url);
    const filter = url.searchParams.get("$filter") ?? "";
    const search = url.searchParams.get("$search") ?? "";
    let results = listPrs();
    const statusMatch = /Status eq '([A-Z]+)'/.exec(filter);
    if (statusMatch) results = results.filter((pr) => pr.Status === statusMatch[1]);
    if (search) results = results.filter((pr) => pr.Title.toLowerCase().includes(search.toLowerCase()));
    return HttpResponse.json({ value: results.map(withOrder) });
  }),

  http.get(new RegExp(`${SERVICE_MARKER}PurchaseRequisition\\(`), ({ request }) => {
    const url = new URL(request.url);
    const reqId = extractKey(relativePath(url));
    if (!reqId) return new HttpResponse(null, { status: 404 });
    const pr = getPr(reqId);
    if (!pr) return HttpResponse.json(errorBody("NOT_FOUND", "Purchase requisition not found"), { status: 404 });
    return HttpResponse.json(withOrder(pr));
  }),

  http.post(new RegExp(`${SERVICE_MARKER}PurchaseRequisition$`), async ({ request }) => {
    const body = (await request.json()) as {
      Title?: string;
      Description?: string;
      Amount?: string;
      Currency?: string;
    };
    const result = createPr({
      Title: body.Title ?? "",
      Description: body.Description,
      Amount: body.Amount ?? "0",
      Currency: body.Currency ?? "",
    });
    if (result.error) {
      return HttpResponse.json(errorBody(result.error.code, result.error.message), { status: result.error.status });
    }
    return HttpResponse.json(withOrder(result.data!), { status: 201 });
  }),

  http.post(new RegExp(`${SERVICE_MARKER}PurchaseRequisition\\(`), async ({ request }) => {
    const url = new URL(request.url);
    const rel = relativePath(url);
    const reqId = extractKey(rel);
    if (!reqId) return new HttpResponse(null, { status: 404 });

    const actionSegment = rel.slice(rel.indexOf(")/") + 2);
    const action = actionSegment.replace(ACTION_PREFIX, "");
    const body = (await request.json().catch(() => ({}))) as { note?: string; vendor_id?: string };

    const result =
      action === "SubmitForApproval"
        ? submitForApproval(reqId)
        : action === "Approve"
          ? approve(reqId, body.note ?? "")
          : action === "Reject"
            ? reject(reqId, body.note ?? "")
            : action === "CreatePurchaseOrder"
              ? createPurchaseOrder(reqId, body.vendor_id ?? "")
              : null;

    if (!result) return new HttpResponse(null, { status: 404 });
    if (result.error) {
      return HttpResponse.json(errorBody(result.error.code, result.error.message), { status: result.error.status });
    }

    const pr = getPr(reqId)!;
    return HttpResponse.json(withOrder(pr));
  }),
];
