import { z } from "zod";

// SAP connection settings only. Validated lazily (on first SAP call) so a
// deployment with no SAP config at all can still boot and serve demo data
// (see src/server/sap/demo.ts) instead of crashing at import time.
const schema = z.object({
  SAP_BASE_URL: z.string().url(),
  SAP_SERVICE_PATH: z.string().min(1),
  SAP_USER: z.string().min(1),
  SAP_PASS: z.string().min(1),
});

export function getEnv() {
  return schema.parse({
    SAP_BASE_URL: process.env.SAP_BASE_URL,
    SAP_SERVICE_PATH: process.env.SAP_SERVICE_PATH,
    SAP_USER: process.env.SAP_USER,
    SAP_PASS: process.env.SAP_PASS,
  });
}
