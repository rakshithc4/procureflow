import { z } from "zod";

const schema = z.object({
  SAP_BASE_URL: z.string().url(),
  SAP_SERVICE_PATH: z.string().min(1),
  SAP_USER: z.string().min(1),
  SAP_PASS: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
});

export const env = schema.parse({
  SAP_BASE_URL: process.env.SAP_BASE_URL,
  SAP_SERVICE_PATH: process.env.SAP_SERVICE_PATH,
  SAP_USER: process.env.SAP_USER,
  SAP_PASS: process.env.SAP_PASS,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
});
