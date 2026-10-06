import { NextResponse } from "next/server";
import { z } from "zod";
import { withUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ name: z.string().trim().min(1).max(80) });

/** PATCH /api/me: set the display name collected at onboarding. */
export const PATCH = withUser(async (user, request) => {
  const { name } = bodySchema.parse(await request.json());
  await prisma.user.update({ where: { id: user.id }, data: { name } });
  return NextResponse.json({ ok: true });
});
