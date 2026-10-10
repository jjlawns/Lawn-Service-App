import { motion } from "motion/react";

const MOWING_IMG =
  "https://images.unsplash.com/photo-1501520158826-76df880863a3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHw0fHxsYXduJTIwbW93ZXIlMjBwcmVjaXNpb24lMjBsYW5kc2NhcGluZyUyMHR1cmZ8ZW58MHx8fHwxNzkxNjMzODE5fDA&ixlib=rb-4.1.0&q=85";
const COASTAL_IMG =
  "https://images.unsplash.com/photo-1775161795266-39996ca6220d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwzfHxmbG9yaWRhJTIwcGFsbSUyMHJlc2lkZW50aWFsJTIwZ2FyZGVuJTIwc3VubGlnaHR8ZW58MHx8fHwxNzkxNjMzODE5fDA&ixlib=rb-4.1.0&q=85";

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export function FeatureBento() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8 lg:py-28" data-testid="feature-bento">
      <motion.p
        {...reveal}
        transition={{ duration: 0.6 }}
        className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400 sm:text-xs"
      >
        The standard, every visit
      </motion.p>
      <motion.h2
        {...reveal}
        transition={{ duration: 0.6, delay: 0.08 }}
        className="mt-4 max-w-2xl font-heading text-3xl font-medium tracking-[-0.02em] text-[#F3F7F4] sm:text-4xl"
      >
        Groundskeeping treated like architecture.
      </motion.h2>

      <div className="mt-12 grid grid-cols-12 gap-4 sm:gap-6">
        <motion.article
          {...reveal}
          transition={{ duration: 0.65, delay: 0.05 }}
          data-testid="bento-card-precision"
          className="group relative col-span-12 flex min-h-[280px] flex-col justify-end overflow-hidden rounded-2xl border border-[#1E3328] md:col-span-8"
        >
          <img
            src={MOWING_IMG}
            alt="Precision turf striping from above"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08100C] via-[#08100C]/55 to-transparent" />
          <div className="relative p-7 sm:p-9">
            <h3 className="font-heading text-2xl text-[#F3F7F4]">Razor-edge rotary precision</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[#A2B4AA]">
              Blades sharpened before every route. Clean 45-degree striping calibrated for
              Floratam and Bermuda turf.
            </p>
          </div>
        </motion.article>

        <motion.article
          {...reveal}
          transition={{ duration: 0.65, delay: 0.12 }}
          data-testid="bento-card-soil"
          className="col-span-12 flex min-h-[280px] flex-col justify-end rounded-2xl border border-[#1E3328] bg-[#122019] p-7 transition-colors hover:border-emerald-500/40 sm:p-9 md:col-span-4"
        >
          <span className="mb-auto font-mono text-4xl text-emerald-500/30">02</span>
          <h3 className="font-heading text-2xl text-[#F3F7F4]">Coastal soil &amp; salinity defence</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#A2B4AA]">
            Nutrient cycles tuned to St. Lucie sandy loam, salt air, and summer humidity.
          </p>
        </motion.article>

        <motion.article
          {...reveal}
          transition={{ duration: 0.65, delay: 0.05 }}
          data-testid="bento-card-trim"
          className="col-span-12 flex min-h-[280px] flex-col justify-end rounded-2xl border border-[#1E3328] bg-[#122019] p-7 transition-colors hover:border-emerald-500/40 sm:p-9 md:col-span-4"
        >
          <span className="mb-auto font-mono text-4xl text-emerald-500/30">03</span>
          <h3 className="font-heading text-2xl text-[#F3F7F4]">The standard visit, done right</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#A2B4AA]">
            Mow, weed eat, crisp edging, full blow-off, and weed control — every visit, every
            property, no upcharges.
          </p>
        </motion.article>

        <motion.article
          {...reveal}
          transition={{ duration: 0.65, delay: 0.12 }}
          data-testid="bento-card-schedule"
          className="group relative col-span-12 flex min-h-[280px] flex-col justify-end overflow-hidden rounded-2xl border border-[#1E3328] md:col-span-8"
        >
          <img
            src={COASTAL_IMG}
            alt="Florida sunlight through coastal palms"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08100C] via-[#08100C]/55 to-transparent" />
          <div className="relative p-7 sm:p-9">
            <h3 className="font-heading text-2xl text-[#F3F7F4]">Flexible service schedules</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[#A2B4AA]">
              Ramp up for rainy-season growth spurts, ease off in winter. No rigid contracts,
              ever.
            </p>
          </div>
        </motion.article>
      </div>
    </section>
  );
}
