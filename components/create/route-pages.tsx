"use client";
import { useSearchParams } from "next/navigation";
import { RiLockLine } from "@remixicon/react";
import { LinkButton } from "@/components/link-button";
import { EmptyState, Panel } from "@/components/states";
import { can } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import { CardForm } from "./card-form";

export function NotAllowed({ body }: { body: string }) {
  return (
    <Panel>
      <EmptyState icon={<RiLockLine />} title="You can’t do this here" body={body} action={<LinkButton href="/cards" variant="outline" size="sm">Back to cards</LinkButton>} />
    </Panel>
  );
}

export function NotFound({ what = "card" }: { what?: string }) {
  return (
    <Panel>
      <EmptyState title={`We couldn’t find that ${what}`} body="It may have been removed, or the link is out of date." action={<LinkButton href="/cards" variant="outline" size="sm">Back to cards</LinkButton>} />
    </Panel>
  );
}

export function NewCard() {
  const role = useStore((s) => s.role);
  const drafts = useStore((s) => s.cardDrafts);
  const params = useSearchParams();
  if (!can(role, "issue"))
    return (
      <div className="mx-auto max-w-[640px] p-6">
        <NotAllowed body="Only the account owner can issue cards. Ask them to create one for you." />
      </div>
    );
  const prefill = { nickname: params.get("nickname") ?? "" };
  const draft = drafts.find((d) => d.id === params.get("draft"));
  return <CardForm key={params.get("draft") ?? "new"} mode="create" prefill={prefill} fromDraft={draft} />;
}

export function EditCard({ cardId }: { cardId: string }) {
  const role = useStore((s) => s.role);
  const card = useStore((s) => s.cards.find((c) => c.id === cardId));
  if (!card)
    return (
      <div className="mx-auto max-w-[640px] p-6">
        <NotFound />
      </div>
    );
  if (!can(role, "edit", card) || card.status === "canceled")
    return (
      <div className="mx-auto max-w-[640px] p-6">
        <NotAllowed body="Only the account owner can change this card’s settings, and canceled cards can’t be edited." />
      </div>
    );
  return <CardForm mode="edit" initial={card} />;
}
