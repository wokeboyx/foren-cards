/**
 * Onboarding questionnaires, copied from the Google Forms linked in "Foren Onboarding Requirement.pdf":
 * - NGA: Nigerian sole traders and companies
 * - COR: UK, Canadian and Kenyan sole traders and companies
 * - MTO: MTOs and PSPs (business banking), asked during sign-up
 * - Fusion Collections and Fusion SendR/Payout: API customers
 *
 * Wording follows the forms. Left out: "person filling the form", "date" and "name of client", which the
 * account already knows. "Leatherback" is now "Foren". "If applicable" and "If yes/no" questions are
 * optional or conditional here, though the forms mark them all required.
 */
import type { CountryCode } from "./onboarding";

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
};

export type QuestionGroup = { key: string; title: string; questions: Question[] };

const YES_NO = ["Yes", "No"];
const yes = (id: string) => (a: Answers) => a[id] === "Yes";
const no = (id: string) => (a: Answers) => a[id] === "No";
const has = (id: string, v: string) => (a: Answers) => (a[id] ?? "").split(",").includes(v);

/** Questions shown, given the answers so far. */
export function visible(groups: QuestionGroup[], a: Answers) {
  return groups.map((g) => ({ ...g, questions: g.questions.filter((q) => !q.showIf || q.showIf(a)) }));
}

/** Required questions that are shown and still empty. */
export function unanswered(groups: QuestionGroup[], a: Answers) {
  return visible(groups, a)
    .flatMap((g) => g.questions)
    .filter((q) => !q.optional && !a[q.id]?.trim());
}

// ---------------------------------------------------------------- business banking (NGA, COR)

const VOLUME_EXAMPLES: Record<CountryCode, string> = {
  NG: "For example: NGN 200k, NGN 2 million, NGN 10 million.",
  GB: "For example: £100+, £1,000+, £5,000+.",
  CA: "For example: CAD 100+, CAD 1,000+, CAD 5,000+.",
  KE: "For example: KES 10,000+, KES 100,000+, KES 500,000+.",
};

/** "Foren Client Onboarding Questionnaire – NGA" for Nigeria; "Foren Onboarding Form COR" for the UK, Canada and Kenya. */
export function bankingQuestionnaire(country: CountryCode): QuestionGroup[] {
  const ng = country === "NG";
  return [
    {
      key: "banking",
      title: "Your account",
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
        {
          id: "nature",
          type: "long",
          label: "Nature of business",
          description: "Give a brief description of the products and services you provide.",
          optional: ng,
        },
        { id: "hasWebsite", type: "choice", label: ng ? "Do you have a business website?" : "Do you have a website?", options: YES_NO },
        { id: "website", type: "short", label: "Website link", showIf: yes("hasWebsite") },
        { id: "social", type: "short", label: "Business social media link", showIf: no("hasWebsite") },
        {
          id: "use",
          type: "long",
          label: "How do you intend to use your Foren account?",
          description: "For example: salaries, paying invoices, payments for goods and services.",
        },
        ...(ng
          ? ([
              { id: "nin", type: "short", label: "NIN number" },
              { id: "bvn", type: "short", label: "BVN number" },
            ] satisfies Question[])
          : ([
              { id: "vat", type: "choice", label: "Are you VAT registered?", options: YES_NO },
              { id: "vatNumber", type: "short", label: "VAT number", optional: true, showIf: yes("vat") },
            ] satisfies Question[])),
      ],
    },
  ];
}

// ---------------------------------------------------------------- MTOs and PSPs

/** "Client Onboarding Questionnaire MTO", split into the three sign-up tabs. */
export const MTO_QUESTIONNAIRE: QuestionGroup[] = [
  {
    key: "business",
    title: "Business & account use",
    questions: [
      { id: "nature", type: "long", label: "Nature of business (description)" },
      { id: "purpose", type: "short", label: "Main purpose of the account" },
      { id: "website", type: "short", label: "Website", optional: true },
      { id: "app", type: "short", label: "Mobile app", optional: true },
      { id: "products", type: "long", label: "Products / services" },
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

// ---------------------------------------------------------------- Fusion (API)

export const API_PRODUCTS = ["Collections", "Payouts (SendR)"];

/**
 * "Fusion by Foren: Collections GBP, NGN, CAD" and "Fusion by Foren: SendR/Payout". Questions the two forms
 * share are asked once. `financialServices` turns on the forms' "only applicable to financial services" questions.
 */
export function fusionQuestionnaire(financialServices: boolean): QuestionGroup[] {
  const collections = has("apiProducts", "Collections");
  const payouts = has("apiProducts", "Payouts (SendR)");
  const fs = () => financialServices;
  return [
    {
      key: "api",
      title: "About your business",
      questions: [
        { id: "apiProducts", type: "multi", label: "Which API services do you need?", options: API_PRODUCTS },
        { id: "apiNature", type: "long", label: "Nature of business (description)" },
        { id: "apiWebsite", type: "short", label: "Company website" },
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
      ],
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
