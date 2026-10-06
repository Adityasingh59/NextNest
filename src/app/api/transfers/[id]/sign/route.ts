import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, withUser, type IdContext } from "@/lib/api";
import { signTransfer } from "@/lib/transfers";

const bodySchema = z.object({ signatureName: z.string(), consent: z.literal(true) });

/** POST /api/transfers/[id]/sign: sign the lease assignment with a typed name. */
export const POST = withUser(async (user, request, { params }: IdContext) => {
  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonError("Type your name and confirm you agree to sign electronically.");
  }

  const transfer = await signTransfer(user, id, parsed.data.signatureName);
  return NextResponse.json({ transfer: { id: transfer.id, status: transfer.status } });
});
