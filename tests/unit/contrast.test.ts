import { describe, expect, it } from "vitest";
import { DESIGNS, EMERGENCY } from "@/components/card/designs";

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe("card designs keep text at ≥ 4.5:1 at every gradient stop (AC 2.6)", () => {
  for (const [name, d] of Object.entries(DESIGNS)) {
    it(name, () => {
      for (const stop of d.stops) {
        expect(contrast(d.text, stop)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(d.muted, stop)).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
  it("emergency", () => {
    for (const stop of EMERGENCY.stops) expect(contrast(EMERGENCY.text, stop)).toBeGreaterThanOrEqual(4.5);
  });
});
