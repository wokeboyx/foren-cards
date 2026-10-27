import type { CountryCode } from "@/domain/onboarding";
import { registryBusiness, type Business } from "@/stores/onboarding";

export const REGIONS: Record<CountryCode, { label: string; options: string[] }> = {
  NG: { label: "State", options: ["Abuja (FCT)", "Lagos", "Ogun", "Oyo", "Rivers", "Kano", "Kaduna", "Enugu", "Anambra", "Delta", "Edo", "Other"] },
  GB: { label: "Nation", options: ["England", "Scotland", "Wales", "Northern Ireland"] },
  CA: {
    label: "Province or territory",
    options: [
      "Alberta",
      "British Columbia",
      "Manitoba",
      "New Brunswick",
      "Newfoundland and Labrador",
      "Nova Scotia",
      "Ontario",
      "Prince Edward Island",
      "Quebec",
      "Saskatchewan",
      "Northwest Territories",
      "Nunavut",
      "Yukon",
    ],
  },
  KE: { label: "County", options: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Kiambu", "Uasin Gishu", "Other"] },
};

export const POSTCODE_LABEL: Record<CountryCode, string> = { NG: "Postal code", GB: "Postcode", CA: "Postal code", KE: "Postal code" };

export type RegType = { code: string; label: string; hint: string };

export type Manual = { name: string; incorporatedOn: string; streetNo: string; street: string; city: string; region: string; area: string; postcode: string };
export const EMPTY_MANUAL: Manual = { name: "", incorporatedOn: "", streetNo: "", street: "", city: "", region: "", area: "", postcode: "" };

export function sampleMatches(country: CountryCode, q: string): Business[] {
  const base = registryBusiness(country, undefined, /^\d+$/.test(q.trim()) ? q.trim() : country === "GB" ? "12345678" : "1234567-8");
  const first = { ...base, name: /^\d+$/.test(q.trim()) ? base.name : titleCase(q.trim()) + (country === "GB" ? " Ltd" : " Inc.") };
  return [
    first,
    {
      ...base,
      name: `${first.name.replace(/ (Ltd|Inc\.)$/, "")} Holdings ${country === "GB" ? "Ltd" : "Inc."}`,
      regNumber: country === "GB" ? "09876543" : "7654321-0",
      incorporatedOn: "2016-07-04",
    },
    {
      ...base,
      name: `${first.name.replace(/ (Ltd|Inc\.)$/, "")} Trading ${country === "GB" ? "Ltd" : "Inc."}`,
      regNumber: country === "GB" ? "11223344" : "1122334-5",
      incorporatedOn: "2022-01-18",
      companyType: country === "GB" ? "Private Limited Company" : "Provincial corporation",
    },
  ];
}

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

export function toBusiness(m: Manual, regType: string, regNumber: string): Business {
  const address = [[m.streetNo, m.street].filter(Boolean).join(" "), m.area, m.city, m.region, m.postcode].filter(Boolean).join(", ");
  return {
    name: m.name.trim(),
    regType: regType || undefined,
    regNumber: regNumber.trim(),
    incorporatedOn: m.incorporatedOn,
    companyType: "Entered manually",
    address,
    source: "manual",
  };
}

export function fromBusiness(b: Business): Manual {
  return { ...EMPTY_MANUAL, name: b.name, incorporatedOn: b.incorporatedOn, street: b.address };
}
