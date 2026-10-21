import { Suspense } from "react";
import { DocumentsPage } from "@/components/get-started/documents";
import { PageFallback } from "@/components/states";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <DocumentsPage />
    </Suspense>
  );
}
