# Redeploy runbook — recreating the SAP backend after a trial reset

SAP BTP trial accounts can be reset or deleted. All ABAP source lives in
[`abap/`](../abap/) so the backend is reproducible from scratch. Budget
under an hour for this end to end.

## 1. Prerequisites
- Access to the SAP BTP trial cockpit and Eclipse ADT with the ABAP
  Development Tools plugin.
- This repo checked out locally (the `abap/` source files).

## 2. Recreate the package
In ADT: **Project Explorer → your ABAP Cloud project → New → ABAP Package**.
- Name: `ZPROCUREMENT_WF`
- Superpackage: `ZLOCAL`
- Transport layer: local (`$TMP`-equivalent for cloud projects)

## 3. Create and activate objects in order
Follow [`abap/MANIFEST.md`](../abap/MANIFEST.md) — it lists every object,
its type, its source file, and the required creation order (dependencies
first). For each row:
1. Right-click the package → **New →** matching object type (Database Table,
   Data Definition, Behavior Definition, Class, Message Class, Service
   Definition).
2. Paste the contents of the referenced `.txt` file as the object source
   (skip the `""` comment header block — those lines are metadata for
   humans, not valid syntax for every object type; for tables/CDS/behavior
   definitions the `""` lines ARE valid ABAP comments and can be pasted
   as-is).
3. Activate (**Ctrl+F3**).
4. Move to the next row only after the current one activates cleanly.

The message class (row 3) is created via the ADT wizard, not pasted source —
see the message list in `abap/ddic/zprocurement_msg.msag.txt`.

## 4. Run quality checks
- Right-click the package → **Run As → ABAP Test Cockpit (ATC)**. Fix any
  findings by editing the source files in this repo, then re-paste and
  re-activate — don't fix only in ADT and let the repo drift.
- Open `ZTC_PROCUREMENT` → **Run As → ABAP Unit Test** (Ctrl+Shift+F10). All
  6 test methods should pass.

## 5. Publish the service
1. Right-click `ZPROCUREMENT_SRV` → **New → Service Binding**.
   - Name: `ZUI_PROCUREMENT_O4`
   - Binding type: **OData V4 – UI**
2. **Publish**. Copy the full service URL shown — this is `SAP_BASE_URL` +
   `SAP_SERVICE_PATH` for `web/.env.local`.

## 6. Communication scenario, system, user
1. ADT: **New → Communication Scenario** → `ZCS_PROCUREMENT`, add the
   `ZUI_PROCUREMENT_O4` binding as an inbound service, auth = **Basic**,
   publish locally.
2. Fiori Launchpad (ABAP environment) → **Communication Management**:
   - **Communication User**: create `PROCURE_API`, note the generated
     password (this is `SAP_PASS`).
   - **Communication System**: point at this same tenant.
   - **Communication Arrangement**: for `ZCS_PROCUREMENT`, using the system
     and user above.

## 7. Confirm the trial system is running
BTP trial systems hibernate nightly. In the BTP cockpit, start the ABAP
environment instance before testing or demoing.

## 8. Verify live
```bash
cd web
cp .env.example .env.local   # fill in SAP_BASE_URL, SAP_SERVICE_PATH, SAP_USER, SAP_PASS
node scripts/sap-smoke.mjs
```
All steps should print `PASS`. Record the output in
`docs/PHASE2_VERIFIED.md`.
