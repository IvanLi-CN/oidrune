import { expect, test } from "@playwright/test";

test("operator can add a source through the confirmation flow", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sources" }).click();
  await page.getByLabel("GitHub numeric ID").first().fill("900001");
  await page.getByRole("button", { name: "Add" }).first().click();
  await expect(
    page.getByRole("dialog", { name: "Add owner allowlist entry" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText("900001")).toBeVisible();
});

test("operator can open a dead-letter retry confirmation on mobile", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Delivery" }).click();
  await page
    .getByRole("button", { name: /Retry evt_01J4A0PCD3BFAQV5ZJHR/ })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Retry dead letter" }),
  ).toBeVisible();
});

test("operator can inspect terminal delivery audit records", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Delivery" }).click();
  await expect(
    page.getByRole("heading", { name: "Audit trail" }),
  ).toBeVisible();
  await expect(page.getByText("delivery.dead_lettered")).toBeVisible();
});
