import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Event taxonomy from the spec's "Data and Analytics Framework". */
export const EVENT_TYPES = [
  "user_signed_up",
  "listing_created",
  "listing_flagged",
  "preference_submitted",
  "match_viewed",
  "match_requested",
  "match_accepted",
  "match_declined",
  "lease_signed",
  "transfer_completed"
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

/** Events the browser may log through POST /api/events; the rest are server-only. */
export const CLIENT_EVENT_TYPES: EventType[] = ["match_viewed"];

/**
 * Logs to the events table (the funnel source of truth) and, when
 * configured, forwards to PostHog. Analytics never breaks a user action.
 */
export async function trackEvent(
  eventType: EventType,
  options: { userId?: string | null; marketId?: string | null; properties?: Record<string, unknown> } = {}
) {
  const properties = (options.properties ?? {}) as Prisma.InputJsonObject;

  try {
    await prisma.event.create({
      data: { eventType, userId: options.userId ?? null, marketId: options.marketId ?? null, eventProperties: properties }
    });
  } catch (error) {
    console.error(`[events] failed to record ${eventType}`, error);
  }

  void forwardToPostHog(eventType, options.userId ?? "anonymous", properties);
}

async function forwardToPostHog(eventType: string, distinctId: string, properties: Prisma.InputJsonObject) {
  const apiKey = process.env.POSTHOG_API_KEY;

  if (!apiKey) {
    return;
  }

  const host = process.env.POSTHOG_HOST || "https://us.i.posthog.com";

  try {
    await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, event: eventType, distinct_id: distinctId, properties }),
      signal: AbortSignal.timeout(3000)
    });
  } catch (error) {
    console.error(`[events] PostHog forward failed for ${eventType}`, error);
  }
}
