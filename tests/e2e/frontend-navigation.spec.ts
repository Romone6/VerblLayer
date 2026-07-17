import { expect, test } from "@playwright/test";

test("marketing CTA opens the live local workspace", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Make a verified business workflow safely callable by an agent." })).toBeVisible();
  await page.getByRole("link", { name: "Open local workspace" }).first().click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Operational command layer status" })).toBeVisible();
});
