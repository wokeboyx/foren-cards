// One spec per usability task in the UX doc §13.
import { expect, test } from "@playwright/test";
import {
  asRole,
  choose,
  enterPin,
  createCardWithPin,
  demo,
  forTeamMember,
  ready,
  approveWithPin,
} from "./helpers";

test("create first card with safe defaults", async ({ page }) => {
  await ready(page, "/cards");
  await demo(page, "Start as a new account (no cards)");
  // The empty state explains what cards can do
  await expect(
    page.getByRole("heading", {
      name: "Create your first card",
    }),
  ).toBeVisible();
  // The terms and the limits and fees are one click away
  await page.getByRole("button", { name: "card terms and conditions" }).click();
  const terms = page.getByRole("dialog", { name: "Card terms and conditions" });
  await expect(terms).toContainText("Up to 15 active cards at a time");
  await expect(terms).toContainText("Funding fee");
  await expect(terms).toContainText("Withdrawal fee");
  await expect(terms).toContainText("Limit per transaction");
  await terms
    .getByRole("button", { name: "Close", exact: true })
    .first()
    .click();
  // The cost is stated before they start
  await expect(page.getByTestId("creation-fee")).toContainText("$2.00");
  // Three short features under one action
  const features = page.getByRole("list", { name: "Features" });
  await expect(features.getByRole("listitem")).toHaveCount(3);
  await expect(features).toContainText("Freeze any time");
  // Create card is one plain button: there is only one kind of card
  await page.getByRole("link", { name: "Create card" }).click();
  await expect(page.getByRole("menu")).toHaveCount(0);

  // Everything is on one page, with no progress bar. The card is for the company by default, and only the admin can see it
  await expect(
    page.getByRole("heading", { name: "Create a card", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect(
    page.getByRole("radio", { name: /For Kola Logistics Ltd/ }),
  ).toBeChecked();
  await expect(
    page.getByText("Only you can see and manage this card."),
  ).toBeVisible();
  // What it costs and which balance pays for it, before creating; the card count only shows when the account is close to its limit
  await expect(
    page.getByRole("combobox", { name: "Pay the creation fee from" }),
  ).toContainText("USD");
  await expect(
    page.getByText(/\$2\.00 once, when you create the card/),
  ).toBeVisible();
  await expect(page.getByText(/of 15 active cards used/)).toHaveCount(0);
  await expect(page.getByText(/This card expires in 12 months/)).toHaveCount(0);
  // Create card stays disabled until the form is complete
  await expect(
    page.getByRole("button", { name: "Create card", exact: true }),
  ).toBeDisabled();
  await page.getByRole("textbox", { name: "Nickname" }).fill("Team travel");
  await expect(
    page.getByRole("button", { name: "Create card", exact: true }),
  ).toBeEnabled();
  // A card for a team member needs someone picked
  await forTeamMember(page);
  await expect(
    page.getByRole("button", { name: "Create card", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("combobox", { name: "Which team member is it for?" })
    .click();
  await page.getByRole("option", { name: /Tunde Bello/ }).click();
  await expect(
    page.getByRole("combobox", { name: "Which team member is it for?" }),
  ).toContainText("Tunde Bello");

  // Limits are on the same page. There is no merchant step, no funding step and no review step: the card starts empty.
  await expect(page.getByText("Which merchants can it pay?")).toHaveCount(0);
  await expect(page.getByText("Check a merchant")).toHaveCount(0);
  await expect(page.getByText("Fund your card", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByText("Spending period")).toHaveCount(0);
  await expect(page.getByText("Cheapest FX")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "How much can it spend?" }),
  ).toBeVisible();
  // Default limits, which can be changed. The transaction limit can't be more than the daily one.
  await expect(page.getByLabel("Daily limit")).toHaveValue("1000");
  await expect(page.getByLabel("Transaction limit")).toHaveValue("500");
  await page.getByLabel("Daily limit").fill("2500");
  await expect(page.getByLabel("Daily limit")).toHaveValue("2500");
  await page.getByLabel("Transaction limit").fill("3000");
  await expect(
    page.getByText("The transaction limit can’t be more than the daily limit."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create card", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Transaction limit").fill("400");
  const summary = page.getByRole("complementary", { name: "Card summary" });
  await expect(summary).toContainText("Creation fee");
  await expect(summary).toContainText("$2.00");
  await expect(summary).not.toContainText("Where it works");
  await expect(
    page.getByText(/\$2\.00 once, when you create the card/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create card", exact: true }).click();
  const pin = page.getByRole("dialog", { name: "Enter your transaction PIN" });
  for (let i = 1; i <= 6; i++) await pin.getByLabel(`PIN digit ${i}`).fill("0");
  await pin.getByRole("button", { name: /^Create card/ }).click();
  await expect(pin.getByText("That PIN isn’t right. Try again.")).toBeVisible();
  for (let i = 1; i <= 6; i++)
    await pin.getByLabel(`PIN digit ${i}`).fill(String(i));
  await pin.getByRole("button", { name: /^Create card/ }).click();
  await expect(
    page.getByRole("heading", { name: "Card created" }),
  ).toBeVisible();
  await expect(page.getByText(/no balance yet/)).toBeVisible();
  // The success screen shows what was set up and paid, and offers to fund the card
  const created = page.getByRole("main");
  await expect(created).toContainText("$2.00");
  await expect(created).toContainText(
    "$2,500.00 a day · $400.00 a transaction",
  );
  await expect(page.getByRole("button", { name: "Fund card" })).toBeVisible();
  await page.getByRole("button", { name: "View card details" }).click();
  await expect(
    page.getByRole("heading", { name: "Team travel", level: 1 }),
  ).toBeVisible();
  // The card shows its balance, and a way to top it up
  await expect(page.getByTestId("card-balance")).toHaveText("$0.00");
  await expect(
    page.getByText("This card has no balance, so payments will be declined."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Fund card" }).first(),
  ).toBeVisible();
});

test("issue failure keeps the entered values", async ({ page }) => {
  await ready(page, "/cards/new");
  await page.getByRole("textbox", { name: "Nickname" }).fill("Will fail");
  await forTeamMember(page);
  await page
    .getByRole("combobox", { name: "Which team member is it for?" })
    .click();
  await page.getByPlaceholder("Search by name or email").fill("zai");
  await page.getByRole("option", { name: /Zainab Musa/ }).click();
  await page
    .getByRole("button", { name: "Open prototype demo controls" })
    .click();
  await page.getByRole("switch", { name: /Fail saves/ }).click();
  await page.keyboard.press("Escape");
  await createCardWithPin(page);
  await expect(
    page.getByRole("alert").filter({ hasText: "We couldn’t issue this card" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Nickname" })).toHaveValue(
    "Will fail",
  );
});

test("a card opens in a panel beside the list: freeze, edit the limit and rename from it", async ({
  page,
}) => {
  await ready(page, "/cards");
  await page
    .getByRole("button", { name: /Ops travel/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/cards\?card=c_ops$/);
  const panel = page.getByRole("region", { name: "Card summary" });
  await expect(panel).toContainText("Ops travel");

  // Mercury's row: Fund, Freeze, Transactions and More. Terminate lives under More; there is no lock card
  await expect(
    panel.getByRole("button", { name: "Terminate card" }),
  ).toHaveCount(0);
  await panel.getByRole("button", { name: "More" }).click();
  await expect(
    page.getByRole("button", { name: "Terminate card" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Lock/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  // Freezing asks first, in a dialog. Going back leaves the card as it is
  await panel.getByRole("button", { name: "Freeze", exact: true }).click();
  const freezeDialog = page.getByRole("dialog", {
    name: "Are you sure you want to freeze this card?",
  });
  await expect(freezeDialog).toContainText("Ops travel");
  await freezeDialog.getByRole("button", { name: "Go back" }).click();
  await expect(freezeDialog).toHaveCount(0);
  await expect(
    panel.getByRole("button", { name: "Freeze", exact: true }),
  ).toBeVisible();
  await panel.getByRole("button", { name: "Freeze", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Are you sure you want to freeze this card?" })
    .getByRole("button", { name: "Freeze card" })
    .click();
  // Freezing needs the transaction PIN
  await enterPin(page, "Freeze card");
  await expect(page.getByText("Card frozen")).toBeVisible();
  await panel.getByRole("button", { name: "Unfreeze", exact: true }).click();
  await expect(
    panel.getByRole("button", { name: "Freeze", exact: true }),
  ).toBeVisible();

  // Limits are edited from More only; there is no second entry point beside the bar
  await expect(panel.getByRole("button", { name: "Edit limits" })).toHaveCount(
    0,
  );
  await panel.getByRole("button", { name: "More" }).click();
  await page.getByRole("button", { name: "Edit limit" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit card limits" });
  const save = dialog.getByRole("button", { name: "Save limit" });
  await expect(save).toBeDisabled();
  await dialog.getByLabel("Daily limit").fill("30000");
  await expect(dialog.getByText("temporary change")).toHaveCount(0);
  await save.click();
  await expect(panel).toContainText("$30,000.00");

  // The nickname is under More
  await panel.getByRole("button", { name: "More" }).click();
  await page.getByRole("button", { name: "Edit nickname" }).click();
  await page
    .getByRole("textbox", { name: "Card nickname" })
    .fill("Ops travel EU");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    panel.getByRole("heading", { name: "Ops travel EU" }),
  ).toBeVisible();

  // Every change is in the card's change log, with who made it
  await panel.getByRole("button", { name: "More" }).click();
  await page.getByRole("button", { name: "Change log" }).click();
  const history = page.getByRole("dialog", { name: "Change log" });
  await expect(
    history.getByText("Nickname changed from “Ops travel” to “Ops travel EU”"),
  ).toBeVisible();
  await expect(
    history.getByText("Status changed from “Active” to “Frozen”"),
  ).toBeVisible();
  await expect(
    history.getByText(/Spending limit changed from .* to \$30,000\.00/),
  ).toBeVisible();
  await expect(history.getByText(/Amara Okafor/).first()).toBeVisible();
  await page.keyboard.press("Escape");

  // "All card details and activity" opens the full page, with the panel kept beside the tabs
  await panel
    .getByRole("link", { name: /All card details and activity/ })
    .click();
  await expect(page).toHaveURL(/\/cards\/c_ops$/);
  await expect(
    page.getByRole("region", { name: "Card summary" }),
  ).toBeVisible();
});

test("card details need the PIN, show in place, and hide again after 45 seconds", async ({
  page,
}) => {
  await ready(page, "/cards/c_ops");
  const main = page.locator("main");
  await main.getByRole("tab", { name: "Card details" }).click();
  await expect(main.getByText("•••• •••• •••• 4821")).toBeVisible();
  await main
    .getByRole("tabpanel")
    .getByRole("button", { name: "Show details" })
    .click();
  // The number only shows once the PIN is accepted
  await expect(main.getByText("4000 0012 3456 4821")).toHaveCount(0);
  await enterPin(page, "Show details");
  await expect(main.getByText("4000 0012 3456 4821")).toBeVisible();
  await expect(main.getByTestId("reveal-countdown")).toContainText("hides in");
  await main.getByRole("button", { name: "Copy card number" }).click();
  await expect(page.getByText("Card number copied")).toBeVisible();
  await main.getByRole("button", { name: "Hide details" }).click();
  await expect(main.getByText("4000 0012 3456 4821")).toHaveCount(0);
});

test("revealed card details hide themselves after 45 seconds", async ({
  page,
}) => {
  await page.clock.install();
  await ready(page, "/cards/c_ops");
  const main = page.locator("main");
  await main.getByRole("tab", { name: "Card details" }).click();
  await main
    .getByRole("tabpanel")
    .getByRole("button", { name: "Show details" })
    .click();
  await enterPin(page, "Show details");
  await expect(main.getByText("4000 0012 3456 4821")).toBeVisible();
  await page.clock.runFor(44_000);
  await expect(main.getByText("4000 0012 3456 4821")).toBeVisible();
  await page.clock.runFor(2_000);
  await expect(main.getByText("4000 0012 3456 4821")).toHaveCount(0);
});

test("terminate offers freezing instead, and has no Go back button", async ({
  page,
}) => {
  await ready(page, "/cards/c_sw");
  await page
    .getByRole("region", { name: "Card summary" })
    .getByRole("button", { name: "More" })
    .click();
  await page.getByRole("button", { name: "Terminate card" }).click();
  const sheet = page.getByRole("dialog", {
    name: /Terminate the card ending in/,
  });
  await expect(sheet.getByRole("button", { name: "Go back" })).toHaveCount(0);
  await expect(
    sheet.getByText("This card can’t be used again. This can’t be undone."),
  ).toBeVisible();
  await sheet.getByRole("button", { name: "Freeze instead" }).click();
  await expect(
    page.getByRole("dialog", {
      name: "Are you sure you want to freeze this card?",
    }),
  ).toBeVisible();
});

// Requests are hidden for now (card, limit, top-up and approval requests); the code stays.
test.skip("approval expires after the retry window", async ({ page }) => {
  await ready(page, "/cards");
  await asRole(page, "owner");
  await page.goto("/requests");
  await page.getByRole("row", { name: /£620\.00/ }).click();
  const panel = page.getByRole("dialog", { name: "Request details" });
  await approveWithPin(page, panel, "Approve once");
  await expect(
    page.getByText(/Approved for one charge\. Tunde has 15 minutes/),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await demo(page, "+16 min");
  await page.getByRole("tab", { name: "History" }).click();
  await expect(page.getByRole("row", { name: /£620\.00/ })).toContainText(
    "Expired",
  );
});

test("explain why a transaction used a particular balance", async ({
  page,
}) => {
  await ready(page, "/cards/c_ops/transactions");
  await page.getByRole("row", { name: /British Airways/ }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText("Card balance")).toBeVisible();
  await expect(sheet.getByText("FX fee")).toBeVisible();
  await expect(sheet.getByText(/1 USD = 0\.7900 GBP/)).toBeVisible();
});

test("create a card for a team member who isn't on Foren yet", async ({
  page,
}) => {
  await ready(page, "/cards/new");
  // Step 1: the card is for the company until you choose a team member, for someone not on Foren yet
  await forTeamMember(page);
  await page
    .getByRole("combobox", { name: "Which team member is it for?" })
    .click();
  // The account admin isn't "staff": they aren't in the list
  await expect(page.getByRole("option", { name: /Amara Okafor/ })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Add someone who isn’t on Foren" })
    .click();
  await page.getByLabel("Full name").fill("Dayo Ade");
  await page.getByLabel("Work email").fill("dayo@kolalogistics.test");
  await page.getByRole("button", { name: "Add and select" }).click();
  await expect(
    page.getByRole("combobox", { name: "Which team member is it for?" }),
  ).toContainText("Dayo Ade");
  await page
    .getByRole("textbox", { name: "Nickname" })
    .fill("Supplier payments");

  // Step 2: limits are set in USD only, shown with the flag
  await expect(page.getByText("Limits are set in USD only.")).toHaveCount(0);
  const summary = page.getByRole("complementary", { name: "Card summary" });
  await expect(summary).toContainText("Creation fee");
  await expect(summary).toContainText("USD balance");

  await createCardWithPin(page);
  await expect(
    page.getByText("We’ve emailed Dayo Ade an invite."),
  ).toBeVisible();
  await page.getByRole("button", { name: "View card details" }).click();
  await expect(
    page.getByRole("heading", { name: "Supplier payments", level: 1 }),
  ).toBeVisible();
  await expect(page.getByTestId("card-balance")).toHaveText("$0.00");
});

test("a company card is the default, and only the admin sees it: no one to choose", async ({
  page,
}) => {
  await ready(page, "/cards/new");
  await expect(
    page.getByRole("radio", { name: /For Kola Logistics Ltd/ }),
  ).toBeChecked();
  await expect(
    page.getByRole("combobox", { name: /Which team member|Who will use/ }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Only you can see and manage this card."),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Nickname" })
    .fill("Cloud subscriptions");
  await expect(
    page.getByRole("button", { name: "Create card", exact: true }),
  ).toBeEnabled();
  // The admin's name isn't shown
  await expect(page.getByRole("main")).not.toContainText("Amara Okafor");
  await createCardWithPin(page);
  await expect(
    page.getByRole("heading", { name: "Card created" }),
  ).toBeVisible();
  await expect(page.getByText(/no balance yet/)).toBeVisible();
  await page.goto("/cards");
  await expect(
    page.getByRole("row", { name: /Cloud subscriptions/ }),
  ).toContainText("Company card");
  await expect(
    page.getByRole("row", { name: /Cloud subscriptions/ }),
  ).toContainText("Not funded");
});

test("fund a new card straight from the success screen", async ({ page }) => {
  await ready(page, "/cards/new");
  await page.getByRole("textbox", { name: "Nickname" }).fill("Ads spend");
  await createCardWithPin(page);
  await expect(page.getByText(/no balance yet/)).toBeVisible();
  await page.getByRole("button", { name: "Fund card" }).click();
  const dialog = page.getByRole("dialog", { name: "Fund this card" });
  await dialog.getByLabel(/Amount to add/).fill("100");
  await dialog.getByRole("button", { name: "Next" }).click();
  await dialog.getByRole("button", { name: "Add money" }).click();
  await enterPin(page, /^Add \$/);
  // The money is on the card: a status page, like the Figma "Request sent" page
  await expect(
    page.getByRole("heading", { name: "Card funded" }),
  ).toBeVisible();
  // Three buttons across the column: outline, outline, then the dark main step
  await expect(
    page.getByRole("button", { name: "View card", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Got it" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByText(/Balance:/)).toContainText("$100.00");
  await expect(page.getByText(/no balance yet/)).toHaveCount(0);
});

test("fund a card from one of your balances", async ({ page }) => {
  await ready(page, "/cards/c_ops");
  await expect(page.getByTestId("card-balance")).toHaveText("$50,000.00");
  // Money added earlier is already in the history: filter to what was funded
  await choose(page, "Status", "Funded");
  const funded = page.getByRole("row", { name: /Card funded/ });
  await expect(funded).toHaveCount(2);
  await expect(funded.first()).toContainText("USD balance");
  await page.getByRole("button", { name: "Fund card" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Fund this card" });
  // Pick which multi-currency balance pays, then how much goes onto the card
  await dialog.getByRole("combobox", { name: "Fund from" }).click();
  await page.getByRole("option", { name: /GBP/ }).click();
  await dialog.getByLabel(/Amount to add/).fill("100");
  await expect(dialog.getByText("Conversion fee")).toBeVisible();
  await expect(dialog.getByText("Exchange rate")).toBeVisible();
  await expect(dialog.getByText(/1 USD ≈ .* GBP/)).toBeVisible();
  await expect(dialog.getByText("You pay")).toBeVisible();
  await dialog.getByRole("combobox", { name: "Fund from" }).click();
  await page.getByRole("option", { name: /USD/ }).click();
  await dialog.getByLabel(/Amount to add/).fill("100");
  await expect(dialog.getByText("Conversion fee")).toHaveCount(0);
  // Putting money on a card costs a funding fee: 1% of the amount, capped at $100
  await expect(dialog.getByTestId("funding-fee")).toContainText("$1.00");
  await expect(
    dialog.getByText("1% of the amount, capped at $100.00"),
  ).toBeVisible();
  // Then a review of what goes where, before confirming
  await dialog.getByRole("button", { name: "Next" }).click();
  await expect(dialog.getByText("Review the details")).toBeVisible();
  // Paying from USD for a USD card: no conversion, so no exchange rate and the fee is free
  await expect(dialog.getByText("From USD balance")).toBeVisible();
  await expect(dialog.getByTestId("exchange-rate")).toHaveCount(0);
  // The funding fee is on top of the amount: $100.00 + $1.00 comes off the USD balance
  await expect(dialog.getByTestId("funding-fee")).toContainText("$1.00");
  await expect(dialog.getByText("$101.00", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Add money" }).click();
  await enterPin(page, /^Add \$/);
  // The money is on the card: a status page, like the Figma "Request sent" page
  await expect(
    page.getByRole("heading", { name: "Card funded" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByTestId("card-balance")).toHaveText("$50,100.00");
  // The top-up joins the history straight away
  await expect(funded).toHaveCount(3);
  await expect(funded.first()).toContainText("$100.00");
  // Funding isn't a payment: it doesn't count as spend
  await expect(page.getByTestId("left-today")).not.toContainText(
    "$100.00 left",
  );
});

// Requests are hidden for now (card, limit, top-up and approval requests); the code stays.
test.skip("a team member requests a card; it shows as pending in the card list until the owner approves it", async ({
  page,
}) => {
  await ready(page, "/cards");
  await asRole(page, "cardholder");
  // Same place as the owner's Create card
  await page.getByRole("link", { name: "Request card" }).click();
  // One page, like Create a card: no steps or progress bar
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Nickname" }).fill("Abuja trip");
  await page
    .getByLabel(/Why do you need it/)
    .fill("Flights and hotel for the client visit.");
  await page.getByLabel("Daily limit").fill("800");
  // The preview fills in as they type, and says who pays the fee
  const summary = page.getByRole("complementary", { name: "Request summary" });
  await expect(summary).toContainText("Abuja trip");
  await expect(summary).toContainText("$800.00");
  await expect(summary).toContainText("$500.00");
  await expect(summary).toContainText("$2.00");
  await expect(summary).toContainText("Paid by Amara when they approve");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(
    page.getByRole("heading", { name: "Request sent" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View request" }).click();
  await expect(
    page.getByRole("dialog", { name: "Request details" }),
  ).toContainText("Abuja trip");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("row", { name: /Abuja trip/ })).toContainText(
    "Pending request",
  );

  // The owner sees it in the same card list and approves it there
  await asRole(page, "owner");
  const row = page.getByRole("row", { name: /Abuja trip/ });
  await expect(row).toContainText("Pending request");
  await row.click();
  const panel = page.getByRole("dialog", { name: "Request details" });
  await expect(panel).toContainText("Flights and hotel for the client visit.");
  await expect(panel).toContainText("Creation fee");
  await approveWithPin(page, panel, "Approve and create");
  await expect(page.getByText("Card created for Tunde")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("row", { name: /Abuja trip/ })).not.toContainText(
    "Pending request",
  );
  await expect(page.getByRole("row", { name: /Abuja trip/ })).toContainText(
    "Tunde Bello",
  );
});

test("a card that's about to expire says so in its panel, and the note explains how to replace it", async ({
  page,
}) => {
  await ready(page, "/cards?card=c_ops");
  const panel = page.getByRole("region", { name: "Card summary" });
  await expect(panel).toContainText("Expires");
  await panel.getByRole("button", { name: "Replace it" }).click();
  const dialog = page.getByRole("dialog", {
    name: "This card is expiring soon",
  });
  await expect(dialog.getByText("1. Get a new card")).toBeVisible();
  await expect(dialog.getByText("2. Replace it where it’s used")).toBeVisible();
  await expect(dialog.getByText(/update it on each site or app/)).toBeVisible();
  await dialog.getByRole("button", { name: "Create a new card" }).click();
  await expect(page.getByRole("textbox", { name: "Nickname" })).toHaveValue(
    "Ops travel",
  );
});

test("a card's name and colour share a row: pick a colour from a dropdown", async ({
  page,
}) => {
  await ready(page, "/cards/new");
  await page.getByRole("textbox", { name: "Nickname" }).fill("Skin check");
  const colour = page.getByRole("combobox", { name: "Card colour" });
  await expect(colour).toContainText("Ink");
  await colour.click();
  const list = page.getByRole("listbox", { name: "Card colour" });
  for (const name of ["Ink", "Silver", "Cobalt", "Clay", "Chalk", "Lime"])
    await expect(list.getByRole("option", { name })).toBeVisible();
  await list.getByRole("option", { name: "Clay" }).click();
  await expect(colour).toContainText("Clay");
  await expect(
    page.getByRole("img", { name: /Skin check card ending/ }),
  ).toBeVisible();

  // One card at a time: no "add another card", and the summary shows the fee
  await expect(
    page.getByRole("button", { name: /Add another card/ }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Card details so far")).toContainText(
    "Creation fee",
  );

  // A frozen card shows "Frozen" on the card itself
  await ready(page, "/cards/c_lagos");
  await expect(
    page.getByRole("img", { name: /card ending .*frozen/ }).first(),
  ).toBeVisible();
});

test("Create card is a single button with no dropdown", async ({ page }) => {
  await ready(page, "/cards");
  await page.getByRole("link", { name: "Create card", exact: true }).click();
  await expect(page).toHaveURL(/\/cards\/new$/);
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(
    page.getByRole("radio", { name: /For Kola Logistics Ltd/ }),
  ).toBeChecked();
});

test("pick which balance pays the card creation fee", async ({ page }) => {
  await ready(page, "/cards/new");
  await page.getByRole("textbox", { name: "Nickname" }).fill("Fee test");
  const pay = page.getByRole("combobox", { name: "Pay the creation fee from" });
  await expect(pay).toContainText("USD");
  await pay.click();
  const options = page
    .getByRole("listbox", { name: "Pay the creation fee from" })
    .getByRole("option");
  expect(await options.count()).toBeGreaterThan(1);
  await options.nth(1).click();
  await expect(pay).not.toContainText("US Dollar");
  const summary = page.getByRole("complementary", { name: "Card summary" });
  await expect(summary).toContainText("balance");
  await expect(summary).not.toContainText("Paid from your USD balance");
  await createCardWithPin(page);
  await expect(page.getByText(/Creation fee paid/)).toBeVisible();
  await expect(
    page.getByText(/from your (?!USD)[A-Z]{3} balance/),
  ).toBeVisible();
});

// Requests are hidden for now (card, limit, top-up and approval requests); the code stays.
test.skip("a cardholder asks for a top-up and the owner approves it", async ({
  page,
}) => {
  await ready(page, "/cards/c_ops");
  await asRole(page, "cardholder");
  await page.goto("/cards/c_ops");
  const panel = page.getByRole("region", { name: "Card summary" });
  // A cardholder can't fund the card themselves: they ask for a top-up
  await expect(panel.getByRole("button", { name: "Fund card" })).toHaveCount(0);
  await panel.getByRole("button", { name: "Request top-up" }).click();
  await page.getByLabel(/Amount/).fill("500");
  await page.getByLabel(/Why do you need it/).fill("Hotel for next week.");
  await page.getByRole("button", { name: "Send request" }).click();
  // The status page, as in the Figma money flows
  await expect(
    page.getByRole("heading", { name: "Request sent" }),
  ).toBeVisible();
  await expect(
    page.getByText("$500.00 requested for Ops travel"),
  ).toBeVisible();
  await expect(page.getByText("Waiting for Amara to approve")).toBeVisible();
  await expect(page.getByTestId("request-reference")).toContainText("TXN-");
  await page.getByRole("button", { name: "Got it" }).click();
  await expect(panel).toContainText("Top-up of $500.00 requested");
  await expect(
    panel.getByRole("button", { name: "Top-up requested" }),
  ).toBeDisabled();

  // The owner approves it from Requests, with the PIN
  await asRole(page, "owner");
  await page.goto("/requests");
  await page.getByRole("row", { name: /\$500\.00 for Ops travel/ }).click();
  const req = page.getByRole("dialog", { name: "Request details" });
  await expect(req).toContainText("Hotel for next week.");
  await approveWithPin(page, req, "Approve top-up");
  await expect(page.getByText("$500.00 added to the card")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/cards/c_ops");
  await expect(page.getByTestId("card-balance")).toHaveText("$50,500.00");
  // ...and it's in the card's history as funding
  await choose(page, "Status", "Funded");
  await expect(page.getByRole("row", { name: /Card funded/ })).toHaveCount(3);
});
