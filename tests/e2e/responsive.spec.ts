import { expect, test } from "@playwright/test";

test("cards list and detail work at 390px without horizontal scroll", async ({ page }) => {
  await page.goto("/cards");
  await expect(page.getByRole("heading", { name: "Cards", exact: true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.getByRole("button", { name: /Ops travel/ }).first().click();
  await expect(page).toHaveURL(/\/cards\/c_ops$/);
  await expect(page.getByRole("button", { name: "Freeze", exact: true })).toBeVisible();
  const detailOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(detailOverflow).toBeLessThanOrEqual(0);
});

test("on a phone, Add to Apple Pay adds the card directly", async ({ page }) => {
  await page.goto("/cards/c_sw");
  await page.getByRole("button", { name: "Add to Apple Pay" }).click();
  const modal = page.getByRole("dialog", { name: "Add to Apple Pay" });
  await expect(modal).toContainText("Wallet opens with this card ready");
  await expect(modal.getByRole("img", { name: /Back of/ })).toHaveCount(0);
  await modal.getByRole("button", { name: "Add to Apple Pay" }).click();
  await expect(page.getByRole("button", { name: "In Apple Pay" })).toBeDisabled();
});

test("phone layout follows the Figma responsive screens: Menu, no sideways scroll", async ({ page }) => {
  await page.goto("/cards");
  await page.getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await menu.getByRole("link", { name: "Requests" }).click();
  await expect(page.getByRole("heading", { name: "Requests", level: 1 })).toBeVisible();
  for (const route of ["/cards", "/cards/c_ops", "/cards/c_ops/transactions", "/subscriptions", "/requests", "/travel", "/cards/new", "/global-account"]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, route).toBeLessThanOrEqual(0);
  }
});

test("on a phone, Create card switches between Details and Preview", async ({ page }) => {
  await page.goto("/cards/new");
  await page.getByRole("textbox", { name: "Nickname" }).fill("Team travel");
  await expect(page.getByRole("complementary", { name: "Card summary" })).toBeHidden();
  await page.getByRole("tab", { name: "Preview" }).click();
  await expect(page.getByRole("complementary", { name: "Card summary" })).toContainText("Team travel");
  await expect(page.getByRole("textbox", { name: "Nickname" })).toBeHidden();
  await page.getByRole("tab", { name: "Details" }).click();
  await expect(page.getByRole("textbox", { name: "Nickname" })).toHaveValue("Team travel");
});
