import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { AppShell } from "@/components/shell/app-shell";
import { asset } from "@/lib/base-path";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
// Foren display face (onboarding titles), from the design system's web-font kit.
const megafield = localFont({
  variable: "--font-megafield",
  display: "swap",
  src: [
    { path: "./fonts/Megafield-Regular.woff2", weight: "400" },
    { path: "./fonts/Megafield-Medium.woff2", weight: "500" },
    { path: "./fonts/Megafield-SemiBold.woff2", weight: "600" },
    { path: "./fonts/Megafield-Bold.woff2", weight: "700" },
  ],
});

export const metadata: Metadata = {
  title: "Foren Cards — prototype",
  description: "Clickable prototype of Foren Cards. Test data only — no real money movement.",
  icons: { icon: asset("/foren-logo.svg") },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${megafield.variable} h-full`}>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
