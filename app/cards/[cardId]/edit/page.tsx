import { EditCard } from "@/components/create/route-pages";

export default async function EditCardPage(props: PageProps<"/cards/[cardId]/edit">) {
  const { cardId } = await props.params;
  return <EditCard cardId={cardId} />;
}
