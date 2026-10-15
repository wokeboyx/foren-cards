import type { NextConfig } from "next";

// GitHub Pages build (GITHUB_PAGES=true): a static export served from /foren-cards.
// Local dev, tests and `next start` are unchanged.
const pages = process.env.GITHUB_PAGES === "true";
const basePath = pages ? "/foren-cards" : "";

const nextConfig: NextConfig = {
  ...(pages ? { output: "export" as const, basePath, trailingSlash: true, images: { unoptimized: true } } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // Not supported in a static export, so off for the GitHub Pages build only.
  cacheComponents: !pages,
  devIndicators: false,
  partialPrefetching: !pages,
  // The prototype keeps all state in localStorage and renders pages only after the client
  // mounts, so automatic instant-navigation validation can't see page segments. Opt in per route.
  experimental: {
    instantInsights: {
      validationLevel: "manual-warning",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
