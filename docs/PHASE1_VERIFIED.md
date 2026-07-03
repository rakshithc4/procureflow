# Phase 1 verification — ABAP backend

**Status: PENDING.** Not yet verified — object creation/activation in ADT
has to happen manually against a live BTP tenant. Fill this in after
completing the steps below.

## What's done
All ABAP source authored in [`abap/`](../abap/) per [`abap/MANIFEST.md`](../abap/MANIFEST.md):
tables, message class spec, abstract entities, CDS interface views, behavior
definitions, behavior implementation class, ABAP Unit test class.

## What's needed to close this out
1. In Eclipse ADT, create package `ZPROCUREMENT_WF` (superpackage `ZLOCAL`,
   local transport).
2. Create and activate objects 1–17 from `abap/MANIFEST.md`, in order.
3. Run ATC on the package. Report findings back — if any, they'll be fixed
   in the repo source and re-pasted, not patched only in ADT.
4. Run ABAP Unit on `ZTC_PROCUREMENT` (Ctrl+Shift+F10).
5. Paste results below and flip status to VERIFIED.

## Results
```
(paste ATC output here)
```
```
(paste ABAP Unit results here)
```

**Verified by:** _(name, date)_
