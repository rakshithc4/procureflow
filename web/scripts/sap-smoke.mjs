#!/usr/bin/env node
// Live smoke test against a real SAP BTP ABAP Environment instance.
// Run: node scripts/sap-smoke.mjs   (reads web/.env — see .env.example)
// Covers the full API contract: create, submit, approve, create PO.

import { fetch } from 'undici';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);
    if (!match) continue;
    const key = match[1];
    let value = (match[2] ?? '').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnv(envPath);

const BASE_URL = process.env.SAP_BASE_URL;
const SERVICE_PATH = process.env.SAP_SERVICE_PATH;
const USER = process.env.SAP_USER;
const PASS = process.env.SAP_PASS;

if (!BASE_URL || !SERVICE_PATH || !USER || !PASS) {
  console.error('Missing SAP_BASE_URL / SAP_SERVICE_PATH / SAP_USER / SAP_PASS in web/.env');
  process.exit(1);
}

const serviceUrl = new URL(SERVICE_PATH, BASE_URL).toString().replace(/\/?$/, '/');
const auth = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');

let cookieJar = '';
let results = [];

function rememberCookies(res) {
  const set = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const c of set) {
    const pair = c.split(';')[0];
    cookieJar = cookieJar ? `${cookieJar}; ${pair}` : pair;
  }
}

async function step(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.log(`FAIL  ${name} — ${err.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

let csrfToken;
let reqId;

async function main() {
  await step('GET $metadata returns 200 with PurchaseRequisition', async () => {
    const res = await fetch(`${serviceUrl}$metadata`, {
      headers: { Authorization: auth },
    });
    assert(res.status === 200, `expected 200, got ${res.status}`);
    const body = await res.text();
    assert(body.includes('PurchaseRequisition'), '$metadata missing PurchaseRequisition');
  });

  await step('GET with x-csrf-token: fetch returns token + session cookies', async () => {
    const res = await fetch(serviceUrl, {
      headers: { Authorization: auth, 'x-csrf-token': 'fetch' },
    });
    assert(res.status === 200, `expected 200, got ${res.status}`);
    csrfToken = res.headers.get('x-csrf-token');
    assert(csrfToken, 'no x-csrf-token header returned');
    rememberCookies(res);
    assert(cookieJar, 'no session cookies captured');
  });

  await step('POST create PurchaseRequisition', async () => {
    const res = await fetch(`${serviceUrl}PurchaseRequisition`, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'x-csrf-token': csrfToken,
        Cookie: cookieJar,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Title: `Smoke test ${new Date().toISOString()}`,
        Description: 'Created by sap-smoke.mjs',
        Amount: '250.00',
        Currency: 'EUR',
      }),
    });
    rememberCookies(res);
    assert(res.status === 201, `expected 201, got ${res.status}: ${await res.text()}`);
    const body = await res.json();
    reqId = body.ReqId;
    assert(reqId, 'no ReqId in create response');
    assert(body.Status === 'DRAFT', `expected DRAFT, got ${body.Status}`);
  });

  await step('POST SubmitForApproval', async () => {
    const url = `${serviceUrl}PurchaseRequisition(ReqId=${reqId})/com.sap.gateway.srvd.zprocurement_srv.v0001.SubmitForApproval`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'x-csrf-token': csrfToken,
        Cookie: cookieJar,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    rememberCookies(res);
    assert(res.status === 200, `expected 200, got ${res.status}: ${await res.text()}`);
    const body = await res.json();
    assert(body.Status === 'SUBMITTED', `expected SUBMITTED, got ${body.Status}`);
  });

  await step('POST Approve', async () => {
    const url = `${serviceUrl}PurchaseRequisition(ReqId=${reqId})/com.sap.gateway.srvd.zprocurement_srv.v0001.Approve`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'x-csrf-token': csrfToken,
        Cookie: cookieJar,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ note: 'Approved by smoke test' }),
    });
    rememberCookies(res);
    assert(res.status === 200, `expected 200, got ${res.status}: ${await res.text()}`);
    const body = await res.json();
    assert(body.Status === 'APPROVED', `expected APPROVED, got ${body.Status}`);
  });

  await step('POST CreatePurchaseOrder', async () => {
    const url = `${serviceUrl}PurchaseRequisition(ReqId=${reqId})/com.sap.gateway.srvd.zprocurement_srv.v0001.CreatePurchaseOrder`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'x-csrf-token': csrfToken,
        Cookie: cookieJar,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vendor_id: 'V001' }),
    });
    rememberCookies(res);
    assert(res.status === 200, `expected 200, got ${res.status}: ${await res.text()}`);
  });

  await step('GET with $expand=_Order shows linked PO', async () => {
    const url = `${serviceUrl}PurchaseRequisition(ReqId=${reqId})?$expand=_Order`;
    const res = await fetch(url, { headers: { Authorization: auth, Cookie: cookieJar } });
    assert(res.status === 200, `expected 200, got ${res.status}`);
    const body = await res.json();
    assert(body._Order, 'expected _Order to be expanded and present');
    assert(body._Order.Status === 'CREATED', `expected PO status CREATED, got ${body._Order.Status}`);
  });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} steps passed`);
  process.exit(failed.length ? 1 : 0);
}

main();
