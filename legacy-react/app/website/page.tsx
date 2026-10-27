import type { Metadata } from "next";
import { RatesSection } from "@/components/website/rates-section";
import { SiteHeader } from "@/components/website/site-header";

export const metadata: Metadata = { title: "Foren — try it (website section prototype)" };

/** One foren.co section, mocked up for testing: WhatsApp quote, payment link and exchange rate tabs. */
export default function Page() {
  return (
    <div className="min-h-dvh bg-white font-sans">
      <SiteHeader />
      <main id="main">
        <RatesSection />
      </main>
    </div>
  );
}
