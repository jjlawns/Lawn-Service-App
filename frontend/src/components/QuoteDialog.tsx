import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { OVERGROWTH_OPTIONS, PLAN_LABELS, telHref } from "@/lib/types";
import type { Overgrowth, Plan } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface QuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  zip: string | null;
  acres: number;
  plan: Plan;
  overgrowth: Overgrowth;
  growthFee: number;
  estimate: number;
  phone: string;
}

interface QuoteResponse {
  id: string;
}

export function QuoteDialog({
  open,
  onOpenChange,
  address,
  zip,
  acres,
  plan,
  overgrowth,
  growthFee,
  estimate,
  phone,
}: QuoteDialogProps) {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [propertyAddress, setPropertyAddress] = useState(address);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) setPropertyAddress(address);
  }, [open, address]);

  const mutation = useMutation({
    mutationFn: () =>
      apiPost<QuoteResponse>("/quotes", {
        name,
        phone: phoneNumber,
        email,
        address: propertyAddress,
        zip,
        acres,
        plan,
        overgrowth,
        estimate,
        notes,
      }),
    onSuccess: () => {
      toast.success("Quote request received — we'll call you back within one business day.");
      onOpenChange(false);
      setName("");
      setPhoneNumber("");
      setEmail("");
      setNotes("");
    },
    onError: () =>
      toast.error("Something went wrong sending your request. Please call us instead."),
  });

  const canSubmit =
    name.trim().length > 0 &&
    phoneNumber.replace(/\D/g, "").length >= 7 &&
    email.includes("@") &&
    propertyAddress.trim().length >= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="quote-dialog"
        className="max-h-[90vh] overflow-y-auto border-[#1E3328] bg-[#122019] text-[#F3F7F4] sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Request your quote</DialogTitle>
          <DialogDescription className="text-[#A2B4AA]">
            {PLAN_LABELS[plan]} · {acres.toFixed(2)} ac · estimated{" "}
            <span className="font-semibold text-emerald-400">
              ${estimate}
              {plan === "monthly" ? (growthFee > 0 ? " first month" : "/month") : " total"}
            </span>
            {growthFee > 0 &&
              ` · includes a $${growthFee} overgrowth fee (${
                OVERGROWTH_OPTIONS.find((o) => o.key === overgrowth)?.label ?? ""
              } since last mow)`}
            . We confirm every quote with a quick walkthrough.
          </DialogDescription>
        </DialogHeader>

        <form
          className="mt-2 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit && !mutation.isPending) mutation.mutate();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="quote-name" className="text-[#A2B4AA]">Full name</Label>
            <Input
              id="quote-name"
              data-testid="quote-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Rivera"
              className="border-[#1E3328] bg-[#0B1510] text-[#F3F7F4] placeholder:text-[#5C6F64]"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="quote-phone" className="text-[#A2B4AA]">Phone</Label>
              <Input
                id="quote-phone"
                data-testid="quote-phone-input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(772) 555-0100"
                className="border-[#1E3328] bg-[#0B1510] text-[#F3F7F4] placeholder:text-[#5C6F64]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quote-email" className="text-[#A2B4AA]">Email</Label>
              <Input
                id="quote-email"
                type="email"
                data-testid="quote-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="border-[#1E3328] bg-[#0B1510] text-[#F3F7F4] placeholder:text-[#5C6F64]"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quote-address" className="text-[#A2B4AA]">Property address</Label>
            <Input
              id="quote-address"
              data-testid="quote-address-input"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              className="border-[#1E3328] bg-[#0B1510] text-[#F3F7F4]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quote-notes" className="text-[#A2B4AA]">
              Notes <span className="text-[#5C6F64]">(gates, pets, preferred day — optional)</span>
            </Label>
            <Textarea
              id="quote-notes"
              data-testid="quote-notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="border-[#1E3328] bg-[#0B1510] text-[#F3F7F4] placeholder:text-[#5C6F64]"
            />
          </div>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={telHref(phone)}
              data-testid="quote-call-link"
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300 hover:text-emerald-200"
            >
              <Phone className="h-4 w-4" /> Prefer to talk? {phone}
            </a>
            <Button
              type="submit"
              data-testid="quote-submit-btn"
              disabled={!canSubmit || mutation.isPending}
              className="rounded-full bg-emerald-500 px-6 font-semibold text-[#042F24] transition-all hover:bg-emerald-400 active:scale-[0.98]"
            >
              {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
