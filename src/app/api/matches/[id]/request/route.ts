import { NextResponse } from "next/server";
import { z } from "zod";
import { withUser, type IdContext } from "@/lib/api";
import { requestMatch } from "@/lib/transfers";

const bodySchema = z.object({ introMessage: z.string().max(300).optional() });

/** POST /api/matches/[listingId]/request: request a match on a listing (the id is the listing id). */
export const POST = withUser(async (user, request, { params }: IdContext) => {
  const { id } = await params;
  const { introMessage } = bodySchema.parse(await request.json().catch(() => ({})));
  const match = await requestMatch(user, id, introMessage);
  return NextResponse.json({ match: { id: match.id, status: match.status } });
});
