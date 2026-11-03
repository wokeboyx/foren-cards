import pluginVue from "eslint-plugin-vue";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import { globalIgnores } from "eslint/config";

export default defineConfigWithVueTs(
  globalIgnores(["dist/**", "test-results/**", "playwright-report/**"]),
  pluginVue.configs["flat/essential"],
  vueTsConfigs.recommended,
  {
    rules: {
      // Screen names like "Welcome" and "Overview" are single words by design.
      "vue/multi-word-component-names": "off",
    },
  }
);
