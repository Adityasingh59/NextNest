# NextNest

A verified, AI-matched marketplace where university students transfer mid-term leases to other verified students.
This repository implements the Phase 1 (MVP) scope of the product specification.

## What works today

| Spec feature | Where |
| --- | --- |
| `.edu` email verification (magic link, single use, 24h expiry, market chosen by email domain) | `src/app/api/auth/*`, `src/lib/login-tokens.ts` |
| Listing creation with scam screening before it goes live | `src/lib/listings.ts`, `src/app/listings/new` |
| Preference profile (budget, area + radius, move-in, duration, room type, furnished, lifestyle) | `src/app/preferences`, `src/app/api/preferences` |
| Deterministic fit score, 0–100 with a per-dimension breakdown | `src/lib/fit-score.ts` (weights: budget 30, location 25, dates 20, room 10, lifestyle 10, furniture 5) |
| Scam detection: heuristics always, Claude when heuristics are not conclusive, spec decision rules, audit log | `src/lib/scam/*`, `ScamCheck` table |
| Manual review queue and poster appeals | `src/app/admin/review`, `/api/listings/[id]/review`, `/api/listings/[id]/appeal` |
| Request → accept/decline → built-in e-signature lease assignment | `src/lib/transfers.ts`, `src/app/transfers/[transferId]` |
| Event taxonomy, funnel, KPIs, experiment and scam metrics | `src/lib/events.ts`, `src/lib/analytics.ts`, `src/app/analytics` |
| Experiment 1 (fit score transparency), Experiment 2 (sample matches before preferences), Experiment 3 (threshold via `SCAM_CLAUDE_THRESHOLD`) | `src/lib/experiments.ts` |
| Config-driven university markets (NYU, Michigan, UCSD) and labelled sample listings for cold start | `src/lib/markets.ts`, `prisma/seed.ts` |

Privacy follows the spec: preferences are only used for scoring, and requesters appear as "verified student at
&lt;university&gt;" until the tenant accepts. Names and emails are shared on the transfer page after that.

UI follows the NextNest design system (tokens in `src/app/globals.css`, mapped into Tailwind in `tailwind.config.ts`),
mobile first at 375px, with light and dark themes.

## Architecture

```
Browser (Next.js App Router pages, server components)
   │  fetch JSON
   ▼
API routes (src/app/api) ── withUser(): session cookie → User
   │
   ├─ lib/matching.ts ── lib/fit-score.ts (pure, unit tested)
   ├─ lib/listings.ts ── lib/scam/screen.ts ─┬─ heuristics.ts (pure)
   │                                         ├─ claude.ts (Claude API, structured output, 10s timeout)
   │                                         └─ decision.ts (pure)
   ├─ lib/transfers.ts (request / accept / decline / sign)
   └─ lib/events.ts ──► Event table (funnel source of truth) ──► PostHog (optional)
   ▼
PostgreSQL via Prisma (Neon in production)
```

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/verify` | Send the `.edu` sign-in link |
| GET | `/api/auth/callback?token=` | Consume the link, start a session |
| POST | `/api/auth/logout` | End the session |
| PATCH | `/api/me` | Set display name |
| GET / POST | `/api/listings` | Ranked listings for the user's market / create a listing (runs screening) |
| GET | `/api/listings/[id]` | Listing detail with the viewer's fit breakdown |
| POST | `/api/listings/[id]/appeal` | Poster adds context to a held listing |
| POST | `/api/listings/[id]/review` | Admin approves or rejects a held listing |
| POST | `/api/preferences` | Create or update the preference profile |
| GET | `/api/matches` | Ranked matches with request status |
| POST | `/api/matches/[listingId]/request` | Request a match |
| POST | `/api/matches/[id]/accept` · `/decline` | Tenant responds to a request |
| POST | `/api/transfers/[id]/sign` | Sign the lease assignment |
| POST | `/api/events` | Client events (`match_viewed` only) |
| GET | `/api/analytics/funnel?market=` | Funnel by stage (admin) |

## Local setup

```bash
cp .env.example .env            # set DATABASE_URL; ANTHROPIC_API_KEY is optional
npm install
npx prisma migrate dev          # creates tables
npm run db:seed                 # markets + sample listings
npm run dev
```

Sign in at http://localhost:3000/login with an address at `nyu.edu`, `umich.edu` or `ucsd.edu`. Without
`RESEND_API_KEY`, the sign-in link is printed in the server console and, in development, shown on the page.
Add your email to `ADMIN_EMAILS` to see the review queue and analytics.

Checks: `npm test` (fit score + scam detection), `npm run lint`, `npm run typecheck`, `npm run build`.

## Deploying to Vercel

1. Import the GitHub repo in Vercel (framework: Next.js; the `vercel-build` script is picked up automatically).
2. In the project's **Storage** tab, create a **Neon** Postgres database and connect it to all environments.
   This injects `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
3. Add environment variables: `AUTH_SECRET` (a long random string) and optionally `ADMIN_EMAILS`, `RESEND_API_KEY`,
   `ANTHROPIC_API_KEY`. Without `RESEND_API_KEY`, set `DEMO_SHOW_SIGNIN_LINK=true` so the sign-in link appears on
   the page. Anyone can then sign in as any supported .edu address, so keep it to protected demo deployments.
4. Redeploy. Each build runs `prisma migrate deploy` and the idempotent seed before `next build`
   (see `scripts/vercel-build.sh`).

## Things to know

- **Market average rents** in `src/lib/markets.ts` are starting estimates. The scam price rule compares against
  them, so keep them current or it will produce false positives (spec: "Failure cases").
- **New accounts** (under 24h) always carry one heuristic flag, so a first listing with a Claude risk score of 40+
  is held for review. This is the spec's decision logic working as written.
- **Locations** are neighborhood-level (no geocoding API yet), which is enough for the location dimension of the fit score.
- **Photos** are https links for now; Vercel Blob upload is a follow-up.
- **Not built yet:** Phase 2 (escrow payments, furniture bundling, landlord notification email, reviews, saved-search
  alerts) and Phase 3. The Prisma schema already has tables for escrow, disputes, tours and reviews.
