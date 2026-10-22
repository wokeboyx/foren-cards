// Onboarding requirements, encoded from "Foren Onboarding Requirement" (compliance, Oct 2026).
// One source of truth: the welcome screen's "Documents you'll need", the stakeholder rules and the
// Business documents upload page all read from here, so they can never disagree.

export type CountryCode = "NG" | "GB" | "CA" | "KE";
export type EntityType = "sole_trader" | "company" | "mto";

export type OnboardingCountry = {
  code: CountryCode;
  name: string;
  /** Business registry we look the company up in. */
  registry: string;
  currency: string;
  /** Entity types we can onboard here. Kenya: the requirements only cover companies and MTOs/PSPs. */
  entities: EntityType[];
};

export const ONBOARDING_COUNTRIES: OnboardingCountry[] = [
  { code: "NG", name: "Nigeria", registry: "CAC", currency: "NGN", entities: ["sole_trader", "company", "mto"] },
  { code: "GB", name: "United Kingdom", registry: "Companies House", currency: "GBP", entities: ["sole_trader", "company", "mto"] },
  { code: "CA", name: "Canada", registry: "Corporations Canada", currency: "CAD", entities: ["sole_trader", "company", "mto"] },
  { code: "KE", name: "Kenya", registry: "Business Registration Service", currency: "KES", entities: ["company", "mto"] },
];

/** Countries people can pick that we don't support yet; they lead to the waitlist. */
export const WAITLIST_COUNTRIES = ["Ghana", "South Africa", "United States", "Germany", "France", "India", "Other country"];

export const countryInfo = (c: CountryCode | null | undefined) => ONBOARDING_COUNTRIES.find((x) => x.code === c);

export const ENTITY_LABEL: Record<EntityType, string> = {
  sole_trader: "Sole trader",
  company: "Company",
  mto: "Money transfer or payment service provider",
};

export const ENTITY_HINT: Record<EntityType, string> = {
  sole_trader: "Registered business with one owner.",
  company: "Registered company with one or more owners.",
  mto: "Licensed MTO or PSP that moves money for its own customers.",
};

/** Who counts as an ultimate beneficial owner (UBO), by ownership. */
export function uboThreshold(country: CountryCode, entity: EntityType): number | null {
  if (entity === "sole_trader") return null;
  if (entity === "mto") return 10;
  return country === "GB" || country === "CA" ? 25 : 10;
}

/** Companies and MTOs must name at least two directors. */
export const minDirectors = (entity: EntityType) => (entity === "sole_trader" ? 0 : 2);

/** Accepted photo IDs for people (proof of identity). */
export function acceptedIds(country: CountryCode): string {
  return country === "NG" ? "International passport or driver’s licence" : "Passport, national ID card or driving licence";
}

// ---------------------------------------------------------------- documents

/** Where a requirement gets satisfied. Only "upload" items appear on the Business documents page. */
export type RequirementSource = "upload" | "identity" | "stakeholders" | "questionnaire" | "edd";

export type Requirement = {
  id: string;
  title: string;
  description: string;
  source: RequirementSource;
  optional?: boolean;
  /** Accepted documents, shown under "Don’t have this document? View alternatives". */
  accepted?: string[];
  /** Short reason this applies to them, for conditional items. */
  because?: string;
};

export type RequirementContext = {
  country: CountryCode;
  entity: EntityType;
  /** Incorporated in the last 6 months or no trading history yet. */
  newBusiness?: boolean;
  /** Nigerian business in a SCUML (DNFBP) category. */
  scuml?: boolean;
  /** Chose API services (Fusion) on "How do you want to use Foren?". */
  api?: boolean;
  /** Chose any non-API product too. Pure API customers skip the business banking questionnaire. */
  banking?: boolean;
};

const PROOF_OF_ADDRESS_NG = [
  "Utility bill dated within the last 3 months (electricity, waste, internet or water)",
  "Bank statement from a Nigerian commercial bank dated within the last 3 months (digital statements aren’t accepted)",
  "Tenancy or lease agreement dated within the last year",
];
const PROOF_OF_ADDRESS = [
  "Utility bill dated within the last 3 months (electricity, waste, internet or water)",
  "Bank statement from a commercial bank dated within the last 3 months (digital statements aren’t accepted)",
  "Tenancy or lease agreement dated within the last year",
];
const PROOF_OF_ADDRESS_KE = [
  "Business bank statement from a regulated bank dated within the last 3 months",
  "Utility bill dated within the last 3 months (water, electricity, gas, landline or internet)",
  "Tenancy or lease agreement dated within the last year",
];

function proofOfAddress(country: CountryCode, entity: EntityType): Requirement {
  const accepted = country === "NG" ? PROOF_OF_ADDRESS_NG : country === "KE" || entity === "mto" ? PROOF_OF_ADDRESS_KE : PROOF_OF_ADDRESS;
  return {
    id: "proof_of_address",
    title: entity === "sole_trader" ? "Proof of registered address" : "Proof of business address",
    description: "Dated within the last 3 months and showing the business name. All 4 edges visible.",
    source: "upload",
    accepted,
  };
}

const LIVENESS: Requirement = {
  id: "liveness",
  title: "Liveness check",
  description: "A short selfie video, done with your identity check.",
  source: "identity",
};

const UBO_DECLARATION: Requirement = {
  id: "ubo_declaration",
  title: "UBO declaration form",
  description: "Signed by a director. Download our template, sign and upload it.",
  source: "upload",
};

function proprietorId(country: CountryCode): Requirement {
  return { id: "proprietor_id", title: "Valid ID of the owner", description: `${acceptedIds(country)}. Done with your identity check.`, source: "identity" };
}

function stakeholders(country: CountryCode, entity: EntityType): Requirement {
  const t = uboThreshold(country, entity);
  const poa = country === "NG" ? ", plus proof of address for directors" : "";
  return {
    id: "stakeholders",
    title: "Directors and beneficial owners",
    description: `At least two directors, everyone who owns ${t}% or more, and all authorised signatories. Each verifies their ID by link${poa}.`,
    source: "stakeholders",
  };
}

function questionnaire(ctx: RequirementContext): Requirement[] {
  const out: Requirement[] = [];
  if (ctx.entity !== "mto" && ctx.banking !== false)
    out.push({ id: "questionnaire", title: "Onboarding questionnaire", description: "About 10 questions on how you’ll use your account and transact.", source: "questionnaire" });
  if (ctx.entity === "mto")
    out.push({ id: "edd", title: "Onboarding questionnaire (business banking)", description: "Business activity, fund flow and AML controls. Part of sign-up.", source: "edd" });
  if (ctx.api)
    out.push({
      id: "api_forms",
      title: "API onboarding forms",
      description: "Prelim forms for Collections and Payouts (SendR), depending on what you need.",
      source: "questionnaire",
    });
  return out;
}

function conditional(ctx: RequirementContext): Requirement[] {
  const out: Requirement[] = [];
  if (ctx.scuml && ctx.country === "NG")
    out.push({
      id: "scuml",
      title: "SCUML certificate",
      description: "Registration with the Special Control Unit against Money Laundering.",
      source: "upload",
      because: "Required for your business category",
    });
  if (ctx.newBusiness)
    out.push(
      {
        id: "ubo_bank_statement",
        title: "Owner’s personal bank statement",
        description: "Last 3 months, for the main beneficial owner.",
        source: "upload",
        because: "Your business is new or hasn’t traded yet",
      },
      {
        id: "business_plan",
        title: "Business plan or proof of seed funding",
        description: "A business plan, investment agreement or proof of funds.",
        source: "upload",
        because: "Your business is new or hasn’t traded yet",
      }
    );
  return out;
}

export function requirementsFor(ctx: RequirementContext): Requirement[] {
  const { country, entity } = ctx;
  let base: Requirement[] = [];

  if (entity === "sole_trader" && country === "NG") {
    base = [
      { id: "cac_certificate", title: "CAC certificate", description: "Your business name registration certificate.", source: "upload" },
      { id: "status_report", title: "Status report", description: "Or other documents of business registration from CAC.", source: "upload" },
      { id: "company_bank_statement", title: "Business bank statement", description: "Dated within the last 3–6 months.", source: "upload" },
      proofOfAddress(country, entity),
      proprietorId(country),
      LIVENESS,
    ];
  } else if (entity === "sole_trader") {
    base = [
      { id: "registration_document", title: "Registration document", description: "Incorporation certificate or other proof of registration.", source: "upload" },
      { id: "ownership_document", title: "Proof of ownership", description: "A document showing you own the business.", source: "upload" },
      {
        id: "trading_evidence",
        title: "Proof of trading",
        description: "One of the documents below, dated within the last 3–6 months.",
        source: "upload",
        accepted: ["Business bank statement", "Invoices", "Business plan", "Partnership agreement"],
      },
      proofOfAddress(country, entity),
      proprietorId(country),
      LIVENESS,
    ];
  } else if (entity === "company" && country === "NG") {
    base = [
      { id: "cac_certificate", title: "Certificate of Incorporation", description: "Your CAC certificate.", source: "upload" },
      { id: "memart", title: "Memorandum and Articles of Association", description: "The complete document.", source: "upload" },
      proofOfAddress(country, entity),
      {
        id: "financials",
        title: "Audited financial statements or business bank statement",
        description: "Dated within the last 3–6 months.",
        source: "upload",
        accepted: ["Audited financial statements", "Business bank statement"],
      },
      { id: "cac_02", title: "Form CAC 02", description: "Return of Allotment.", source: "upload" },
      { id: "cac_07", title: "Form CAC 07", description: "Particulars of Directors.", source: "upload" },
      { id: "board_resolution", title: "Board resolution", description: "Or a letter of authorisation to open this account.", source: "upload" },
      UBO_DECLARATION,
      stakeholders(country, entity),
      LIVENESS,
    ];
  } else if (entity === "company" && country === "KE") {
    base = [
      { id: "memart", title: "Memorandum and Articles of Association", description: "Or your Articles of Incorporation.", source: "upload" },
      { id: "certificate", title: "Certificate of Incorporation", description: "Or your Certificate of Registration.", source: "upload" },
      proofOfAddress(country, entity),
      { id: "directors_list", title: "List of directors and shareholders", description: "An official list, such as a CR12.", source: "upload" },
      { id: "tax_certificate", title: "Tax certificate", description: "Your KRA PIN certificate.", source: "upload" },
      { id: "bank_statements", title: "Business bank statements", description: "The latest three months.", source: "upload" },
      { id: "vat", title: "VAT registration", description: "Only if you’re VAT registered.", source: "upload", optional: true },
      UBO_DECLARATION,
      stakeholders(country, entity),
      LIVENESS,
    ];
  } else if (entity === "company") {
    base = [
      { id: "memart", title: "Memorandum and Articles of Association", description: "Or your Articles of Incorporation.", source: "upload" },
      { id: "certificate", title: "Certificate of Incorporation", description: "Or your Certificate of Registration.", source: "upload" },
      proofOfAddress(country, entity),
      { id: "directors_list", title: "Official list of directors", description: country === "GB" ? "We’ll check it against Companies House." : "From your provincial or federal registry.", source: "upload" },
      { id: "shareholders", title: "Evidence of shareholders", description: "A register of members or share certificates.", source: "upload" },
      { id: "bank_statements", title: "Business bank statements", description: "The latest three months.", source: "upload" },
      { id: "vat", title: country === "CA" ? "GST/HST registration" : "VAT registration", description: "Only if you’re registered.", source: "upload", optional: true },
      UBO_DECLARATION,
      stakeholders(country, entity),
      LIVENESS,
    ];
  } else {
    // MTOs / PSPs, all jurisdictions.
    base = [
      { id: "memart", title: "Memorandum and Articles of Association", description: "Or your Articles of Incorporation.", source: "upload" },
      { id: "certificate", title: "Certificate of Incorporation", description: "Or your Certificate of Registration.", source: "upload" },
      proofOfAddress(country, entity),
      { id: "directors_list", title: "Official list of directors", description: "From your company registry.", source: "upload" },
      {
        id: "ownership_structure",
        title: "Ownership structure",
        description: "Showing every beneficial owner with 10% or more.",
        source: "upload",
        accepted: [
          "Share certificates",
          "A commercial registry document with beneficial ownership",
          "If there’s more than one layer of ownership: an ownership chart signed by a company officer or notary",
        ],
      },
      stakeholders(country, entity),
      ...(country === "CA"
        ? [
            {
              id: "criminal_record_checks",
              title: "Criminal record checks",
              description: "For the CEO, president, directors and anyone who owns or controls 20% or more.",
              source: "upload" as const,
              because: "Required by our MSB partners in Canada",
            },
          ]
        : []),
      ...(country === "NG"
        ? [
            { id: "board_resolution", title: "Board resolution", description: "Authorising this business relationship and account.", source: "upload" as const },
            { id: "status_report", title: "Status report", description: "From CAC.", source: "upload" as const },
          ]
        : []),
      { id: "aml_policy", title: "AML/KYC/CDD policies", description: "Must include your client risk assessment.", source: "upload" },
      { id: "prohibited_list", title: "Prohibited industries and countries", description: "The list you apply to your own customers.", source: "upload" },
      { id: "monitoring_policy", title: "Transaction monitoring policy", description: "How you detect and escalate unusual activity.", source: "upload" },
      { id: "onboarding_flow", title: "Customer onboarding flow chart", description: "How you onboard and verify your customers.", source: "upload" },
      { id: "transaction_flow", title: "Transaction flow chart with Foren", description: "How money moves between your customers, you and Foren.", source: "upload" },
      {
        id: "financials",
        title: "Audited financial accounts or business bank statements",
        description: "The latest accounts, or bank statements for the last 3–6 months.",
        source: "upload",
        accepted: [
          "Latest audited financial accounts",
          "Business bank statements for the last 3–6 months",
          "In exceptional cases: the UBO’s bank statements or other documents, reviewed case by case",
        ],
      },
      {
        id: "licence",
        title: country === "NG" ? "Operating licence" : "Evidence of registration",
        description:
          country === "NG" ? "Your CBN operating licence." : country === "GB" ? "Your FCA authorisation or registration." : country === "CA" ? "Your FINTRAC MSB registration." : "Your licence or registration from your regulator.",
        source: "upload",
      },
      ...(country === "GB"
        ? [{ id: "ico", title: "ICO registration", description: "Evidence you’re registered with the Information Commissioner’s Office.", source: "upload" as const }]
        : []),
      { id: "aml_audit", title: "External AML audit report", description: "Your latest one.", source: "upload" },
      UBO_DECLARATION,
      { ...LIVENESS, title: "Liveness check of a director" },
    ];
  }

  return [...base, ...conditional(ctx), ...questionnaire(ctx)];
}

export const uploadRequirements = (ctx: RequirementContext) => requirementsFor(ctx).filter((r) => r.source === "upload");

// ---------------------------------------------------------------- registration lookups

/** Registration types per country and entity, for "Find your business". */
export type RegistrationType = { code: string; label: string; hint: string };

export function registrationTypes(country: CountryCode, entity: EntityType): RegistrationType[] {
  if (country === "NG") {
    if (entity === "sole_trader") return [{ code: "BN", label: "BN", hint: "Business name" }];
    return [
      { code: "RC", label: "RC", hint: "Limited company" },
      { code: "IT", label: "IT", hint: "Incorporated trustees" },
    ];
  }
  if (country === "KE")
    return [
      { code: "PVT", label: "PVT", hint: "Private company" },
      { code: "CPR", label: "CPR", hint: "Public company" },
    ];
  return [];
}

// ---------------------------------------------------------------- business profile

export const TURNOVER_BANDS = ["Under 1M", "1M – 5M", "5M – 10M", "10M – 50M", "50M – 250M", "Above 250M"];

export type Sector = { name: string; categories: { name: string; scuml?: boolean }[] };

/** Sectors and categories. `scuml` marks Nigerian DNFBP categories that need a SCUML certificate. */
export const SECTORS: Sector[] = [
  {
    name: "Financial services",
    categories: [{ name: "Fintech and payments" }, { name: "Microfinance" }, { name: "Bureau de change", scuml: true }, { name: "Insurance broking" }, { name: "Mortgage brokers", scuml: true }],
  },
  { name: "Healthcare", categories: [{ name: "Pharmacy and drugs" }, { name: "Hospitals and clinics" }, { name: "Medical supplies" }] },
  {
    name: "Retail and e-commerce",
    categories: [{ name: "Online store" }, { name: "Supermarkets", scuml: true }, { name: "Jewellery and precious metals", scuml: true }, { name: "Car dealers", scuml: true }, { name: "Fashion" }],
  },
  {
    name: "Professional services",
    categories: [{ name: "Legal practice", scuml: true }, { name: "Accounting and audit", scuml: true }, { name: "Tax consulting", scuml: true }, { name: "Consulting" }, { name: "Marketing and design" }],
  },
  { name: "Real estate and construction", categories: [{ name: "Real estate agency", scuml: true }, { name: "Construction" }, { name: "Property management", scuml: true }] },
  { name: "Hospitality and travel", categories: [{ name: "Hotels", scuml: true }, { name: "Travel agency" }, { name: "Restaurants" }] },
  { name: "Technology", categories: [{ name: "Software and SaaS" }, { name: "IT services" }, { name: "Hardware" }] },
  { name: "Logistics and manufacturing", categories: [{ name: "Freight and logistics" }, { name: "Manufacturing" }, { name: "Import and export" }] },
  { name: "Non-profit", categories: [{ name: "NGO or charity", scuml: true }, { name: "Religious organisation", scuml: true }] },
];

export function isScumlCategory(sector: string | undefined, category: string | undefined) {
  return !!SECTORS.find((s) => s.name === sector)?.categories.find((c) => c.name === category)?.scuml;
}

/** "How do you want to use Foren?" options (Figma 3035:73236). */
export const USE_CASES = [
  { id: "global_accounts", title: "Global Accounts", description: "Hold, swap and manage multi-currency balances from your dashboard." },
  { id: "api", title: "API services", description: "Automate collections and payouts in any currency programmatically." },
  { id: "payouts", title: "Global Payouts", description: "Send single or batch cross-border transfers in many currencies." },
  { id: "payment_links", title: "Payment Links", description: "Share links to collect payments, with no code." },
  { id: "checkout", title: "Foren Checkout", description: "Accept payments on your website with a hosted, branded checkout." },
  { id: "cards", title: "Cards", description: "Issue virtual cards to your team and control what they spend." },
  { id: "virtual_accounts", title: "Virtual Accounts", description: "Dedicated account numbers for collecting from customers." },
  { id: "fx", title: "FX and conversion", description: "Convert currencies at transparent, competitive rates." },
  { id: "insights", title: "Spend Insights", description: "See how money moves across your business in real time." },
  { id: "team", title: "Team Management", description: "Set roles and permissions for your team." },
] as const;

export type UseCaseId = (typeof USE_CASES)[number]["id"];

/** Is the business new (incorporated in the last 6 months), given an ISO date? */
export function isNewBusiness(incorporatedOn: string | undefined, today = new Date()) {
  if (!incorporatedOn) return false;
  const d = new Date(incorporatedOn);
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return d > sixMonthsAgo;
}
