// Mirrors backend Pydantic models in server.py — keep in sync manually.
export interface ServiceConfig {
  phone: string;
  zips: string[];
  base_price: number;
  per_acre: number;
  included_acres: number;
  min_price: number;
  frequency_multipliers: Record<string, number>;
}

export interface AddressCheckResult {
  in_area: boolean;
  matched_address: string | null;
  city: string | null;
  zip: string | null;
  acres: number | null;
  acres_source: string | null;
  estimate_weekly: number | null;
}

export type Frequency = "weekly" | "biweekly" | "onetime";

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: "Weekly Precision",
  biweekly: "Bi-Weekly Estate",
  onetime: "One-Time Cleanup",
};

export const DEFAULT_CONFIG: ServiceConfig = {
  phone: "(772) 882-9420",
  zips: [
    "34945", "34946", "34947", "34948", "34949", "34950", "34951",
    "34952", "34953", "34954", "34981", "34982", "34983", "34984",
    "34985", "34986", "34987", "34988", "34990",
    "32960", "32962", "32963", "32967",
  ],
  base_price: 49,
  per_acre: 120,
  included_acres: 0.25,
  min_price: 49,
  frequency_multipliers: { weekly: 1, biweekly: 1.2, onetime: 1.5 },
};

export function priceFor(config: ServiceConfig, acres: number, frequency: Frequency): number {
  const billable = Math.max(0, acres - config.included_acres);
  const weekly = Math.max(config.min_price, config.base_price + config.per_acre * billable);
  return Math.round(weekly * (config.frequency_multipliers[frequency] ?? 1));
}

export function telHref(phone: string): string {
  return `tel:+1${phone.replace(/\D/g, "")}`;
}
