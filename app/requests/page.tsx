import { Suspense } from "react";
import { RequestsPage } from "@/components/requests/requests-page";
import { PageFallback } from "@/components/states";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <RequestsPage />
    </Suspense>
  );
}
