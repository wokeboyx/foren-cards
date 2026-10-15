import { Suspense } from "react";
import { CardsOverview } from "@/components/cards/cards-overview";
import { PageFallback } from "@/components/states";

export default function CardsPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <CardsOverview />
    </Suspense>
  );
}
