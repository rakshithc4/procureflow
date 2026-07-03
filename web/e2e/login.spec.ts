import { test, expect } from "@playwright/test";

test.describe("Login (US6 — trust the system)", () => {
  test("shows demo credentials and signs in", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Demo credentials")).toBeVisible();

    await page.getByLabel("Email").fill("requestor@demo");
    await page.getByLabel("Password").fill("demo1234");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("shows an error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("requestor@demo");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("redirects unauthenticated visitors to /login", async ({ page }) => {
    await page.goto("/requisitions");
    await expect(page).toHaveURL(/\/login/);
  });

  test("hides the Approvals link for the requestor role", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("requestor@demo");
    await page.getByLabel("Password").fill("demo1234");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: "Approvals" })).toHaveCount(0);
  });
});
