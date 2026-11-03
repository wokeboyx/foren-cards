# Foren Cards — agent notes

Vue 3 + Vite single-page app. Read `README.md` (layout, conventions) and `src/services/README.md` (API boundary) before changing code.

- Components read from Pinia stores (`src/stores/`) and write through `@/services`; never `fetch` in a component.
- New icons: add them to `src/components/icons.ts`.
- Before finishing: `npm run typecheck && npm run lint && npm test && npm run test:e2e`.
