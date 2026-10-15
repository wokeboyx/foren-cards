"use client";
import { PageHeader } from "@/components/page-header";
import { useRouter } from "next/navigation";
import { RiAddLine } from "@remixicon/react";
import { ForenSegmentedControl } from "@/components/ui/foren-segmented-control";
import { LinkButton } from "@/components/link-button";
import { COPY } from "@/content/copy";
import { can } from "@/lib/permissions";
import { useStore } from "@/lib/store";

export type CardsTab = "manage" | "subscriptions" | "check" | "archived";

const TABS: { value: CardsTab; label: string; href: string }[] = [
  { value: "manage", label: "Manage", href: "/cards" },
  { value: "subscriptions", label: "Subscriptions", href: "/subscriptions" },
  { value: "check", label: "Check a merchant", href: "/cards/check-merchant" },
  { value: "archived", label: "Archived", href: "/cards?view=archived" },
];

/** "Cards" title with an inline Create card action, and the Cards overview tabs (DS Segmented control). */
export function CardsHeader({ tab, description }: { tab: CardsTab; description?: string }) {
  const role = useStore((s) => s.role);
  const router = useRouter();
  return (
    <PageHeader
      title="Cards"
      description={description}
      actions={
        can(role, "issue") ? (
          <LinkButton href="/cards/new" variant="primary" size="sm" leadingIcon={<RiAddLine />}>
            {COPY.createCard}
          </LinkButton>
        ) : (
          <LinkButton href="/cards/request" variant="primary" size="sm" leadingIcon={<RiAddLine />}>
            Request card
          </LinkButton>
        )
      }
      tabs={
        <ForenSegmentedControl
          size="lg"
          ariaLabel="Cards sections"
          options={TABS.map(({ value, label }) => ({ value, label }))}
          value={tab}
          onChange={(v) => router.push(TABS.find((t) => t.value === v)!.href)}
        />
      }
    />
  );
}
