// Features borrowed from Revolut, Wise and Mercury.
import { expect, test } from "@playwright/test";
import { asRole, ready, approveWithPin } from "./helpers";

test("a cardholder asks for a higher limit and the owner approves it", async ({ page }) => {
  await ready(page, "/cards/c_ops");
  await asRole(page, "cardholder");
  await page.goto("/cards/c_ops?tab=controls");
  const panel = page.locator("main");
  await panel.getByRole("button", { name: "Ask for more" }).click();
  await page.getByLabel(/New monthly limit/).fill("40000");
  await page.getByLabel(/Why do you need it/).fill("Team offsite flights.");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(panel.getByText(/Limit increase to \$40,000\.00 requested/)).toBeVisible();

  await asRole(page, "owner");
  await expect(page.getByRole("row", { name: /Ops travel/ })).toContainText("Limit request");
  await page.goto("/requests");
  await page.getByRole("row", { name: /Ops travel · up to \$40,000\.00/ }).click();
  const req = page.getByRole("dialog", { name: "Request details" });
  await expect(req).toContainText("Team offsite flights.");
  await approveWithPin(page, req, "Approve new limit");
  await expect(page.getByText("New limit approved")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/cards/c_ops");
  await expect(page.locator("main")).toContainText("$40,000.00 per month");
});

test("an admin lock can't be undone by the cardholder", async ({ page }) => {
  await ready(page, "/cards/c_ops?tab=controls");
  const panel = page.locator("main");
  await panel.getByRole("button", { name: "Lock", exact: true }).click();
  await page.getByLabel("Reason (optional)").fill("Suspected fraud");
  await page.getByRole("dialog").getByRole("button", { name: "Lock card" }).click();
  await expect(panel.getByText("Locked by Amara Okafor.").first()).toBeVisible();
  await expect(panel.getByRole("button", { name: "Unlock" }).first()).toBeVisible();

  await asRole(page, "cardholder");
  await page.goto("/cards/c_ops");
  const theirs = page.locator("main");
  await expect(theirs.getByRole("button", { name: "Locked by an admin" })).toBeDisabled();
  await expect(theirs.getByRole("button", { name: /unfreeze/i })).toHaveCount(0);
});

test("receipts, notes and the monthly statement", async ({ page }) => {
  await ready(page, "/cards/c_ops/transactions");
  await expect(page.getByText(/statement/).first()).toBeVisible();
  await page.getByRole("tab", { name: /Missing receipts/ }).click();
  await page.getByRole("button", { name: /Uber/ }).first().click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText("Missing receipt")).toBeVisible();
  await sheet.getByLabel("Receipt file").setInputFiles({ name: "uber-oct.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test") });
  await expect(page.getByText("Receipt added")).toBeVisible();
  await expect(sheet.getByText("uber-oct.pdf")).toBeVisible();
  await sheet.getByLabel("Category").selectOption({ label: "Local transport" });
  await expect(page.getByText("Category saved")).toBeVisible();
  await page.keyboard.press("Escape");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await download).suggestedFilename()).toBe("ops-travel-4821-transactions.csv");
});

test("create several cards at once, with a spending period, via a saved draft", async ({ page }) => {
  await ready(page, "/cards/new");
  await page.getByRole("combobox", { name: "Who will use it?" }).click();
  await page.getByRole("option", { name: /Tunde Bello/ }).click();
  await page.getByRole("textbox", { name: "Nickname" }).fill("Lagos summit");
  await page.getByRole("button", { name: "Add another card with the same settings" }).click();
  await page.getByLabel("Card 2 nickname").fill("Abuja summit");
  await page.getByRole("button", { name: "Continue" }).click();

  // Save and come back later
  await page.getByRole("button", { name: "Save and finish later" }).click();
  await expect(page.getByText("Draft saved. Find it in your card list.")).toBeVisible();
  const drafts = page.getByRole("region", { name: "Drafts" });
  await expect(drafts).toContainText("Lagos summit, Abuja summit");
  await drafts.getByRole("listitem").filter({ hasText: "Abuja summit" }).getByRole("link", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Where can it be used?" })).toBeVisible();

  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("switch", { name: /Only allow spending between certain dates/ }).click();
  await page.getByLabel("From").fill("2026-11-02");
  await page.getByLabel("Until").fill("2026-11-06");
  await expect(page.getByRole("complementary", { name: "Card summary" })).toContainText("2026-11-02 – 2026-11-06");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Create card" }).click();
  await expect(page.getByRole("heading", { name: "2 cards created" })).toBeVisible();
  await page.goto("/cards");
  await expect(page.getByRole("region", { name: "Drafts" })).not.toContainText("Abuja summit");
  await expect(page.getByRole("row", { name: /Abuja summit/ })).toBeVisible();
});

test("add a card to Apple Pay", async ({ page }) => {
  await ready(page, "/cards/c_sw");
  const panel = page.locator("main");
  await panel.getByRole("button", { name: "Add to Apple Pay" }).click();
  // Desktop: the modal shows the business and the card front and back to scan with the phone's Wallet
  const modal = page.getByRole("dialog", { name: "Add to Apple Pay" });
  await expect(modal).toContainText("Kola Logistics Ltd");
  await expect(modal.getByRole("img", { name: /Front of Software & tools: 4000 0012 3456 3307/ })).toBeVisible();
  await expect(modal.getByRole("img", { name: /Back of Software & tools/ })).toBeVisible();
  await modal.getByRole("button", { name: "I’ve added it" }).click();
  await expect(panel.getByRole("button", { name: "In Apple Pay" })).toBeDisabled();
  await expect(panel).toContainText("Mobile wallets");
});

test("spending abroad shows which balance pays, the rate and whether the card works", async ({ page }) => {
  await ready(page, "/cards/c_ops");
  await page.locator("main").getByRole("link", { name: "Spending abroad" }).click();
  await expect(page.getByRole("heading", { name: "Spend like a local in United Kingdom" })).toBeVisible();
  await expect(page.getByText(/You hold £12,400\.00 in GBP/)).toBeVisible();
  await expect(page.getByText("The card is active")).toBeVisible();

  await page.getByRole("combobox", { name: "Where are you going?" }).click();
  await page.getByRole("option", { name: /Canada/ }).click();
  await expect(page.getByRole("heading", { name: "Spend like a local in Canada" })).toBeVisible();
  await expect(page.getByText(/A CA\$150\.00 charge would be paid like this/)).toBeVisible();

  await page.getByLabel("From").fill("2026-11-02");
  await page.getByLabel("Until").fill("2026-11-06");
  await page.getByRole("button", { name: "Save trip dates" }).click();
  await expect(page.getByText("Trip dates saved on the card")).toBeVisible();
  await expect(page.getByText("Only works 2026-11-02 to 2026-11-06")).toBeVisible();
});

test("payments in other currencies can be turned off", async ({ page }) => {
  await ready(page, "/cards/c_ops?tab=controls");
  await page.locator("main").getByRole("switch", { name: "Payments in other currencies" }).click();
  await expect(page.getByText("Payments in other currencies turned off")).toBeVisible();

});

test("approving a request needs the transaction PIN", async ({ page }) => {
  await ready(page, "/requests");
  await page.getByRole("row", { name: /£620\.00/ }).click();
  const drawer = page.getByRole("dialog", { name: "Request details" });
  await drawer.getByRole("button", { name: "Approve once" }).click();
  const pin = page.getByRole("dialog", { name: "Enter your transaction PIN" });
  for (let i = 1; i <= 4; i++) await pin.getByLabel(`PIN digit ${i}`).fill("0");
  await pin.getByRole("button", { name: "Approve once" }).click();
  await expect(pin.getByText("That PIN isn’t right. Try again.")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("row", { name: /£620\.00/ })).toContainText("Waiting for decision");
});
