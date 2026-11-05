import type { NextConfig } from "next";

// Static export builds:
// - GitHub Pages (GITHUB_PAGES=true): served from /foren-cards.
// - Cloudflare (CLOUDFLARE=true): served from the root, deployed with wrangler.jsonc.
// Local dev, tests and `next start` are unchanged.
const pages = process.env.GITHUB_PAGES === "true";
const staticExport = pages || process.env.CLOUDFLARE === "true";
const basePath = pages ? "/foren-cards" : "";

const nextConfig: NextConfig = {
  ...(staticExport ? { output: "export" as const, basePath, trailingSlash: true, images: { unoptimized: true } } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // Not supported in a static export, so off for the static builds only.
  cacheComponents: !staticExport,
  devIndicators: false,
  partialPrefetching: !staticExport,
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
