import { Suspense } from "react";
import { StakeholdersPage } from "@/components/get-started/stakeholders";
import { PageFallback } from "@/components/states";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <StakeholdersPage />
    </Suspense>
  );
}
