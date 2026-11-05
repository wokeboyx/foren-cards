import { describe, expect, it } from "vitest";
import {
  KRA_PIN_RE,
  ONBOARDING_COUNTRIES,
  acceptedIds,
  ageLabel,
  businessCategories,
  categoryChosen,
  categoryUnsupported,
  needsOwnerAddress,
  sumPct,
  categoryOf,
  hasStakeholders,
  isScumlCategory,
  registrationTypes,
  requirementsFor,
  uboThreshold,
  uploadRequirements,
  type CountryCode,
  type EntityType,
  type RequirementContext,
} from "@/domain/onboarding";
import { MTO_QUESTIONNAIRE, unanswered } from "@/domain/questionnaires";

const reqs = (ctx: RequirementContext) => requirementsFor(ctx);
const ids = (ctx: RequirementContext) => reqs(ctx).map((r) => r.id);
const required = (ctx: RequirementContext) => uploadRequirements(ctx).filter((r) => !r.optional).map((r) => r.id);
const find = (ctx: RequirementContext, id: string) => reqs(ctx).find((r) => r.id === id);

// Every country, entity and category the prototype can onboard.
const ALL: RequirementContext[] = ONBOARDING_COUNTRIES.flatMap((c) =>
  c.entities.flatMap((entity) => {
    const cats = businessCategories(c.code, entity);
    return cats.length ? cats.map((cat) => ({ country: c.code, entity, category: cat.id })) : [{ country: c.code, entity }];
  })
);

describe("countries and categories", () => {
  it("onboards sole traders, companies and MTOs in all four countries", () => {
    for (const c of ONBOARDING_COUNTRIES) expect(c.entities).toEqual(["sole_trader", "company", "mto"]);
  });

  it("splits Nigerian companies into 8 types and sole traders into 2", () => {
    expect(businessCategories("NG", "company").map((c) => c.id)).toEqual([
      "private",
      "public",
      "guarantee",
      "free_zone",
      "trustees",
      "cooperative",
      "government",
      "government_approved",
    ]);
    expect(businessCategories("NG", "sole_trader").map((c) => c.id)).toEqual(["sole_proprietor", "partnership"]);
  });

  it("adds Kenya Partnership and NGO/CBO", () => {
    expect(businessCategories("KE", "sole_trader").map((c) => c.id)).toEqual(["sole_proprietor", "partnership"]);
    expect(businessCategories("KE", "company").map((c) => c.id)).toEqual(["limited", "ngo"]);
  });

  it("has no categories for the UK, Canada or any MTO", () => {
    for (const country of ["GB", "CA"] as CountryCode[])
      for (const entity of ["sole_trader", "company", "mto"] as EntityType[]) expect(businessCategories(country, entity)).toEqual([]);
    expect(businessCategories("NG", "mto")).toEqual([]);
    expect(businessCategories("KE", "mto")).toEqual([]);
  });

  it("needs a category picked only where there's a choice", () => {
    expect(categoryChosen("GB", "company", null)).toBe(true);
    expect(categoryChosen("NG", "company", null)).toBe(false);
    expect(categoryChosen("NG", "company", "ngo")).toBe(false);
    expect(categoryChosen("NG", "company", "trustees")).toBe(true);
  });

  it("falls back to the first category", () => {
    expect(categoryOf("NG", "company", null)).toBe("private");
    expect(categoryOf("KE", "company", "nonsense")).toBe("limited");
    expect(categoryOf("GB", "company", null)).toBeNull();
  });

  it("gives every requirement list unique ids", () => {
    for (const ctx of ALL) {
      const list = ids({ ...ctx, scuml: true, newBusiness: true });
      expect(new Set(list).size, JSON.stringify(ctx)).toBe(list.length);
    }
  });
});

describe("people", () => {
  it("uses a 10% UBO threshold everywhere, including UK and Canadian companies", () => {
    for (const country of ["NG", "GB", "CA", "KE"] as CountryCode[]) {
      expect(uboThreshold(country, "company")).toBe(10);
      expect(uboThreshold(country, "mto")).toBe(10);
    }
  });

  it("asks partnerships for partners, not sole proprietors", () => {
    expect(hasStakeholders("sole_trader", "sole_proprietor")).toBe(false);
    expect(hasStakeholders("sole_trader", "partnership")).toBe(true);
    expect(uboThreshold("NG", "sole_trader", "sole_proprietor")).toBeNull();
    expect(uboThreshold("NG", "sole_trader", "partnership")).toBe(10);
  });

  it("asks Kenyan stakeholders for a KRA PIN and selfie", () => {
    const description = find({ country: "KE", entity: "company" }, "stakeholders")?.description;
    expect(description).toContain("nationality and KRA PIN");
    expect(description).toContain("ID with a selfie");
    // Date of birth comes from the ID check, so it isn't asked with their details.
    expect(description).not.toContain("date of birth");
    expect(find({ country: "NG", entity: "company" }, "stakeholders")?.description).not.toContain("date of birth");
    expect(find({ country: "GB", entity: "company" }, "stakeholders")?.description).not.toContain("KRA PIN");
  });

  it("accepts only national ID and passport in Kenya", () => {
    expect(acceptedIds("KE")).toBe("National ID card (front and back) or passport");
  });
});

describe("United Kingdom and Canada", () => {
  it("asks UK sole traders for ownership, bank statements and UTR", () => {
    expect(required({ country: "GB", entity: "sole_trader" })).toEqual(["ownership_document", "company_bank_statement", "tax_letter", "proof_of_address"]);
    expect(find({ country: "GB", entity: "sole_trader" }, "tax_letter")?.title).toBe("Proof of UTR");
  });

  it("asks Canadian sole traders for a CRA letter", () => {
    expect(find({ country: "CA", entity: "sole_trader" }, "tax_letter")?.title).toBe("Letter from the Canada Revenue Agency");
  });

  it("keeps VAT optional for companies", () => {
    expect(find({ country: "GB", entity: "company" }, "vat")?.optional).toBe(true);
    expect(find({ country: "CA", entity: "company" }, "vat")?.title).toBe("GST/HST registration");
  });

  it("asks Canadian MTOs, not UK ones, for a board resolution", () => {
    expect(ids({ country: "CA", entity: "mto" })).toEqual(expect.arrayContaining(["board_resolution", "criminal_record_checks"]));
    expect(ids({ country: "GB", entity: "mto" })).not.toContain("board_resolution");
    expect(ids({ country: "GB", entity: "mto" })).toContain("ico");
  });
});

describe("Nigeria", () => {
  it("asks business partnerships for partners instead of company documents", () => {
    const ctx: RequirementContext = { country: "NG", entity: "sole_trader", category: "partnership" };
    expect(find(ctx, "stakeholders")?.title).toBe("Partners");
    expect(ids(ctx)).not.toContain("memart");
    expect(ids(ctx)).not.toContain("shareholders");
    expect(ids(ctx)).not.toContain("proprietor_id");
  });

  it("checks the owner's ID for sole proprietors", () => {
    expect(ids({ country: "NG", entity: "sole_trader", category: "sole_proprietor" })).toContain("proprietor_id");
  });

  it("asks every company type for proof of address, source of funds and a board resolution", () => {
    for (const cat of businessCategories("NG", "company"))
      expect(required({ country: "NG", entity: "company", category: cat.id }), cat.id).toEqual(
        expect.arrayContaining(["proof_of_address", "financials", "board_resolution"])
      );
  });

  it("accepts any of the CAC forms for private, public and guarantee companies", () => {
    for (const category of ["private", "public", "guarantee"]) {
      const cac = find({ country: "NG", entity: "company", category }, "cac_documents");
      expect(cac?.accepted).toHaveLength(3);
    }
  });

  it("gives each company type its own documents", () => {
    const has = (category: string, ...docs: string[]) => expect(required({ country: "NG", entity: "company", category }), category).toEqual(expect.arrayContaining(docs));
    has("private", "cac_certificate", "memart", "tin", "licence");
    has("public", "listing");
    has("guarantee", "status_report");
    has("free_zone", "nepza_certificate", "directors_particulars", "notice_of_situation", "share_capital", "licence");
    has("trustees", "constitution", "memart", "cac_it1", "status_report", "scuml");
    has("cooperative", "cooperative_certificate", "application_form", "recognition_letter");
    has("government", "gazette", "authorisation_letter");
    has("government_approved", "government_approval", "owners_document");
  });

  it("keeps the flagged rows Compliance chose to keep", () => {
    expect(ids({ country: "NG", entity: "company", category: "trustees" })).toContain("memart");
    expect(ids({ country: "NG", entity: "company", category: "guarantee" })).toContain("status_report");
  });

  it("leaves the UBO form out for companies limited by guarantee", () => {
    expect(ids({ country: "NG", entity: "company", category: "guarantee" })).not.toContain("ubo_declaration");
    expect(ids({ country: "NG", entity: "company", category: "private" })).toContain("ubo_declaration");
  });

  it("lists SCUML once for incorporated trustees, even in a SCUML sector", () => {
    expect(ids({ country: "NG", entity: "company", category: "trustees", scuml: true }).filter((id) => id === "scuml")).toHaveLength(1);
  });

  it("asks MTOs for share certificates and a systems and controls demonstration", () => {
    const ctx: RequirementContext = { country: "NG", entity: "mto" };
    expect(required(ctx)).toEqual(expect.arrayContaining(["ownership_structure", "systems_controls", "status_report", "board_resolution"]));
    expect(find(ctx, "systems_controls")?.accepted).toEqual(["A flow document", "A demo call with our compliance team"]);
  });
});

describe("SCUML", () => {
  it("follows Compliance's sector list", () => {
    expect(isScumlCategory("Financial services", "Microfinance")).toBe(true);
    expect(isScumlCategory("Financial services", "Insurance")).toBe(true);
    expect(isScumlCategory("Professional services", "Consulting")).toBe(true);
    expect(isScumlCategory("Real estate and construction", "Construction")).toBe(true);
    expect(isScumlCategory("Hospitality and travel", "Casinos, betting and lotteries")).toBe(true);
    expect(isScumlCategory("Non-profit", "Club or association")).toBe(true);
    expect(isScumlCategory("Retail and e-commerce", "Supermarkets")).toBe(false);
    expect(isScumlCategory("Professional services", "Legal practice")).toBe(false);
    expect(isScumlCategory("Healthcare", "Pharmacy and drugs")).toBe(false);
  });

  it("is only asked in Nigeria", () => {
    expect(ids({ country: "NG", entity: "sole_trader", scuml: true })).toContain("scuml");
    expect(ids({ country: "GB", entity: "sole_trader", scuml: true })).not.toContain("scuml");
  });
});

describe("Kenya", () => {
  it("asks sole proprietors for a personal KRA PIN and keeps the flagged rows optional", () => {
    const ctx: RequirementContext = { country: "KE", entity: "sole_trader", category: "sole_proprietor" };
    expect(required(ctx)).toEqual(["certificate", "tax_certificate", "bank_statements", "proof_of_address"]);
    expect(find(ctx, "tax_certificate")?.title).toBe("Personal KRA PIN certificate");
    expect(find(ctx, "board_resolution")?.optional).toBe(true);
    expect(find(ctx, "annual_returns")?.optional).toBe(true);
  });

  it("asks partnerships for a deed, resolution and partners", () => {
    const ctx: RequirementContext = { country: "KE", entity: "sole_trader", category: "partnership" };
    expect(required(ctx)).toEqual(["certificate", "partnership_deed", "partners_resolution", "tax_certificate", "bank_statements", "proof_of_address"]);
    expect(find(ctx, "stakeholders")?.title).toBe("Partners");
  });

  it("asks limited companies for the CR12, BOF1 and annual returns", () => {
    const ctx: RequirementContext = { country: "KE", entity: "company", category: "limited" };
    expect(required(ctx)).toEqual(expect.arrayContaining(["cr12", "bof1", "annual_returns", "tax_certificate", "board_resolution"]));
    expect(find(ctx, "cr12")?.description).toContain("30 days");
    expect(find(ctx, "board_resolution")?.description).toContain("30 days");
  });

  it("asks NGOs for a constitution and trustees, without the UBO form", () => {
    const ctx: RequirementContext = { country: "KE", entity: "company", category: "ngo" };
    expect(required(ctx)).toEqual(["certificate", "constitution", "tax_certificate", "board_resolution", "proof_of_address"]);
    expect(find(ctx, "stakeholders")?.title).toBe("Trustees and officials");
    expect(ids(ctx)).not.toContain("ubo_declaration");
  });

  it("asks MTOs for the CBK licence, goAML and audited accounts", () => {
    const ctx: RequirementContext = { country: "KE", entity: "mto" };
    expect(required(ctx)).toEqual(expect.arrayContaining(["goaml", "bof1", "management_accounts", "compliance_officer_cv", "compliance_structure"]));
    expect(find(ctx, "licence")?.description).toBe("Your Central Bank of Kenya operating licence.");
    expect(find(ctx, "financials")?.description).toBe("For the last 1–2 financial years.");
  });
});

describe("registration lookup", () => {
  it("looks up Kenyan sole traders by business name and NGOs by hand", () => {
    expect(registrationTypes("KE", "sole_trader").map((t) => t.code)).toEqual(["BN"]);
    expect(registrationTypes("KE", "company", "ngo")).toEqual([]);
    expect(registrationTypes("NG", "company", "trustees").map((t) => t.code)).toEqual(["IT"]);
  });
});

describe("MTO questionnaire", () => {
  const missing = (a: Record<string, string>) => unanswered(MTO_QUESTIONNAIRE, a).map((q) => q.id);

  it("requires the website and app only when the business has them", () => {
    expect(missing({ hasWebsite: "No", hasApp: "No" })).not.toContain("website");
    expect(missing({ hasWebsite: "No", hasApp: "No" })).not.toContain("app");
    expect(missing({ hasWebsite: "Yes", hasApp: "Yes" })).toEqual(expect.arrayContaining(["website", "app"]));
  });
});

describe("automatic document checks", () => {
  it("checks the date of proof of address, and of the Kenyan CR12 and board resolution", () => {
    expect(find({ country: "GB", entity: "company" }, "proof_of_address")?.maxAgeDays).toBe(90);
    expect(find({ country: "KE", entity: "company", category: "limited" }, "cr12")?.maxAgeDays).toBe(30);
    expect(find({ country: "KE", entity: "company", category: "limited" }, "board_resolution")?.maxAgeDays).toBe(30);
    expect(find({ country: "KE", entity: "mto" }, "directors_list")?.maxAgeDays).toBe(30);
    expect(find({ country: "NG", entity: "company" }, "board_resolution")?.maxAgeDays).toBeUndefined();
  });

  it("describes the age limit in words", () => {
    expect(ageLabel(90)).toBe("3 months");
    expect(ageLabel(30)).toBe("30 days");
  });

  it("reads the NEPZA number off the free zone certificate", () => {
    expect(find({ country: "NG", entity: "company", category: "free_zone" }, "nepza_certificate")?.reads).toBe("NEPZA number");
  });

  it("accepts KRA PINs like A012345678Z", () => {
    expect(KRA_PIN_RE.test("A012345678Z")).toBe(true);
    expect(KRA_PIN_RE.test("p051234567q")).toBe(true);
    expect(KRA_PIN_RE.test("A01234567Z")).toBe(false);
    expect(KRA_PIN_RE.test("12345678901")).toBe(false);
  });
});

describe("Nov 2026 QA fixes", () => {
  it("adds ownership percentages without float drift", () => {
    expect(sumPct([5.2, 78.9, 15.9])).toBe(100);
    expect(sumPct([100, -84.1])).toBe(15.9);
  });

  it("stops sign-up for Kenyan NGOs", () => {
    expect(categoryUnsupported("KE", "company", "ngo")).toBe(true);
    expect(categoryChosen("KE", "company", "ngo")).toBe(false);
    expect(categoryChosen("KE", "company", "limited")).toBe(true);
  });

  it("asks sole proprietors, not partnerships, for their own proof of address at sign-up", () => {
    expect(needsOwnerAddress("sole_trader", "sole_proprietor")).toBe(true);
    expect(needsOwnerAddress("sole_trader", null)).toBe(true);
    expect(needsOwnerAddress("sole_trader", "partnership")).toBe(false);
    expect(needsOwnerAddress("company", null)).toBe(false);
    for (const country of ["GB", "CA", "NG", "KE"] as const) {
      const ctx = { country, entity: "sole_trader" as const, category: country === "NG" || country === "KE" ? "sole_proprietor" : null };
      expect(reqs(ctx as RequirementContext).some((r) => r.id === "proprietor_address")).toBe(true);
    }
  });
});
