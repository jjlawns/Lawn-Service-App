import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { apiPut } from "@/lib/api";
import type { ServiceConfig } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ConfigDrawer({ config }: { config: ServiceConfig }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(config.phone);
  const [zips, setZips] = useState(config.zips.join(", "));
  const [basePrice, setBasePrice] = useState(String(config.base_price));
  const [perAcre, setPerAcre] = useState(String(config.per_acre));
  const [minPrice, setMinPrice] = useState(String(config.min_price));
  const [includedAcres, setIncludedAcres] = useState(String(config.included_acres));
  const [easementFee, setEasementFee] = useState(String(config.easement_fee));
  const [monthlyMin, setMonthlyMin] = useState(String(config.monthly_min));
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setPhone(config.phone);
      setZips(config.zips.join(", "));
      setBasePrice(String(config.base_price));
      setPerAcre(String(config.per_acre));
      setMinPrice(String(config.min_price));
      setIncludedAcres(String(config.included_acres));
      setEasementFee(String(config.easement_fee));
      setMonthlyMin(String(config.monthly_min));
    }
  }, [open, config]);

  const mutation = useMutation({
    mutationFn: () =>
      apiPut<ServiceConfig>("/config", {
        phone: phone.trim(),
        zips: zips.split(/[^0-9]+/).filter((z) => z.length === 5),
        base_price: Number(basePrice),
        per_acre: Number(perAcre),
        min_price: Number(minPrice),
        included_acres: Number(includedAcres),
        easement_fee: Number(easementFee),
        monthly_min: Number(monthlyMin),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
      toast.success("Rates and service zips updated.");
      setOpen(false);
    },
    onError: () => toast.error("Could not save settings — check the values and try again."),
  });

  const valid =
    phone.trim().length >= 7 &&
    zips.split(/[^0-9]+/).some((z) => z.length === 5) &&
    Number(basePrice) > 0 &&
    Number(perAcre) >= 0 &&
    Number(minPrice) > 0 &&
    Number(includedAcres) >= 0 &&
    Number(easementFee) >= 0 &&
    Number(monthlyMin) > 0;

  return (
    <>
      <button
        data-testid="config-open-btn"
        onClick={() => setOpen(true)}
        aria-label="Owner settings"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1E3328] text-[#A2B4AA] transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
      >
        <Settings className="h-4 w-4" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          data-testid="config-drawer"
          className="w-full overflow-y-auto border-[#1E3328] bg-[#0B1510] text-[#F3F7F4] sm:max-w-md"
        >
          <SheetHeader>
            <SheetTitle className="font-heading text-2xl">Owner settings</SheetTitle>
            <SheetDescription className="text-[#A2B4AA]">
              Adjust your service zips and pricing. Changes apply instantly to every new estimate.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="cfg-phone" className="text-[#A2B4AA]">Business phone</Label>
              <Input
                id="cfg-phone"
                data-testid="config-phone-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border-[#1E3328] bg-[#122019] text-[#F3F7F4]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cfg-zips" className="text-[#A2B4AA]">
                Service zip codes <span className="text-[#5C6F64]">(comma or space separated)</span>
              </Label>
              <Textarea
                id="cfg-zips"
                data-testid="config-zips-input"
                value={zips}
                onChange={(e) => setZips(e.target.value)}
                rows={4}
                className="border-[#1E3328] bg-[#122019] font-mono text-sm text-[#F3F7F4]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cfg-base" className="text-[#A2B4AA]">Base price ($)</Label>
                <Input
                  id="cfg-base"
                  data-testid="config-base-price-input"
                  type="number"
                  min={1}
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="border-[#1E3328] bg-[#122019] text-[#F3F7F4]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cfg-per-acre" className="text-[#A2B4AA]">Per extra acre ($)</Label>
                <Input
                  id="cfg-per-acre"
                  data-testid="config-per-acre-input"
                  type="number"
                  min={0}
                  value={perAcre}
                  onChange={(e) => setPerAcre(e.target.value)}
                  className="border-[#1E3328] bg-[#122019] text-[#F3F7F4]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cfg-min" className="text-[#A2B4AA]">Minimum price ($)</Label>
                <Input
                  id="cfg-min"
                  data-testid="config-min-price-input"
                  type="number"
                  min={1}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="border-[#1E3328] bg-[#122019] text-[#F3F7F4]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cfg-included" className="text-[#A2B4AA]">Acres in base price</Label>
                <Input
                  id="cfg-included"
                  data-testid="config-included-acres-input"
                  type="number"
                  min={0}
                  step={0.05}
                  value={includedAcres}
                  onChange={(e) => setIncludedAcres(e.target.value)}
                  className="border-[#1E3328] bg-[#122019] text-[#F3F7F4]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cfg-easement" className="text-[#A2B4AA]">
                  Easement fee, under 1 ac ($)
                </Label>
                <Input
                  id="cfg-easement"
                  data-testid="config-easement-fee-input"
                  type="number"
                  min={0}
                  value={easementFee}
                  onChange={(e) => setEasementFee(e.target.value)}
                  className="border-[#1E3328] bg-[#122019] text-[#F3F7F4]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cfg-monthly-min" className="text-[#A2B4AA]">
                  Monthly minimum ($)
                </Label>
                <Input
                  id="cfg-monthly-min"
                  data-testid="config-monthly-min-input"
                  type="number"
                  min={1}
                  value={monthlyMin}
                  onChange={(e) => setMonthlyMin(e.target.value)}
                  className="border-[#1E3328] bg-[#122019] text-[#F3F7F4]"
                />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-[#5C6F64]">
              Cut price = max(minimum, base + per-acre × acres beyond the included amount),
              plus the easement fee on lots under 0.25 acre. Monthly service bills 3 cuts
              per month; lots under 0.2 acre pay the flat monthly minimum. One-time
              cleanups price at 1.5× a cut. Overgrown first cuts bill 2–4× a cut
              depending on time since last mow.
            </p>
            <Button
              data-testid="config-save-btn"
              onClick={() => mutation.mutate()}
              disabled={!valid || mutation.isPending}
              className="mt-2 rounded-full bg-emerald-500 font-semibold text-[#042F24] transition-all hover:bg-emerald-400 active:scale-[0.98]"
            >
              {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save settings"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
