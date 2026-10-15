# Foren Cards — prototype

A clickable Next.js prototype of the Foren Cards UX flows (business cards, Flows 1–8). Built with the Foren Design System components from
foren-docs.vercel.app. **Test data only — no real cards, money or merchants.**

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # domain unit tests (authorisation engine, routing, forecasts, contrast)
npm run test:e2e     # production build + Playwright flows (§13 tasks) + axe accessibility scan
```

## Live prototype

**https://wokeboyx.github.io/foren-cards/** — deployed to GitHub Pages by `.github/workflows/deploy-pages.yml` on every push to `main`.

- The Pages build is a static export (`GITHUB_PAGES=true npx next build` → `out/`, served from `/foren-cards`). Local dev, tests and `next start` don't use it.
- Sample cards have pre-built pages. Cards created in the browser live in localStorage, so `app/not-found.tsx` renders their pages on the client.
- Files in `public/` are referenced through `asset()` (`lib/base-path.ts`) so they work under the sub-path.

## Using the prototype

- **Demo panel** (bottom right): switch role (Account owner / Cardholder / Finance lead; also "Viewing as" in the top bar),
  slow the network, force load or save failures, move the clock (+16 min expires approvals),
  simulate low balances, load sample AutoFX goals, reset data.
- **/qa** lists every state from the UX doc §10 checklist with a link or instructions to reach it.
- State persists in localStorage, so a usability session survives a refresh. "Reset demo data" restores the seed.

## Where things live

| Path | What |
| --- | --- |
| `domain/` | Pure logic: `authorize.ts` (single authorisation engine), `routing.ts` (SmartRoute), `forecast.ts`, `compatibility.ts`, `autofx.ts` |
| `content/copy.ts` | §8 content patterns and §9 decline inventory — the single source of copy |
| `config/policy.ts` | Open questions from §12 as settings (approver roles, full-PAN roles, emergency ceiling, forecast threshold…) |
| `components/ui/` | Foren Design System components, copied verbatim from the docs site |
| `lib/store.ts`, `lib/actions.ts`, `lib/api.ts` | Persisted store, user actions, mock API with latency + fault injection |

## Layout reference

The shell follows the Foren Business Banking Figma file (DEV READY page): the "NEW IA" sidebar (workspace switcher;
Home, Dashboard, Global accounts, **Cards**; Move money; Records; Manage; Developers at the bottom), and content in an inset
panel with a breadcrumb, search, bell and avatar across the top. **Cards** sits after Move money and expands like Receive
into Overview, Requests and Spending abroad. Subscriptions and Check a merchant are tabs on the Cards overview
(Manage / Subscriptions / Check a merchant / Archived). Sidebar items outside cards show a "not part of the cards
prototype" toast. "Viewing as" (a prototype control) sits where the Figma top bar has Test mode.

Each card has its own page (`/cards/[id]`, Figma dashboard layout): spend this period with Freeze / Transactions /
Spending abroad, then one panel with tabs — Recent transactions, **Card controls** and Subscriptions (`?tab=controls`) — in the Figma Settings › Security pattern — each row says what
the control does and what it's set to now, with a switch (applies straight away) or a Change button. The right column
shows the card with its details in place (Show details → number, expiry, CVC with copy), wallets and facts.

**Design system:** screens use the foren-docs components (Button, Badge, Toggle, Progress, Segmented control for all tabs,
Table, Info note, Input, Search, Avatar, ComboBox…). The DS has no Tabs, Sidebar, Breadcrumb or Modal, so tabs use the
Segmented control, and the sidebar, breadcrumb and modals follow the Figma file using DS tokens.
Flows otherwise follow Mercury's web cards screens: Manage / Subscriptions / Archived tabs, small confirmation modals,
and a full-screen create view whose live summary doubles as the review step.

## Deviations and assumptions to review

- **Text/Tertiary token override.** The design system's `#95908b` is ~3.2:1 on white and fails WCAG AA.
  `app/globals.css` overrides it to `#6e6964` (≥ 4.5:1 everywhere). Raise with the design-system owners.
- **SmartRoute semantics** (`domain/routing.ts`) are a prototype interpretation: same-currency balance first,
  then lowest FX fee, charges may split. Cards only pay from Foren balances (no fallback account). Needs product/engineering validation.
- **Fee avoided** is only claimed for non-USD, non-NGN charges paid entirely from a same-currency balance,
  compared with converting from USD at the Foren fee. The real comparison basis is an open question.
- **Merchant logos** are letter tiles; network compatibility data is illustrative.
- **Emergency-card ceiling** is hidden (`POLICY.emergencyCeiling = null`) until product confirms it.
- Revolut Business iOS patterns, every card keeps a history (what changed, when, who: Card controls → History); cancelling lists the consequences and offers "Freeze instead"; requests show an approvals timeline (submitted by → approved/declined by, with the reason, up to 500 characters). Spend programs and bulk ordering of company cards were noted but not built (not in the UX doc).
- **Create card is a 5-step flow** (who, where, money, limits, review) with a single progress bar, per-step checks and the live preview + summary fixed on the right. Editing a card stays one page. All radio choices are stacked vertically.
- **Borrowed from Revolut / Wise / Mercury:** limit increase requests (cardholder → owner, shown on the card row and in Requests);
  receipts, notes and expense categories on transactions with a "Missing receipt" marker and filter; a monthly statement per card
  with CSV export; admin **Lock card** (stronger than freeze: the cardholder can't ask to unfreeze); **spending periods** (card only
  works between two dates; declines with "outside_period"); **bulk create** (several cards with the same settings); **Save and
  finish later** drafts shown in the card list; **Add to Apple Pay / Google Pay** (simulated: real provisioning depends on the
  card processor and needs confirming with engineering). **Spending abroad** (Wise travel hub, adapted): pick a country and a card to see which balance pays and what it costs, whether the card will work there (status, limit, period, controls), tips, and set trip dates. At /travel (from the sidebar, the card page, Global account and search).
- **Card requests live in the card list.** Team members see **Request card** where the owner sees Create card (same focus layout, single progress bar, live preview). A sent request appears in the card list as a **Pending request** row for the requester and the owner; the owner opens it in a side panel and chooses **Approve and create** or Decline. Requests also appear on the Requests page.
- **Auto cards were removed.** Payments happen at the merchant's checkout, so Foren can't suggest a card before someone pays.
  Instead, card creation asks "How many merchants will use this card?" — **One merchant** (locks to the first merchant that
  charges it; each other subscription needs its own card) or **Many merchants** (anywhere / selected merchants / categories).
  A subscription can still be given its own card (§8.4): create the card → update it at the merchant (off-app) → Foren blocks
  the merchant on the old card once it switches.
- **No fallback bank account.** Cards only pay from Foren balances; the fallback was removed from the model, engine and every screen.
- **Company cards and invites.** A card can be for a team member (in their name) or for the company (Revolut's "virtual company card",
  up to 5 people can use and manage it). You can add someone who isn't on Foren yet while creating a card; they get an invite.
- **Requests and Subscriptions** use the same layout as Cards: tabs, a dense table and a right-hand detail panel (a sheet on phones).
  Request detail follows Revolut: Approve/Decline first, then status + approvals timeline, note and request details.
- Cards are virtual only. Physical cards, card type and activation were removed.
- **Make a payment (cardholder) was removed** (15 Oct 2026). Declines are explored with Test a charge (Card controls → Test a charge).
- **The mobile personal track was removed** (15 Oct 2026) at the user's request; the prototype is business only.
- **Card controls for business cards:** Payments in other currencies and Payments without a security code (the engine declines
  non-NGN charges when the first is off; the second is stored only). Cards without saved controls allow everything.
- One decline reason not in §9 was added for state coverage: *expired*.
