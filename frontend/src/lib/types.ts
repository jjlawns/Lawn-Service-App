// Mirrors backend Pydantic models in server.py — keep in sync manually.
export interface ServiceConfig {
  phone: string;
  zips: string[];
  base_price: number;
  per_acre: number;
  included_acres: number;
  min_price: number;
}

export interface AddressCheckResult {
  in_area: boolean;
  matched_address: string | null;
  city: string | null;
  zip: string | null;
  acres: number | null;
  acres_source: string | null;
  estimate_cut: number | null;
}

export type Plan = "monthly" | "onetime";
export type Overgrowth = "recent" | "weeks" | "month" | "severe";

export const PLAN_LABELS: Record<Plan, string> = {
  monthly: "Monthly Service",
  onetime: "One-Time Cleanup",
};

export const OVERGROWTH_OPTIONS: { key: Overgrowth; label: string; multiplier: number }[] = [
  { key: "recent", label: "Within 2 weeks", multiplier: 1 },
  { key: "weeks", label: "2–4 weeks", multiplier: 1.15 },
  { key: "month", label: "1–2 months", multiplier: 1.35 },
  { key: "severe", label: "2+ months", multiplier: 1.6 },
];

export const DEFAULT_CONFIG: ServiceConfig = {
  phone: "(772) 882-9420",
  zips: [
    "34945", "34946", "34947", "34948", "34949", "34950", "34951",
    "34952", "34953", "34954", "34981", "34982", "34983", "34984",
    "34985", "34986", "34987", "34988", "34990",
    "32960", "32962", "32963", "32967",
  ],
  base_price: 35,
  per_acre: 70,
  included_acres: 0.25,
  min_price: 35,
};

// One cut for the lot; monthly plan = 3 cuts/month, one-time cleanup prices higher.
export function cutPrice(config: ServiceConfig, acres: number): number {
  const billable = Math.max(0, acres - config.included_acres);
  return Math.round(Math.max(config.min_price, config.base_price + config.per_acre * billable));
}

export function monthlyPrice(cut: number): number {
  return cut * 3;
}

export function onetimePrice(cut: number): number {
  return Math.round(cut * 1.5);
}

export function overgrowthFee(cut: number, multiplier: number): number {
  return Math.round(cut * (multiplier - 1));
}

export function telHref(phone: string): string {
  return `tel:+1${phone.replace(/\D/g, "")}`;
}
