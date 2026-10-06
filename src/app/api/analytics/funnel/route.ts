import { NextResponse } from "next/server";
import { jsonError, withUser } from "@/lib/api";
import { getFunnel } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/session";

/** GET /api/analytics/funnel?market=nyu: stage-by-stage funnel (admin only). Omit market for all markets. */
export const GET = withUser(async (user, request) => {
  if (!isAdmin(user)) {
    return jsonError("Admins only.", 403);
  }

  const slug = new URL(request.url).searchParams.get("market");
  const market = slug ? await prisma.market.findUnique({ where: { slug } }) : null;

  if (slug && !market) {
    return jsonError("Unknown market.", 404);
  }

  return NextResponse.json({ market: market?.slug ?? "all", stages: await getFunnel(market?.id) });
});
