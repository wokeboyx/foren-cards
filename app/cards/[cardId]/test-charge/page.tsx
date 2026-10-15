import { TestCharge } from "@/components/transactions/test-charge";

export default async function Page(props: PageProps<"/cards/[cardId]/test-charge">) {
  const { cardId } = await props.params;
  return <TestCharge cardId={cardId} />;
}
