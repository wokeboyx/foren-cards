import { Suspense } from "react";
import { SubscriptionsPage } from "@/components/subscriptions/subscriptions-page";
import { PageFallback } from "@/components/states";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <SubscriptionsPage />
    </Suspense>
  );
}
