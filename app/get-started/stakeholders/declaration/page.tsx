import { Suspense } from "react";
import { DeclarationPage } from "@/components/get-started/declaration";
import { PageFallback } from "@/components/states";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <DeclarationPage />
    </Suspense>
  );
}
