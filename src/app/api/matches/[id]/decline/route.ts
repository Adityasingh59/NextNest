import { NextResponse } from "next/server";
import { z } from "zod";
import { withUser, type IdContext } from "@/lib/api";
import { declineMatch } from "@/lib/transfers";

const bodySchema = z.object({ reason: z.string().max(300).optional() });

/** POST /api/matches/[id]/decline: departing tenant declines a match request. */
export const POST = withUser(async (user, request, { params }: IdContext) => {
  const { id } = await params;
  const { reason } = bodySchema.parse(await request.json().catch(() => ({})));
  await declineMatch(user, id, reason);
  return NextResponse.json({ ok: true });
});
