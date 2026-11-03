// Features borrowed from Revolut, Wise and Mercury.
import { expect, test } from "@playwright/test";
import {
  asRole,
  choose,
  createCardWithPin,
  forTeamMember,
  ready,
  approveWithPin,
} from "./helpers";

// Requests are hidden for now (card, limit, top-up and approval requests); the code stays.
test.skip("a cardholder asks for a higher limit and the owner approves it", async ({
  page,
}) => {
  await ready(page, "/cards/c_ops");
  await asRole(page, "cardholder");
  await page.goto("/cards/c_ops?tab=details");
  const panel = page.locator("main");
  await panel.getByRole("button", { name: "Request increase" }).click();
  await page.getByLabel("Daily limit").fill("40000");
  await page.getByLabel(/Why do you need it/).fill("Team offsite flights.");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(
    panel.getByText(/Limit increase to \$40,000\.00 a day requested/),
  ).toBeVisible();

  await asRole(page, "owner");
  await page.goto("/cards?card=c_ops");
  await expect(
    page.getByRole("region", { name: "Card summary" }),
  ).toContainText("Limit increase to $40,000.00 a day requested");
  await page.goto("/requests");
  await page
    .getByRole("row", { name: /Ops travel · \$40,000\.00 a day/ })
    .click();
  const req = page.getByRole("dialog", { name: "Request details" });
  await expect(req).toContainText("Team offsite flights.");
  await approveWithPin(page, req, "Approve new limit");
  await expect(page.getByText("New limit approved")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/cards/c_ops");
  // The daily limit is the new amount, and what's left is that minus what's been spent
  const summary = page.getByRole("region", { name: "Card summary" });
  await expect(summary).toContainText("$40,000.00");
  await expect(summary).toContainText(
    /\$39,9\d\d\.\d\d left of \$40,000\.00 today/,
  );
});

test("receipts and notes on a transaction", async ({ page }) => {
  await ready(page, "/cards/c_ops");
  // Missing receipts is one of the History filters, not a separate tab
  await expect(page.getByRole("tab", { name: /Missing receipts/ })).toHaveCount(
    0,
  );
  await choose(page, "Status", /Missing receipts/);
  await page.getByRole("button", { name: /Uber/ }).first().click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText("Missing receipt")).toBeVisible();
  await sheet.getByLabel("Receipt file").setInputFiles({
    name: "uber-oct.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 test"),
  });
  await expect(page.getByText("Receipt added")).toBeVisible();
  await expect(sheet.getByText("uber-oct.pdf")).toBeVisible();
  await sheet.getByRole("combobox", { name: "Category" }).click();
  await page.getByRole("option", { name: "Local transport" }).click();
  await expect(page.getByText("Category saved")).toBeVisible();
  await page.keyboard.press("Escape");
});

test("closing the create page part-way asks first, then the card is created", async ({
  page,
}) => {
  await ready(page, "/cards/new");
  await forTeamMember(page);
  await page
    .getByRole("combobox", { name: "Which team member is it for?" })
    .click();
  await page.getByRole("option", { name: /Tunde Bello/ }).click();
  await page.getByRole("textbox", { name: "Nickname" }).fill("Lagos summit");
  // One card at a time: there is no "add another card" option
  await expect(
    page.getByRole("button", { name: /Add another card/ }),
  ).toHaveCount(0);

  // Closing the page part-way asks first; there is no "save and finish later"
  await expect(
    page.getByRole("button", { name: "Save and finish later" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Close" }).click();
  const leave = page.getByRole("dialog", {
    name: "Leave without creating the card?",
  });
  await expect(leave).toBeVisible();
  await leave.getByRole("button", { name: "Keep editing" }).click();
  await expect(page.getByRole("textbox", { name: "Nickname" })).toHaveValue(
    "Lagos summit",
  );

  await createCardWithPin(page);
  await expect(
    page.getByRole("heading", { name: "Card created" }),
  ).toBeVisible();
  await page.goto("/cards");
  await expect(page.getByRole("row", { name: /Lagos summit/ })).toBeVisible();
});

// Requests are hidden for now (card, limit, top-up and approval requests); the code stays.
test.skip("approving a request needs the transaction PIN", async ({ page }) => {
  await ready(page, "/requests");
  await page.getByRole("row", { name: /£620\.00/ }).click();
  const drawer = page.getByRole("dialog", { name: "Request details" });
  await drawer.getByRole("button", { name: "Approve once" }).click();
  const pin = page.getByRole("dialog", { name: "Enter your transaction PIN" });
  for (let i = 1; i <= 6; i++) await pin.getByLabel(`PIN digit ${i}`).fill("0");
  await pin.getByRole("button", { name: "Approve once" }).click();
  await expect(pin.getByText("That PIN isn’t right. Try again.")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("row", { name: /£620\.00/ })).toContainText(
    "Waiting for decision",
  );
});

test("terminated cards live in Archived, with no intro text or filter hint", async ({
  page,
}) => {
  await ready(page, "/cards");
  // Not in the main list...
  await expect(page.getByRole("row", { name: /Old events/ })).toHaveCount(0);
  await expect(page.getByText("No filters applied")).toHaveCount(0);
  // ...but in Archived, straight away
  await page.goto("/cards?view=archived");
  await expect(page.getByRole("row", { name: /Old events/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /2025 offsite/ })).toBeVisible();
  await expect(page.getByText(/moved out of the main list/)).toHaveCount(0);
  await expect(page.getByText("No filters applied")).toHaveCount(0);
});

test("the sidebar shows the business logo, name and Foren tag, and no Requests", async ({
  page,
}) => {
  await ready(page, "/cards");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByText("Kola Logistics Ltd")).toBeVisible();
  await expect(nav.getByTestId("foren-tag")).toHaveText("@kolalogistics");
  await expect(nav.getByRole("link", { name: /Requests/ })).toHaveCount(0);
});

test("a funding row opens a transaction details drawer with the fee and the total taken", async ({
  page,
}) => {
  await ready(page, "/cards/c_ops");
  await choose(page, "Status", "Funded");
  await page
    .getByRole("row", { name: /Card funded/ })
    .first()
    .click();
  const drawer = page.getByRole("dialog", { name: "Card funded" });
  await expect(drawer).toContainText("How it was funded");
  await expect(drawer).toContainText("Added to the card");
  // 1% of $25,000.00 is more than the cap, so the fee is $100.00 and the total taken $25,100.00
  await expect(drawer.getByTestId("detail-funding-fee")).toContainText(
    "$100.00",
  );
  await expect(drawer).toContainText("Taken from your USD balance");
  await expect(drawer).toContainText("$25,100.00");
  await expect(drawer).toContainText("Reference");
});
