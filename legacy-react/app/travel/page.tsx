import { Suspense } from "react";
import { TravelPage } from "@/components/travel/travel-page";
import { PageFallback } from "@/components/states";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <TravelPage />
    </Suspense>
  );
}
