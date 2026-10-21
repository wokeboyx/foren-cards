import { Suspense } from "react";
import { QuestionnairePage } from "@/components/get-started/questionnaire";
import { PageFallback } from "@/components/states";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <QuestionnairePage />
    </Suspense>
  );
}
