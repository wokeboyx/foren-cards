// Seed data, generated relative to "now" so due-soon windows and limit periods always have data.
import { DEFAULT_BLOCKED_CATEGORIES } from "@/domain/labels";
import { money } from "@/domain/money";
import { route } from "@/domain/routing";
import type {
  AutoFxGoal,
  Balance,
  Card,
  CardDraft,
  CardRequest,
  Currency,
  FundingConfig,
  Money,
  Notification,
  Person,
  Subscription,
  Transaction,
} from "@/domain/types";

export const PEOPLE: Person[] = [
  { id: "u_amara", name: "Amara Okafor", email: "amara@kolalogistics.test", role: "owner" },
  { id: "u_tunde", name: "Tunde Bello", email: "tunde@kolalogistics.test", role: "cardholder" },
  { id: "u_chidi", name: "Chidi Eze", email: "chidi@kolalogistics.test", role: "finance" },
  { id: "u_zainab", name: "Zainab Musa", email: "zainab@kolalogistics.test", role: "cardholder" },
  { id: "u_grace", name: "Grace Adeyemi", email: "grace@kolalogistics.test", role: "cardholder" },
];

export const COMPANY = { name: "Kola Logistics Ltd" };
export const PERSONAL_USER = { id: "p_ife", name: "Ifeoma Nwosu" };


const ADDRESS = { line1: "14 Adeola Odeku Street", city: "Lagos", postcode: "101241", country: "Nigeria" };

const ALL: Currency[] = ["USD", "GBP", "EUR", "NGN", "CAD"];
export const defaultFunding = (): FundingConfig => ({ strategy: "cheapest_fx", order: [...ALL] });

/** yyyy-mm-dd, offset by whole days (negative = past). */
const dayKey = (now: Date, offset: number) => {
  const x = new Date(now);
  x.setDate(x.getDate() + offset);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

const daysAgo = (now: Date, d: number, h = 10) => {
  const x = new Date(now);
  x.setDate(x.getDate() - d);
  x.setHours(h, (d * 7) % 60, 0, 0);
  return x.toISOString();
};

function card(partial: Partial<Card> & Pick<Card, "id" | "nickname" | "holderId" | "last4">, now: Date): Card {
  return {
    kind: "standard",
    status: "active",
    archived: false,
    design: "midnight",
    expiry: "2029-09",
    funding: defaultFunding(),
    permissions: {
      mode: "anywhere",
      allowedMerchantIds: [],
      allowedCategories: [],
      blockedMerchantIds: [],
      blockedCategories: [...DEFAULT_BLOCKED_CATEGORIES],
    },
    limit: { period: "monthly", amount: money(5000, "USD") },
    billingAddress: ADDRESS,
    createdAt: daysAgo(now, 90),
    ...partial,
  };
}

export type SeedState = {
  cards: Card[];
  balances: Balance[];
  transactions: Transaction[];
  subscriptions: Subscription[];
  requests: CardRequest[];
  goals: AutoFxGoal[];
  notifications: Notification[];
  invitedPeople: Person[];
  cardDrafts: CardDraft[];
};

export function seed(now = new Date()): SeedState {
  const cards: Card[] = [
    card({ id: "c_ops", nickname: "Ops travel", holderId: "u_tunde", last4: "4821", design: "skyline", limit: { period: "monthly", amount: money(25000, "USD") } }, now),
    card(
      {
        id: "c_mkt",
        nickname: "Marketing ads",
        holderId: "u_zainab",
        last4: "7710",
        design: "aurora",
        funding: { strategy: "cheapest_fx", order: [...ALL] },
        permissions: {
          mode: "merchants",
          allowedMerchantIds: ["m_linkedin", "m_meta", "m_canva"],
          allowedCategories: [],
          blockedMerchantIds: [],
          blockedCategories: [...DEFAULT_BLOCKED_CATEGORIES],
        },
        limit: { period: "monthly", amount: money(8000, "USD") },
      },
      now
    ),
    card(
      {
        id: "c_sw",
        nickname: "Software & tools",
        holderId: "u_amara",
        companyCard: true,
        contactIds: ["u_amara", "u_chidi"],
        last4: "3307",
        design: "midnight",
        funding: { strategy: "protect", protect: "USD", order: [...ALL] },
        permissions: {
          mode: "categories",
          allowedMerchantIds: [],
          allowedCategories: ["software"],
          blockedMerchantIds: [],
          blockedCategories: [...DEFAULT_BLOCKED_CATEGORIES],
        },
        limit: { period: "monthly", amount: money(3000, "USD") },
      },
      now
    ),
    card(
      {
        id: "c_figma",
        nickname: "Figma",
        holderId: "u_amara",
        last4: "9054",
        design: "lime",
        lockedMerchantId: "m_figma",
        limit: { period: "monthly", amount: money(200, "USD") },
      },
      now
    ),
    card(
      {
        id: "c_lagos",
        nickname: "Lagos office",
        holderId: "u_tunde",
        last4: "1186",
        status: "frozen",
        design: "cream",
        limit: { period: "weekly", amount: money(2_500_000, "NGN") },
      },
      now
    ),
    card(
      {
        id: "c_ent",
        nickname: "Client entertainment",
        holderId: "u_tunde",
        last4: "6620",
        design: "titanium",
        permissions: {
          mode: "anywhere",
          allowedMerchantIds: [],
          allowedCategories: [],
          blockedMerchantIds: ["m_netflix"],
          blockedCategories: [...DEFAULT_BLOCKED_CATEGORIES],
        },
        limit: { period: "per_txn", amount: money(250, "GBP") },
      },
      now
    ),
    card(
      {
        id: "c_field",
        nickname: "Field team",
        holderId: "u_grace",
        last4: "2290",
        design: "titanium",
        limit: { period: "daily", amount: money(750_000, "NGN") },
        // Raised for a week, then it goes back to ₦500,000 a day.
        limitRestore: { limit: { period: "daily", amount: money(500_000, "NGN") }, at: daysAgo(now, -5) },
      },
      now
    ),
    // One merchant: waiting for its first charge, then it locks to that merchant.
    card(
      {
        id: "c_meta",
        nickname: "Meta Ads",
        holderId: "u_zainab",
        last4: "6402",
        design: "aurora",
        permissions: { mode: "first_merchant", allowedMerchantIds: [], allowedCategories: [], blockedMerchantIds: [], blockedCategories: [...DEFAULT_BLOCKED_CATEGORIES] },
        limit: { period: "monthly", amount: money(2_000, "USD") },
        createdAt: daysAgo(now, 1),
      },
      now
    ),
    // One merchant, already locked; naira only (foreign payments off); protects GBP.
    card(
      {
        id: "c_power",
        nickname: "Power bills",
        holderId: "u_chidi",
        last4: "5170",
        design: "cream",
        lockedMerchantId: "m_ikeja",
        permissions: { mode: "first_merchant", allowedMerchantIds: [], allowedCategories: [], blockedMerchantIds: [], blockedCategories: [...DEFAULT_BLOCKED_CATEGORIES] },
        funding: { strategy: "protect", protect: "GBP", order: [...ALL] },
        controls: { online: true, foreignCurrency: false, non3ds: true },
        limit: { period: "monthly", amount: money(400_000, "NGN") },
      },
      now
    ),
    // Trip card: only works between two dates, pays from EUR first (custom order), in Apple Pay.
    card(
      {
        id: "c_eu",
        nickname: "EU roadshow",
        holderId: "u_tunde",
        last4: "3958",
        design: "skyline",
        funding: { strategy: "custom", order: ["EUR", "GBP", "USD", "CAD", "NGN"] },
        permissions: { mode: "categories", allowedMerchantIds: [], allowedCategories: ["travel", "transport", "food"], blockedMerchantIds: [], blockedCategories: [...DEFAULT_BLOCKED_CATEGORIES] },
        activeFrom: dayKey(now, -1),
        activeUntil: dayKey(now, 9),
        controls: { online: true, foreignCurrency: true, non3ds: false },
        wallets: ["apple"],
        limit: { period: "weekly", amount: money(4_000, "EUR") },
        createdAt: daysAgo(now, 6),
      },
      now
    ),
    // Locked by an admin: the cardholder can't ask to unfreeze it.
    card(
      {
        id: "c_kano",
        nickname: "Kano depot",
        holderId: "u_grace",
        last4: "7741",
        status: "frozen",
        design: "titanium",
        adminLock: { by: "Amara Okafor", at: daysAgo(now, 1), reason: "Suspected fraud — card details found online" },
        limit: { period: "monthly", amount: money(1_200_000, "NGN") },
      },
      now
    ),
    // For someone invited while creating the card (not on Foren yet). CAD limit.
    card(
      {
        id: "c_supplies",
        nickname: "Toronto supplies",
        holderId: "u_bisi",
        last4: "2685",
        design: "lime",
        permissions: { mode: "merchants", allowedMerchantIds: ["m_staples"], allowedCategories: [], blockedMerchantIds: [], blockedCategories: [...DEFAULT_BLOCKED_CATEGORIES] },
        limit: { period: "monthly", amount: money(1_500, "CAD") },
        createdAt: daysAgo(now, 2),
      },
      now
    ),
    // Emergency single-use card that has been used.
    card(
      {
        id: "c_emerg",
        nickname: "Emergency · Air Peace",
        holderId: "u_tunde",
        last4: "9310",
        kind: "emergency",
        design: "cream",
        lockedMerchantId: "m_airpeace",
        singleUse: true,
        used: true,
        validUntil: daysAgo(now, 3, 11),
        limit: { period: "per_txn", amount: money(180_000, "NGN") },
        createdAt: daysAgo(now, 3),
      },
      now
    ),
    card({ id: "c_events", nickname: "Old events", holderId: "u_zainab", last4: "5532", status: "canceled", design: "midnight" }, now),
    card({ id: "c_offsite", nickname: "2025 offsite", holderId: "u_grace", last4: "8813", status: "canceled", archived: true, design: "skyline" }, now),
  ];

  const balances: Balance[] = [
    { currency: "USD", available: money(48_210.55, "USD") },
    { currency: "GBP", available: money(12_400, "GBP") },
    { currency: "EUR", available: money(3_150.2, "EUR") },
    { currency: "NGN", available: money(18_450_000, "NGN") },
    { currency: "CAD", available: money(2_100, "CAD") },
  ];

  const rich: Balance[] = balances.map((b) => ({ ...b, available: { ...b.available, minor: b.available.minor * 10 } }));
  const txns: Transaction[] = [];
  let n = 0;
  const tx = (cardId: string, merchantId: string, amount: Money, ago: number, opts: { snapshot?: Balance[]; declined?: Transaction["declineReason"]; hour?: number } = {}) => {
    const c = cards.find((x) => x.id === cardId)!;
    const id = `t_${++n}`;
    if (opts.declined) {
      txns.push({ id, cardId, merchantId, amount, status: "declined", at: daysAgo(now, ago, opts.hour), legs: [], declineReason: opts.declined });
      return;
    }
    const r = route(amount, c.funding, opts.snapshot ?? rich);
    if (!r.ok) throw new Error(`seed route failed for ${id}`);
    const at = daysAgo(now, ago, opts.hour);
    // Older charges already have receipts; the last few days are still missing theirs.
    const receipt = ago > 5 ? { name: `receipt-${id}.pdf`, size: 84_000 + n * 1_000, at } : undefined;
    txns.push({ id, cardId, merchantId, amount, status: "approved", at, legs: r.legs, feeAvoided: r.feeAvoided, receipt });
  };

  // Ops travel
  tx("c_ops", "m_uber", money(18_500, "NGN"), 0, { hour: 8 });
  tx("c_ops", "m_ba", money(1_240, "GBP"), 2);
  tx("c_ops", "m_airpeace", money(412_000, "NGN"), 5);
  tx("c_ops", "m_bolt", money(9_800, "NGN"), 6);
  // Split across balances: GBP was low at the time
  tx("c_ops", "m_ba", money(2_860, "GBP"), 9, {
    snapshot: [
      { currency: "USD", available: money(30_000, "USD") },
      { currency: "GBP", available: money(1_900, "GBP") },
      { currency: "EUR", available: money(800, "EUR") },
      { currency: "NGN", available: money(0, "NGN") },
      { currency: "CAD", available: money(0, "CAD") },
    ],
  });
  tx("c_ops", "m_marriott", money(640, "EUR"), 12);
  tx("c_ops", "m_uber", money(22_300, "NGN"), 14);
  tx("c_ops", "m_spotify", money(11.99, "GBP"), 27);
  // Marketing
  tx("c_mkt", "m_linkedin", money(1_500, "USD"), 26);
  tx("c_mkt", "m_linkedin", money(1_500, "USD"), 56);
  tx("c_mkt", "m_meta", money(980, "USD"), 4);
  tx("c_mkt", "m_canva", money(119.99, "USD"), 160);
  tx("c_mkt", "m_meta", money(1_120, "USD"), 18);
  tx("c_mkt", "m_jumia", money(85_000, "NGN"), 3, { declined: "merchant_not_allowed" });
  // Software (USD charges paid with USD protected -> converted from other balances)
  tx("c_sw", "m_notion", money(96, "USD"), 27);
  tx("c_sw", "m_notion", money(96, "USD"), 57);
  tx("c_sw", "m_slack", money(87.5, "USD"), 18);
  tx("c_sw", "m_slack", money(87.5, "USD"), 48);
  tx("c_sw", "m_gws", money(41.4, "GBP"), 24);
  tx("c_sw", "m_gws", money(41.4, "GBP"), 54);
  tx("c_sw", "m_aws", money(412.18, "USD"), 10);
  tx("c_sw", "m_aws", money(388.92, "USD"), 40);
  tx("c_sw", "m_adobe", money(65.99, "GBP"), 8);
  // Figma auto card
  tx("c_figma", "m_figma", money(45, "USD"), 29);
  tx("c_figma", "m_figma", money(45, "USD"), 59);
  // Lagos office (before freeze)
  tx("c_lagos", "m_jumia", money(126_400, "NGN"), 7);
  tx("c_lagos", "m_ikeja", money(85_000, "NGN"), 16);
  tx("c_lagos", "m_spotify", money(11.99, "GBP"), 2, { declined: "frozen" });
  // Client entertainment
  tx("c_ent", "m_chowdeck", money(64_500, "NGN"), 1);
  tx("c_ent", "m_netflix", money(15.49, "USD"), 6, { declined: "merchant_blocked" });
  tx("c_ent", "m_chowdeck", money(38_200, "NGN"), 11);
  // Power bills (locked to Ikeja Electric; a foreign charge was declined by Card controls)
  tx("c_power", "m_ikeja", money(92_000, "NGN"), 13);
  tx("c_power", "m_ikeja", money(88_500, "NGN"), 43);
  tx("c_power", "m_aws", money(20, "USD"), 4, { declined: "card_control" });
  // EU roadshow
  tx("c_eu", "m_marriott", money(780, "EUR"), 0, { hour: 7 });
  tx("c_eu", "m_ba", money(310, "GBP"), 1);
  // Kano depot (before the admin lock)
  tx("c_kano", "m_jumia", money(214_000, "NGN"), 9);
  tx("c_kano", "m_binance", money(500, "USD"), 1, { declined: "category_blocked" });
  // Toronto supplies
  tx("c_supplies", "m_staples", money(236.4, "CAD"), 1);
  // Emergency card (used once)
  tx("c_emerg", "m_airpeace", money(168_000, "NGN"), 3, { hour: 12 });
  // Field team
  tx("c_field", "m_bolt", money(42_000, "NGN"), 0, { hour: 9 });
  // Old canceled card
  tx("c_events", "m_marriott", money(220, "EUR"), 70);

  const transactions = txns.sort((a, b) => b.at.localeCompare(a.at));

  const sub = (id: string, merchantId: string, cardId: string, usualAmount: Money, chargesAgo: number[], extra: Partial<Subscription> = {}): Subscription => ({
    id,
    merchantId,
    cardId,
    usualAmount,
    frequency: "monthly",
    chargeDates: chargesAgo.map((d) => daysAgo(now, d)),
    blocked: false,
    reminders: { owner: true, cardholder: false, daysBefore: 3 },
    ...extra,
  });

  const subscriptions: Subscription[] = [
    sub("s_notion", "m_notion", "c_sw", money(96, "USD"), [27, 57]),
    sub("s_slack", "m_slack", "c_sw", money(87.5, "USD"), [18, 48]),
    sub("s_gws", "m_gws", "c_sw", money(41.4, "GBP"), [24, 54]),
    sub("s_aws", "m_aws", "c_sw", money(400, "USD"), [10, 40]),
    sub("s_adobe", "m_adobe", "c_sw", money(65.99, "GBP"), [8]),
    sub("s_figma", "m_figma", "c_figma", money(45, "USD"), [29, 59]),
    sub("s_linkedin", "m_linkedin", "c_mkt", money(1_500, "USD"), [26, 56]),
    sub("s_canva", "m_canva", "c_mkt", money(119.99, "USD"), [160, 525], { frequency: "yearly" }),
    sub("s_spotify_ops", "m_spotify", "c_ops", money(11.99, "GBP"), [27, 57]),
    sub("s_spotify_lagos", "m_spotify", "c_lagos", money(11.99, "GBP"), [32, 62], {
      lastDecline: { at: daysAgo(now, 2), reason: "frozen" },
    }),
    sub("s_netflix", "m_netflix", "c_ent", money(15.49, "USD"), [36, 66], {
      blocked: true,
      lastDecline: { at: daysAgo(now, 6), reason: "merchant_blocked" },
    }),
  ];

  const requests: CardRequest[] = [
    {
      id: "r_seed1",
      kind: "one_time_approval",
      requesterId: "u_tunde",
      cardId: "c_ent",
      merchantId: "m_ba",
      amount: money(620, "GBP"),
      reason: "per_charge_limit",
      note: "Client flight change — needs to be booked today.",
      state: "pending",
      createdAt: daysAgo(now, 0, 9),
    },
    {
      id: "r_seed2",
      kind: "limit_increase",
      requesterId: "u_zainab",
      cardId: "c_mkt",
      newLimit: { period: "monthly", amount: money(12_000, "USD") },
      oldLimit: { period: "monthly", amount: money(8_000, "USD") },
      note: "Q4 campaign launch on LinkedIn and Meta.",
      state: "pending",
      createdAt: daysAgo(now, 0, 8),
    },
    {
      id: "r_seed3",
      kind: "new_card",
      requesterId: "u_grace",
      newCard: { nickname: "Site visits", limit: { period: "monthly", amount: money(300_000, "NGN") }, oneMerchant: false, design: "titanium" },
      note: "Fuel and transport for weekly warehouse site visits.",
      state: "pending",
      createdAt: daysAgo(now, 1, 15),
    },
  ];

  const notifications: Notification[] = [
    {
      id: "n_seed1",
      at: daysAgo(now, 0, 9),
      forRole: "owner",
      title: "Approval requested",
      body: "Tunde Bello asked to approve £620.00 at British Airways on Client entertainment.",
      href: "/requests",
      read: false,
    },
    {
      id: "n_seed2",
      at: daysAgo(now, 0, 8),
      forRole: "owner",
      title: "Limit increase requested",
      body: "Zainab Musa asked to raise Marketing ads to $12,000.00 a month.",
      href: "/requests",
      read: false,
    },
    {
      id: "n_seed3",
      at: daysAgo(now, 1, 15),
      forRole: "owner",
      title: "New card requested",
      body: "Grace Adeyemi asked for a card: “Site visits”, up to ₦300,000.00 a month.",
      href: "/cards",
      read: false,
    },
  ];

  const invitedPeople: Person[] = [{ id: "u_bisi", name: "Bisi Adewale", email: "bisi@kolalogistics.test", role: "cardholder", invited: true }];

  const cardDrafts: CardDraft[] = [
    {
      id: "d_seed1",
      savedAt: daysAgo(now, 0, 7),
      step: 2,
      names: [],
      amountText: "1500",
      years: 1,
      card: card({ id: "d_seed1", nickname: "Lagos tech summit", holderId: "u_zainab", last4: "", design: "aurora", limit: { period: "monthly", amount: money(1_500, "USD") }, createdAt: daysAgo(now, 0, 7) }, now),
    },
  ];

  return { cards, balances, transactions, subscriptions, requests, goals: [], notifications, invitedPeople, cardDrafts };
}

export function sampleGoals(now = new Date()): AutoFxGoal[] {
  return [
    {
      id: "g_s1",
      type: "keep_min",
      currency: "GBP",
      threshold: money(10_000, "GBP"),
      counterCurrency: "USD",
      createdAt: daysAgo(now, 20),
      actions: [],
    },
    {
      id: "g_s2",
      type: "target_rate",
      currency: "USD",
      counterCurrency: "NGN",
      amount: money(5_000, "USD"),
      targetRate: 1600,
      createdAt: daysAgo(now, 6),
      actions: [],
    },
    {
      id: "g_s3",
      type: "cap",
      currency: "CAD",
      threshold: money(1_500, "CAD"),
      counterCurrency: "USD",
      createdAt: daysAgo(now, 3),
      actions: [],
    },
  ];
}
