import { useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  CircleCheck,
  CircleX,
  Loader2,
  MapPin,
  Phone,
  Ruler,
} from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import {
  cutPrice,
  monthlyPrice,
  onetimePrice,
  overgrowthFee,
  OVERGROWTH_OPTIONS,
  PLAN_LABELS,
  telHref,
} from "@/lib/types";
import type { AddressCheckResult, Overgrowth, Plan, ServiceConfig } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuoteDialog } from "@/components/QuoteDialog";

const PLANS: Plan[] = ["monthly", "onetime"];
const MIN_ACRES = 0.1;
const MAX_ACRES = 5;

export function AddressChecker({ config }: { config: ServiceConfig }) {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<AddressCheckResult | null>(null);
  const [acres, setAcres] = useState(0.25);
  const [plan, setPlan] = useState<Plan>("monthly");
  const [overgrowth, setOvergrowth] = useState<Overgrowth>("recent");
  const [quoteOpen, setQuoteOpen] = useState(false);

  const checkMutation = useMutation({
    mutationFn: (a: string) => apiPost<AddressCheckResult>("/check-address", { address: a }),
    onSuccess: (r) => {
      setResult(r);
      if (r.acres) setAcres(Math.min(MAX_ACRES, Math.max(MIN_ACRES, r.acres)));
    },
    onError: () =>
      toast.error("We couldn't verify that address right now — please try again or call us."),
  });

  const submit = () => {
    const a = address.trim();
    if (a.length < 3 || checkMutation.isPending) return;
    checkMutation.mutate(a);
  };

  const cut = cutPrice(config, acres);
  const growthMult = OVERGROWTH_OPTIONS.find((o) => o.key === overgrowth)?.multiplier ?? 1;
  const growthFee = overgrowthFee(cut, growthMult);
  const monthly = monthlyPrice(config, cut, acres);
  const price = plan === "monthly" ? monthly + growthFee : onetimePrice(cut) + growthFee;
  const fillPct = ((acres - MIN_ACRES) / (MAX_ACRES - MIN_ACRES)) * 100;

  return (
    <div id="checker" data-testid="address-checker" className="w-full max-w-2xl scroll-mt-28">
      <div className="rounded-2xl border border-[#1E3328] bg-[#122019]/90 p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)] backdrop-blur-sm sm:p-5">
        <label
          htmlFor="address-input"
          className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#A2B4AA]"
        >
          <MapPin className="h-3.5 w-3.5 text-emerald-400" />
          Your property address or zip code
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="address-input"
            data-testid="address-input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. 121 SW Port St Lucie Blvd, Port St Lucie"
            className="h-12 flex-1 rounded-xl border-[#1E3328] bg-[#0B1510] px-4 text-base text-[#F3F7F4] placeholder:text-[#5C6F64] focus-visible:ring-emerald-400"
          />
          <Button
            data-testid="check-address-btn"
            onClick={submit}
            disabled={checkMutation.isPending || address.trim().length < 3}
            className="h-12 rounded-xl bg-emerald-500 px-6 font-semibold text-[#042F24] transition-all hover:bg-emerald-400 hover:shadow-[0_0_24px_rgba(16,185,129,0.35)] active:scale-[0.98]"
          >
            {checkMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Check &amp; Price <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        <div aria-live="polite">
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={`${result.zip}-${result.in_area}`}
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="mt-5 rounded-xl border border-[#1E3328] bg-[#0B1510] p-5"
                data-testid="result-card"
              >
                {result.in_area ? (
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        data-testid="service-badge"
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#064E3B] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#D1FAE5]"
                      >
                        <CircleCheck className="h-3.5 w-3.5" /> In our service area
                      </span>
                      {result.zip && (
                        <span className="font-mono text-xs text-[#A2B4AA]" data-testid="result-zip">
                          {result.city ? `${result.city} · ` : ""}
                          {result.zip}
                        </span>
                      )}
                    </div>
                    {result.matched_address && (
                      <p className="text-sm text-[#A2B4AA]" data-testid="matched-address">
                        Matched to: <span className="text-[#F3F7F4]">{result.matched_address}</span>
                      </p>
                    )}

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-[#A2B4AA]">
                          <Ruler className="h-4 w-4 text-emerald-400" />
                          Lot size
                          {result.acres_source === "county" && (
                            <span className="rounded-full border border-[#1E3328] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-300">
                              county property records
                            </span>
                          )}
                        </span>
                        <span className="font-heading text-lg text-[#F3F7F4]" data-testid="acres-value">
                          {acres.toFixed(2)} ac
                        </span>
                      </div>
                      <input
                        type="range"
                        min={MIN_ACRES}
                        max={MAX_ACRES}
                        step={0.05}
                        value={acres}
                        onChange={(e) => setAcres(Number(e.target.value))}
                        className="acre-slider"
                        style={{ "--fill": `${fillPct}%` } as CSSProperties}
                        aria-label="Adjust lot size in acres"
                        data-testid="acreage-slider"
                      />
                      <p className="mt-1 text-xs text-[#5C6F64]">
                        {result.acres
                          ? "Pulled from county records — drag to adjust if your yard differs."
                          : "County record unavailable for this address — drag to match your lot."}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#A2B4AA]">
                        Service plan
                      </p>
                      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Service plan">
                        {PLANS.map((p) => (
                          <button
                            key={p}
                            role="tab"
                            aria-selected={plan === p}
                            data-testid={`plan-tab-${p}`}
                            onClick={() => setPlan(p)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                              plan === p
                                ? "bg-emerald-500 text-[#042F24]"
                                : "border border-[#1E3328] text-[#A2B4AA] hover:border-emerald-500/50 hover:text-[#F3F7F4]"
                            }`}
                          >
                            {PLAN_LABELS[p]}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-[#5C6F64]">
                        {plan === "monthly"
                          ? "Every 10 days in summer · every 14 in winter · month-to-month, cancel anytime"
                          : "A single full-property cleanup pass — no ongoing commitment"}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#A2B4AA]">
                        How long since it was last mowed?
                      </p>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Time since last mow">
                        {OVERGROWTH_OPTIONS.map((o) => (
                          <button
                            key={o.key}
                            role="radio"
                            aria-checked={overgrowth === o.key}
                            data-testid={`overgrowth-${o.key}`}
                            onClick={() => setOvergrowth(o.key)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                              overgrowth === o.key
                                ? "bg-[#EAB308] text-[#422006]"
                                : "border border-[#1E3328] text-[#A2B4AA] hover:border-amber-400/50 hover:text-[#F3F7F4]"
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl bg-[#122019] p-5">
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#A2B4AA]">
                          {plan === "monthly"
                            ? growthFee > 0
                              ? "Estimated first month"
                              : "Estimated per month"
                            : "One-time total"}
                        </p>
                        <p className="mt-1 overflow-hidden font-heading text-5xl text-emerald-400">
                          <motion.span
                            key={price}
                            initial={{ y: 22, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            className="inline-block"
                            data-testid="estimate-price"
                          >
                            ${price}
                          </motion.span>
                        </p>
                        <p className="mt-1 text-xs text-[#5C6F64]">
                          {plan === "monthly"
                            ? acres < 0.2
                              ? "Small-lot monthly rate · final quote confirmed on walkthrough"
                              : `≈3 cuts/month at $${cut}/cut${
                                  growthFee > 0 ? ` · then $${monthly}/mo after` : ""
                                } · final quote confirmed on walkthrough`
                            : "Full cleanup pass · final quote confirmed on walkthrough"}
                        </p>
                        {growthFee > 0 && (
                          <p className="mt-1 text-xs text-amber-400" data-testid="overgrowth-fee-note">
                            Includes a ${growthFee} overgrowth recovery fee on the first cut
                          </p>
                        )}
                      </div>
                      <Button
                        data-testid="request-quote-btn"
                        onClick={() => setQuoteOpen(true)}
                        className="rounded-full bg-[#F5F3EC] px-6 font-semibold text-[#0D1B13] transition-all hover:-translate-y-0.5 hover:bg-white active:scale-[0.98]"
                      >
                        Request this quote
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4" data-testid="out-of-area-panel">
                    <span
                      data-testid="service-badge"
                      className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#7F1D1D] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#FEE2E2]"
                    >
                      <CircleX className="h-3.5 w-3.5" /> Outside our service area
                    </span>
                    <p className="text-sm leading-relaxed text-[#A2B4AA]">
                      {result.zip
                        ? `${result.zip} isn't on our current route map. We cover St. Lucie County only, including Lakewood Park — and we're expanding.`
                        : "We couldn't place that address on our route map. We cover St. Lucie County only, including Lakewood Park."}{" "}
                      Call us and we'll tell you honestly whether we can make it work.
                    </p>
                    <a
                      href={telHref(config.phone)}
                      data-testid="out-of-area-call-btn"
                      className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/40 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/10"
                    >
                      <Phone className="h-4 w-4" /> Call {config.phone}
                    </a>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <QuoteDialog
        open={quoteOpen}
        onOpenChange={setQuoteOpen}
        address={result?.matched_address ?? address}
        zip={result?.zip ?? null}
        acres={acres}
        plan={plan}
        overgrowth={overgrowth}
        growthFee={growthFee}
        estimate={price}
        phone={config.phone}
      />
    </div>
  );
}
