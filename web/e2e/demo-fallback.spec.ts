import { test, expect } from "@playwright/test";

const BANNER = "SAP backend asleep (trial system) — showing demo data.";

test.describe("Demo fallback (SAP backend asleep)", () => {
  test("a flagged session still works end to end and shows the banner", async ({ page, context }) => {
    await context.addCookies([{ name: "pf_demo", value: "1", url: "http://localhost:3000" }]);
    await page.goto("/login");
    await page.getByRole("button", { name: /Try as Approver/ }).click();

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText(BANNER)).toBeVisible();
    // Data renders (seeded demo rows), not an error state.
    await expect(page.getByText("Office chairs (x10)")).toBeVisible();
  });

  test("'Retry live backend' drops the flag and hides the banner when SAP answers", async ({ page, context }) => {
    await context.addCookies([{ name: "pf_demo", value: "1", url: "http://localhost:3000" }]);
    await page.goto("/login");
    await page.getByRole("button", { name: /Try as Approver/ }).click();
    await expect(page.getByText(BANNER)).toBeVisible();

    await page.getByRole("button", { name: "Retry live backend" }).click();
    await expect(page.getByText(BANNER)).toHaveCount(0);
  });

  test("no banner when the backend is healthy", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Try as Requestor/ }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText(BANNER)).toHaveCount(0);
  });
});
