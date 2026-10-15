import { Suspense } from "react";
import { NewCard } from "@/components/create/route-pages";

export default function NewCardPage() {
  return (
    <Suspense>
      <NewCard />
    </Suspense>
  );
}
