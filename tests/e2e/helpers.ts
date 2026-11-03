import { expect, type Page } from "@playwright/test";

export async function asRole(
  page: Page,
  role: "owner" | "cardholder" | "finance" | "individual",
) {
  await page.locator("#role-switch").selectOption(role);
  await page.waitForURL(role === "individual" ? /\/personal/ : /\/cards/);
}

export async function demo(page: Page, button: string | RegExp) {
  await page
    .getByRole("button", { name: "Open prototype demo controls" })
    .click();
  await page.getByRole("button", { name: button }).click();
  await page.keyboard.press("Escape");
}

export async function pickMerchant(
  page: Page,
  query: string,
  name: string,
  field = "Merchant",
) {
  await page.getByRole("combobox", { name: field }).fill(query);
  await page
    .getByRole("option", { name: new RegExp(name) })
    .first()
    .click();
}

export async function ready(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("main")).toBeVisible();
}

/** Creating a card shows the fee, then asks for the transaction PIN (any 6 digits except 000000). */
export async function createCardWithPin(page: Page) {
  await page.getByRole("button", { name: "Create card", exact: true }).click();
  const pin = page.getByRole("dialog", { name: "Enter your transaction PIN" });
  for (let i = 1; i <= 6; i++)
    await pin.getByLabel(`PIN digit ${i}`).fill(String(i));
  await pin.getByRole("button", { name: /^Create card/ }).click();
}

/** Approving a request asks for the transaction PIN (any 6 digits except 000000). */
export async function approveWithPin(
  page: Page,
  drawer: import("@playwright/test").Locator,
  action: string,
) {
  await drawer.getByRole("button", { name: action }).click();
  const pin = page.getByRole("dialog", { name: "Enter your transaction PIN" });
  for (let i = 1; i <= 6; i++)
    await pin.getByLabel(`PIN digit ${i}`).fill(String(i));
  await pin.getByRole("button", { name: action }).click();
}

/** Cards are for the company by default; this switches the create form to a card in a team member's name. */
export async function forTeamMember(page: Page) {
  await page.getByText("A team member", { exact: true }).click();
  await expect(
    page.getByRole("radio", { name: /A team member/ }),
  ).toBeChecked();
}

/** Pick an option from a design-system dropdown (it isn't a native <select>). */
export async function choose(
  page: Page,
  field: string,
  option: string | RegExp,
) {
  await page.getByRole("combobox", { name: field }).click();
  await page
    .getByRole(
      "option",
      typeof option === "string"
        ? { name: option, exact: true }
        : { name: option },
    )
    .click();
}

/** The transaction PIN dialog (six digits, any except 000000), then its action button. */
export async function enterPin(page: Page, action: string | RegExp) {
  const pin = page.getByRole("dialog", { name: "Enter your transaction PIN" });
  for (let i = 1; i <= 6; i++)
    await pin.getByLabel(`PIN digit ${i}`).fill(String(i));
  await pin.getByRole("button", { name: action }).click();
}
