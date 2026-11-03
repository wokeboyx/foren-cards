import { expect, test } from "@playwright/test";

test("cards list and detail work at 390px without horizontal scroll", async ({
  page,
}) => {
  await page.goto("/cards");
  await expect(
    page.getByRole("heading", { name: "Cards", exact: true }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await page
    .getByRole("button", { name: /Ops travel/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/cards\?card=c_ops$/);
  await expect(
    page.getByRole("button", { name: "Freeze", exact: true }),
  ).toBeVisible();
  const detailOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(detailOverflow).toBeLessThanOrEqual(0);
});

test("phone layout follows the Figma responsive screens: Menu, no sideways scroll", async ({
  page,
}) => {
  await page.goto("/cards");
  await page.getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  // Requests are hidden, so the menu has no Requests link
  await expect(menu.getByRole("link", { name: "Requests" })).toHaveCount(0);
  await menu.getByRole("link", { name: "Overview" }).click();
  await expect(
    page.getByRole("heading", { name: "Cards", level: 1 }),
  ).toBeVisible();
  for (const route of [
    "/cards",
    "/cards/c_ops",
    "/cards/c_ops/transactions",
    "/cards/new",
    "/global-account",
  ]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, route).toBeLessThanOrEqual(0);
  }
});

test("on a phone, Create card is one column with a leave prompt", async ({
  page,
}) => {
  await page.goto("/cards/new");
  await page.getByRole("textbox", { name: "Nickname" }).fill("Team travel");
  await expect(
    page.getByRole("img", { name: /Team travel card ending/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(
    page.getByRole("dialog", { name: "Leave without creating the card?" }),
  ).toBeVisible();
});
