// Mirrors backend Pydantic models in server.py — keep in sync manually.
export interface ServiceConfig {
  phone: string;
  zips: string[];
  base_price: number;
  per_acre: number;
  included_acres: number;
  min_price: number;
  easement_fee: number;
  monthly_min: number;
}

export interface AddressCheckResult {
  in_area: boolean;
  matched_address: string | null;
  city: string | null;
  zip: string | null;
  county: string | null;
  acres: number | null;
  distance_miles: number | null;
  distance_fee: number | null;
  income_adjust_pct: number | null;
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
  { key: "weeks", label: "2–4 weeks", multiplier: 2 },
  { key: "month", label: "1–2 months", multiplier: 3 },
  { key: "severe", label: "2+ months", multiplier: 4 },
];

export const DEFAULT_CONFIG: ServiceConfig = {
  phone: "(772) 940-4424",
  zips: [
    "34945", "34946", "34947", "34949", "34950", "34951", "34952",
    "34953", "34981", "34982", "34983", "34984", "34986", "34987",
  ],
  base_price: 35,
  per_acre: 70,
  included_acres: 0.25,
  min_price: 35,
  easement_fee: 5,
  monthly_min: 100,
};

// One cut for the lot: base + per-acre beyond the included amount, plus the easement fee
// on small lots (under 0.25 ac). Monthly = 3 cuts, with a flat small-lot rate under 0.2 ac.
export function cutPrice(config: ServiceConfig, acres: number): number {
  const billable = Math.max(0, acres - config.included_acres);
  let cut = Math.max(config.min_price, config.base_price + config.per_acre * billable);
  if (acres < 0.25) cut += config.easement_fee;
  return Math.round(cut);
}

export function monthlyPrice(config: ServiceConfig, cut: number, acres: number): number {
  if (acres < 0.2) return config.monthly_min;
  return Math.max(config.monthly_min, cut * 3);
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
