import { test, expect, type Page } from "@playwright/test";

async function loginAsApprover(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("approver@demo");
  await page.getByLabel("Password").fill("demo1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
}

async function createDraft(page: Page, title: string, amount: string) {
  await page.goto("/requisitions/new");
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Amount").fill(amount);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
}

test.describe("US1 — create requisition", () => {
  test("blocks save with inline errors on invalid input", async ({ page }) => {
    await loginAsApprover(page);
    await page.goto("/requisitions/new");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Title is required")).toBeVisible();
    await expect(page.getByText("Amount must be greater than 0")).toBeVisible();
  });

  test("creates a DRAFT requisition", async ({ page }) => {
    await loginAsApprover(page);
    await createDraft(page, `E2E create ${Date.now()}`, "500");
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();
  });
});

test.describe("US1-US4 — golden path", () => {
  test("submit, approve, create PO", async ({ page }) => {
    await loginAsApprover(page);
    const title = `E2E golden path ${Date.now()}`;
    await createDraft(page, title, "500");

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Submit for Approval" }).click();
    await expect(page.getByText("Submitted", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Approve", exact: true }).click();
    const approveDialog = page.getByRole("dialog");
    await approveDialog.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText("Approved", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Create Purchase Order" }).click();
    const poDialog = page.getByRole("dialog");
    await poDialog.getByLabel("Vendor ID").fill("V001");
    await poDialog.getByRole("button", { name: "Create PO" }).click();

    await expect(page.getByText("PO Created")).toBeVisible();
    await expect(page.getByText("Purchase Order", { exact: true })).toBeVisible();
  });
});

test.describe("US3 — reject", () => {
  test("AC2: rejecting without a note is blocked", async ({ page }) => {
    await loginAsApprover(page);
    const title = `E2E reject ${Date.now()}`;
    await createDraft(page, title, "200");

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Submit for Approval" }).click();

    await page.getByRole("button", { name: "Reject" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Reject" }).click();
    await expect(dialog.getByText("A note is required when rejecting a requisition")).toBeVisible();

    await dialog.getByPlaceholder("Reason for rejection").fill("Not in budget this quarter");
    await dialog.getByRole("button", { name: "Reject" }).click();
    await expect(page.getByText("Rejected", { exact: true })).toBeVisible();
  });
});

test.describe("US5 — approvals queue", () => {
  test("AC1: one-click approve removes the row from the queue", async ({ page }) => {
    await loginAsApprover(page);
    const title = `E2E queue ${Date.now()}`;
    await createDraft(page, title, "300");

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Submit for Approval" }).click();

    await page.goto("/approvals");
    const row = page.getByRole("row", { name: new RegExp(title) });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Approve" }).click();
    await expect(row).toHaveCount(0);
  });
});
