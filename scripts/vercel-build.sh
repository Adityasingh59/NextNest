#!/usr/bin/env bash
# Vercel build: generate the Prisma client, apply migrations, seed markets, then build.
# The Neon integration provides DATABASE_URL (pooled) and DATABASE_URL_UNPOOLED (direct);
# Prisma's directUrl reads DIRECT_URL, so fall back to the unpooled URL when it is not set.
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "error: DATABASE_URL is not set for this environment." >&2
  echo "Connect a Postgres database (Vercel project > Storage > Neon) to this environment and redeploy." >&2
  exit 1
fi
if [ -z "${AUTH_SECRET:-}" ]; then
  echo "error: AUTH_SECRET is not set for this environment (Settings > Environment Variables)." >&2
  exit 1
fi

export DIRECT_URL="${DIRECT_URL:-${DATABASE_URL_UNPOOLED:-$DATABASE_URL}}"

npx prisma generate
npx prisma migrate deploy
npm run db:seed
npx next build
