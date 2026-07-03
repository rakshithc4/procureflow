import "@testing-library/jest-dom/vitest";

process.env.SAP_BASE_URL ??= "https://mock-sap.example.com";
process.env.SAP_SERVICE_PATH ??= "/sap/opu/odata4/sap/zui_procurement_o4/srvd/sap/zprocurement_srv/0001/";
process.env.SAP_USER ??= "MOCK_USER";
process.env.SAP_PASS ??= "mock-pass";
process.env.NEXTAUTH_SECRET ??= "test-secret-for-vitest-only";
