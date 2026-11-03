import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";

// GitHub Pages build (GITHUB_PAGES=true) is served from /foren-cards/. Everything else runs at /.
const base = process.env.GITHUB_PAGES === "true" ? "/foren-cards/" : "/";

export default defineConfig({
  base,
  plugins: [
    vue(),
    tailwindcss(),
    // Remix icons (src/components/icons.ts). 24px by default, like @remixicon; size classes override it.
    Icons({ compiler: "vue3", scale: 1, defaultClass: "remixicon", iconCustomizer: (_c, _i, props) => {
        props.width = "24";
        props.height = "24";
      },
    }),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
