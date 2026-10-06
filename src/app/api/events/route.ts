import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, withUser } from "@/lib/api";
import { CLIENT_EVENT_TYPES, trackEvent, type EventType } from "@/lib/events";
import { readExperimentGroups } from "@/lib/experiments";

const bodySchema = z.object({
  eventType: z.string(),
  properties: z.record(z.union([z.string().max(200), z.number(), z.boolean(), z.null()])).default({})
});

/** POST /api/events: log a client-side analytics event (allowlisted types only). */
export const POST = withUser(async (user, request) => {
  const { eventType, properties } = bodySchema.parse(await request.json());

  if (!CLIENT_EVENT_TYPES.includes(eventType as EventType)) {
    return jsonError("Unknown event type.");
  }

  await trackEvent(eventType as EventType, {
    userId: user.id,
    marketId: user.market.id,
    properties: {
      ...properties,
      fit_score_variant: readExperimentGroups(user.experimentGroups).fit_score_transparency ?? null
    }
  });

  return NextResponse.json({ ok: true });
});
