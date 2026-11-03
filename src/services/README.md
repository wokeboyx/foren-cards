# Services: wiring the real API

The UI is complete and runs on mock data. **Components never talk to the network directly.** They:

1. **read** data from the Pinia stores (`useAppStore` in `src/stores/app.ts`, `useOnboardingStore` in `src/stores/onboarding.ts`), and
2. **write** through the functions in this folder (`import { freezeCard } from "@/services"`).

The real API plugs in at those two points. You shouldn't need to touch any component.

```
component ──reads──▶ Pinia store ◀──fills── service ──http()──▶ Foren API
    └─────────calls─────────────────────────▲
```

## Files

| File                                                                      | What                                                                                                                                                |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `http.ts`                                                                 | `http<T>(path, init)`: a fetch wrapper that sends JSON, includes credentials and throws `ApiError` on non-2xx. Reads `VITE_API_BASE_URL`.           |
| `cards.ts`, `requests.ts`, `payments.ts`, `subscriptions.ts`, `people.ts` | One exported function per user action, with its signature and a comment saying what it must do. Today each one delegates to `mock/backend.ts`.      |
| `index.ts`                                                                | The barrel that components import from.                                                                                                             |
| `mock/backend.ts`                                                         | The mock backend: business rules (authorisation, approvals, history, notifications) applied to the store. **Delete it once every service is real.** |
| `mock/call.ts`                                                            | Simulated latency and failures, driven by the demo panel.                                                                                           |

## Switching a write over

```ts
// cards.ts: before
export const freezeCard = (id: string): Promise<void> => mock.freezeCard(id);

// after: call the API, then put the server's version of the card in the store
export async function freezeCard(id: string): Promise<void> {
  const card = await http<Card>(`/cards/${id}/freeze`, { method: "POST" });
  useAppStore().upsertCard(card);
}
```

Rules the UI relies on:

- **Throw on failure, and leave the store unchanged when you do.** `useAction` turns the error into the inline "couldn't save, nothing changed" message.
- **Resolve with the value shown in the signature** (for example `issueCard` resolves to the created `Card`). Screens navigate using it.
- Keep the exported name and parameter list. If the API needs a different shape, adapt it inside the function.
- Types live in `src/domain/types.ts`. Map API responses to them at this boundary, not in components.

## Loading data (reads)

Screens call `useLoad(key)` (`src/composables/useLoad.ts`) to show skeletons, load errors and Retry. Today it only waits a simulated delay, because the store is seeded from `src/fixtures/`.

To use real data:

1. Add `load*` functions here (e.g. `loadCards()`), each fetching and writing into the store (`useAppStore().$patch({ cards })`).
2. Have `useLoad` call the loader for its key instead of the mock `call`. The keys screens pass today are `"cards"`, `"requests"`, `"subs"`, `` `tx-${cardId}` `` and `"global"`.
3. Remove the fixture seed from the store's `state()` and its `persist` option. Server data shouldn't live in localStorage.

## Prototype-only pieces to remove for production

- **Demo panels** (`components/shell/DemoPanel.vue`, `components/onboarding/OnboardingDemoPanel.vue`): role switch, fake latency and failures, clock jumps, reset. Role comes from the session in production.
- **Simulations:** `attemptPayment`, `simulatePersonalPurchase`, `demoMerchantsSwitch`, `confirmBillingMoved`, and `restoreExpiredLimits` (the server does this itself).
- **`/qa`:** the state checklist page used for design QA.
- **`now()`** in `stores/app.ts`: the prototype clock with a demo offset. Use `new Date()`.
- **`currentUserId(role)` / `ROLE_PERSON`:** these come from the authenticated user.

The end-to-end tests (`tests/e2e`) drive the demo panel. Keep them running against the mock build (`VITE_USE_MOCKS` unset) as UI regression tests.
