# J&J Lawn & Landscape — PRD

## Original problem statement
"An app that customers can search their address in St Lucie County and tell them if they're in our service area and also give them an estimated price for their lawn service."
User choices: zip-code-list service area (St. Lucie County + northernmost Vero Beach, sample data), price based on property acreage from county property records, quote request form + visible phone number after the estimate, sample prices editable later.

## User personas
- Homeowner in St. Lucie County / North Vero Beach checking if their address is serviced and what a mow costs
- Business owner who needs to adjust service zips, rates, and phone number without a developer

## Architecture
- FastAPI + MongoDB backend (`backend/server.py`), React 19 + Vite + Tailwind v4 frontend
- Service area (2026-10-10, owner-corrected): St. Lucie County ONLY, incl. Lakewood Park. 14 zips: 34945, 34946, 34947, 34949, 34950, 34951, 34952, 34953, 34981, 34982, 34983, 34984, 34986, 34987. All Vero Beach / Indian River County excluded. In-area rule: verified county = St. Lucie wins; zip list only decides when county is unknown (protects cross-boundary zips)
- Acreage: Florida Dept. of Revenue statewide parcel service (ArcGIS FeatureServer, county property-appraiser tax-roll data) — nearest parcel centroid to geocoded point, `LND_SQFOOT / 43560`
- Results cached in `properties` collection (address_key); service config in `config` collection; leads in `quotes`
- Design: obsidian-forest (#0B1510) + emerald (#10B981), Lora/DM Sans/IBM Plex Mono, motion/react reveals, lenis smooth scroll

## Core endpoints
- GET/PUT /api/config — service zips, phone, pricing (no auth — owner drawer is open by design for the demo)
- POST /api/check-address — geocode + zip check + county acreage + weekly estimate
- POST /api/quotes — quote-request lead capture

## Implemented (2026-10-10)
- Quote alerts: owner gets an email (Emergent-managed Resend) on every new quote request → Keri@jjlawnandlandscape.com, reply-to set to the customer; fire-and-forget so mail failure never loses a lead
- Lead dashboard at /admin: password-only owner login (JWT httpOnly cookie, 7-day session, 5-attempt/15-min lockout), leads list with status tracking (new/contacted/won/lost), click-to-call/mail links
- Corner-lot question in the checker: doubles the scaled easement charge for the second street-facing easement; shown in estimate, quote, and dashboard
- SEO: full static head (title/description/OG/Twitter/robots/theme-color), LocalBusiness JSON-LD (phone confirmed; no address/hours/ratings — unconfirmed, per policy), noscript fallback, robots.txt + llms.txt (real files, text/plain). PENDING: canonical/og:url/og:image/sitemap need the real production domain; footer copy claims "Mon–Sat 7am–6pm · Licensed & insured" — UNCONFIRMED, owner to verify
- Auth: ADMIN_PASSWORD + JWT_SECRET in backend/.env; routers/admin.py; lib/auth.py; lib/emailer.py
- Kinetic split hero with masked line reveal, parallax live rate card, editorial marquee, bento grid, route-map zip chips, footer with click-to-call
- Address checker: full address or zip-only; city optional (auto-retries with "St. Lucie County, FL" context); in/out-of-area badge; county acreage with slider override
- Pricing (owner-corrected 2026-10-10): cut = max($35, $35 + $70/acre beyond 0.25 ac) + easement that scales with lot size: $5 × max(1, 1 + acres − 0.25) → $5 at ≤0.25 ac, ~$6 at 0.5, ~$9 at 1 ac, ~$14 at 2 ac. Monthly = 3×cut, flat $100/mo for lots under 0.2 ac. Verified: 0.18ac→$100/mo, 0.23ac→$120/mo, 0.5ac→$59/cut, 1ac→$96/cut. One-Time Cleanup 1.5× cut. Overgrowth first-cut multipliers: 2–4 wks 2×, 1–2 mo 3×, 2+ mo 4×
- Adjustments (2026-10-10): PSL zips (34952/53/83/84/86/87) add drive-distance surcharge from 34982 base (27.3889,-80.3184): ≤10 mi $0, 10–15 mi +$5/cut, 15+ mi +$10/cut. Automatic income adjustment per zip from Census ACS 2024 5-yr median HH income via Census Reporter (cached in `zip_stats`, 30-day refresh): pct = clamp((income/county_median − 1) × 0.25, −10%, +15%), county median $71,457
- Standard service copy: mow, weed eat, edge, blow off, weed control; no debris vacuuming, no bush hogging; residential & commercial. Phone (772) 940-4424
- Quote request dialog (name/phone/email/address/notes + plan/overgrowth) → MongoDB, success toast
- Owner settings drawer (gear in navbar): edit phone, zips, base/per-acre/min price, included acres — live
- Original SVG logo + favicon

## Verified
- curl: config read, check-address (in-area w/ real 0.60ac county record → $91, out-of-area 90210, zip-only 34986), quote create 201, 422 negatives
- UI: hero, check flows, quote submit toast, out-of-area panel, bento, areas, footer — all via public preview URL
- `yarn typecheck` clean

## Backlog
- P0: Admin view for quote leads (currently stored only; no listing UI) + auth for owner drawer
- P0: Replace placeholder phone (772) 882-9420 and sample zips/prices with real business data
- P1: Email/SMS notification to owner on new quote (Resend/Twilio)
- P1: Quote follow-up status tracking
- P2: Map preview of matched address (leaflet), service-day scheduling
