"use client";
import * as React from "react";
import { CardPage } from "@/components/cards/card-page";
import { EditCard, NotFound } from "@/components/create/route-pages";
import { PageFallback } from "@/components/states";
import { TransactionsPage } from "@/components/transactions/transactions-page";
import { BASE_PATH } from "@/lib/base-path";

const noop = () => () => {};

/**
 * On GitHub Pages only the sample cards have pre-built pages. A card created in the browser
 * (it lives in localStorage) lands here, so render its page on the client instead of a 404.
 */
export default function NotFoundPage() {
  const path = React.useSyncExternalStore(
    noop,
    () => window.location.pathname,
    () => ""
  );
  const m = path
    .slice(BASE_PATH.length)
    .replace(/\/$/, "")
    .match(/^\/cards\/([^/]+)(?:\/(transactions|edit))?$/);
  if (!m) return <NotFound what="page" />;
  const [, cardId, sub] = m;
  return (
    <React.Suspense fallback={<PageFallback />}>
      {sub === "transactions" ? <TransactionsPage cardId={cardId} /> : sub === "edit" ? <EditCard cardId={cardId} /> : <CardPage cardId={cardId} />}
    </React.Suspense>
  );
}
