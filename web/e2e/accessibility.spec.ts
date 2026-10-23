import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function loginAsApprover(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("approver@demo");
  await page.getByLabel("Password").fill("demo1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
}

// Entrance animations (motion) fade content in; axe would measure colours
// blended with the background mid-fade and report phantom contrast failures
// (flaky, timing-dependent). Wait for finite animations to end first.
async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((a) => a.effect?.getComputedTiming().iterations === Infinity || a.playState === "finished"),
  );
}

// T4.6: axe-core sweep — every route must have loading/empty/error states
// (US6) and no accessibility violations.
test.describe("Accessibility", () => {
  test("login page has no axe violations", async ({ page }) => {
    await page.goto("/login");
    await settle(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  for (const route of [
    "/",
    "/requisitions",
    "/requisitions/new",
    "/requisitions/seed-0001",
    "/approvals",
    "/dev/states",
  ]) {
    test(`${route} has no axe violations`, async ({ page }) => {
      await loginAsApprover(page);
      await page.goto(route);
      await settle(page);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
