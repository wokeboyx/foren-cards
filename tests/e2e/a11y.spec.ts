import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = ["/cards", "/cards/c_lagos", "/cards/c_ops", "/cards/c_ops?tab=controls", "/cards/c_ops?tab=subscriptions", "/cards/new", "/cards/check-merchant", "/cards/c_ops/transactions", "/cards/c_ops/test-charge", "/subscriptions", "/requests", "/global-account"];

for (const route of ROUTES) {
  test(`no serious accessibility violations: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    await page.waitForTimeout(900);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.length} × ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
  });
}
