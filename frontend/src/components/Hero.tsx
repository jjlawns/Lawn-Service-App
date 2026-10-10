import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { AddressChecker } from "@/components/AddressChecker";
import { cutPrice } from "@/lib/types";
import type { ServiceConfig } from "@/lib/types";

const HERO_IMG =
  "https://images.unsplash.com/photo-1764969370921-7c8df49171cd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwzfHxsdXNoJTIwZ3JlZW4lMjBsYXduJTIwbW93ZWQlMjBlc3RhdGV8ZW58MHx8fHwxNzkxNjMzODE5fDA&ixlib=rb-4.1.0&q=85";

const HEADLINE_LINES = ["Precision turf care", "for coastal Florida grounds."];

export function Hero({ config }: { config: ServiceConfig }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);

  const tiers = [
    { label: "Quarter acre", acres: 0.25 },
    { label: "Half acre", acres: 0.5 },
    { label: "Full acre", acres: 1 },
  ];

  return (
    <section ref={ref} id="top" className="relative overflow-hidden" data-testid="hero-section">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#34D399 1px, transparent 1px), linear-gradient(90deg, #34D399 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl grid-cols-12 gap-10 px-4 pb-20 pt-16 sm:px-8 lg:gap-12 lg:pb-28 lg:pt-24">
        <div className="col-span-12 flex flex-col justify-center lg:col-span-7">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400 sm:text-xs"
            data-testid="hero-overline"
          >
            Estate turf &amp; lawn management / St. Lucie County, Florida
          </motion.p>

          <h1
            className="font-heading text-4xl font-medium leading-[1.05] tracking-[-0.025em] text-[#F3F7F4] sm:text-5xl lg:text-6xl"
            data-testid="hero-headline"
          >
            {HEADLINE_LINES.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-1">
                <motion.span
                  className="block"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.15 + i * 0.14, ease: [0.22, 1, 0.36, 1] }}
                >
                  {i === 1 ? (
                    <>
                      for coastal <em className="not-italic text-emerald-400">Florida grounds.</em>
                    </>
                  ) : (
                    line
                  )}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-[#A2B4AA] md:text-lg"
            data-testid="hero-subtitle"
          >
            Type your address. We verify it against our St. Lucie County routes, pull your
            lot size from county property records, and price your cut — in about five
            seconds. Residential and commercial.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="mt-10"
          >
            <AddressChecker config={config} />
          </motion.div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="relative overflow-hidden rounded-2xl border border-[#1E3328] shadow-[0_32px_80px_-24px_rgba(0,0,0,0.7)]"
            data-testid="hero-rate-card"
          >
            <motion.div style={{ y: imgY }} className="absolute inset-0 -top-16 h-[130%]">
              <img
                src={HERO_IMG}
                alt="Freshly striped estate lawn under Florida sun"
                className="h-full w-full object-cover"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#08100C] via-[#08100C]/72 to-[#08100C]/20" />

            <div className="relative flex min-h-[480px] flex-col justify-end gap-6 p-7 sm:p-9">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400">
                  Live rate card
                </p>
                <p className="mt-2 font-heading text-2xl text-[#F3F7F4]">
                  Acreage-calibrated, per visit
                </p>
              </div>
              <ul className="divide-y divide-[#1E3328]/80" data-testid="hero-tier-list">
                {tiers.map((t) => (
                  <li key={t.label} className="flex items-baseline justify-between py-3">
                    <span className="text-sm text-[#A2B4AA]">{t.label}</span>
                    <span className="font-heading text-xl text-[#F3F7F4]">
                      ${cutPrice(config, t.acres)}
                      <span className="ml-1 font-sans text-xs text-[#A2B4AA]">/cut</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#A2B4AA]">
                Serving St. Lucie County · month-to-month, no lock-in
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
