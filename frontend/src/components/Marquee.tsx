const ITEMS = [
  "Port St. Lucie [34952 / 34953 / 34983 / 34984 / 34986 / 34987]",
  "Fort Pierce [34945 / 34946 / 34947 / 34950 / 34982]",
  "St. Lucie West & Tradition [34986 / 34987]",
  "Lakewood Park [34951]",
  "Hutchinson Island Coastal [34949]",
  "Residential & commercial routes",
  "Mow · Weed Eat · Edge · Blow-Off · Weed Control",
  "Bermuda & St. Augustine specialists",
];

export function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div
      data-testid="editorial-marquee"
      className="overflow-hidden border-y border-[#1E3328] bg-[#0E1B15] py-5"
      aria-hidden="true"
    >
      <div className="animate-marquee flex w-max items-center">
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center font-mono text-xs uppercase tracking-[0.2em] text-[#A2B4AA]"
          >
            <span className="px-6">{item}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
          </span>
        ))}
      </div>
    </div>
  );
}
