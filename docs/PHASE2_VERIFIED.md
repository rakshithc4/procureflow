# Phase 2 verification — service exposure + live API access

**Status: PENDING.** Requires Phase 1 verified first, plus a manual ADT/BTP
checkpoint (service binding publish + communication arrangement setup).

## What's done
Service definition (`abap/service/zprocurement_srv.srvd.txt`), projection
views + metadata extension + projection behavior definition all authored.
Live smoke-test script at `web/scripts/sap-smoke.mjs`.

## What's needed to close this out
1. Publish Service Binding `ZUI_PROCUREMENT_O4` (OData V4 – UI) on
   `ZPROCUREMENT_SRV`. Copy the service URL.
2. Create Communication Scenario `ZCS_PROCUREMENT`, Communication User
   `PROCURE_API`, System, and Arrangement (see `docs/REDEPLOY.md` §6).
3. Confirm the trial system is running.
4. Fill in `web/.env.local` with the real `SAP_BASE_URL`,
   `SAP_SERVICE_PATH`, `SAP_USER`, `SAP_PASS`.
5. Run `node scripts/sap-smoke.mjs` from `web/`, paste output below.

## Results
```
(paste sap-smoke.mjs output here)
```

**Verified by:** _(name, date)_
