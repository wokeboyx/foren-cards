import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// GitHub Pages build (GITHUB_PAGES=true) is served from /foren-cards/. Everything else runs at /.
const base = process.env.GITHUB_PAGES === "true" ? "/foren-cards/" : "/";

export default defineConfig({
  base,
  plugins: [vue(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
