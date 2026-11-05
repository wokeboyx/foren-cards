import { Suspense } from "react";
import { StakeholderFormPage } from "@/components/get-started/stakeholder-form";
import { PageFallback } from "@/components/states";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <StakeholderFormPage />
    </Suspense>
  );
}
