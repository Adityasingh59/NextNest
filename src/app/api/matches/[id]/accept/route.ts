import { NextResponse } from "next/server";
import { withUser, type IdContext } from "@/lib/api";
import { acceptMatch } from "@/lib/transfers";

/** POST /api/matches/[id]/accept: departing tenant accepts a match request. */
export const POST = withUser(async (user, _request, { params }: IdContext) => {
  const { id } = await params;
  const transfer = await acceptMatch(user, id);
  return NextResponse.json({ transfer: { id: transfer.id } });
});
