import { Suspense } from "react";
import { CardPage } from "@/components/cards/card-page";

export default async function CardDetailPage(props: PageProps<"/cards/[cardId]">) {
  const { cardId } = await props.params;
  return (
    <Suspense fallback={null}>
      <CardPage cardId={cardId} />
    </Suspense>
  );
}
