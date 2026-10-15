# Foren Cards — Next.js prototype implementation plan

Source: *Foren Cards — UX Flows, User Stories & Acceptance Criteria* v1.0 (12 Oct 2026).
Goal: a clickable, state-complete Next.js prototype of the business-card V1 flows (Flows 1–8) for design review, usability testing (doc §13) and QA reference, plus the personal-card discovery track (Flows 9–10) behind a flag.

**The prototype makes no real money movement and has no real card data.** Everything runs on test data through a mock API, and every simulated result is labelled as a simulation.

---

## 1. Stack and key decisions

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router, TypeScript, React 19 | Matches the existing Foren docs-site stack |
| Styling | Tailwind v4 with Foren tokens as CSS variables; Inter with `font-variant-numeric: tabular-nums` for money | Doc §4: Foren DS, Inter, tabular figures |
| Primitives | shadcn/ui (Radix): Dialog, Sheet, Popover, Tabs, Toggle, Command (merchant search), Toast | Accessible keyboard and focus handling (doc §11) |
| Forms | react-hook-form + zod | Field-level validation that keeps values when issuing fails (AC 2.1, 2.5) |
| Data | Mock API in `lib/api/*` (async functions with simulated latency and fault injection), used through TanStack Query | Every loading, error and retry state in the §10 checklist can actually be triggered |
| State persistence | In-memory store seeded from fixtures and mirrored to `localStorage`, with a "Reset demo" button | Approvals and freezes survive a refresh during a test session |
| Drag-and-drop | dnd-kit, plus up/down buttons | AC 2.2 requires an accessible way to reorder |
| Motion | Framer Motion, gated on `useReducedMotion` | Expressive motion only on card-created success (AC 2.6, §11) |
| Testing | Vitest (domain logic), Playwright + @axe-core/playwright (flows and a11y) | |
| Deploy | Vercel preview, password-protected | |

**Demo control panel.** A floating dev panel lets the tester:
- switch role (Account owner, Cardholder, Finance lead, Individual)
- force any API call to fail or load slowly
- jump the clock forward, to expire 15- and 30-minute windows
- turn the personal-card track on or off
- reset all data

Without it, most of the state coverage in §10 can't be demonstrated.

**Open questions become config, not hard-coded values.** `config/policy.ts` holds:
- `emergencyCeiling: null | Money` (the PRD's $10k shows only when it is set)
- `fullPanRoles`
- `approverRoles`
- `forecastMinCharges`
- `launchCurrencies`
- `canBlockMerchantAcrossCards`

Each entry carries a comment pointing to the §12 question it depends on.

---

## 2. Project structure

```
foren-cards/
  app/
    layout.tsx                 # shell: sidebar nav, role badge, demo panel
    (business)/
      cards/
        page.tsx               # Flow 1: overview, empty state, filters, Auto cards toggle
        @panel/(.)[cardId]/page.tsx   # intercepted detail panel (keeps list context)
        [cardId]/page.tsx      # full-page detail (deep link / mobile sheet)
        [cardId]/transactions/page.tsx
        [cardId]/transactions/[txId]/page.tsx
        [cardId]/test-charge/page.tsx  # Flow 6.2
        [cardId]/edit/page.tsx
        new/page.tsx           # Flow 2
        archived/page.tsx
        check-merchant/page.tsx        # Flow 3 standalone
      subscriptions/page.tsx   # Flow 8 (?card= filter)
      requests/page.tsx        # owner inbox: approvals, unfreeze, emergency
      pay/[attemptId]/page.tsx # Flow 5: cardholder decline and recovery surface
      global-account/autofx/page.tsx  # Flow 7
    (personal)/personal/...    # Flows 9–10, flag-gated
  components/
    ui/                        # shadcn primitives
    money/ Money.tsx, FundingPath.tsx, FxBreakdown.tsx
    card/ CardArt.tsx, StatusBadge.tsx, SpendMeter.tsx
    merchant/ MerchantSearch.tsx, VerdictPanel.tsx
    states/ EmptyState.tsx, ErrorState.tsx, Skeletons.tsx
  domain/                      # pure, unit-tested logic (no React)
    types.ts  money.ts  authorize.ts  routing.ts
    compatibility.ts  forecast.ts  autofx.ts  declines.ts
  content/copy.ts              # §8 and §9 copy inventory, the single source of truth
  lib/api/                     # mock API + fault injection + clock
  fixtures/                    # seed companies, cards, merchants, txns, subs
  config/policy.ts
  tests/ unit/ e2e/
```

---

## 3. Domain model (`domain/types.ts`)

- **Card**: id, nickname, holderId, kind (`standard | emergency | subscription`), status (`active | frozen | canceled`), archived, design, last4, expiry, `lockedMerchantId?`, funding (`FundingConfig`), permissions (`PermissionConfig`), limits (`Limit[]`), billingAddress.
  - "Auto" is a kind with its own tag, not a status. The list shows it as a status label per AC 1.2.
- **FundingConfig**: strategy (`cheapest_fx | protect | custom`), order (`Currency[]`), `protect?: Currency` (the currency kept for last). No fallback bank account.
- **PermissionConfig**: mode (`anywhere | merchants | categories`), allowedMerchants, allowedCategories, blockedMerchants, blockedCategories (defaults: gambling, cash_atm, crypto).
- **Limit**: period (`per_txn | daily | weekly | monthly`), amount (`Money`).
- **Money**: `{ minor: bigint, currency }`. Never floats. Format with `Intl.NumberFormat` and `tabular-nums`.
- **Transaction**: merchant, amount, status, timestamp, `legs: FundingLeg[]` (balance, amount, fx?: {rate, fee, converted}), `feeAvoided?: {amount, basis}`.
- **Subscription**: merchant, card, usualAmount, frequency, charges[], `forecast: {date, amount, estimate: true} | insufficient_history`, status (`active | due_soon | declined | blocked | still_on_old_card | at_risk`).
- **Request**: kind (`one_time_approval | unfreeze | emergency_card`), requester, card, merchant?, amount?, reason, state (`pending | approved | denied | expired | used`), `windowEndsAt?`.
- **AutoFxGoal**: type (`keep_min | target_rate | cap`), the fields for that type, status (`on_track | waiting_for_rate | action_taken | unable_to_act`), progress, actions[].

### The authorisation engine (`domain/authorize.ts`)

One pure function, `authorize(card, attempt, balances, policy, now) → Decision`. It returns ordered steps:
1. status
2. merchant permissions
3. limits
4. each balance tried (via `routing.ts`)
5. outcome

The result is either an approval with funding legs or a decline with a `DeclineReason`. It is used by:
- **Test charge (6.2):** shows the steps directly.
- **Decline recovery (5.x):** maps the reason through `declines.ts` to the §9 copy, then picks the fix the current role is allowed to do.
- **Merchant check (3.1):** combines the rules step with `compatibility.ts`'s network verdict.
- **Subscription at-risk warnings (8.5):** runs the forecast charge against current balances.

Because one engine drives all four, a card behaves the same way everywhere in the prototype. It also gets the heaviest unit testing.

---

## 4. Build phases

Each phase ends with a deployed preview and its §10 states demonstrable via the demo panel.

### Phase 0: Foundations (≈2–3 days)
- Scaffold the app, Tailwind tokens, Inter, the shadcn primitives, the app shell and nav, and responsive breakpoints (at 390px: sheet replaces panel, list replaces table).
- `Money`, `StatusBadge` (icon + text, never colour alone), `EmptyState`, `ErrorState` (generic error copy + Retry), skeletons.
- Mock API with latency, failure injection and a controllable clock; fixtures; demo panel; role context; `copy.ts`; `policy.ts`.
- `CardArt` with the 6 designs (Midnight, Skyline, Aurora, Cream, Lime, Titanium). A unit test samples each gradient's stops and asserts text contrast ≥ 4.5:1 (AC 2.6).
- **Blocker to resolve now:** the Foren Design System token values (palette, radii, spacing). If no Figma or token file is available, start with placeholders in one `tokens.css` so they can be swapped later.

### Phase 1: Cards overview and detail (Flows 1, 4) (≈4 days)
- **Empty state:** the §8 copy, one "Create card" CTA, a light feature preview, and Treasury Mode and Agent Cards shown as non-interactive "Coming later" (AC 1.1).
- **List:** thumbnail, nickname, holder, last4, a spend-vs-limit meter, a status label; filters by status and holder stored in URL search params; a no-results state; an Archived view (AC 1.2).
- **Auto cards toggle** with its explanation. Turning it off never touches existing Auto cards (AC 1.3).
- **Detail panel** via an intercepting route:
  - header (art, last4, status)
  - spend meter plus a sentence
  - primary actions: Freeze, Transactions, More
  - funding path, permissions, limits, billing address
  - subscriptions and insight when data exists
  - a Test charge entry point
  - (AC 4.1)
- **Freeze/unfreeze:** a confirm dialog using the frozen-state copy. Optimistic UI rolls back on an injected failure. Cardholders get "Request unfreeze" instead (AC 4.2, 5.3).
- **Cancel:** an irreversible confirmation. Then **Archive**, with copy explaining that archiving isn't cancelling (AC 4.3).
- **Copy details:** masked by default and role-gated by `policy.fullPanRoles`, with a toast on copy. All PANs are test numbers (AC 4.4).
- **Edit:** reuses the creation form sections. A failed save shows the generic save-failure copy.

### Phase 2: Create card (Flow 2) (≈5 days)
- **Single-page form** with sections and a sticky live preview (stacked on mobile):
  1. Cardholder + type
  2. Funding: three strategy radio cards with one-liners, a split-charge note, and a custom order list (dnd-kit + up/down buttons). Fallback path as an ordered list with a removable bank account; a non-blocking warning when there's no fallback, and copy that never promises authorisation.
  3. Permissions: three modes with a one-sentence summary, merchant search (Command + logos), category chips. Default blocks can only be removed through an explicit "Remove protection" with a risk explanation. Includes the inline merchant check.
  4. Limits + expiry: period select, a plain-language sentence ("Up to ₦5,000,000.00 per week"), zod validation for missing, malformed, negative and out-of-range values, and a layout that holds large NGN amounts.
  5. Design: optional, with defaults.
- **Review step:** a summary covering where the money comes from, then Issue.
- **States:** issuing; success (the "Card created" copy, key facts, next steps, the one celebratory motion); failure (plain error, values preserved, Retry).

### Phase 3: Merchant checker (Flow 3) (≈2 days)
- One `MerchantChecker` component mounted in three places: inside create card, on card detail, and standalone (with a card picker).
- **Verdicts:** Works / Likely to work / Setup needed (exact steps) / Won't work (blocker plus an alternative card or method) / No history yet. The two factors (network and this card's rules) are shown separately. When a rule is the blocker, it is named, with a "Change rule" button if the role is allowed.
- **States:** empty search, searching, results, lookup error. Fixtures include merchants covering every verdict.

### Phase 4: Transactions and test charge (Flow 6) (≈3 days)
- **List** (table, or stacked rows on mobile) and **detail**:
  - paying balance(s), split legs with per-leg fees
  - the FX applied breakdown (converted amount, rate, fee)
  - fee avoided, shown only when `feeAvoided.basis` exists
  - a "Block merchant" action from the transaction row
- **Test charge:**
  - inputs: merchant, amount, currency
  - an animated step list (status, then permissions, then limits, then each balance, then outcome), each step passed or blocked with a reason
  - a persistent "Simulation — no payment was made" banner
  - an offer of a merchant-specific card for new merchants

### Phase 5: Decline recovery and requests (Flow 5) (≈4 days)
- **`/pay/[attemptId]` cardholder surface:** a "Simulate a payment" button in cardholder role runs `authorize`. On a decline it shows the §9 title and one fix the role can perform; otherwise it routes to a request. A canceled card shows "no fix on this card".
- **One-time approval:** the request carries requester, card, merchant, amount and reason. In the owner `/requests` inbox the owner approves or denies. The cardholder sees "Approved for one charge. Retry within 15 minutes." with a live countdown (driven by the demo clock), then an expired state with "Request again". Retry passes exactly once, then the rule restores itself.
- **Unfreeze request** and **emergency card request**:
  - The emergency card is merchant-locked, single-use, valid 30 minutes, and has a distinct "Emergency" design.
  - The ceiling shows only if it's set in policy.
  - After use or expiry the card is dead.
- **Insufficient balance:** offer an approved alternative or an emergency request.
- **Denied:** explain the decision and offer an allowed alternative.
- **Recovery failed:** shown as its own state.
- **Notifications:** an in-app bell plus a requests badge, so both roles see outcomes. Switch roles in the demo panel to play both sides.

### Phase 6: Subscriptions (Flow 8) (≈4 days)
- **Company-wide view** with a card filter, also reachable per card. Rows sort by next expected charge, with a "Due in next 7 days" group and 7- and 30-day summary tiles (shown only when the forecasts are reliable).
- **Each row:** logo, usual amount, frequency, last charge, an "Estimated next charge" label, card, status. Recently declined rows show their reason.
- **`forecast.ts`:** returns `insufficient_history` below `policy.forecastMinCharges`, which shows "We need one more charge…". At-risk detection runs `authorize` against projected balances.
- **Actions:**
  - reminders (owner and/or cardholder, or off)
  - block merchant (§8 confirmation copy with the contract caveat, then a Blocked status, then unblock or "allow next attempt only")
  - give it its own card (creates a merchant-locked card, then "Still on the old card" until a demo-panel "Merchant updated billing" event)
  - check compatibility
- **8.5 warnings** with a one-step fix (top up, unfreeze, adjust limit, allow once). The status updates only after the store confirms the change.

### Phase 7: AutoFX (Flow 7) (≈3 days)
- **Empty state:** the §8 copy and three goal types.
- **Type-specific editor:** shows only the relevant fields, a live rule sentence ("Keep at least 50,000 GBP; top up from USD."), and validation.
- **Goal cards:** status (text + icon) and progress. Actions taken are explained with amounts. Unable-to-act shows a reason and a next step. An AutoFX marker appears on affected balances.
- **Demo-panel rate ticker:** moves rates so `waiting_for_rate` can become `action_taken`. Creating a goal never implies a conversion has happened.

### Phase 8: Personal-card discovery track (Flows 9–10, flag-gated) (≈3 days)
- A separate `(personal)` layout with no team, approval or company controls.
- A shorter create flow: purpose (general or merchant-specific), funding preference, optional limit, a fees review. Clear "Prototype" labels.
- Transactions with funding and FX detail, estimated renewals, freeze, block merchant (with the contract caveat), and replace/cancel with confirmation.
- Reuses the domain engine and components. Only the composition differs.

### Phase 9: Hardening (≈3 days)
- **Playwright e2e,** one spec per §13 test task:
  - first card with defaults
  - merchant check
  - merchant-blocked decline → approval → retry
  - find next week's subscriptions + block
  - explain transaction funding
  - personal freeze
- **axe on every route.** Keyboard-only runs of the primary flows. Visible focus. Labels persist on all inputs.
- **Visual checks** at 390, 768 and 1440 widths, plus a long-name and huge-NGN stress fixture.
- **State-coverage matrix:** a `/__states` page (dev only) that renders every §10 state from fixtures. QA and design sign off against it.
- **Copy lint:** a unit test that fails if a component hard-codes any string that `copy.ts` defines.

**Rough total: ~6–7 weeks for one engineer, or ~4 weeks for two** (split Phases 2–3 from Phases 5–6 after Phase 1).

---

## 5. Cross-cutting acceptance rules (checked in every PR)

- Status and alerts always pair colour with text or an icon.
- Money is always `Money` (explicit currency and tabular figures). FX is never folded into a total.
- Estimates are always labelled "Estimate". Merchant results never claim "guaranteed".
- Destructive or risky actions get a confirmation that states the consequence.
- A fix is offered only if the current role can perform it. Otherwise the user is routed to the owner.
- Failures keep the previous state and show the generic error or save-failure copy with a Retry.
- `prefers-reduced-motion` is respected. Celebration motion appears only on card-created.

---

## 6. Inputs needed before or during build

1. **Foren Design System tokens or Figma link:** palette, type scale, radii, and card artwork gradients. This blocks final visuals, not Phase 0.
2. **Answers to doc §12,** each of which maps to a `policy.ts` flag:
   - the approver roles
   - who can see the full card number
   - the emergency-card ceiling and expiry
   - the subscription forecast threshold
   - the launch currencies
   - whether a merchant can be blocked across all cards
3. **Merchant logo source:** static SVG fixtures are fine for the prototype.
4. **Hosting:** confirm a password-protected Vercel preview is acceptable for usability sessions.
