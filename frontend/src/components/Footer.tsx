import { Phone } from "lucide-react";
import { Logo } from "@/components/Logo";
import { telHref } from "@/lib/types";
import type { ServiceConfig } from "@/lib/types";

export function Footer({ config }: { config: ServiceConfig }) {
  return (
    <footer className="border-t border-[#1E3328]" data-testid="site-footer">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9 text-emerald-400" />
            <span className="font-heading text-lg font-semibold uppercase tracking-[0.22em] text-[#F3F7F4]">
              J&amp;J Lawn &amp; Landscape
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#A2B4AA]">
            Lawn &amp; landscape care for homes and businesses across St. Lucie County,
            Florida — from Lakewood Park to Hutchinson Island.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={telHref(config.phone)}
            data-testid="footer-phone-link"
            className="inline-flex w-fit items-center gap-3 rounded-full bg-emerald-500 px-6 py-3 font-semibold text-[#042F24] transition-all hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-[0_0_28px_rgba(16,185,129,0.35)]"
          >
            <Phone className="h-4 w-4" /> {config.phone}
          </a>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#5C6F64]">
            Mon–Sat · 7am–6pm · Licensed &amp; insured
          </p>
        </div>
      </div>
      <div className="border-t border-[#1E3328]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 font-mono text-[11px] uppercase tracking-[0.16em] text-[#5C6F64] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} J&amp;J Lawn &amp; Landscape</span>
          <span>Estimates calibrated from county property records</span>
        </div>
      </div>
    </footer>
  );
}
