import { Phone } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ConfigDrawer } from "@/components/ConfigDrawer";
import { Button } from "@/components/ui/button";
import { telHref } from "@/lib/types";
import type { ServiceConfig } from "@/lib/types";

export function Navbar({ config }: { config: ServiceConfig }) {
  return (
    <header
      data-testid="site-header"
      className="sticky top-0 z-50 backdrop-blur-xl bg-[#0B1510]/80 border-b border-[#1E3328]/80"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <a href="#top" className="flex items-center gap-3" data-testid="brand-link">
          <Logo className="h-8 w-8 text-emerald-400" />
          <span className="font-heading text-sm font-semibold uppercase tracking-[0.22em] text-[#F3F7F4] sm:text-base">
            J&amp;J Lawn &amp; Landscape
          </span>
        </a>

        <div className="hidden items-center gap-2 rounded-full border border-[#1E3328] bg-[#122019] px-3 py-1.5 lg:flex" data-testid="service-status-pill">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#A2B4AA]">
            St. Lucie County — Service Active
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={telHref(config.phone)}
            data-testid="nav-phone-link"
            className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#F3F7F4] transition-colors hover:text-emerald-300 md:flex"
          >
            <Phone className="h-4 w-4 text-emerald-400" />
            {config.phone}
          </a>
          <Button
            data-testid="nav-estimate-btn"
            className="rounded-full bg-emerald-500 px-5 font-semibold text-[#042F24] transition-all hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-[0_0_24px_rgba(16,185,129,0.35)] active:scale-[0.98]"
            onClick={() => document.getElementById("checker")?.scrollIntoView({ behavior: "smooth" })}
          >
            Estimate Yard
          </Button>
          <ConfigDrawer config={config} />
        </div>
      </div>
    </header>
  );
}
