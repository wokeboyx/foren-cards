import { Suspense } from "react";
import { TransactionsPage } from "@/components/transactions/transactions-page";
import { PageFallback } from "@/components/states";

export default async function Page(props: PageProps<"/cards/[cardId]/transactions">) {
  const { cardId } = await props.params;
  return (
    <Suspense fallback={<PageFallback />}>
      <TransactionsPage cardId={cardId} />
    </Suspense>
  );
}
