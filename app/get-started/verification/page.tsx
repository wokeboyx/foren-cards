import { Suspense } from "react";
import { VerificationPage } from "@/components/get-started/verification";
import { PageFallback } from "@/components/states";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <VerificationPage />
    </Suspense>
  );
}
