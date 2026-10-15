import Link from "next/link";

// QA / design-review index: every state in the UX doc's §10 checklist and how to reach it.
const DEMO = "Demo panel";

const MATRIX: { area: string; states: [string, string, string?][] }[] = [
  {
    area: "Cards overview",
    states: [
      ["First-time empty", `${DEMO} → Start as a new account`, "/cards"],
      ["Populated list", "Default data", "/cards"],
      ["Filters active", "Status chip or cardholder filter", "/cards?status=frozen"],
      ["No filter results", "Filter to a holder with no cards in that status", "/cards?status=canceled&holder=u_tunde"],
      ["Loading", `${DEMO} → Network speed: Slow`, "/cards"],
      ["Error", `${DEMO} → Fail page loads`, "/cards"],
      ["Archived list", "Archived tab", "/cards?view=archived"],
    ],
  },
  {
    area: "Create card",
    states: [
      ["Default form", "", "/cards/new"],
      ["Steps with one progress bar", "Continue through each step", "/cards/new"],
      ["Continue disabled until the step is complete", "Step 1 with nothing filled in", "/cards/new"],
      ["Company card + who can manage it", "Who’s it for? → The company", "/cards/new"],
      ["Add someone who isn’t on Foren", "Add someone who isn’t on Foren", "/cards/new"],
      ["One merchant vs many merchants", "Spend controls", "/cards/new"],
      ["Optional merchant check", "Spend controls → Check a merchant", "/cards/new"],
      ["Creating", `${DEMO} → Slow, then Create card`],
      ["Success (with invite note)", "Create card", "/cards/new"],
      ["Issue failure", `${DEMO} → Fail saves, then Create card`],
    ],
  },
  {
    area: "Card detail",
    states: [
      ["Active", "", "/cards/c_ops"],
      ["Auto", "", "/cards/c_figma"],
      ["Frozen", "", "/cards/c_lagos"],
      ["Canceled", "", "/cards/c_events"],
      ["Archived", "", "/cards/c_offsite"],
      ["One merchant, waiting for its first charge", "Meta Ads", "/cards/c_meta"],
      ["One merchant, locked; naira only; Protect GBP", "Power bills", "/cards/c_power"],
      ["Trip dates + custom balance order + Apple Pay", "EU roadshow", "/cards/c_eu"],
      ["Locked by an admin", "Kano depot", "/cards/c_kano"],
      ["Card for someone not on Foren (invite pending), CAD limit", "Toronto supplies", "/cards/c_supplies"],
      ["Emergency card, used", "Emergency · Air Peace", "/cards/c_emerg"],
      ["Temporary limit (restores itself)", "Field team", "/cards/c_field"],
      ["Emergency (countdown)", "Request + approve an emergency card"],
      ["Card page (own page, Figma layout)", "Click any card in the list", "/cards/c_ops"],
      ["Card details shown in place", "Card details → Show details", "/cards/c_ops"],
      ["Card controls (switches + Change)", "Card page → Card controls", "/cards/c_ops"],
      ["Payment declined by a card control", "Card controls → Payments in other currencies off, then Card controls → Test a charge in USD", "/cards/c_ops?tab=controls"],
      ["History (audit log)", "Card controls → History → View", "/cards/c_ops"],
      ["Request a card (team member)", "View as Cardholder → Request card", "/cards/request"],
      ["Limit increase request", "View as Cardholder → Ops travel → Spending limit → Ask for more", "/cards/c_ops"],
      ["Admin lock (cardholder can’t request unfreeze)", "Card controls → Lock card", "/cards/c_ops"],
      ["Spending period", "Card controls → Spending period", "/cards/c_ops"],
      ["Add to Apple Pay / Google Pay", "Your own card (Amara: Software & tools)", "/cards/c_sw"],
      ["Statement + CSV, receipts, notes, categories", "Card → Transactions", "/cards/c_ops/transactions"],
      ["Create several cards at once", "Step 1 → Add another card with the same settings", "/cards/new"],
      ["Draft saved to finish later", "Create card → Save and finish later", "/cards/new"],
      ["Spending abroad (business)", "Sidebar → Cards → Spending abroad, or the card page", "/travel?card=c_ops"],
      ["Pending card request in the card list", "Send a request, then view as Account owner", "/cards"],
      ["Cancel: consequences + Freeze instead", "Card controls → Cancel card", "/cards/c_sw"],
      ["Company card (used by several people)", "", "/cards/c_sw"],
      ["Subscription moved to its own card; old card blocks it", `Subscriptions → Give it its own card, then ${DEMO} → Merchant switches to its new card`, "/subscriptions"],
    ],
  },
  {
    area: "Merchant checker",
    states: [
      ["Works", "Search Figma", "/cards/check-merchant?card=c_ops&merchant=m_figma"],
      ["Likely to work", "Search LinkedIn Ads", "/cards/check-merchant?card=c_ops&merchant=m_linkedin"],
      ["Setup needed", "Search Adobe", "/cards/check-merchant?card=c_ops&merchant=m_adobe"],
      ["Won’t work (network)", "Search Marriott", "/cards/check-merchant?card=c_ops&merchant=m_marriott"],
      ["Won’t work (card rule)", "Netflix on Client entertainment", "/cards/check-merchant?card=c_ent&merchant=m_netflix"],
      ["No history yet", "Search Lekki Pop-up Kiosk, or type any unknown name", "/cards/check-merchant?card=c_ops&merchant=m_kiosk"],
      ["Lookup error", `${DEMO} → Fail page loads, then search`],
    ],
  },
  {
    area: "Transactions",
    states: [
      ["Populated", "", "/cards/c_ops/transactions"],
      ["No transactions", "Any newly issued card"],
      ["Split funding", "British Airways £2,860", "/cards/c_ops/transactions"],
      ["FX applied", "Software & tools charges", "/cards/c_sw/transactions"],
      ["Fee avoided", "British Airways £1,240 (GBP from GBP)", "/cards/c_ops/transactions"],
      ["Declined detail", "Netflix on Client entertainment", "/cards/c_ent/transactions"],
      ["Test a charge", "", "/cards/c_ent/test-charge"],
    ],
  },
  {
    area: "Decline recovery (view as Cardholder)",
    states: [
      ["Each decline reason", "Test a charge: Netflix on Client entertainment (blocked), BA £400 (per-charge), any on Lagos office (frozen)", "/cards/c_ent/test-charge"],
      ["Request pending", "Request one-time approval"],
      ["Owner approval (approvals timeline)", "Switch to Account owner → Requests", "/requests"],
      ["Denied", "Owner → Decline with a note"],
      ["Approved + countdown", "Owner → Approve once, back to the payment"],
      ["Expired approval", `${DEMO} → +16 min`],
      ["Recovery failed", "Retry on another blocked card"],
    ],
  },
  {
    area: "Subscriptions",
    states: [
      ["Populated / due soon", "", "/subscriptions"],
      ["No subscriptions", `${DEMO} → Start as a new account`, "/subscriptions"],
      ["Declined", "Spotify on Lagos office", "/subscriptions?sub=s_spotify_lagos"],
      ["Blocked", "Netflix", "/subscriptions?sub=s_netflix"],
      ["Still on old card", "Open any → Give it its own card", "/subscriptions?sub=s_gws"],
      ["Insufficient history", "Adobe Creative Cloud", "/subscriptions?sub=s_adobe"],
      ["At-risk balance", `${DEMO} → Simulate low balances (LinkedIn Ads)`, "/subscriptions"],
    ],
  },
  {
    area: "AutoFX (Global account)",
    states: [
      ["No goals", "", "/global-account"],
      ["Goal editor by type", "Pick a goal type"],
      ["Saved / on track / waiting for rate", `${DEMO} → Load sample AutoFX goals`, "/global-account"],
      ["Action taken", "Run goal check (demo)"],
      ["Unable to act", "Simulate low balances, then add a Keep-minimum goal"],
    ],
  },
];

export default function QAPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[30px] leading-[34px] font-semibold tracking-[-0.025em] text-fg">State coverage</h1>
        <p className="mt-1 max-w-2xl text-[14px] text-fg-2">
          Every state from the UX doc’s §10 checklist and how to reach it. Use the Demo panel (bottom right) to switch role, slow the network, force failures or move the clock.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {MATRIX.map((g) => (
          <section key={g.area} className="rounded-[20px] bg-surface p-5">
            <h2 className="mb-3 text-[16px] font-semibold text-fg">{g.area}</h2>
            <ul className="divide-y divide-line">
              {g.states.map(([state, how, href]) => (
                <li key={state} className="flex items-start justify-between gap-4 py-2 text-[13px]">
                  <div>
                    <div className="font-medium text-fg">{state}</div>
                    {how && <div className="text-fg-3">{how}</div>}
                  </div>
                  {href && (
                    <Link href={href} className="shrink-0 font-semibold text-fg underline underline-offset-2">
                      Open
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
