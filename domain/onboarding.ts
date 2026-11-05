// Onboarding requirements, encoded from "Foren Onboarding Requirement" (compliance, Oct 2026) and updated to
// the consolidated requirements workbook and Compliance's answers to its open questions (Nov 2026).
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
  /** Entity types we can onboard here. */
  entities: EntityType[];
};

export const ONBOARDING_COUNTRIES: OnboardingCountry[] = [
  { code: "NG", name: "Nigeria", registry: "CAC", currency: "NGN", entities: ["sole_trader", "company", "mto"] },
  { code: "GB", name: "United Kingdom", registry: "Companies House", currency: "GBP", entities: ["sole_trader", "company", "mto"] },
  { code: "CA", name: "Canada", registry: "Corporations Canada", currency: "CAD", entities: ["sole_trader", "company", "mto"] },
  { code: "KE", name: "Kenya", registry: "Business Registration Service", currency: "KES", entities: ["sole_trader", "company", "mto"] },
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

/** Business categories with their own document lists. Only Nigeria and Kenya split an entity type further. */
export type BusinessCategory = { id: string; label: string; hint: string; /** Listed so people can find it, but we can't onboard it yet: sign-up stops here. */ unsupported?: boolean };

const CATEGORIES: Partial<Record<CountryCode, Partial<Record<EntityType, BusinessCategory[]>>>> = {
  NG: {
    sole_trader: [
      { id: "sole_proprietor", label: "Sole proprietorship", hint: "A business name with one owner." },
      { id: "partnership", label: "Business partnership", hint: "A business name owned by two or more partners." },
    ],
    company: [
      { id: "private", label: "Private limited company", hint: "A Ltd company registered with CAC." },
      { id: "public", label: "Public limited company", hint: "A Plc listed on a stock exchange." },
      { id: "guarantee", label: "Company limited by guarantee", hint: "Usually a non-profit, with members instead of shareholders." },
      { id: "free_zone", label: "Free trade zone company", hint: "Registered with NEPZA to operate in a free zone." },
      { id: "trustees", label: "Incorporated trustees", hint: "Registered with CAC with an IT number, such as a charity or association." },
      { id: "cooperative", label: "Cooperative society", hint: "Registered as a cooperative society." },
      { id: "government", label: "Government ministry, department or agency", hint: "Set up by law or gazette." },
      { id: "government_approved", label: "Private entity created by government approval", hint: "Set up under a government approval." },
    ],
  },
  KE: {
    sole_trader: [
      { id: "sole_proprietor", label: "Sole proprietorship", hint: "A registered business name with one owner." },
      { id: "partnership", label: "Partnership", hint: "Two or more partners under a partnership deed." },
    ],
    company: [
      { id: "limited", label: "Limited company", hint: "Registered with the Business Registration Service." },
      { id: "ngo", label: "NGO or community-based organisation", hint: "A registered or exempted non-profit.", unsupported: true },
    ],
  },
};

/** Adds percentages in hundredths so 5.2 + 78.9 + 15.9 is exactly 100, not 99.99999999999999. */
export const sumPct = (values: number[]) => Math.round(values.reduce((a, v) => a + Math.round(v * 100), 0)) / 100;

export const businessCategories = (country: CountryCode, entity: EntityType) => CATEGORIES[country]?.[entity] ?? [];

/** The category to use: the one picked, or the first when there's a choice and nothing valid is picked yet. */
export function categoryOf(country: CountryCode, entity: EntityType, category: string | null | undefined): string | null {
  const list = businessCategories(country, entity);
  return list.find((c) => c.id === category)?.id ?? list[0]?.id ?? null;
}

/** True when no category is needed, or a valid one is picked. */
export const categoryChosen = (country: CountryCode, entity: EntityType, category: string | null | undefined) => {
  const list = businessCategories(country, entity);
  return !list.length || list.some((c) => c.id === category && !c.unsupported);
};

/** The chosen business type is one we don't support yet. */
export const categoryUnsupported = (country: CountryCode, entity: EntityType, category: string | null | undefined) =>
  businessCategories(country, entity).some((c) => c.id === category && c.unsupported);

export const categoryLabel = (country: CountryCode, entity: EntityType, category: string | null | undefined) =>
  businessCategories(country, entity).find((c) => c.id === category)?.label;

/** Partnerships list their partners like companies list stakeholders; other sole traders are the only owner. */
export const hasStakeholders = (entity: EntityType, category: string | null | undefined) => entity !== "sole_trader" || category === "partnership";

/** Who counts as an ultimate beneficial owner (UBO), by ownership. Compliance confirmed 10% for every country (Nov 2026). */
export function uboThreshold(_country: CountryCode, entity: EntityType, category?: string | null): number | null {
  return hasStakeholders(entity, category) ? 10 : null;
}

/** Nature of control options for UBOs and controllers (Director and UBO declaration, Section 2). */
export const CONTROL_TYPES = [
  { id: "shares", label: "Holds shares" },
  { id: "voting", label: "Holds voting rights" },
  { id: "appoints", label: "Can appoint or remove directors" },
  { id: "other", label: "Other significant control" },
] as const;
export type ControlType = (typeof CONTROL_TYPES)[number]["id"];

/** "Holds shares, Holds voting rights", or the description given for other control. */
export function controlLabel(control: ControlType[], other: string) {
  return control.map((c) => (c === "other" ? other || "Other significant control" : CONTROL_TYPES.find((t) => t.id === c)!.label)).join(", ");
}

/** International dialling code for the representative's phone number. */
export const DIAL_CODE: Record<CountryCode, string> = { NG: "+234", GB: "+44", CA: "+1", KE: "+254" };

/** Companies and MTOs must name at least two directors. */
export const minDirectors = (entity: EntityType) => (entity === "sole_trader" ? 0 : 2);

/** Accepted photo IDs for people (proof of identity): passport or national ID. Nigeria also takes the NIN slip; Kenya needs both sides of the ID. */
export function acceptedIds(country: CountryCode): string {
  if (country === "NG") return "International passport or national ID (NIN slip accepted)";
  if (country === "KE") return "National ID card (front and back) or passport";
  return "Passport or national ID card";
}

export const idTypes = (country: CountryCode | null) =>
  country === "NG" ? ["International passport", "National ID card or NIN slip"] : country === "KE" ? ["National ID card", "Passport"] : ["Passport", "National ID card"];

const REGION_CODES =
  "AF AX AL DZ AS AD AO AI AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BA BW BR VG BN BG BF BI KH CM CA CV KY CF TD CL CN CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI XK KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU KP MK MP NO OM PK PW PS PA PG PY PE PH PL PT PR QA RE RO RU RW WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA KR SS ES LK BL SH KN LC MF PM VC SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TC TV UG UA AE GB US UY UZ VU VA VE VN WF EH YE ZM ZW";

/** Nationality options for stakeholders: our four countries first, then every other country A–Z. */
export function nationalityOptions(): { code: string; name: string }[] {
  const names = new Intl.DisplayNames(["en-GB"], { type: "region" });
  const first = ["NG", "GB", "CA", "KE"];
  const all = REGION_CODES.split(" ").map((code) => ({ code, name: names.of(code) ?? code }));
  return [
    ...first.map((c) => all.find((x) => x.code === c)!),
    ...all.filter((x) => !first.includes(x.code)).sort((a, b) => a.name.localeCompare(b.name)),
  ];
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
  /** One-line version of `description` for the sign-up checklist ("What you'll need"). Falls back to `description`. */
  summary?: string;
  /** The upload check reads the document's date and flags it when it's older than this. */
  maxAgeDays?: number;
  /** A number the upload check reads off the document. We only ask for it when it can't be found. */
  reads?: string;
};

/** "30 days", "3 months". */
export const ageLabel = (days: number) => (days % 30 === 0 && days >= 60 ? `${days / 30} months` : `${days} days`);

/** Kenyan KRA PIN: a letter, 9 digits and a letter, like A012345678Z. */
export const KRA_PIN_RE = /^[A-Z]\d{9}[A-Z]$/i;

export type RequirementContext = {
  country: CountryCode;
  entity: EntityType;
  /** Business category id from `businessCategories`. Missing: the first category for that country and entity. */
  category?: string | null;
  /** Incorporated in the last 6 months or no trading history yet. */
  newBusiness?: boolean;
  /** Nigerian business in a sector Compliance lists for SCUML. */
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
    maxAgeDays: 90,
  };
}

const LIVENESS: Requirement = {
  id: "liveness",
  title: "Liveness check",
  description: "A short selfie video, done with your identity check.",
  source: "identity",
};

/** Digital only: built from the stakeholders the user adds, then confirmed with a tick box. No upload. */
const UBO_DECLARATION: Requirement = {
  id: "ubo_declaration",
  title: "Director and UBO declaration",
  description: "Filled in for you from your stakeholders. You confirm it with a tick, no signature needed.",
  source: "stakeholders",
};

/** Sole proprietors' own proof of address (compliance: proof of address from every stakeholder). Collected at sign-up, after the ID check. */
const PROPRIETOR_ADDRESS: Requirement = {
  id: "proprietor_address",
  title: "Proof of your home address",
  description: "A utility bill or bank statement in your name, dated within the last 3 months. Uploaded after your identity check.",
  source: "identity",
};

/** Sole proprietors upload their own proof of address at sign-up. Partnerships don't: each partner does it through their stakeholder link. */
export const needsOwnerAddress = (entity: EntityType | null | undefined, category: string | null | undefined) =>
  entity === "sole_trader" && category !== "partnership";

function proprietorId(country: CountryCode): Requirement {
  return { id: "proprietor_id", title: "Valid ID of the owner", description: `${acceptedIds(country)}. Done with your identity check.`, source: "identity" };
}

function stakeholders(country: CountryCode, entity: EntityType, category: string | null): Requirement {
  const t = uboThreshold(country, entity, category);
  // Choice Bank also needs each person's KRA PIN, entered with their details (it isn't on Kenyan IDs), and a selfie.
  // Date of birth comes from each person's ID check, so it isn't asked here.
  const details = country === "KE" ? "their nationality and KRA PIN" : "their nationality";
  const checks = country === "KE" ? "their ID with a selfie" : "their ID and proof of address";
  if (category === "partnership")
    return {
      id: "stakeholders",
      title: "Partners",
      description: `Every partner, with their share${country === "KE" ? ", nationality and KRA PIN" : " and nationality"}. Each verifies ${checks} by link.`,
      summary: "Every partner and their share. Each verifies by link.",
      source: "stakeholders",
    };
  if (category === "trustees" || category === "ngo")
    return {
      id: "stakeholders",
      title: "Trustees and officials",
      description: `Every trustee and official who runs the organisation, with ${details}. Each verifies ${checks} by link.`,
      summary: "Every trustee and official. Each verifies by link.",
      source: "stakeholders",
    };
  return {
    id: "stakeholders",
    title: "Directors, beneficial owners and signatories",
    description: `At least two directors, everyone who owns ${t}% or more, and all authorised signatories, with ${details}. Each verifies ${checks} by link.`,
    summary: `Directors, owners of ${t}% or more, and signatories.`,
    source: "stakeholders",
  };
}

const upload = (id: string, title: string, description: string, more: Partial<Requirement> = {}): Requirement => ({ id, title, description, source: "upload", ...more });

const SCUML: Requirement = upload("scuml", "SCUML certificate", "Registration with the Special Control Unit against Money Laundering.");

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
  if (ctx.scuml && ctx.country === "NG") out.push({ ...SCUML, because: "Required for your business category" });
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
  const category = categoryOf(country, entity, ctx.category);
  const partnership = category === "partnership";
  let base: Requirement[] = [];

  if (entity === "sole_trader" && country === "NG") {
    base = [
      upload("cac_certificate", "CAC certificate", partnership ? "Your partnership’s business name registration certificate." : "Your business name registration certificate."),
      upload("status_report", "Form CAC/BN/1 or status report", "Your application for registration of business name, or a status report from CAC.", { summary: "Business name application or status report from CAC." }),
      upload("company_bank_statement", "Business bank statement", "Dated within the last 3–6 months."),
      proofOfAddress(country, entity),
      ...(partnership ? [stakeholders(country, entity, category)] : [proprietorId(country), PROPRIETOR_ADDRESS]),
      LIVENESS,
    ];
  } else if (entity === "sole_trader" && country === "KE") {
    // Choice Bank (Kenya).
    base = partnership
      ? [
          upload("certificate", "Partnership certificate of registration", "From the Business Registration Service."),
          upload("partnership_deed", "Partnership deed", "A certified copy."),
          upload("partners_resolution", "Partners’ resolution", "Or mandate, authorising this account and naming who can sign."),
          upload("tax_certificate", "Partnership KRA PIN certificate", "In your partnership’s name."),
          upload("bank_statements", "Bank statement", "The latest three months."),
          proofOfAddress(country, entity),
          stakeholders(country, entity, category),
          LIVENESS,
        ]
      : [
          upload("certificate", "Business registration certificate", "Your proprietor business certificate from the Business Registration Service.", { summary: "From the Business Registration Service." }),
          upload("tax_certificate", "Personal KRA PIN certificate", "The PIN certificate in your own name."),
          upload("bank_statements", "Bank statement", "The latest three months."),
          proofOfAddress(country, entity),
          proprietorId(country),
          PROPRIETOR_ADDRESS,
          LIVENESS,
          // Compliance kept these for sole traders (Nov 2026) without setting a level.
          upload("board_resolution", "Letter of authorisation", "Authorising this account and naming who can sign. Dated within the last 30 days.", { optional: true, maxAgeDays: 30, summary: "Names who can sign. Dated within 30 days." }),
          upload("annual_returns", "Latest annual returns", "Your most recent filed returns.", { optional: true }),
        ];
  } else if (entity === "sole_trader") {
    base = [
      upload("ownership_document", "Proof of ownership", "A document showing you own the business."),
      upload("company_bank_statement", "Business bank statement", "Dated within the last 3–6 months."),
      country === "GB"
        ? upload("tax_letter", "Proof of UTR", "An HMRC letter or correspondence showing your Unique Taxpayer Reference.", { summary: "An HMRC letter showing your UTR." })
        : upload("tax_letter", "Letter from the Canada Revenue Agency", "A recent CRA letter addressed to your business."),
      proofOfAddress(country, entity),
      proprietorId(country),
      PROPRIETOR_ADDRESS,
      LIVENESS,
      upload("registration_document", "Registration certificate", "Your certificate of registration, if you have one.", { optional: true }),
    ];
  } else if (entity === "company" && country === "NG") {
    const incorporation = upload("cac_certificate", "Certificate of Incorporation", "Your CAC certificate.");
    const memart = upload("memart", "Memorandum and Articles of Association", "The complete document.");
    const tin = upload("tin", "Tax Identification Number (TIN)", "Your TIN certificate or letter.");
    // Compliance kept these three rows as one choice, with no rule yet for which form applies (Nov 2026).
    const cac = upload("cac_documents", "CAC registration documents", "A status report, or the CAC forms filed when you registered.", {
      accepted: ["CAC status report", "Forms CAC 2 (allotment of shares) and CAC 7 (particulars of directors)", "Form CAC 1.1 (application for registration)"],
    });
    const byCategory: Record<string, Requirement[]> = {
      private: [
        incorporation,
        memart,
        cac,
        tin,
        upload("licence", "Operating licence", "From your industry regulator."),
        upload("aml_policy", "AML/CFT and KYC policy", "Only if you’re a regulated business.", { optional: true }),
      ],
      public: [incorporation, memart, cac, tin, upload("listing", "Evidence of listing", "The stock exchange you’re listed on, and proof of the listing.")],
      guarantee: [incorporation, memart, cac, tin, upload("status_report", "Form CAC/BN/1 or status report", "Your registration application, or a status report from CAC.")],
      free_zone: [
        upload("nepza_certificate", "NEPZA certificate of registration", "From the Nigeria Export Processing Zones Authority. We read your NEPZA number from it.", { reads: "NEPZA number", summary: "From the Nigeria Export Processing Zones Authority." }),
        memart,
        upload("directors_particulars", "Particulars of directors", "Or any claim to them."),
        upload("notice_of_situation", "Notice of situation", "A certified true copy showing your registered address."),
        upload("share_capital", "Statement of share capital and return of allotment", "As filed when you registered."),
        upload("licence", "Operating licence", "Your free zone operating licence."),
      ],
      trustees: [
        upload("constitution", "Constitution", "Or memorandum of guidance."),
        memart,
        upload("cac_it1", "Form CAC IT/1", "Your application for registration of incorporated trustees."),
        upload("status_report", "Status report", "From CAC."),
        SCUML,
      ],
      cooperative: [
        upload("cooperative_certificate", "Cooperative society certificate", "Your certificate of registration as a cooperative."),
        upload("application_form", "Certified application form", "The application you filed to register the cooperative."),
        upload("recognition_letter", "Letter of recognition", "From the registrar of cooperative societies."),
      ],
      government: [
        upload("gazette", "Official gazette", "The gazette or law that set up your organisation."),
        upload("authorisation_letter", "Authorisation letter", "Authorising this account and naming who can sign."),
      ],
      government_approved: [
        upload("government_approval", "Government approval document", "The approval your organisation was set up under."),
        upload("owners_document", "Document showing business owners", "Naming everyone who owns the business."),
      ],
    };
    base = [
      ...byCategory[category!],
      proofOfAddress(country, entity),
      upload("financials", "Source of funds", "A business bank statement, or a management or financial report.", {
        accepted: ["Business bank statement", "Management accounts or a financial report"],
      }),
      upload("board_resolution", "Board resolution", "Or a letter of authorisation to open this account."),
      // The UBO form is optional for companies limited by guarantee.
      ...(category === "guarantee" ? [] : [UBO_DECLARATION]),
      stakeholders(country, entity, category),
      LIVENESS,
    ];
  } else if (entity === "company" && country === "KE") {
    // Choice Bank (Kenya).
    base =
      category === "ngo"
        ? [
            upload("certificate", "Certificate of registration", "Or your exemption certificate. A certified copy."),
            upload("constitution", "By-laws or constitution", "The complete document."),
            upload("tax_certificate", "KRA PIN certificate", "In your organisation’s name."),
            upload("board_resolution", "Board or trustee resolution", "Authorising this account and naming who can sign."),
            proofOfAddress(country, entity),
            stakeholders(country, entity, category),
            LIVENESS,
          ]
        : [
            upload("memart", "Memorandum and Articles of Association", "Or Forms CR1, CR2 and CR8."),
            upload("certificate", "Certificate of Incorporation", "From the Business Registration Service."),
            upload("cr12", "CR12", "The official list of current directors, shareholders and share capital. Valid for 30 days.", { maxAgeDays: 30, summary: "Current directors and shareholders. Valid 30 days." }),
            upload("bof1", "Beneficial ownership form (BOF1)", "As filed with the Business Registration Service, naming everyone with 10% or more.", { summary: "Filed with the Business Registration Service." }),
            upload("tax_certificate", "Corporate KRA PIN certificate", "In your company’s name."),
            upload("annual_returns", "Latest annual returns", "Your most recent filed returns."),
            upload("board_resolution", "Board resolution", "On company letterhead, signed by at least 2 directors and naming your signatories. Dated within the last 30 days.", {
              maxAgeDays: 30,
              summary: "Signed by 2 directors. Dated within 30 days.",
            }),
            upload("bank_statements", "Business bank statements", "The latest three months."),
            proofOfAddress(country, entity),
            upload("vat", "VAT registration certificate", "Only if you’re VAT registered.", { optional: true }),
            UBO_DECLARATION,
            stakeholders(country, entity, category),
            LIVENESS,
          ];
  } else if (entity === "company") {
    base = [
      upload("memart", "Memorandum and Articles of Association", "Or your Articles of Incorporation."),
      upload("certificate", "Certificate of Incorporation", "Or your Certificate of Registration."),
      proofOfAddress(country, entity),
      upload("directors_list", "Official list of directors", country === "GB" ? "We’ll check it against Companies House." : "From your provincial or federal registry."),
      upload("shareholders", "Evidence of shareholders", "A register of members or share certificates."),
      upload("bank_statements", "Business bank statements", "Dated within the last 3–6 months."),
      upload("vat", country === "CA" ? "GST/HST registration" : "VAT registration", "Only if you’re registered.", { optional: true }),
      UBO_DECLARATION,
      stakeholders(country, entity, category),
      LIVENESS,
    ];
  } else {
    // MTOs / PSPs, all jurisdictions.
    base = [
      upload("memart", "Memorandum and Articles of Association", "Or your Articles of Incorporation."),
      upload("certificate", "Certificate of Incorporation", "Or your Certificate of Registration."),
      proofOfAddress(country, entity),
      upload("directors_list", "Official list of directors", country === "KE" ? "A CR12, valid for 30 days." : "From your company registry.", country === "KE" ? { maxAgeDays: 30 } : {}),
      upload("ownership_structure", "Ownership structure", "Showing every beneficial owner with 10% or more.", {
        accepted: [
          "Share certificates",
          "A commercial registry document with beneficial ownership",
          "If there’s more than one layer of ownership: an ownership chart signed by a company officer or notary",
        ],
      }),
      stakeholders(country, entity, category),
      ...(country === "CA"
        ? [
            upload("criminal_record_checks", "Criminal record checks", "For the CEO, president, directors and anyone who owns or controls 20% or more.", {
              summary: "For leaders and anyone owning or controlling 20%+.",
              because: "Required by our MSB partners in Canada",
            }),
          ]
        : []),
      ...(country !== "GB" ? [upload("board_resolution", "Board resolution", "Authorising this business relationship and account.")] : []),
      ...(country === "NG"
        ? [
            upload("status_report", "Status report", "From CAC."),
            upload("systems_controls", "Demonstration of systems and controls", "Show us how your compliance systems and controls work.", {
              accepted: ["A flow document", "A demo call with our compliance team"],
            }),
          ]
        : []),
      ...(country === "KE"
        ? [
            upload("bof1", "Beneficial ownership form (BOF1)", "As filed with the Business Registration Service, with a signed ownership chart.", { summary: "Filed with the BRS, with a signed ownership chart." }),
            upload("tax_certificate", "Corporate KRA PIN certificate", "In your company’s name."),
            upload("annual_returns", "Latest annual returns", "Your most recent filed returns."),
            upload("notice_of_situation", "Notice of situation", "A certified true copy showing your registered address."),
            upload("goaml", "FRC goAML registration", "Proof of registration or portal clearance from the Financial Reporting Centre.", { summary: "Registration with the Financial Reporting Centre." }),
            upload("management_accounts", "Management accounts", "Your latest ones."),
            upload("bank_statements", "Business bank statements", "The last 3–6 months."),
            upload("compliance_officer_cv", "Compliance officer’s CV", "For your named compliance officer."),
            upload("compliance_structure", "Compliance department structure", "Who does what in your compliance team."),
          ]
        : []),
      upload("aml_policy", "AML/KYC/CDD policies", "Must include your client risk assessment."),
      upload("prohibited_list", "Prohibited industries and countries", "The list you apply to your own customers."),
      upload("monitoring_policy", "Transaction monitoring policy", "How you detect and escalate unusual activity."),
      upload("onboarding_flow", "Customer onboarding flow chart", "How you onboard and verify your customers."),
      upload("transaction_flow", "Transaction flow chart with Foren", "How money moves between your customers, you and Foren."),
      country === "KE"
        ? upload("financials", "Audited financial accounts", "For the last 1–2 financial years.")
        : upload("financials", "Audited financial accounts or business bank statements", "The latest accounts, or bank statements for the last 3–6 months.", {
            accepted: [
              "Latest audited financial accounts",
              "Business bank statements for the last 3–6 months",
              "In exceptional cases: the UBO’s bank statements or other documents, reviewed case by case",
            ],
          }),
      upload(
        "licence",
        country === "NG" || country === "KE" ? "Operating licence" : "Evidence of registration",
        country === "NG"
          ? "Your CBN operating licence."
          : country === "KE"
            ? "Your Central Bank of Kenya operating licence."
            : country === "GB"
              ? "Your FCA authorisation or registration."
              : "Your FINTRAC MSB registration."
      ),
      ...(country === "GB" ? [upload("ico", "ICO registration", "Evidence you’re registered with the Information Commissioner’s Office.")] : []),
      upload("aml_audit", "External AML audit report", "Your latest one."),
      UBO_DECLARATION,
      { ...LIVENESS, title: "Liveness check of a director" },
    ];
  }

  // Incorporated trustees always need SCUML, so it's already in their list.
  const extra = conditional(ctx).filter((r) => !base.some((b) => b.id === r.id));
  return [...base, ...extra, ...questionnaire(ctx)];
}

export const uploadRequirements = (ctx: RequirementContext) => requirementsFor(ctx).filter((r) => r.source === "upload");

// ---------------------------------------------------------------- registration lookups

/** Registration types per country, entity and category, for "Find your business". */
export type RegistrationType = { code: string; label: string; hint: string };

export function registrationTypes(country: CountryCode, entity: EntityType, category?: string | null): RegistrationType[] {
  const BN = { code: "BN", label: "BN", hint: "Business name" };
  if (country === "NG") {
    if (entity === "sole_trader") return [BN];
    if (category === "trustees") return [{ code: "IT", label: "IT", hint: "Incorporated trustees" }];
    return [
      { code: "RC", label: "RC", hint: "Limited company" },
      { code: "IT", label: "IT", hint: "Incorporated trustees" },
    ];
  }
  if (country === "KE") {
    if (entity === "sole_trader") return [BN];
    // NGOs and CBOs aren't on the business register: they're entered by hand.
    if (category === "ngo") return [];
    return [
      { code: "PVT", label: "PVT", hint: "Private company" },
      { code: "CPR", label: "CPR", hint: "Public company" },
    ];
  }
  return [];
}

// ---------------------------------------------------------------- business profile

export const TURNOVER_BANDS = ["Under 1M", "1M – 5M", "5M – 10M", "10M – 50M", "50M – 250M", "Above 250M"];

export type Sector = { name: string; categories: { name: string; scuml?: boolean }[] };

/** Sectors and categories. `scuml` marks the Nigerian categories Compliance lists for a SCUML certificate (Nov 2026). */
export const SECTORS: Sector[] = [
  {
    name: "Financial services",
    categories: [
      { name: "Banking", scuml: true },
      { name: "Fintech and payments", scuml: true },
      { name: "Microfinance", scuml: true },
      { name: "Bureau de change", scuml: true },
      { name: "Insurance", scuml: true },
      { name: "Mortgage institutions and brokers", scuml: true },
      { name: "Clearing and settlement", scuml: true },
    ],
  },
  { name: "Healthcare", categories: [{ name: "Pharmacy and drugs" }, { name: "Hospitals and clinics" }, { name: "Medical supplies" }] },
  {
    name: "Retail and e-commerce",
    categories: [
      { name: "Online store" },
      { name: "Supermarkets" },
      { name: "Luxury goods", scuml: true },
      { name: "Jewellery, precious stones and metals", scuml: true },
      { name: "Car dealers and importers", scuml: true },
      { name: "Fashion" },
    ],
  },
  {
    name: "Professional services",
    categories: [
      { name: "Legal practice" },
      { name: "Accounting and audit", scuml: true },
      { name: "Tax consulting", scuml: true },
      { name: "Consulting", scuml: true },
      { name: "Trust and company services", scuml: true },
      { name: "Marketing and design" },
    ],
  },
  {
    name: "Real estate and construction",
    categories: [
      { name: "Real estate agency or development", scuml: true },
      { name: "Estate surveying and valuation", scuml: true },
      { name: "Construction", scuml: true },
      { name: "Property management" },
    ],
  },
  {
    name: "Hospitality and travel",
    categories: [{ name: "Hotels", scuml: true }, { name: "Casinos, betting and lotteries", scuml: true }, { name: "Travel agency" }, { name: "Restaurants" }],
  },
  { name: "Technology", categories: [{ name: "Software and SaaS" }, { name: "IT services" }, { name: "Hardware" }] },
  {
    name: "Logistics and manufacturing",
    categories: [{ name: "Freight and logistics" }, { name: "Manufacturing" }, { name: "Import and export" }, { name: "Farming equipment and machinery", scuml: true }],
  },
  {
    name: "Non-profit",
    categories: [{ name: "NGO or charity", scuml: true }, { name: "Religious organisation", scuml: true }, { name: "Club or association", scuml: true }],
  },
];

export function isScumlCategory(sector: string | undefined, category: string | undefined) {
  return !!SECTORS.find((s) => s.name === sector)?.categories.find((c) => c.name === category)?.scuml;
}

/** "How do you want to use Foren?" options (Figma 3035:73236). */
export const USE_CASES = [
  { id: "global_accounts", title: "Global Accounts", description: "Hold, swap, and manage multi-currency balances directly from your dashboard." },
  { id: "api", title: "API services", description: "Automate collections and payouts in any currency programmatically." },
  { id: "payouts", title: "Global Payouts", description: "Execute single or batch cross-border multi-currency transfers." },
  { id: "payment_links", title: "Payment Links", description: "Generate shareable payment links to collect payments with no code required." },
  { id: "checkout", title: "Foren Checkout", description: "Accept payments on your website with a hosted, branded checkout." },
  { id: "cards", title: "Card Issuance & Acquiring", description: "Issue and accept card payments globally (Coming soon)." },
  { id: "virtual_accounts", title: "Virtual Accounts", description: "Generate dedicated virtual account numbers for global collections." },
  { id: "fx", title: "FX & Conversion", description: "Convert currencies at transparent, competitive rates." },
  { id: "insights", title: "Spend Insights", description: "Track how money moves across your business in real time." },
  { id: "team", title: "Team Management", description: "Configure roles and permissions for your team." },
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

export const nationalityName = (code: string) => (code ? (new Intl.DisplayNames(["en-GB"], { type: "region" }).of(code) ?? code) : "");
