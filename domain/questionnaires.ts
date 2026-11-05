/**
 * Onboarding questionnaires, from "Onboarding Questionnaire" in the consolidated requirements workbook (Nov 2026),
 * itself a transcription of the Google Forms:
 * - NGA: "Sole trader" (also used for business partnerships, which compliance files under sole traders) and "Nigeria companies"
 * - COR: "UK and Canada sole trader", "UK and Canada companies" and "Kenya non-financial institution"
 * - MTO: MTOs and PSPs in every country, asked during sign-up
 * - Fusion Collections and Fusion SendR/Payout: API customers
 *
 * The sole trader and company forms ask the same questions; what changes by business type here is who the
 * questions are about (the NIN and BVN), the examples, and what sign-up already told us. Nothing sign-up holds is
 * asked again: the business name, registration and address come from the registry, and sector, category and
 * turnover from "A few more things". Where a form still needs an answer we already have, it's filled in for them.
 *
 * Wording follows the forms, except where noted. Left out: "person filling the form", "date" and "name of client".
 * "Leatherback" is now "Foren". "If applicable" and "If yes/no" questions are optional or conditional here, though
 * some forms mark them all required.
 */
import { USE_CASES, categoryOf, type CountryCode, type RequirementContext, type UseCaseId } from "./onboarding";

export type Answers = Record<string, string>;

export type Question = {
  id: string;
  label: string;
  description?: string;
  type: "short" | "long" | "choice" | "multi";
  options?: string[];
  optional?: boolean;
  /** Only asked when this returns true. */
  showIf?: (a: Answers) => boolean;
  /** A sample answer shown under free-text questions, so people know the level of detail we need. */
  example?: string;
  /** Checked as well as required: "url" must look like a web address. */
  format?: "url";
  /** An answer we already have from sign-up. The question starts filled in and says so; they can change it. */
  prefill?: string;
};

/** One step of a questionnaire. `intro` says why we ask, under the step title. */
export type QuestionGroup = { key: string; title: string; intro?: string; questions: Question[] };

/** What sign-up already collected that the questionnaires use, so they don't ask for it again. */
export type SignUpData = {
  /** "A few more things": the sector and category picked from our lists. */
  sector?: string;
  sectorCategory?: string;
  /** "How do you want to use Foren?": the products picked. */
  useCases?: readonly UseCaseId[];
  /** Kenya: the KRA PIN of the person signing up. */
  kraPin?: string | null;
  /** The website saved on "A few more things" before it moved here. Prefills the website question. */
  website?: string;
  /** MTOs and PSPs: their sign-up questionnaire answers (`mtoQuestionnaire`). */
  edd?: Answers;
};

const YES_NO = ["Yes", "No"];
const yes = (id: string) => (a: Answers) => a[id] === "Yes";
const no = (id: string) => (a: Answers) => a[id] === "No";
const has = (id: string, v: string) => (a: Answers) => (a[id] ?? "").split(",").includes(v);

const PREFILLED = "Filled in from your sign-up. Change it if it’s out of date.";
/** Marks a question as prefilled with `value`, when there is one. */
function prefilled(q: Question, value: string | null | undefined, why = PREFILLED): Question {
  const v = value?.trim();
  return v ? { ...q, prefill: v, description: [q.description, why].filter(Boolean).join(" ") } : q;
}

const URL_RE = /^(https?:\/\/)?[^\s/.]+(\.[^\s/.]+)+(\/\S*)?$/i;

/** What's wrong with a filled-in answer, if anything. */
export function formatError(q: Question, value: string | undefined): string | undefined {
  const v = value?.trim();
  if (v && q.format === "url" && !URL_RE.test(v)) return "Enter a link, like https://example.com";
}

/** Questions shown, given the answers so far. */
export function visible(groups: QuestionGroup[], a: Answers) {
  return groups.map((g) => ({ ...g, questions: g.questions.filter((q) => !q.showIf || q.showIf(a)) }));
}

/** Questions that are shown and still need an answer: required and empty, or filled in wrongly. */
export function unanswered(groups: QuestionGroup[], a: Answers) {
  return visible(groups, a)
    .flatMap((g) => g.questions)
    .filter((q) => (!q.optional && !a[q.id]?.trim()) || !!formatError(q, a[q.id]));
}

/** Answers sign-up already gave, by question id. */
export function prefillAnswers(groups: QuestionGroup[]): Answers {
  return Object.fromEntries(groups.flatMap((g) => g.questions).flatMap((q) => (q.prefill ? [[q.id, q.prefill]] : [])));
}

/** Saved answers on top of the prefilled ones. A prefilled answer they cleared stays cleared. */
export const withPrefills = (groups: QuestionGroup[], saved: Answers): Answers => ({ ...prefillAnswers(groups), ...saved });

/** Earlier versions stored lists in the MTO answers; keep only text. */
export function textAnswers(saved: Record<string, string | string[]> | undefined): Answers {
  return Object.fromEntries(Object.entries(saved ?? {}).filter((e): e is [string, string] => typeof e[1] === "string"));
}

/** "Global Accounts, Global Payouts", from the products picked at sign-up. */
const productList = (useCases: readonly UseCaseId[] | undefined) =>
  USE_CASES.filter((u) => useCases?.includes(u.id) && u.id !== "api")
    .map((u) => u.title)
    .join(", ");

/** "Healthcare (Pharmacy and drugs)". */
const sectorOf = (k: SignUpData) => (k.sector ? (k.sectorCategory ? `${k.sector} (${k.sectorCategory})` : k.sector) : "");

// ---------------------------------------------------------------- business banking (NGA, COR)

/** Who the business banking questions are about. Non-profits and public bodies get examples that fit them. */
export type BusinessKind = "sole_proprietor" | "partnership" | "company" | "organisation";

const ORGANISATIONS = ["guarantee", "trustees", "cooperative", "government", "ngo"];

export function businessKind(ctx: Pick<RequirementContext, "country" | "entity" | "category">): BusinessKind {
  const category = categoryOf(ctx.country, ctx.entity, ctx.category);
  if (ctx.entity === "sole_trader") return category === "partnership" ? "partnership" : "sole_proprietor";
  return category && ORGANISATIONS.includes(category) ? "organisation" : "company";
}

/** The Google Form a business banking customer would have filled in. Partnerships use the sole trader forms, as compliance files them as sole traders. */
export function bankingForm(ctx: Pick<RequirementContext, "country" | "entity">) {
  const sole = ctx.entity === "sole_trader";
  if (ctx.country === "NG") return sole ? "NGA sole trader" : "NGA companies";
  if (ctx.country === "KE") return "COR Kenya non-financial institution";
  return sole ? "COR UK and Canada sole trader" : "COR UK and Canada companies";
}

/** Kenya and Canada use local currency, not the forms' £ examples (Summary of Changes, "Currency examples in questionnaires"). */
const VOLUME_EXAMPLES: Record<CountryCode, string> = {
  NG: "For example: NGN 200k, NGN 2 million, NGN 10 million.",
  GB: "For example: £100+, £1,000+, £5,000+.",
  CA: "For example: CAD 100+, CAD 1,000+, CAD 5,000+.",
  KE: "For example: KES 10,000+, KES 100,000+, KES 500,000+.",
};

const CITY: Record<CountryCode, string> = { NG: "Lagos", GB: "Manchester", CA: "Toronto", KE: "Nairobi" };

const NATURE_EXAMPLE: Record<BusinessKind, (city: string) => string> = {
  sole_proprietor: (c) => `I run a hair salon in ${c}, offering styling and braiding, and sell hair care products to walk-in customers.`,
  partnership: (c) => `We’re two partners running an accounting practice in ${c}, doing bookkeeping and tax returns for small businesses.`,
  company: (c) => `We run two pharmacies in ${c}, selling prescription and over-the-counter medicines to walk-in customers and local clinics.`,
  organisation: (c) => `We’re a registered charity in ${c} running free reading classes for children, funded by donations and grants.`,
};

const USE_EXAMPLE: Record<BusinessKind, string> = {
  sole_proprietor: "Receiving payments from clients, paying for stock from two suppliers, and paying my shop rent.",
  partnership: "Receiving client fees, paying our two staff each month, and paying for software and office rent.",
  company: "Paying suppliers in the UK and China, receiving payments from distributors, and monthly staff salaries.",
  organisation: "Receiving donations and grants, paying staff salaries, and paying programme costs such as books and venue hire.",
};

/** Whose NIN and BVN the Nigerian forms ask for. */
const NIN_INTRO: Record<BusinessKind, string> = {
  sole_proprietor: "Yours, as the owner of the business.",
  partnership: "Yours, as the partner opening the account.",
  company: "Yours, as the person opening the account for the business.",
  organisation: "Yours, as the person opening the account for the organisation.",
};

/**
 * The NGA form in Nigeria and the COR form in the UK, Canada and Kenya, for sole traders, partnerships, companies
 * and other organisations (not MTOs: they answer `mtoQuestionnaire` at sign-up).
 */
export function bankingQuestionnaire(ctx: RequirementContext, known: SignUpData = {}): QuestionGroup[] {
  const { country } = ctx;
  const ng = country === "NG";
  const kind = businessKind(ctx);
  const sector = sectorOf(known);
  const products = productList(known.useCases);
  return [
    {
      key: "banking_activity",
      title: "Expected activity",
      intro: "Your best estimate is fine. It helps us set the right limits on your account from day one.",
      questions: [
        {
          id: "volume",
          type: "short",
          label: "Expected monthly transaction volume",
          description: `How much money will enter your account each month? ${VOLUME_EXAMPLES[country]}`,
        },
        // Not in the forms: asked for on the in-app "Edit transaction profile" screen.
        { id: "outflow", type: "short", label: "Expected monthly outflows", description: "How much money will leave your account each month?" },
        {
          id: "frequency",
          type: "choice",
          label: "Expected monthly transaction frequency",
          description: "How many transactions will be performed each month?",
          options: ["1–100", "101–250", "251–500", "500 and above"],
        },
      ],
    },
    {
      key: "banking_business",
      title: kind === "organisation" ? "About your organisation" : "About your business",
      intro: "Tell us what you do and what the account is for, in your own words.",
      questions: [
        {
          id: "nature",
          type: "long",
          label: "Nature of business",
          // Sector and category came from our lists at sign-up; this is the free-text description the forms ask for.
          description: [
            kind === "organisation" ? "Describe what your organisation does and who it serves." : "Give a brief description of the products and services you provide.",
            sector && `We have your sector, ${sector}, from sign-up.`,
          ]
            .filter(Boolean)
            .join(" "),
          // Optional on the NGA forms, required on COR.
          optional: ng,
          example: NATURE_EXAMPLE[kind](CITY[country]),
        },
        prefilled({ id: "hasWebsite", type: "choice", label: ng ? "Do you have a business website?" : "Do you have a website?", options: YES_NO }, known.website && "Yes"),
        prefilled({ id: "website", type: "short", label: "Website link", format: "url", showIf: yes("hasWebsite") }, known.website),
        {
          id: "social",
          type: "short",
          label: "Business social media link",
          description: "For example, your Instagram, Facebook, X or LinkedIn page.",
          format: "url",
          // Required on the NGA forms, optional on COR.
          optional: !ng,
          showIf: no("hasWebsite"),
        },
        {
          // "How do you intend to use your Foren account?" is the purpose of the account: what the money is for.
          // Which Foren products they want was picked at sign-up, so it isn't asked again here.
          id: "use",
          type: "long",
          label: "What will you use the account for?",
          description: [
            "What payments will you make and receive, and who with? For example: salaries, paying invoices, payments for goods and services.",
            products && `We already know you want ${products}; this is about the money itself.`,
          ]
            .filter(Boolean)
            .join(" "),
          example: USE_EXAMPLE[kind],
        },
      ],
    },
    {
      key: "banking_tax",
      title: ng ? "Your NIN and BVN" : "Tax registration",
      intro: ng ? `${NIN_INTRO[kind]} Both are 11-digit numbers: your National Identification Number and your Bank Verification Number.` : undefined,
      questions: ng
        ? [
            { id: "nin", type: "short", label: "NIN number" },
            { id: "bvn", type: "short", label: "BVN number" },
          ]
        : [
            // Canada's sales tax is GST/HST, not VAT (same answer ids, so saved answers carry over). The answer is also
            // the trigger for the conditional VAT registration document (consolidated requirements UK-LLC-17, CA-LLC-16, KE-LLC-14).
            {
              id: "vat",
              type: "choice",
              label: country === "CA" ? "Are you registered for GST/HST?" : "Are you VAT registered?",
              options: YES_NO,
            },
            // A Kenyan sole proprietor's VAT is registered against their own KRA PIN, which they gave at sign-up.
            prefilled(
              {
                id: "vatNumber",
                type: "short",
                label: country === "CA" ? "GST/HST number" : "VAT number",
                optional: true,
                showIf: yes("vat"),
              },
              country === "KE" && kind === "sole_proprietor" ? known.kraPin : undefined,
              "In Kenya, VAT is registered against your KRA PIN, so we’ve used the one you gave at sign-up."
            ),
          ],
    },
  ];
}

// ---------------------------------------------------------------- MTOs and PSPs

/** "Client Onboarding Questionnaire MTO" (all countries), split into the three sign-up tabs. */
export function mtoQuestionnaire(known: SignUpData = {}): QuestionGroup[] {
  const sector = sectorOf(known);
  const products = productList(known.useCases);
  return [
    {
      key: "business",
      title: "Business & account use",
      questions: [
        { id: "nature", type: "long", label: "Nature of business (description)", description: sector ? `We have your sector, ${sector}, from sign-up. Describe what you do.` : undefined },
        {
          // The purpose of the account, not which Foren products they want (picked at sign-up).
          id: "purpose",
          type: "short",
          label: "Main purpose of the account",
          description: ["For example: settling customer remittances to Nigeria and Kenya.", products && `We already know you want ${products}.`].filter(Boolean).join(" "),
        },
        // Compliance (Nov 2026): required when the business has one. No longer asked on "A few more things".
        prefilled({ id: "hasWebsite", type: "choice", label: "Do you have a website?", options: YES_NO }, known.website && "Yes"),
        prefilled({ id: "website", type: "short", label: "Website", format: "url", showIf: yes("hasWebsite") }, known.website),
        { id: "hasApp", type: "choice", label: "Do you have a mobile app?", options: YES_NO },
        { id: "app", type: "short", label: "Mobile app", description: "Its name, or a link to it in the App Store or Google Play.", showIf: yes("hasApp") },
        { id: "products", type: "long", label: "Products / services", description: "What you offer your own customers, such as international transfers or bill payments." },
        { id: "uboWealth", type: "long", label: "UBO source of wealth" },
        { id: "incomingSources", type: "short", label: "What are the primary sources of incoming funds?" },
        { id: "howUsed", type: "long", label: "Describe how this account is used within your business operations", optional: true },
        { id: "aggregate", type: "long", label: "Do you aggregate funds from multiple underlying clients or participants? If yes, please explain." },
        { id: "thirdParty", type: "long", label: "Will this account be used for payment processing or settlement on behalf of third parties? Please describe." },
      ],
    },
    {
      key: "activity",
      title: "Transactions & fund flow",
      questions: [
        { id: "volumeDaily", type: "short", label: "Expected transaction volume: daily" },
        { id: "volumeWeekly", type: "short", label: "Expected transaction volume: weekly" },
        { id: "volumeMonthly", type: "short", label: "Expected transaction volume: monthly" },
        { id: "frequencyDaily", type: "short", label: "Expected transaction frequency: daily" },
        { id: "frequencyWeekly", type: "short", label: "Expected transaction frequency: weekly" },
        { id: "frequencyMonthly", type: "short", label: "Expected transaction frequency: monthly" },
        { id: "fundFlow", type: "long", label: "Expected fund flow / intended account use" },
        { id: "currencies", type: "long", label: "Currencies required and use case for each currency" },
        { id: "countriesIn", type: "long", label: "Top 5 countries: incoming" },
        { id: "countriesOut", type: "long", label: "Top 5 countries: outgoing" },
        { id: "payeesIn", type: "long", label: "Top 5 counterparties / payees: incoming" },
        { id: "payeesOut", type: "long", label: "Top 5 counterparties / payees: outgoing" },
        { id: "highRisk", type: "long", label: "Will any transactions involve high-risk or sanctioned jurisdictions? If yes, explain." },
        { id: "customers6m", type: "short", label: "How many customers have you onboarded in the last 6 months?" },
        { id: "transactions6m", type: "short", label: "How many transactions have you processed in the last 6 months?" },
        { id: "value6m", type: "short", label: "Total value of transactions processed" },
        { id: "remitting", type: "long", label: "To which countries have you been remitting?" },
        { id: "changes", type: "long", label: "Have there been recent or planned changes to transaction volumes, counterparties, or jurisdictions?" },
      ],
    },
    {
      key: "aml",
      title: "AML & financial-crime controls",
      questions: [
        { id: "escalation", type: "long", label: "Describe escalation and investigation procedures for suspicious activity" },
        { id: "sars", type: "long", label: "Are there any customers who have internal SARs raised on them?" },
        { id: "monitoring", type: "long", label: "Brief description of your client onboarding and transaction monitoring process / tools" },
        { id: "ofac", type: "long", label: "Describe OFAC screening controls applied to transactions and counterparties" },
      ],
    },
  ];
}

/** The MTO questionnaire with nothing known from sign-up. */
export const MTO_QUESTIONNAIRE: QuestionGroup[] = mtoQuestionnaire();

// ---------------------------------------------------------------- Fusion (API)

export const API_PRODUCTS = ["Collections", "Payouts (SendR)"];

/** Fusion questions an MTO already answered in its sign-up questionnaire, by MTO answer id. */
const FROM_MTO: Record<string, string> = {
  apiNature: "nature",
  apiWebsite: "website",
  apiApp: "app",
  apiFundFlow: "fundFlow",
  apiUboWealth: "uboWealth",
  apiProductsOffered: "products",
  apiCountriesIn: "countriesIn",
  apiPayeesIn: "payeesIn",
  apiCustomers6m: "customers6m",
  apiTransactions6m: "transactions6m",
  apiValue6m: "value6m",
  apiRemitting: "remitting",
  apiSars: "sars",
  apiMonitoring: "monitoring",
};

/** Fusion questions the business banking questionnaire already asks, when both are shown. */
const IN_BANKING = ["apiNature", "apiProductsOffered", "apiWebsite"];

/** Whether this customer gets the business banking questionnaire (NGA or COR). */
export const asksBanking = (ctx: RequirementContext) => ctx.entity !== "mto" && ctx.banking !== false;

/**
 * "Fusion by Foren: Collections GBP, NGN, CAD" and "Fusion by Foren: SendR/Payout". Questions the two forms share are
 * asked once. Financial services businesses (and MTOs) also get the forms' "only applicable to financial services"
 * questions. Questions the business banking questionnaire asks are left out when it's shown too, and MTOs find the
 * ones they answered at sign-up filled in.
 */
export function fusionQuestionnaire(ctx: RequirementContext, known: SignUpData = {}): QuestionGroup[] {
  const collections = has("apiProducts", "Collections");
  const payouts = has("apiProducts", "Payouts (SendR)");
  const financialServices = ctx.entity === "mto" || !!ctx.financialServices;
  const fs = () => financialServices;
  const withBanking = asksBanking(ctx);
  const mto = ctx.entity === "mto" ? (known.edd ?? {}) : {};
  const fill = (q: Question): Question => prefilled(q, FROM_MTO[q.id] ? mto[FROM_MTO[q.id]] : q.id === "apiWebsite" ? known.website : undefined);
  const about: Question[] = [
    { id: "apiProducts", type: "multi", label: "Which API services do you need?", options: API_PRODUCTS },
    { id: "apiNature", type: "long", label: "Nature of business (description)" },
    { id: "apiWebsite", type: "short", label: "Company website", format: "url" },
    { id: "apiApp", type: "short", label: "Mobile app", optional: true },
    { id: "apiLicensed", type: "long", label: "Are you registered and licensed to operate in your jurisdiction?" },
    { id: "apiLicences", type: "long", label: "List the licences you have for your business" },
    { id: "apiUseCase", type: "short", label: "Use case(s) for our API" },
    { id: "apiEngineers", type: "choice", label: "Do you have engineers for this integration?", options: YES_NO },
    { id: "apiFundFlow", type: "short", label: "Expected fund flow and intended account use" },
    { id: "apiUboWealth", type: "long", label: "UBO source of wealth" },
    { id: "apiProductsOffered", type: "long", label: "Products / services you offer" },
    { id: "apiCountriesIn", type: "long", label: "Top 5 countries: incoming" },
    { id: "apiPayeesIn", type: "long", label: "Top 5 counterparties / payees: incoming", description: "For example: businesses, individuals." },
    { id: "apiCustomers6m", type: "short", label: "How many customers have you onboarded in the last 6 months?" },
    { id: "apiTransactions6m", type: "short", label: "How many transactions have you processed in the last 6 months?" },
    { id: "apiValue6m", type: "short", label: "Total value of transactions processed in GBP, USD or NGN" },
    { id: "apiOver10k", type: "short", label: "Do any customers transact more than £10,000 on a single basis?" },
    { id: "apiRemitting", type: "long", label: "To which countries have you been remitting?", showIf: fs },
    { id: "apiSars", type: "long", label: "Are there any customers who have internal SARs raised on them?", showIf: fs },
    { id: "apiMonitoring", type: "long", label: "Brief description of your client onboarding and transaction monitoring process / tools", showIf: fs },
  ];
  return [
    {
      key: "api",
      title: "About your business",
      questions: about.filter((q) => !(withBanking && IN_BANKING.includes(q.id))).map(fill),
    },
    {
      key: "collections",
      title: "Collections",
      questions: [
        { id: "colMulti", type: "choice", label: "Would you be collecting in more than one currency?", options: YES_NO, showIf: collections },
        { id: "colCurrencies", type: "multi", label: "Which currencies would you like to collect?", options: ["NGN", "GBP", "CAD"], showIf: collections },
        {
          id: "colServices",
          type: "multi",
          label: "Type of service required",
          options: [
            "NGN payment gateway: cards",
            "NGN payment gateway: pay by bank transfer",
            "GBP payment gateway: cards",
            "GBP payment gateway: Open Banking",
            "Payment gateway: pay by Interac",
          ],
          showIf: collections,
        },
        { id: "colDirect", type: "choice", label: "Are you planning to implement a direct integration?", options: YES_NO, showIf: collections },
        { id: "colPci", type: "choice", label: "Do you have a PCI DSS licence?", options: YES_NO, showIf: (a) => collections(a) && a.colDirect === "Yes" },
        { id: "colAverage", type: "short", label: "Average value per transaction, per currency", description: "For example: £300, NGN 500.", showIf: collections },
        { id: "colValueDaily", type: "short", label: "Expected transaction value per currency: daily", description: "For example: £10,000, CAD 10,000 and NGN 10,000.", showIf: collections },
        { id: "colValueMonthly", type: "short", label: "Expected transaction value per currency: monthly", description: "For example: £100,000, CAD 100,000 and NGN 100,000.", showIf: collections },
        { id: "colCountDaily", type: "short", label: "Expected transaction count per currency: daily", description: "For example: 30 transactions a day.", showIf: collections },
        { id: "colCountMonthly", type: "short", label: "Expected transaction count per currency: monthly", description: "For example: 200 transactions a month.", showIf: collections },
      ],
    },
    {
      key: "payouts",
      title: "Payouts (SendR)",
      questions: [
        { id: "payServices", type: "multi", label: "Type of service required", options: ["SendR / international payout", "Local payout"], showIf: payouts },
        { id: "payMulti", type: "choice", label: "Would you be paying out in more than one currency?", options: YES_NO, showIf: payouts },
        { id: "payCurrencies", type: "multi", label: "Payout currencies", options: ["NGN", "GBP", "USD", "INR", "PKR", "ETB", "CAD"], showIf: payouts },
        { id: "payAverage", type: "long", label: "Average value per transaction, per currency", description: "For example: £50, $100, NGN 500, Br 20, Rs 50.", showIf: payouts },
        { id: "payVolumeDaily", type: "short", label: "Expected transaction volume per currency: daily", description: "For example: £10,000, NGN 10,000, $10,000.", showIf: payouts },
        { id: "payVolumeMonthly", type: "short", label: "Expected transaction volume per currency: monthly", description: "For example: £100,000, NGN 100,000, $100,000.", showIf: payouts },
        { id: "payCountDaily", type: "short", label: "Expected transaction count per currency: daily", description: "For example: 30 transactions a day.", showIf: payouts },
        { id: "payCountMonthly", type: "short", label: "Expected transaction count per currency: monthly", description: "For example: 200 transactions a month.", showIf: payouts },
        { id: "payCountriesOut", type: "long", label: "Top 5 countries: outgoing", showIf: payouts },
        { id: "payPayeesOut", type: "long", label: "Top 5 counterparties / payees: outgoing", showIf: payouts },
      ],
    },
  ];
}

/** Everything the in-app questionnaire asks this customer: business banking, Fusion API, or both. */
export function questionnaireFor(ctx: RequirementContext, known: SignUpData = {}): QuestionGroup[] {
  return [...(asksBanking(ctx) ? bankingQuestionnaire(ctx, known) : []), ...(ctx.api ? fusionQuestionnaire(ctx, known) : [])];
}
