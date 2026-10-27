# React → Vue porting conventions

The React/Next.js source lives in `legacy-react/` as the reference until the port is finished, then it is deleted.
The Vue app is in `src/`. Stack: Vue 3.5 (`<script setup lang="ts">`), Vite, Vue Router 5, Pinia, Tailwind v4, Reka UI.

## Where files go

| React source | Vue target |
|---|---|
| `legacy-react/components/<dir>/<file>.tsx` exporting component `FooBar` | `src/components/<dir>/FooBar.vue` (one SFC per exported component) |
| Non-component exports of that file (helpers, constants, types, hooks) | `src/components/<dir>/<file>.ts` (same kebab-case name, `.ts`) |
| `legacy-react/components/<file>.tsx` (top level) | `src/components/FooBar.vue` / `src/components/<file>.ts` |
| Plain `.ts` files (`designs.ts`, `holder.ts`, `data.ts`) | same name in `src/components/<dir>/` |
| Private (non-exported) sub-components | keep them in the same SFC if small, or a sibling SFC with a descriptive PascalCase name |
| React hooks exported from a component file (`useSteps`, `useTravelPlan`, `useSubStatus`) | composable in the `<file>.ts` companion, returning refs/computeds |

Import SFCs by default import: `import ForenButton from "@/components/ui/ForenButton.vue"`.
Import helpers by name from the `.ts` companion: `import { lockText } from "@/components/card/status-badge"`.

## Shared modules already ported (use these, don't recreate)

| React | Vue |
|---|---|
| `@/lib/store` → `useStore`, `now`, `uid`, `currentUserId`, `personById`, `allPeople`, `requestState`, `approvalWindowEnd`, `ROLE_PERSON`, `USD_RATES` | `@/stores/app` → `useAppStore` (Pinia, same state + action names), and the same helper names |
| `@/lib/store` → `useNow(ms)` | `@/composables/useNow` → returns `ComputedRef<Date>` |
| `@/lib/onboarding-store` → `useOnboarding`, helpers, types | `@/stores/onboarding` → `useOnboardingStore` (same state + action names incl. `set`), `useRequirementContext()` returns a `ComputedRef`. All helpers and types keep their names |
| `@/lib/actions` (freezeCard, decideRequest, …) | `@/services` (same function names and signatures) |
| `@/lib/api` → `useLoad(key)`, `useAction(fn)`, `ApiError`, `LoadStatus` | `@/composables/useLoad` (`{ status: Ref, retry }`; `key` may be a getter), `@/composables/useAction` (`{ run, pending: Ref, error: Ref, clearError }`), `ApiError` from `@/services` |
| `@/lib/use-desktop` → `useIsDesktop()` | `@/composables/useIsDesktop` → `Ref<boolean>` |
| `@/components/onboarding/guard` → `useSignupGuard`, `blockedBy` | `@/composables/useSignupGuard` → `useSignupGuard(href)` returns `ComputedRef<boolean>` |
| `@/lib/permissions`, `@/lib/utils` (`cn`), `@/lib/base-path` (`asset`) | `@/lib/permissions`, `@/lib/utils`, `@/lib/base-path` |
| `@/domain/*`, `@/config/*`, `@/content/*`, `@/fixtures/*` | unchanged, now under `src/` (same `@/…` paths) |

Reading store state: `const store = useAppStore()` then `store.role`, `store.cards` in templates/computeds.
Zustand selectors like `useStore((s) => s.cards.find(...))` become `computed(() => store.cards.find(...))`.
`useStore.getState()` inside handlers becomes `useAppStore()` (call it in setup and reuse).
Use `storeToRefs` only if you destructure state.

## Library mapping

| React | Vue |
|---|---|
| `next/link` `<Link href>` | `<RouterLink :to>` |
| `useRouter()` push/replace/back | `useRouter()` from `vue-router` (`router.push`, `router.replace`, `router.back()`) |
| `usePathname()` | `useRoute().path` |
| `useSearchParams()` `.get("x")` | `useRoute().query.x` (string or array: normalise with a small helper) and `router.replace({ query: { ...route.query, x } })` to write |
| `useParams()` / page `params` | component props (router passes `cardId` with `props: true`) |
| `next/image` | `<img>` with `asset("/path")` for `public/` files; keep width/height/alt |
| `@radix-ui/react-dialog` | `reka-ui` `DialogRoot/DialogPortal/DialogOverlay/DialogContent/DialogTitle/DialogDescription/DialogClose` (`v-model:open` or `:open` + `@update:open`). `asChild` → `as-child` |
| `@radix-ui/react-popover` | `reka-ui` `PopoverRoot/PopoverTrigger/PopoverPortal/PopoverContent/PopoverAnchor/PopoverClose` |
| `@remixicon/react` `<RiCloseLine className=…/>` | `@remixicon/vue` same component names: `import { RiCloseLine } from "@remixicon/vue"`, `<RiCloseLine class="…" aria-hidden="true" />` |
| `sonner` `toast(...)`, `<Toaster/>` | `vue-sonner` `toast(...)`, `<Toaster/>` (import `"vue-sonner/style.css"` once, in AppShell) |
| `motion/react` `motion.div`, `AnimatePresence` | `motion-v` `motion.div` / `<Motion>`, `<AnimatePresence>`; respect reduced motion like the source |
| `@dnd-kit` sortable | `vue-draggable-plus` (`<VueDraggable v-model="list" handle=…>`), keep the up/down buttons |
| `class-variance-authority`, `clsx`, `tailwind-merge` | unchanged |
| `React.useId()` | `useId()` from `vue` |
| `useEffect` | `watch`/`watchEffect`/`onMounted` + `onBeforeUnmount`/`onScopeDispose` |
| `useMemo` | `computed` |
| `useRef` to DOM | template ref (`useTemplateRef`) |
| `forwardRef` | not needed; expose with `defineExpose` only if a parent actually uses the ref |
| `key` prop to reset state | `:key` on the component |

## Component API rules (keep call sites mechanical)

1. **Prop names stay the same** as the React props (camelCase in `defineProps`, kebab-case or camelCase in templates).
   Types via `defineProps<{…}>()` with `withDefaults` for defaults. Keep the JSDoc comments.
2. **`children` → default `<slot />`.**
3. **`ReactNode` props** (`title`, `description`, `footer`, `action`, `leadingIcon`, `icon`, …) → a **named slot with the same name**.
   If callers in the React code ever pass a plain string, also accept a `string` prop of the same name and render it as the slot fallback:
   `<slot name="title">{{ title }}</slot>`. Check `v-if="title || $slots.title"` where React checked truthiness.
   Icon props (`leadingIcon`, `trailingIcon`, `icon`) are slots only.
4. **Render-prop functions** → scoped slots.
5. **Callbacks** `onFoo` → emits `foo` (`defineEmits<{ foo: [args] }>()`), listened to as `@foo`.
   Exception — controlled value pairs become `v-model`:
   - `open` + `onOpenChange` → `v-model:open` (prop `open`, emit `update:open`)
   - `value`/`checked`/`selected`/`pressed` + `onChange`/`onValueChange`/`onCheckedChange` → `v-model` (prop `modelValue`, emit `update:modelValue`).
     If the React callback also passes extra args, emit an extra event too, e.g. `change`.
   - Native inputs: a component wrapping `<input>` uses `defineModel()` and passes other attrs through.
6. **Rest props spread** (`{...props}` onto the root element) → Vue attribute fallthrough (default). If the attrs must land on an inner element, `defineOptions({ inheritAttrs: false })` + `v-bind="$attrs"`.
   `className` → `class` (fallthrough merges it). Where the source merges with `cn(base, className)`, take a `class` prop explicitly: `const props = defineProps<{ class?: HTMLAttributes["class"] }>()` and bind `:class="cn(base, props.class)"`.
7. Keep **every** `aria-*`, `role`, `id`, label text, heading text, button text, `data-*` attribute and DOM structure the same. The Playwright suite in `tests/e2e` queries by role and accessible name; it is the acceptance test for the port.
8. Keep all Tailwind classes exactly as they are. `style={{ "--w": … }}` → `:style="{ '--w': … }"`.
9. Keep comments that explain *why*. Don't add new commentary about the port.
10. Strict TypeScript, no `any`. Must pass `vue-tsc`.

## Templates

- `cond && <X/>` → `v-if`. Ternaries → `v-if/v-else` or inline `{{ a ? b : c }}`.
- `.map()` → `v-for` with `:key`.
- `dangerouslySetInnerHTML` → `v-html` (only where the source used it).
- `onClick={() => …}` → `@click="…"`; `e.preventDefault()` in submit → `@submit.prevent`.
- Text with curly quotes and `’` stays verbatim.
- Logic-heavy JSX helpers can stay as `computed`s or small local functions in `<script setup>`.
