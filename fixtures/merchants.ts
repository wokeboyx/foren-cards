import type { Merchant } from "@/domain/types";

// Test merchants. Network data is illustrative — the real confidence model is an open question (§12).
export const MERCHANTS: Merchant[] = [
  { id: "m_aws", name: "Amazon Web Services", category: "software", billingCurrency: "USD", mark: "AW", tint: "#f59e0b", network: { kind: "works" } },
  { id: "m_figma", name: "Figma", category: "software", billingCurrency: "USD", mark: "Fi", tint: "#7c3aed", network: { kind: "works" } },
  { id: "m_notion", name: "Notion", category: "software", billingCurrency: "USD", mark: "N", tint: "#383633", network: { kind: "works" } },
  { id: "m_slack", name: "Slack", category: "software", billingCurrency: "USD", mark: "Sl", tint: "#4a154b", network: { kind: "works" } },
  { id: "m_gws", name: "Google Workspace", category: "software", billingCurrency: "GBP", mark: "G", tint: "#4285f4", network: { kind: "works" } },
  { id: "m_adobe", name: "Adobe Creative Cloud", category: "software", billingCurrency: "GBP", mark: "Ad", tint: "#e1251b", network: { kind: "setup_needed", steps: ["Add the card’s billing address exactly as shown in card details.", "Expect a one-time code from your bank app at checkout."] } },
  { id: "m_linkedin", name: "LinkedIn Ads", category: "advertising", billingCurrency: "USD", mark: "in", tint: "#0a66c2", network: { kind: "likely", note: "Most cards like this one have been accepted here." } },
  { id: "m_meta", name: "Meta Ads", category: "advertising", billingCurrency: "USD", mark: "Me", tint: "#0866ff", network: { kind: "setup_needed", steps: ["Turn on international payments in Meta Ads billing settings.", "Use the card’s billing address."] } },
  { id: "m_ba", name: "British Airways", category: "travel", billingCurrency: "GBP", mark: "BA", tint: "#075aaa", network: { kind: "likely", note: "Accepted for most bookings. Some fares ask to see the booking card at check-in." } },
  { id: "m_airpeace", name: "Air Peace", category: "travel", billingCurrency: "NGN", mark: "AP", tint: "#00205b", network: { kind: "works" } },
  { id: "m_marriott", name: "Marriott Hotels", category: "travel", billingCurrency: "EUR", mark: "Ma", tint: "#8b1d41", network: { kind: "wont_work", reason: "This merchant doesn’t accept virtual cards for hotel deposits." } },
  { id: "m_uber", name: "Uber", category: "transport", billingCurrency: "NGN", mark: "U", tint: "#000000", network: { kind: "works" } },
  { id: "m_bolt", name: "Bolt", category: "transport", billingCurrency: "NGN", mark: "Bo", tint: "#34d186", network: { kind: "works" } },
  { id: "m_chowdeck", name: "Chowdeck", category: "food", billingCurrency: "NGN", mark: "Ch", tint: "#ff6b00", network: { kind: "likely", note: "Works for most local cards; occasional verification at checkout." } },
  { id: "m_jumia", name: "Jumia", category: "office", billingCurrency: "NGN", mark: "Ju", tint: "#f68b1e", network: { kind: "works" } },
  { id: "m_staples", name: "Staples", category: "office", billingCurrency: "CAD", mark: "St", tint: "#cc0000", network: { kind: "works" } },
  { id: "m_ikeja", name: "Ikeja Electric", category: "utilities", billingCurrency: "NGN", mark: "IE", tint: "#1d4ed8", network: { kind: "unknown" } },
  { id: "m_netflix", name: "Netflix", category: "entertainment", billingCurrency: "USD", mark: "Nf", tint: "#e50914", network: { kind: "works" } },
  { id: "m_bet9ja", name: "Bet9ja", category: "gambling", billingCurrency: "NGN", mark: "B9", tint: "#00a651", network: { kind: "works" } },
  { id: "m_binance", name: "Binance", category: "crypto", billingCurrency: "USD", mark: "Bn", tint: "#f0b90b", network: { kind: "wont_work", reason: "Card payments to this merchant aren’t supported." } },
  { id: "m_atm", name: "ATM withdrawal", category: "cash_atm", billingCurrency: "NGN", mark: "AT", tint: "#5e5c5a", network: { kind: "works" } },
  { id: "m_kiosk", name: "Lekki Pop-up Kiosk", category: "food", billingCurrency: "NGN", mark: "LK", tint: "#87827e", network: { kind: "unknown" } },
  { id: "m_canva", name: "Canva", category: "software", billingCurrency: "USD", mark: "Ca", tint: "#00c4cc", network: { kind: "works" } },
  { id: "m_spotify", name: "Spotify", category: "entertainment", billingCurrency: "GBP", mark: "Sp", tint: "#1db954", network: { kind: "works" } },
];

export const merchantById = (id: string) => MERCHANTS.find((m) => m.id === id);
