import { expect, type Page } from "@playwright/test";

export async function asRole(page: Page, role: "owner" | "cardholder" | "finance" | "individual") {
  await page.locator("#role-switch").selectOption(role);
  await page.waitForURL(role === "individual" ? /\/personal/ : /\/cards/);
}

export async function demo(page: Page, button: string | RegExp) {
  await page.getByRole("button", { name: "Open prototype demo controls" }).click();
  await page.getByRole("button", { name: button }).click();
  await page.keyboard.press("Escape");
}

export async function pickMerchant(page: Page, query: string, name: string, field = "Merchant") {
  await page.getByRole("combobox", { name: field }).fill(query);
  await page.getByRole("option", { name: new RegExp(name) }).first().click();
}

export async function ready(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("main")).toBeVisible();
}

/** Approving a request asks for the transaction PIN (any 4 digits except 0000). */
export async function approveWithPin(page: Page, drawer: import("@playwright/test").Locator, action: string) {
  await drawer.getByRole("button", { name: action }).click();
  const pin = page.getByRole("dialog", { name: "Enter your transaction PIN" });
  for (let i = 1; i <= 4; i++) await pin.getByLabel(`PIN digit ${i}`).fill(String(i));
  await pin.getByRole("button", { name: action }).click();
}
