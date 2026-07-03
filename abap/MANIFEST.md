# ABAP object manifest — ZPROCUREMENT_WF

Creation/activation order in ADT (Ctrl+F3 to activate each before moving to the next).
Package: `ZPROCUREMENT_WF`, superpackage `ZLOCAL`, transport: local.

| # | Object | Type | Source file | ADT object name |
|---|--------|------|--------------|------------------|
| 1 | ZPURCHASE_REQ | Database table | `ddic/zpurchase_req.tabl.txt` | `ZPURCHASE_REQ` |
| 2 | ZPURCHASE_ORD | Database table | `ddic/zpurchase_ord.tabl.txt` | `ZPURCHASE_ORD` |
| 3 | ZPROCUREMENT_MSG | Message class (create via ADT wizard, see file) | `ddic/zprocurement_msg.msag.txt` | `ZPROCUREMENT_MSG` |
| 4 | ZA_DECISION | Abstract entity (CDS) | `cds/za_decision.ddls.txt` | `ZA_DECISION` |
| 5 | ZA_PO_INPUT | Abstract entity (CDS) | `cds/za_po_input.ddls.txt` | `ZA_PO_INPUT` |
| 6 | ZI_PURCHASE_ORD | Interface view (CDS) | `cds/zi_purchase_ord.ddls.txt` | `ZI_PURCHASE_ORD` |
| 7 | ZI_PURCHASE_REQ | Interface view (CDS) | `cds/zi_purchase_req.ddls.txt` | `ZI_PURCHASE_REQ` |
| 8 | ZI_PURCHASE_ORD behavior | Behavior definition | `behavior/zi_purchase_ord.bdef.txt` | `ZI_PURCHASE_ORD` |
| 9 | ZBP_PURCHASE_ORD | Behavior implementation class (empty) | `behavior/zbp_purchase_ord.clas.txt` | `ZBP_PURCHASE_ORD` |
| 10 | ZI_PURCHASE_REQ behavior | Behavior definition | `behavior/zi_purchase_req.bdef.txt` | `ZI_PURCHASE_REQ` |
| 11 | ZBP_PURCHASE_REQ | Behavior implementation class | `behavior/zbp_purchase_req.clas.txt` | `ZBP_PURCHASE_REQ` |
| 12 | ZC_PURCHASE_ORD | Projection view, read-only, no bdef (CDS) | `cds/zc_purchase_ord.ddls.txt` | `ZC_PURCHASE_ORD` |
| 13 | ZC_PURCHASE_REQ | Projection view (CDS) | `cds/zc_purchase_req.ddls.txt` | `ZC_PURCHASE_REQ` |
| 14 | ZC_PURCHASE_REQ metadata ext | Metadata extension | `cds/zc_purchase_req.ddlx.txt` | `ZC_PURCHASE_REQ` |
| 15 | ZC_PURCHASE_REQ behavior | Behavior definition (projection) | `behavior/zc_purchase_req.bdef.txt` | `ZC_PURCHASE_REQ` |
| 16 | ZPROCUREMENT_SRV | Service definition | `service/zprocurement_srv.srvd.txt` | `ZPROCUREMENT_SRV` |
| 17 | ZTC_PROCUREMENT | ABAP Unit test class | `test/ztc_procurement.clas.txt` | `ZTC_PROCUREMENT` |
| 18 | ZUI_PROCUREMENT_O4 | Service binding (OData V4 – UI) | manual, no source file | created directly in ADT on ZPROCUREMENT_SRV |

## Recovery after trial reset
1. Recreate package `ZPROCUREMENT_WF` as above.
2. Paste + activate objects 1–17 in table order.
3. Create service binding (object 18), publish, re-run Communication Scenario / User / Arrangement steps in `docs/REDEPLOY.md`.
4. Re-paste the resulting service URL into `web/.env`.
