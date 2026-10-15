import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/shell/app-shell";
import { asset } from "@/lib/base-path";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Foren Cards — prototype",
  description: "Clickable prototype of Foren Cards. Test data only — no real money movement.",
  icons: { icon: asset("/foren-logo.svg") },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
