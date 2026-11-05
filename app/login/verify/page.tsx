import { Suspense } from "react";
import { LoginVerify } from "@/components/login/verify";

// The variant (?method=email | backup) comes from the URL, so the client part needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <LoginVerify />
    </Suspense>
  );
}
