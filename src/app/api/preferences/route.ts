import { NextResponse } from "next/server";
import { jsonError, withUser } from "@/lib/api";
import { trackEvent } from "@/lib/events";
import { parseDate, preferenceInputSchema } from "@/lib/listing-input";
import { CAMPUS_AREA_SLUG, parseNeighborhoods } from "@/lib/markets";
import { prisma } from "@/lib/prisma";

/** POST /api/preferences: create or update the arriving student's preference profile. */
export const POST = withUser(async (user, request) => {
  const input = preferenceInputSchema.parse(await request.json());
  const market = user.market;

  const area =
    input.preferredArea === CAMPUS_AREA_SLUG
      ? { lat: Number(market.campusLatitude), lng: Number(market.campusLongitude) }
      : parseNeighborhoods(market.neighborhoods).find((n) => n.slug === input.preferredArea);

  if (!area) {
    return jsonError("Pick campus or a neighborhood in your market.");
  }

  const data = {
    marketId: market.id,
    budgetMinCents: input.budgetMin * 100,
    budgetMaxCents: input.budgetMax * 100,
    preferredArea: input.preferredArea,
    areaLatitude: area.lat,
    areaLongitude: area.lng,
    commuteRadiusMiles: input.commuteRadiusMiles,
    moveInDate: parseDate(input.moveInDate),
    leaseDurationMonths: input.leaseDurationMonths,
    roomType: input.roomType,
    wantsFurnished: input.wantsFurnished,
    lifestyleTags: input.lifestyleTags
  };

  const preference = await prisma.preferenceProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data
  });

  await trackEvent("preference_submitted", {
    userId: user.id,
    marketId: market.id,
    properties: {
      university_market: market.slug,
      budget_range: `${input.budgetMin}-${input.budgetMax}`,
      commute_radius: input.commuteRadiusMiles,
      is_update: Boolean(user.preference)
    }
  });

  return NextResponse.json({ preference: { id: preference.id } });
});
