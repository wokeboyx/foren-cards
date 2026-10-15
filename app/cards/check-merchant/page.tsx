import { Suspense } from "react";
import { CheckMerchantPage } from "@/components/merchant/check-merchant-page";
import { PageFallback } from "@/components/states";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <CheckMerchantPage />
    </Suspense>
  );
}
