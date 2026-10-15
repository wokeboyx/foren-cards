// Core domain model for the Foren Cards prototype. All data is test data.

export type Currency = "USD" | "GBP" | "EUR" | "NGN" | "CAD";

/** Integer minor units (cents, kobo, pence). Never floats. */
export type Money = { minor: number; currency: Currency };

export type Role = "owner" | "cardholder" | "finance" | "individual";

export type Person = {
  id: string;
  name: string;
  email: string;
  role: Exclude<Role, "individual">;
  /** Added while creating a card; hasn't joined Foren yet. */
  invited?: boolean;
};

export type CardKind = "standard" | "emergency" | "subscription";
export type CardStatus = "active" | "frozen" | "canceled";
export type CardDesign = "midnight" | "skyline" | "aurora" | "cream" | "lime" | "titanium";

export type FundingStrategy = "cheapest_fx" | "protect" | "custom";

export type FundingConfig = {
  strategy: FundingStrategy;
  /** Balance order. For cheapest_fx / protect this is derived per charge; for custom it is used as-is. */
  order: Currency[];
  /** protect: the currency kept for last, e.g. GBP for a UK business. */
  protect?: Currency;
};

/** first_merchant: the card locks itself to whichever merchant charges it first (then lockedMerchantId is set). */
export type PermissionMode = "anywhere" | "first_merchant" | "merchants" | "categories";

export type Category =
  | "software"
  | "travel"
  | "advertising"
  | "office"
  | "food"
  | "transport"
  | "utilities"
  | "entertainment"
  | "gambling"
  | "cash_atm"
  | "crypto";

export type PermissionConfig = {
  mode: PermissionMode;
  allowedMerchantIds: string[];
  allowedCategories: Category[];
  blockedMerchantIds: string[];
  blockedCategories: Category[];
};

export type LimitPeriod = "per_txn" | "daily" | "weekly" | "monthly";
export type Limit = { period: LimitPeriod; amount: Money };

export type Address = { line1: string; city: string; postcode: string; country: string };

export type Card = {
  id: string;
  nickname: string;
  holderId: string;
  kind: CardKind;
  status: CardStatus;
  archived: boolean;
  design: CardDesign;
  last4: string;
  /** ISO date (yyyy-mm) */
  expiry: string;
  lockedMerchantId?: string;
  funding: FundingConfig;
  permissions: PermissionConfig;
  limit: Limit;
  billingAddress: Address;
  createdAt: string;
  /** Emergency cards only */
  validUntil?: string;
  singleUse?: boolean;
  used?: boolean;
  /** Personal track */
  personal?: boolean;
  /** Spending period: the card only works between these dates (yyyy-mm-dd, inclusive). */
  activeFrom?: string;
  activeUntil?: string;
  /** Admin lock (Revolut): frozen by the account owner; the cardholder can't ask to unfreeze it. */
  adminLock?: { by: string; at: string; reason?: string };
  /** Mobile wallets the card has been added to (simulated). */
  wallets?: ("apple" | "google")[];
  /** Company card (Revolut "virtual company card"): issued in the company's name for shared spend
   *  like subscriptions and suppliers. holderId is the main contact; contactIds can also use and manage it. */
  companyCard?: boolean;
  contactIds?: string[];
  /** A merchant's own card that's waiting for the merchant to switch over from a shared card. */
  moveFrom?: { cardId: string; merchantId: string; blockOld: boolean };
  /** Personal track: how the card can be used (Card controls). Changes apply straight away. */
  controls?: CardControls;
  purpose?: string;
  /** Temporary limit change: the limit to restore and when (Edit limit → "This is a temporary change"). */
  limitRestore?: { limit: Limit; at: string };
  /** Audit log, newest first (Revolut-style "See history"). Cards created before logging show only "Card created". */
  history?: CardEvent[];
  /** Remind before subscriptions on this card renew (offered on the card-created screen). */
  renewalReminders?: boolean;
};

/** A card being created, saved to finish later (Revolut "Save draft"). */
export type CardDraft = { id: string; savedAt: string; step: number; card: Card; names: string[]; amountText: string; years: number };

export type CardEvent = { at: string; text: string; by: string };

export type CardControls = {
  online: boolean;
  /** Charges in a currency other than the account's home currency (NGN). */
  foreignCurrency: boolean;
  /** Online payments that don't ask for a 3-D Secure code. Stored only; simulated charges carry no 3DS flag. */
  non3ds: boolean;
};

export type Balance = { currency: Currency; available: Money; autoFxGoalIds?: string[] };


export type NetworkVerdict =
  | { kind: "works" }
  | { kind: "likely"; note: string }
  | { kind: "setup_needed"; steps: string[] }
  | { kind: "wont_work"; reason: string }
  | { kind: "unknown" };

export type Merchant = {
  id: string;
  name: string;
  category: Category;
  billingCurrency: Currency;
  /** Short letters for the logo tile */
  mark: string;
  tint: string;
  network: NetworkVerdict;
};

export type FxDetail = { from: Currency; rate: number; fee: Money; converted: Money };

export type FundingLeg = {
  source: { kind: "balance"; currency: Currency };
  /** Amount debited from the source, in the source currency */
  debit: Money;
  /** Portion of the charge this leg covered, in the charge currency */
  covers: Money;
  fx?: FxDetail;
};

export type FeeAvoided = { amount: Money; basis: string };

export type TxStatus = "approved" | "declined" | "pending" | "refunded";

export type DeclineReason =
  | "frozen"
  | "canceled"
  | "expired"
  | "merchant_blocked"
  | "category_blocked"
  | "merchant_not_allowed"
  | "card_control"
  | "outside_period"
  | "per_charge_limit"
  | "spend_limit"
  | "insufficient_balance"
  | "unknown";

export type Transaction = {
  id: string;
  cardId: string;
  merchantId: string;
  amount: Money;
  status: TxStatus;
  at: string;
  legs: FundingLeg[];
  feeAvoided?: FeeAvoided;
  declineReason?: DeclineReason;
  /** Set when the charge came through on a one-time approval */
  viaApprovalId?: string;
  /** Expense details added after the charge (Mercury / Revolut). */
  note?: string;
  expenseCategory?: ExpenseCategory;
  receipt?: { name: string; size: number; at: string };
};

export type ExpenseCategory = "travel" | "meals" | "software" | "marketing" | "office" | "transport" | "other";

export type SubscriptionFrequency = "weekly" | "monthly" | "quarterly" | "yearly";

export type Subscription = {
  id: string;
  merchantId: string;
  cardId: string;
  usualAmount: Money;
  frequency: SubscriptionFrequency;
  chargeDates: string[];
  blocked: boolean;
  allowNextAttempt?: boolean;
  /** Set when a dedicated card was created; cleared when merchant billing is updated */
  movingToCardId?: string;
  lastDecline?: { at: string; reason: DeclineReason };
  reminders: { owner: boolean; cardholder: boolean; daysBefore: number };
};

export type RequestKind = "one_time_approval" | "unfreeze" | "emergency_card" | "new_card" | "limit_increase";
export type RequestState = "pending" | "approved" | "denied" | "expired" | "used";

export type CardRequest = {
  id: string;
  kind: RequestKind;
  requesterId: string;
  cardId?: string;
  merchantId?: string;
  amount?: Money;
  reason?: DeclineReason;
  note?: string;
  state: RequestState;
  createdAt: string;
  decidedAt?: string;
  /** Name of whoever approved or declined */
  decidedBy?: string;
  denyNote?: string;
  /** one_time_approval: retry window end */
  windowEndsAt?: string;
  /** emergency_card / new_card: issued card */
  issuedCardId?: string;
  /** limit_increase: the limit the cardholder asked for, and what it was at the time. */
  newLimit?: Limit;
  oldLimit?: Limit;
  /** new_card: what the team member asked for. The owner sets funding and can adjust before approving. */
  newCard?: { nickname: string; limit: Limit; oneMerchant: boolean; design: CardDesign };
  /** The declined payment attempt this request came from */
  attemptTxId?: string;
};

export type GoalType = "keep_min" | "target_rate" | "cap";
export type GoalStatus = "on_track" | "waiting_for_rate" | "action_taken" | "unable_to_act";

export type AutoFxGoal = {
  id: string;
  type: GoalType;
  currency: Currency;
  /** keep_min: minimum; cap: maximum */
  threshold?: Money;
  /** Currency to top up from (keep_min) or sweep to (cap) / convert to (target_rate) */
  counterCurrency: Currency;
  /** target_rate: amount to convert */
  amount?: Money;
  /** target_rate: units of counterCurrency per 1 currency */
  targetRate?: number;
  createdAt: string;
  actions: { at: string; text: string }[];
  /** Set when the goal acted and is done (target_rate) */
  completed?: boolean;
};

export type Notification = {
  id: string;
  at: string;
  forRole: Role;
  title: string;
  body: string;
  href?: string;
  read: boolean;
};
