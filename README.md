# Foren Cards — UI

The Foren Cards web UI (business cards, Flows 1–8), plus sign-up and account setup. Built with **Vue 3, Vite, Vue Router, Pinia and Tailwind v4**,
using the Foren Design System components. It runs on a **mock backend with test data only: no real cards, money or merchants.**
Connecting it to the API is the frontend team's next step: see [`src/services/README.md`](src/services/README.md).

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # vue-tsc
npm run lint         # eslint (Vue + TypeScript)
npm test             # domain unit tests (authorisation engine, routing, forecasts, contrast)
npm run test:e2e     # production build + Playwright flows (§13 tasks), responsive checks and axe accessibility scan
npm run build        # type-check + production build to dist/
```

Node 24 or later.

## Live prototype

**https://wokeboyx.github.io/foren-cards/**, deployed to GitHub Pages by `.github/workflows/deploy-pages.yml` on every push to `main`.

- The Pages build sets `GITHUB_PAGES=true`, so the app is served from `/foren-cards/` (Vite `base`). CI copies `index.html` to `404.html` so deep links like `/cards/c_ops/edit` load the app.
- Files in `public/` are referenced through `asset()` (`src/lib/base-path.ts`) so they work under the sub-path.

## Using the prototype

- **Demo panel** (bottom right): switch role (Account owner / Cardholder / Finance lead; also "Viewing as" in the top bar),
  slow the network, force load or save failures, move the clock (+16 min expires approvals),
  simulate low balances, load sample AutoFX goals, reset data.
- **Onboarding** starts at **/onboarding** (sign-up) and continues in-app at **/get-started** (activation). Requirements per country and entity type
  come from the compliance doc and live in `src/domain/onboarding.ts`; the onboarding store is separate (`src/stores/onboarding.ts`).
  The flask on the right edge of sign-up screens jumps to any screen, sets lookup/ID outcomes, or loads review states.
  Titles use Megafield (`src/assets/fonts/`, from the design system's web-font kit).
- **/qa** lists every state from the UX doc §10 checklist with a link or instructions to reach it.
- State persists in localStorage, so a usability session survives a refresh. "Reset demo data" restores the seed.

## Where things live

| Path | What |
| --- | --- |
| `src/router/index.ts` | Every route. `meta.layout` picks the page chrome: app (sidebar), `focus` (full-screen create/edit), `onboarding`, `bare` |
| `src/components/shell/` | App shell: sidebar, top bar, search, notifications, demo panel |
| `src/components/ui/` | Foren Design System components (Button, Badge, Toggle, Input, Table, Segmented control…), with cva variants in the `.ts` files beside them |
| `src/components/<feature>/` | Screens by area: `cards`, `create`, `requests`, `subscriptions`, `transactions`, `autofx`, `onboarding`, `get-started`, `website` |
| `src/components/*.vue` | Shared app pieces: `Sheet`, `Modal`, `ConfirmDialog`, `EmptyState`, `ErrorState`, `Panel`, `PageHeader`, `LinkButton`, `Money`… |
| `src/components/icons.ts` | The Remix icons in use. Each is compiled on its own by `unplugin-icons`, so only these are bundled |
| `src/services/` | **The API boundary.** One function per user action; mock-backed today. Read its README before wiring the API |
| `src/stores/` | Pinia stores: `app.ts` (cards, transactions, requests, balances…), `onboarding.ts` (sign-up and setup). `persist.ts` mirrors them to localStorage for the mock |
| `src/composables/` | `useLoad` (loading/error/retry), `useAction` (pending/error for a save), `useNow`, `useIsDesktop`, `useSignupGuard` |
| `src/domain/` | Pure logic: `authorize.ts` (single authorisation engine), `routing.ts` (SmartRoute), `forecast.ts`, `compatibility.ts`, `autofx.ts`, `onboarding.ts` (requirements per country/entity) |
| `src/content/copy.ts` | §8 content patterns and §9 decline inventory: the single source of copy |
| `src/config/policy.ts` | Open questions from §12 as settings (approver roles, full-PAN roles, emergency ceiling, forecast threshold…) |
| `src/fixtures/` | Seed data for the mock |
| `tests/e2e/` | Playwright specs. They query by role and accessible name, so keep labels stable when changing screens |

### Conventions

- One component per `.vue` file (`<script setup lang="ts">`, PascalCase name). Non-component helpers for a component sit next to it in a kebab-case `.ts` file.
- Components read state from the stores and write through `@/services`. They never call `fetch` themselves.
- Content passed into a component goes in slots. A text prop has a same-named slot that overrides it (`title` prop and `#title` slot). Controlled values use `v-model` (`v-model:open` on dialogs).
- Styling is Tailwind with the Foren tokens in `src/styles/globals.css` (`text-fg`, `bg-surface`, `border-line`…). Merge classes with `cn()`.
- Screens built on Reka UI (dialogs, popovers) get focus and keyboard handling from it. Keep the `aria-*` attributes and labels: the e2e and axe tests rely on them.

## Layout reference

The shell follows the Foren Business Banking Figma file (DEV READY page): the "NEW IA" sidebar (workspace switcher;
Home, Dashboard, Global accounts, **Cards**; Move money; Records; Manage; Developers at the bottom), and content in an inset
panel with a breadcrumb, search, bell and avatar across the top. **Cards** sits after Move money and expands like Receive
into Overview and Requests. Subscriptions is a tab on the Cards overview
(Manage / Subscriptions / Archived). Sidebar items outside cards show a "not part of the cards
prototype" toast. "Viewing as" (a prototype control) sits where the Figma top bar has Test mode.

A card opens the way it does in Mercury: click a row in the list and a panel opens beside it (a full-screen sheet on phones).
Each fact is shown once. The panel has one note at the top (the most urgent: terminated, frozen, emergency, limit request, no
balance, expiring), then the limit as "$X left of $Y today" with a bar, the card with its balance on the face, and
one row of actions (Fund card, Freeze and a **More** menu: Edit nickname, Edit limit, Change log, Terminate card). On the full
page (`/cards/[id]`) the page header names the card, so the panel leaves the name out; the tabs on the left are **History**
(search and filters; *Missing receipts* is a status filter; Source and Notes only show on very wide screens), **Card details**
(number, expiry, CVC, name on card, billing address, copy buttons) and **Subscriptions**.
Edit limit is Mercury's "Edit card limits".
Creating a card lets you choose which balance pays the creation fee (any balance that can cover it, converted when it isn't USD).
There is no lock card and no Card controls section.

**Design system:** screens use the foren-docs components (Button, Badge, Toggle, Progress, Segmented control for all tabs,
Table, Info note, Input, Search, Avatar, ComboBox…). The DS has no Tabs, Sidebar, Breadcrumb or Modal, so tabs use the
Segmented control, and the sidebar, breadcrumb and modals follow the Figma file using DS tokens.
Flows otherwise follow Mercury's web cards screens: Manage / Subscriptions / Archived tabs, small confirmation modals,
and a full-screen create view whose live summary doubles as the review step.

## Deviations and assumptions to review

- **Text/Tertiary token override.** The design system's `#95908b` is ~3.2:1 on white and fails WCAG AA.
  `src/styles/globals.css` overrides it to `#6e6964` (≥ 4.5:1 everywhere). Raise with the design-system owners.
- **SmartRoute semantics** (`src/domain/routing.ts`) are a prototype interpretation: same-currency balance first,
  then lowest FX fee, charges may split. Cards only pay from Foren balances (no fallback account). Needs product/engineering validation.
- **Fee avoided** is only claimed for non-USD, non-NGN charges paid entirely from a same-currency balance,
  compared with converting from USD at the Foren fee. The real comparison basis is an open question.
- **Merchant logos** are letter tiles; network compatibility data is illustrative.
- **Emergency-card ceiling** is hidden (`POLICY.emergencyCeiling = null`) until product confirms it.
- Revolut Business iOS patterns, every card keeps a history (what changed, when, who: Card controls → History); cancelling lists the consequences and offers "Freeze instead"; requests show an approvals timeline (submitted by → approved/declined by, with the reason, up to 500 characters). Spend programs and bulk ordering of company cards were noted but not built (not in the UX doc).
- **Create card is a 2-step flow** (card details, then limits) as a Mercury-style focus page (thin progress line, one centred column, "Next →"). Closing part-way asks "Leave without creating the card?"; there are no drafts. A live card preview sits above the colour swatches, the cost and active-card count show on step 1, and step 2 ends with a summary. There is one kind of card and a plain Create card button (no menu). A card is for the company by default (only the account admin sees it) or, by radio choice, for a team member. New cards allow any merchant except the default blocked categories; merchant rules are edited from the card, not at creation. Editing a card stays one page. The success screen shows what was set up and paid, with **Fund card** first.
- **Borrowed from Revolut / Wise / Mercury:** limit increase requests (cardholder → owner, shown on the card row and in Requests);
  receipts, notes and expense categories on transactions with a "Missing receipt" marker and filter
  with CSV export; admin **Lock card** (stronger than freeze: the cardholder can't ask to unfreeze); **spending periods** (card only
  works between two dates; declines with "outside_period"). Removed because they can't be supported yet: Check a merchant and network compatibility, Spending abroad, Apple Pay / Google Pay and saved drafts.
- **Card requests live in the card list.** Team members see **Request card** where the owner sees Create card (the same one-page form as Create a card: nickname and colour, why, limits, with a live preview and the creation fee; no steps). A sent request appears in the card list as a **Pending request** row for the requester and the owner; the owner opens it in a side panel and chooses **Approve and create** or Decline. Approving creates the card and charges the owner the creation fee, like any new card. Requests also appear on the Requests page.
- **Auto cards were removed.** Payments happen at the merchant's checkout, so Foren can't suggest a card before someone pays.
  Cards are not tied to a purpose or a merchant: there is no merchant lock, no "one merchant" choice and no allowed
  merchants or categories, because a card can't be told what it is for. A subscription can still be given its own
  (plain) card (§8.4): create the card → update it at the merchant (off-app) → Foren blocks the merchant on the old card
  once it switches. The only merchant-bound card is the single-use emergency card.
- **Funding and top-up requests follow the Figma money flows.** *Fund card* (owner and finance) is a full page on the Figma
  grey canvas: amount and balance, a review with a round back button, a floating Cancel / Next bar, then a **Card funded**
  status page. A cardholder can't fund their own card: the panel shows **Request top-up** instead. It opens "Request a
  top-up" (amount, why), then the **Request sent** status page (timeline and a TXN reference). The owner sees it in Requests
  (kind *Top-up*), approves with the PIN, and the money moves from the balance in the card's currency if it covers it,
  otherwise from USD.
- **Fees, limits and the PIN.** The empty state links to the card terms and conditions, which open with a "Limits and fees" list
  (15 active cards, daily and per-transaction limits, the $2.00 creation fee, and the funding and withdrawal fees). Putting money on a card costs a funding fee: 1% of the amount, capped at $100 (in
  `POLICY.cardFundingFee`; the withdrawal fee is a placeholder with the same schedule). The transaction PIN is needed to add money,
  to show the card number and security code (they hide again after 45 seconds), to freeze, and to terminate a card.
  "Cancel card" is now **Terminate card** everywhere users see it. Subscriptions are hidden for now: no tab, no sidebar or search entry, and `/subscriptions` redirects to `/cards`.
- **History includes funding.** Every top-up of a card (from the card page or the create success screen) is a *Card funded*
  row in History, shown as a credit with the balance it came from. It isn't spend, so it doesn't change "left today".
- **No fallback bank account.** Cards only pay from Foren balances; the fallback was removed from the model, engine and every screen.
- **Company cards and invites.** A card can be for a team member (in their name) or for the company (Revolut's "virtual company card",
  up to 5 people can use and manage it). You can add someone who isn't on Foren yet while creating a card; they get an invite.
- **Requests and Subscriptions** use the same layout as Cards: tabs, a dense table and a right-hand detail panel (a sheet on phones).
  Request detail follows Revolut: Approve/Decline first, then status + approvals timeline, note and request details.
- Cards are virtual only. Physical cards, card type and activation were removed.
- **Make a payment (cardholder) was removed** (15 Oct 2026). 
- **Test a charge was removed** (15 Oct 2026). Declines are shown through declined transactions in the seed data (e.g. Jumia on Marketing ads, Spotify on Lagos office).
- **The mobile personal track was removed** (15 Oct 2026) at the user's request; the prototype is business only.
- **Card controls for business cards:** Payments in other currencies and Payments without a security code (the engine declines
  non-NGN charges when the first is off; the second is stored only). Cards without saved controls allow everything.
- One decline reason not in §9 was added for state coverage: *expired*.
