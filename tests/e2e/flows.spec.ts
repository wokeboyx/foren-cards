// One spec per usability task in the UX doc §13.
import { expect, test } from "@playwright/test";
import { asRole, demo, pickMerchant, ready, approveWithPin } from "./helpers";

test("create first card with safe defaults", async ({ page }) => {
  await ready(page, "/cards");
  await demo(page, "Start as a new account (no cards)");
  // The empty state explains what cards can do
  await expect(page.getByRole("heading", { name: "Virtual cards for every way your team spends" })).toBeVisible();
  await expect(page.getByText("Lock a card to one merchant")).toBeVisible();
  await expect(page.getByText("Treasury Mode")).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("link", { name: "Create your first card" }).click();

  // Step 1: who it's for (validated before moving on), with one progress bar
  await expect(page.getByRole("heading", { name: "Who’s this card for?" })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Create card progress" })).toHaveAttribute("aria-valuenow", "1");
  await page.getByRole("textbox", { name: "Nickname" }).fill("Team travel");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Choose who will use this card, or add someone who isn’t on Foren.")).toBeVisible();
  await page.getByRole("combobox", { name: "Who will use it?" }).click();
  await page.getByRole("option", { name: /Tunde Bello/ }).click();
  await expect(page.getByRole("combobox", { name: "Who will use it?" })).toContainText("Tunde Bello");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2: where it works, with safe defaults
  await expect(page.getByRole("heading", { name: "Where can it be used?" })).toBeVisible();
  await expect(page.getByText("Blocked · Gambling")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3: money. The summary says where the money comes from
  await expect(page.getByRole("radio", { name: /Cheapest FX/ })).toBeChecked();
  await expect(page.getByRole("complementary", { name: "Card summary" }).getByText("Money comes from")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 4: limits and expiry
  await expect(page.getByRole("heading", { name: "How much can it spend?" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 5: review and create
  await expect(page.getByRole("heading", { name: "Choose a design and review" })).toBeVisible();
  await page.getByRole("button", { name: "Create card" }).click();
  await expect(page.getByRole("heading", { name: "Card created" })).toBeVisible();
  await page.getByRole("button", { name: "View card details" }).click();
  await expect(page.getByRole("heading", { name: "Team travel", level: 1 })).toBeVisible();
});

test("issue failure keeps the entered values", async ({ page }) => {
  await ready(page, "/cards/new");
  await page.getByRole("textbox", { name: "Nickname" }).fill("Will fail");
  await page.getByRole("combobox", { name: "Who will use it?" }).click();
  await page.getByPlaceholder("Search by name or email").fill("zai");
  await page.getByRole("option", { name: /Zainab Musa/ }).click();
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Open prototype demo controls" }).click();
  await page.getByRole("switch", { name: /Fail saves/ }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Create card" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "We couldn’t issue this card" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("textbox", { name: "Nickname" })).toHaveValue("Will fail");
});


test("freeze, edit limit and rename from the card page", async ({ page }) => {
  await ready(page, "/cards");
  await page.getByRole("button", { name: /Ops travel/ }).first().click();
  await expect(page).toHaveURL(/\/cards\/c_ops$/);
  const main = page.locator("main");
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Ops travel");

  // One tap to freeze, from the action row or the Freeze card switch
  await main.getByRole("button", { name: "Freeze", exact: true }).click();
  await expect(page.getByText("Card frozen. Payments will fail until you unfreeze it.")).toBeVisible();
  await main.getByRole("tab", { name: "Card controls" }).click();
  await expect(main.getByRole("switch", { name: "Freeze card" })).toBeChecked();
  await main.getByRole("switch", { name: "Freeze card" }).click();
  await expect(main.getByRole("button", { name: "Freeze", exact: true })).toBeVisible();

  // Card controls: switches apply straight away and say what they do
  const fx = main.getByRole("switch", { name: "Payments in other currencies" });
  await fx.click();
  await expect(fx).not.toBeChecked();
  await expect(main.getByText("Only NGN charges go through.")).toBeVisible();

  await main.getByRole("listitem").filter({ hasText: "Spending limit" }).getByRole("button", { name: "Change" }).click();
  const save = page.getByRole("button", { name: "Save limit" });
  await expect(save).toBeDisabled();
  await page.getByLabel("Spend limit").fill("30000");
  await page.getByText("This is a temporary change").click();
  await save.click();
  await expect(main.getByText(/\$30,000\.00 per month/).first()).toBeVisible();

  await main.getByRole("listitem").filter({ hasText: "Nickname" }).getByRole("button", { name: "Change" }).click();
  await page.getByRole("textbox", { name: "Card nickname" }).fill("Ops travel EU");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ops travel EU", level: 1 })).toBeVisible();

  // Every change is in the card's history, with who made it
  await main.getByRole("listitem").filter({ hasText: "History" }).getByRole("button", { name: "View" }).click();
  const history = page.getByRole("dialog", { name: "History" });
  await expect(history.getByText("Nickname changed from “Ops travel” to “Ops travel EU”")).toBeVisible();
  await expect(history.getByText("Status changed from “Active” to “Frozen”")).toBeVisible();
  await expect(history.getByText("Payments in other currencies turned off")).toBeVisible();
  await expect(history.getByText(/Spending limit changed from .* to \$30,000\.00/)).toBeVisible();
  await expect(history.getByText(/Amara Okafor/).first()).toBeVisible();
});

test("card details show in place on the card page", async ({ page }) => {
  await ready(page, "/cards/c_ops");
  const main = page.locator("main");
  await expect(main.getByText("•••• •••• •••• 4821")).toBeVisible();
  await main.getByRole("button", { name: "Show details" }).click();
  await expect(main.getByText("4000 0012 3456 4821")).toBeVisible();
  await main.getByRole("button", { name: "Copy card number" }).click();
  await expect(page.getByText("Card number copied")).toBeVisible();
  await main.getByRole("button", { name: "Hide details" }).click();
  await expect(main.getByText("4000 0012 3456 4821")).toHaveCount(0);
});

test("cancel offers freezing instead", async ({ page }) => {
  await ready(page, "/cards/c_sw?tab=controls");
  await page.locator("main").getByRole("button", { name: "Cancel card" }).click();
  const sheet = page.getByRole("dialog", { name: /Cancel the card ending in/ });
  await expect(sheet.getByText("This card can’t be used again. This can’t be undone.")).toBeVisible();
  await sheet.getByRole("button", { name: "Freeze instead" }).click();
  await expect(page.getByRole("dialog", { name: "Are you sure you want to freeze this card?" })).toBeVisible();
});

test("check whether a card will work at a new merchant", async ({ page }) => {
  await ready(page, "/cards/check-merchant?card=c_ops");
  await pickMerchant(page, "Corner bakery", "Check “Corner bakery”", "Search for a merchant");
  await expect(page.getByText("No history yet").first()).toBeVisible();
  await expect(page.getByText(/can’t promise this payment will succeed/)).toBeVisible();

  await pickMerchant(page, "Adobe", "Adobe Creative Cloud", "Search for a merchant");
  await expect(page.getByText("Setup needed").first()).toBeVisible();
  await expect(page.getByText(/billing address/)).toBeVisible();
});

test("approval expires after the retry window", async ({ page }) => {
  await ready(page, "/cards");
  await asRole(page, "owner");
  await page.goto("/requests");
  await page.getByRole("row", { name: /£620\.00/ }).click();
  const panel = page.getByRole("dialog", { name: "Request details" });
  await approveWithPin(page, panel, "Approve once");
  await expect(page.getByText(/Approved for one charge\. Tunde has 15 minutes/)).toBeVisible();
  await page.keyboard.press("Escape");
  await demo(page, "+16 min");
  await page.getByRole("tab", { name: "History" }).click();
  await expect(page.getByRole("row", { name: /£620\.00/ })).toContainText("Expired");
});

test("find next week's subscription charges and block one merchant", async ({ page }) => {
  await ready(page, "/subscriptions");
  await expect(page.getByRole("columnheader", { name: /Due in the next 7 days/ })).toBeVisible();
  const notion = page.getByRole("row", { name: /Notion/ });
  await expect(notion).toContainText("Due soon");
  await expect(page.getByText("Estimate").first()).toBeVisible();
  await expect(page.getByText("Not enough history").first()).toBeVisible();

  await notion.click();
  const panel = page.getByRole("dialog", { name: "Notion" });
  await panel.getByRole("button", { name: "Block", exact: true }).click();
  await expect(page.getByText("This does not cancel your subscription with the merchant.")).toBeVisible();
  await page.getByRole("button", { name: "Block merchant" }).click();
  await expect(page.getByText("Notion blocked on Software & tools")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("row", { name: /Notion/ })).toContainText("Blocked");
});

test("explain why a transaction used a particular balance", async ({ page }) => {
  await ready(page, "/cards/c_ops/transactions");
  await page.getByRole("row", { name: /Split across balances/ }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText("This charge was split across 2 balances.")).toBeVisible();
  await expect(sheet.getByText("GBP balance")).toBeVisible();
  await expect(sheet.getByText("FX fee")).toBeVisible();
  await expect(sheet.getByText(/1 USD = 0\.7900 GBP/)).toBeVisible();
});

test("create a company card locked to its first merchant, for someone not on Foren", async ({ page }) => {
  await ready(page, "/cards/new");
  // Step 1: company card for someone not on Foren yet
  await page.getByText("The company", { exact: true }).click();
  await expect(page.getByRole("radio", { name: /The company/ })).toBeChecked();
  await page.getByRole("combobox", { name: "Who can use and manage it?" }).click();
  await page.getByRole("button", { name: "Add someone who isn’t on Foren" }).click();
  await page.getByLabel("Full name").fill("Dayo Ade");
  await page.getByLabel("Work email").fill("dayo@kolalogistics.test");
  await page.getByRole("button", { name: "Add and select" }).click();
  await expect(page.getByRole("combobox", { name: "Who can use and manage it?" })).toContainText("Dayo Ade");
  await page.getByRole("textbox", { name: "Nickname" }).fill("Supplier payments");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2: one merchant vs many, each with its advantage and trade-off
  await expect(page.getByText("Each other subscription needs its own card.")).toBeVisible();
  await expect(page.getByText("Freezing it stops every merchant on it at once.")).toBeVisible();
  await page.getByText("One merchant", { exact: true }).click();
  await expect(page.getByRole("radio", { name: /One merchant/ })).toBeChecked();
  await expect(page.getByText("Which merchants can it pay?")).toHaveCount(0);
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3: protect any currency, not just USD
  await page.getByText("Protect a currency", { exact: true }).click();
  await page.getByRole("combobox", { name: "Which currency do you want to protect?" }).click();
  await page.getByRole("option", { name: /British pound sterling \(GBP\)/ }).click();
  await expect(page.getByRole("combobox", { name: "Which currency do you want to protect?" })).toContainText("British pound sterling (GBP)");
  const summary = page.getByRole("complementary", { name: "Card summary" });
  await expect(summary).toContainText("Protect GBP");
  await expect(summary).toContainText("Company card, used by");
  await expect(summary).toContainText("Locks to the first merchant that charges it");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Create card" }).click();
  await expect(page.getByText("We’ve emailed Dayo Ade an invite.")).toBeVisible();
  await page.getByRole("button", { name: "View card details" }).click();
  await expect(page.getByRole("heading", { name: "Supplier payments", level: 1 })).toBeVisible();
  await page.goto("/cards");
  await expect(page.getByRole("row", { name: /Supplier payments/ })).toContainText("Locks on first use");
  await expect(page.getByRole("row", { name: /Supplier payments/ })).toContainText("Company card");
});



test("a team member requests a card; it shows as pending in the card list until the owner approves it", async ({ page }) => {
  await ready(page, "/cards");
  await asRole(page, "cardholder");
  // Same place as the owner's Create card
  await page.getByRole("link", { name: "Request card" }).click();
  await expect(page.getByRole("progressbar", { name: "Request card progress" })).toBeVisible();
  await page.getByLabel("Card name").fill("Abuja trip");
  await page.getByLabel(/Why do you need it/).fill("Flights and hotel for the client visit.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Monthly limit").fill("800");
  await expect(page.getByRole("complementary", { name: "Request summary" })).toContainText("Up to $800.00 per month");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("heading", { name: "Request sent" })).toBeVisible();
  await page.getByRole("link", { name: "View request" }).click();
  await expect(page.getByRole("dialog", { name: "Request details" })).toContainText("Abuja trip");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("row", { name: /Abuja trip/ })).toContainText("Pending request");

  // The owner sees it in the same card list and approves it there
  await asRole(page, "owner");
  const row = page.getByRole("row", { name: /Abuja trip/ });
  await expect(row).toContainText("Pending request");
  await row.click();
  const panel = page.getByRole("dialog", { name: "Request details" });
  await expect(panel).toContainText("Flights and hotel for the client visit.");
  await approveWithPin(page, panel, "Approve and create");
  await expect(page.getByText("Card created for Tunde")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("row", { name: /Abuja trip/ })).not.toContainText("Pending request");
  await expect(page.getByRole("row", { name: /Abuja trip/ })).toContainText("Tunde Bello");
});
