import { motion } from "motion/react";
import type { ServiceConfig } from "@/lib/types";

const REGIONS = [
  { name: "Port St. Lucie", zips: ["34952", "34953", "34983", "34984", "34986", "34987"] },
  { name: "Fort Pierce", zips: ["34945", "34946", "34947", "34950", "34981", "34982"] },
  { name: "Lakewood Park", zips: ["34951"] },
  { name: "Hutchinson Island", zips: ["34949"] },
  { name: "Tradition & St. Lucie West", zips: ["34986", "34987"] },
];

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export function ServiceAreas({ config }: { config: ServiceConfig }) {
  const active = new Set(config.zips);
  const regions = REGIONS.map((r) => ({ ...r, active: r.zips.filter((z) => active.has(z)) })).filter(
    (r) => r.active.length > 0
  );
  const mapped = new Set(REGIONS.flatMap((r) => r.zips));
  const extras = config.zips.filter((z) => !mapped.has(z));

  return (
    <section className="border-t border-[#1E3328] bg-[#0E1B15]" data-testid="service-areas">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8 lg:py-28">
        <motion.p
          {...reveal}
          transition={{ duration: 0.6 }}
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400 sm:text-xs"
        >
          Route map
        </motion.p>
        <motion.h2
          {...reveal}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="mt-4 max-w-2xl font-heading text-3xl font-medium tracking-[-0.02em] text-[#F3F7F4] sm:text-4xl"
        >
          Every address in St. Lucie County — Lakewood Park included.
        </motion.h2>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {regions.map((region, i) => (
            <motion.div
              key={region.name}
              {...reveal}
              transition={{ duration: 0.6, delay: 0.05 * i }}
              data-testid={`region-card-${region.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="rounded-2xl border border-[#1E3328] bg-[#0B1510] p-6 transition-colors hover:border-emerald-500/40"
            >
              <h3 className="font-heading text-xl text-[#F3F7F4]">{region.name}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {region.active.map((zip) => (
                  <span
                    key={zip}
                    className="rounded-full border border-[#1E3328] px-3 py-1 font-mono text-xs text-emerald-300"
                  >
                    {zip}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
          {extras.length > 0 && (
            <motion.div
              {...reveal}
              transition={{ duration: 0.6, delay: 0.25 }}
              data-testid="region-card-also-serving"
              className="rounded-2xl border border-[#1E3328] bg-[#0B1510] p-6"
            >
              <h3 className="font-heading text-xl text-[#F3F7F4]">Also serving</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {extras.map((zip) => (
                  <span
                    key={zip}
                    className="rounded-full border border-[#1E3328] px-3 py-1 font-mono text-xs text-emerald-300"
                  >
                    {zip}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
