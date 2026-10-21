import { Suspense } from "react";
import { GetStartedPage } from "@/components/get-started/overview";
import { PageFallback } from "@/components/states";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <GetStartedPage />
    </Suspense>
  );
}
