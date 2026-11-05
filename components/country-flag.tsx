import { asset } from "@/lib/base-path";
import { cn } from "@/lib/utils";

/** Round country flags from the Foren Design System "Country Selector" page (Figma fMjvoaNbmk0lqhd9hatUEa · 897:4980). */
const FILE: Record<string, string> = {
  NG: "ng",
  GB: "gb",
  CA: "ca",
  KE: "ke",
  Ghana: "gh",
  "South Africa": "za",
  "United States": "us",
  Germany: "de",
  France: "fr",
  India: "in",
};

/** Whether there's a flag for this ISO code or country name. */
export const hasFlag = (country: string) => country in FILE;

/** Decorative: the country is always named next to it. Renders nothing for countries without a flag. */
export function CountryFlag({ country, size = 24, className }: { country: string; size?: number; className?: string }) {
  const file = FILE[country];
  if (!file) return null;
  // eslint-disable-next-line @next/next/no-img-element -- tiny static SVGs; next/image adds nothing here.
  return <img src={asset(`/onboarding/flags/${file}.svg`)} alt="" width={size} height={size} aria-hidden className={cn("shrink-0 rounded-full", className)} style={{ width: size, height: size }} />;
}
