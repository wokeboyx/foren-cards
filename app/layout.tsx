import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { AppShell } from "@/components/shell/app-shell";
import { asset } from "@/lib/base-path";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
// Onboarding titles use the Foren display face, Megafield. It's licensed, so it isn't shipped in this public repo:
// it's used when installed on the viewer's machine, with Instrument Serif as the web fallback.
const serif = Instrument_Serif({ variable: "--font-serif-fallback", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Foren Cards — prototype",
  description: "Clickable prototype of Foren Cards. Test data only — no real money movement.",
  icons: { icon: asset("/foren-logo.svg") },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable} h-full`}>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
