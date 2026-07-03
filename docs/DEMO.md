# Demo script (3 minutes)

Mock mode works for this entire script with no live SAP connection
(`MOCK_SAP=1`); swap to a live URL for the real-SAP version once Phase 5 is
verified.

## 1. Login (15s)
Open `/login`. Point out the demo credentials on the card — no external
IdP, two seeded roles (requestor, approver). Sign in as **approver@demo**
(approver can do everything requestor can, plus approve/reject/create PO —
lets the whole flow run from one account).

## 2. Dashboard (20s)
Land on `/`. Four status metric cards, recent-5 table. Point out the status
badge system — five visually distinct states (icon + label, never color
alone).

## 3. Create a requisition (30s)
Click **New requisition**. Try submitting empty — inline zod validation
errors appear (title required, amount > 0). Fill in a real title, amount,
currency. Save → redirected to the detail page, status **Draft**.

## 4. Submit → Approve → Create PO (45s)
On the detail page:
- **Submit for Approval** (confirm dialog) → status flips to **Submitted**,
  timeline advances.
- **Approve** (dialog, note optional) → **Approved**, "Create Purchase
  Order" appears — the action bar is driven purely by the role×status
  matrix in `web/src/lib/pr.ts`, not per-page role checks.
- **Create Purchase Order** (vendor ID required) → status becomes **PO
  Created**, a Purchase Order card appears with order ID, vendor, amount,
  order date.

## 5. Reject path (30s)
Create a second requisition, submit it, then **Reject** without typing a
note — blocked with an inline error. Add a note → rejects successfully,
status **Rejected**.

## 6. Approvals queue (20s)
Go to `/approvals` (approver-only — not in the nav for requestor@demo).
Submit a third requisition, then one-click **Approve** directly from the
queue row.

## 7. Wrap-up (10s)
Mention: SAP RAP managed business object on BTP ABAP Environment as the
system of record (4 custom actions, 6 ABAP Unit tests, ATC-clean), Next.js
proxy pattern hiding all SAP credentials from the browser, full test suite
(Vitest unit/integration + Playwright e2e incl. an axe-core accessibility
sweep on every route).

---

## Resume bullets

- Built an end-to-end SAP procurement product: a RAP managed business object
  with 4 custom actions and 6 ABAP Unit tests on SAP BTP ABAP Environment,
  consumed by a Next.js 16 app (6 routes, 16 Playwright specs including a
  full accessibility sweep, 48 unit/integration tests) with a server-side
  proxy that centralizes SAP OData v4 CSRF/session handling.
- Designed a role×status permission matrix as the single source of truth
  for UI action-gating (zero inline role checks), driving a data table,
  detail action bar, and approvals queue from one typed function with
  100%-branch-covered tests.
