// Seed data, generated relative to "now" so due-soon windows and limit periods always have data.
import { expiryFrom } from "@/domain/limits";
import { DEFAULT_BLOCKED_CATEGORIES } from "@/domain/labels";
import { money } from "@/domain/money";
import { route } from "@/domain/routing";
import type {
  AutoFxGoal,
  Balance,
  Card,
  CardRequest,
  Money,
  Notification,
  Person,
  Subscription,
  Transaction,
} from "@/domain/types";

export const PEOPLE: Person[] = [
  {
    id: "u_amara",
    name: "Amara Okafor",
    email: "amara@kolalogistics.test",
    role: "owner",
  },
  {
    id: "u_tunde",
    name: "Tunde Bello",
    email: "tunde@kolalogistics.test",
    role: "cardholder",
  },
  {
    id: "u_chidi",
    name: "Chidi Eze",
    email: "chidi@kolalogistics.test",
    role: "finance",
  },
  {
    id: "u_zainab",
    name: "Zainab Musa",
    email: "zainab@kolalogistics.test",
    role: "cardholder",
  },
  {
    id: "u_grace",
    name: "Grace Adeyemi",
    email: "grace@kolalogistics.test",
    role: "cardholder",
  },
];

export const COMPANY = { name: "Kola Logistics Ltd" };
export const PERSONAL_USER = { id: "p_ife", name: "Ifeoma Nwosu" };

const ADDRESS = {
  line1: "14 Adeola Odeku Street",
  city: "Lagos",
  postcode: "101241",
  country: "Nigeria",
};

const daysAgo = (now: Date, d: number, h = 10) => {
  const x = new Date(now);
  x.setDate(x.getDate() - d);
  x.setHours(h, (d * 7) % 60, 0, 0);
  return x.toISOString();
};

function card(
  partial: Partial<Card> & Pick<Card, "id" | "nickname" | "holderId" | "last4">,
  now: Date,
): Card {
  return {
    kind: "standard",
    status: "active",
    archived: false,
    design: "ink",
    permissions: {
      mode: "anywhere",
      allowedMerchantIds: [],
      allowedCategories: [],
      blockedMerchantIds: [],
      blockedCategories: [...DEFAULT_BLOCKED_CATEGORIES],
    },
    limit: { daily: money(5000, "USD"), txn: money(2500, "USD") },
    billingAddress: ADDRESS,
    createdAt: daysAgo(now, 90),
    ...partial,
    // Cards last 12 months from when they were created.
    expiry:
      partial.expiry ??
      expiryFrom(new Date(partial.createdAt ?? daysAgo(now, 90))),
    // Cards are prefunded: unless a card says otherwise, it holds twice its daily limit.
    balance: partial.balance ?? {
      minor: (partial.limit ?? { daily: money(5000, "USD") }).daily.minor * 2,
      currency: (partial.limit ?? { daily: money(5000, "USD") }).daily.currency,
    },
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
};

export function seed(now = new Date()): SeedState {
  const cards: Card[] = [
    card(
      {
        id: "c_ops",
        nickname: "Ops travel",
        holderId: "u_tunde",
        last4: "4821",
        design: "cobalt",
        expiry: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        limit: { daily: money(25000, "USD"), txn: money(12500, "USD") },
      },
      now,
    ),
    card(
      {
        id: "c_mkt",
        nickname: "Marketing ads",
        holderId: "u_zainab",
        last4: "7710",
        design: "clay",
        permissions: {
          mode: "merchants",
          allowedMerchantIds: ["m_linkedin", "m_meta", "m_canva"],
          allowedCategories: [],
          blockedMerchantIds: [],
          blockedCategories: [...DEFAULT_BLOCKED_CATEGORIES],
        },
        limit: { daily: money(8000, "USD"), txn: money(4000, "USD") },
      },
      now,
    ),
    card(
      {
        id: "c_sw",
        nickname: "Software & tools",
        holderId: "u_amara",
        companyCard: true,
        last4: "3307",
        design: "ink",
        permissions: {
          mode: "categories",
          allowedMerchantIds: [],
          allowedCategories: ["software"],
          blockedMerchantIds: [],
          blockedCategories: [...DEFAULT_BLOCKED_CATEGORIES],
        },
        limit: { daily: money(3000, "USD"), txn: money(1500, "USD") },
      },
      now,
    ),
    card(
      {
        id: "c_figma",
        nickname: "Design team",
        holderId: "u_amara",
        last4: "9054",
        design: "lime",
        limit: { daily: money(200, "USD"), txn: money(100, "USD") },
      },
      now,
    ),
    card(
      {
        id: "c_lagos",
        nickname: "Lagos office",
        holderId: "u_tunde",
        last4: "1186",
        status: "frozen",
        design: "chalk",
        limit: { daily: money(2500000, "NGN"), txn: money(1250000, "NGN") },
      },
      now,
    ),
    card(
      {
        id: "c_ent",
        nickname: "Sales team",
        holderId: "u_tunde",
        last4: "6620",
        design: "silver",
        limit: { daily: money(250, "GBP"), txn: money(250, "GBP") },
        balance: money(3_000, "GBP"),
      },
      now,
    ),
    // Growth team card.
    card(
      {
        id: "c_meta",
        nickname: "Growth team",
        holderId: "u_zainab",
        last4: "6402",
        design: "clay",
        limit: { daily: money(2000, "USD"), txn: money(1000, "USD") },
        createdAt: daysAgo(now, 1),
      },
      now,
    ),
    // Locked by an admin: the cardholder can't ask to unfreeze it.
    card(
      {
        id: "c_kano",
        nickname: "Kano depot",
        holderId: "u_grace",
        last4: "7741",
        status: "frozen",
        design: "silver",
        limit: { daily: money(1200000, "NGN"), txn: money(600000, "NGN") },
      },
      now,
    ),
    // For someone invited while creating the card (not on Foren yet). CAD limit.
    card(
      {
        id: "c_supplies",
        nickname: "Toronto office",
        holderId: "u_bisi",
        last4: "2685",
        design: "lime",
        limit: { daily: money(1500, "CAD"), txn: money(750, "CAD") },
        createdAt: daysAgo(now, 2),
      },
      now,
    ),
    // Emergency single-use card that has been used.
    card(
      {
        id: "c_emerg",
        nickname: "Emergency · Air Peace",
        holderId: "u_tunde",
        last4: "9310",
        kind: "emergency",
        design: "chalk",
        lockedMerchantId: "m_airpeace",
        singleUse: true,
        used: true,
        validUntil: daysAgo(now, 3, 11),
        limit: { daily: money(180000, "NGN"), txn: money(180000, "NGN") },
        createdAt: daysAgo(now, 3),
      },
      now,
    ),
    card(
      {
        id: "c_events",
        nickname: "Old events",
        holderId: "u_zainab",
        last4: "5532",
        status: "canceled",
        design: "ink",
      },
      now,
    ),
    card(
      {
        id: "c_offsite",
        nickname: "2025 offsite",
        holderId: "u_grace",
        last4: "8813",
        status: "canceled",
        archived: true,
        design: "cobalt",
      },
      now,
    ),
  ];

  const balances: Balance[] = [
    { currency: "USD", available: money(48_210.55, "USD") },
    { currency: "GBP", available: money(12_400, "GBP") },
    { currency: "EUR", available: money(3_150.2, "EUR") },
    { currency: "NGN", available: money(18_450_000, "NGN") },
    { currency: "CAD", available: money(2_100, "CAD") },
  ];

  const txns: Transaction[] = [];
  let n = 0;
  const tx = (
    cardId: string,
    merchantId: string,
    amount: Money,
    ago: number,
    opts: { declined?: Transaction["declineReason"]; hour?: number } = {},
  ) => {
    const c = cards.find((x) => x.id === cardId)!;
    const id = `t_${++n}`;
    if (opts.declined) {
      txns.push({
        id,
        cardId,
        merchantId,
        amount,
        status: "declined",
        at: daysAgo(now, ago, opts.hour),
        legs: [],
        declineReason: opts.declined,
      });
      return;
    }
    const r = route(amount, {
      minor: 1_000_000_000_000,
      currency: c.balance.currency,
    });
    if (!r.ok) throw new Error(`seed route failed for ${id}`);
    const at = daysAgo(now, ago, opts.hour);
    // Older charges already have receipts; the last few days are still missing theirs.
    const receipt =
      ago > 5
        ? { name: `receipt-${id}.pdf`, size: 84_000 + n * 1_000, at }
        : undefined;
    txns.push({
      id,
      cardId,
      merchantId,
      amount,
      status: "approved",
      at,
      legs: r.legs,
      feeAvoided: r.feeAvoided,
      receipt,
    });
  };

  // Ops travel
  tx("c_ops", "m_uber", money(18_500, "NGN"), 0, { hour: 8 });
  tx("c_ops", "m_ba", money(1_240, "GBP"), 2);
  tx("c_ops", "m_airpeace", money(412_000, "NGN"), 5);
  tx("c_ops", "m_bolt", money(9_800, "NGN"), 6);
  tx("c_ops", "m_marriott", money(640, "EUR"), 12);
  tx("c_ops", "m_uber", money(22_300, "NGN"), 14);
  tx("c_ops", "m_spotify", money(11.99, "GBP"), 27);
  // Marketing
  tx("c_mkt", "m_linkedin", money(1_500, "USD"), 26);
  tx("c_mkt", "m_linkedin", money(1_500, "USD"), 56);
  tx("c_mkt", "m_meta", money(980, "USD"), 4);
  tx("c_mkt", "m_canva", money(119.99, "USD"), 160);
  tx("c_mkt", "m_meta", money(1_120, "USD"), 18);
  tx("c_mkt", "m_jumia", money(85_000, "NGN"), 3, {
    declined: "merchant_not_allowed",
  });
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
  // Design team
  tx("c_figma", "m_figma", money(45, "USD"), 29);
  tx("c_figma", "m_figma", money(45, "USD"), 59);
  // Lagos office (before freeze)
  tx("c_lagos", "m_jumia", money(126_400, "NGN"), 7);
  tx("c_lagos", "m_ikeja", money(85_000, "NGN"), 16);
  tx("c_lagos", "m_spotify", money(11.99, "GBP"), 2, { declined: "frozen" });
  // Sales team
  tx("c_ent", "m_chowdeck", money(64_500, "NGN"), 1);
  tx("c_ent", "m_chowdeck", money(38_200, "NGN"), 11);
  // Kano depot (before the admin lock)
  tx("c_kano", "m_jumia", money(214_000, "NGN"), 9);
  tx("c_kano", "m_binance", money(500, "USD"), 1, {
    declined: "category_blocked",
  });
  // Toronto office
  tx("c_supplies", "m_staples", money(236.4, "CAD"), 1);
  // Emergency card (used once)
  tx("c_emerg", "m_airpeace", money(168_000, "NGN"), 3, { hour: 12 });
  // Old canceled card
  tx("c_events", "m_marriott", money(220, "EUR"), 70);

  // Money added to cards from the account balances, so each card's history starts with it
  const fund = (
    cardId: string,
    amount: Money,
    from: Transaction["fundedFrom"],
    ago: number,
  ) =>
    txns.push({
      id: `t_fund_${cardId}_${ago}`,
      cardId,
      merchantId: "",
      amount,
      status: "approved",
      at: daysAgo(now, ago, 9),
      legs: [],
      kind: "funding",
      fundedFrom: from,
    });
  fund("c_ops", money(50_000, "USD"), "USD", 30);
  fund("c_ops", money(25_000, "USD"), "USD", 9);
  fund("c_mkt", money(16_000, "USD"), "USD", 20);
  fund("c_sw", money(10_000, "USD"), "USD", 15);

  const transactions = txns.sort((a, b) => b.at.localeCompare(a.at));

  const sub = (
    id: string,
    merchantId: string,
    cardId: string,
    usualAmount: Money,
    chargesAgo: number[],
    extra: Partial<Subscription> = {},
  ): Subscription => ({
    id,
    merchantId,
    cardId,
    usualAmount,
    frequency: "monthly",
    chargeDates: chargesAgo.map((d) => daysAgo(now, d)),
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
    sub("s_canva", "m_canva", "c_mkt", money(119.99, "USD"), [160, 525], {
      frequency: "yearly",
    }),
    sub("s_spotify_ops", "m_spotify", "c_ops", money(11.99, "GBP"), [27, 57]),
    sub(
      "s_spotify_lagos",
      "m_spotify",
      "c_lagos",
      money(11.99, "GBP"),
      [32, 62],
      {
        lastDecline: { at: daysAgo(now, 2), reason: "frozen" },
      },
    ),
    sub("s_netflix", "m_netflix", "c_ent", money(15.49, "USD"), [36, 66]),
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
      newLimit: { daily: money(12000, "USD"), txn: money(6000, "USD") },
      oldLimit: { daily: money(8000, "USD"), txn: money(4000, "USD") },
      note: "Q4 campaign launch on LinkedIn and Meta.",
      state: "pending",
      createdAt: daysAgo(now, 0, 8),
    },
    {
      id: "r_seed3",
      kind: "new_card",
      requesterId: "u_grace",
      newCard: {
        nickname: "Warehouse team",
        limit: { daily: money(300000, "NGN"), txn: money(150000, "NGN") },
        oneMerchant: false,
        design: "silver",
      },
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
      body: "Tunde Bello asked to approve £620.00 at British Airways on Sales team.",
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
      body: "Grace Adeyemi asked for a card: “Warehouse team”, up to ₦300,000.00 a month.",
      href: "/cards",
      read: false,
    },
  ];

  const invitedPeople: Person[] = [
    {
      id: "u_bisi",
      name: "Bisi Adewale",
      email: "bisi@kolalogistics.test",
      role: "cardholder",
      invited: true,
    },
  ];

  return {
    cards,
    balances,
    transactions,
    subscriptions,
    requests,
    goals: [],
    notifications,
    invitedPeople,
  };
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
