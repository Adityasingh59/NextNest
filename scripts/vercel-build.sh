#!/usr/bin/env bash
# Vercel build: generate the Prisma client, apply migrations, seed markets, then build.
# The Neon integration provides DATABASE_URL (pooled) and DATABASE_URL_UNPOOLED (direct);
# Prisma's directUrl reads DIRECT_URL, so fall back to the unpooled URL when it is not set.
set -euo pipefail
export DIRECT_URL="${DIRECT_URL:-${DATABASE_URL_UNPOOLED:-$DATABASE_URL}}"

npx prisma generate
npx prisma migrate deploy
npm run db:seed
npx next build
