import { z } from "zod";
import { LIFESTYLE_TAGS } from "@/lib/markets";

const roomType = z.enum(["PRIVATE_ROOM", "SHARED_ROOM", "STUDIO", "ENTIRE_APARTMENT"]);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const tags = z.array(z.enum(LIFESTYLE_TAGS)).max(LIFESTYLE_TAGS.length).default([]);

export const listingInputSchema = z
  .object({
    title: z.string().trim().min(8).max(120),
    description: z.string().trim().min(30, "Describe the room in at least 30 characters").max(2000),
    streetLine1: z.string().trim().min(3).max(200),
    neighborhood: z.string().trim().min(1),
    monthlyRent: z.coerce.number().int().min(100).max(20_000),
    leaseStartDate: isoDate,
    leaseEndDate: isoDate,
    availableFrom: isoDate,
    roomType,
    isFurnished: z.boolean().default(false),
    furnitureNotes: z.string().trim().max(500).optional(),
    lifestyleTags: tags,
    photoUrls: z.array(z.string().url().startsWith("https://")).max(8).default([]),
    landlordName: z.string().trim().max(120).optional(),
    landlordEmail: z.string().trim().email().optional().or(z.literal(""))
  })
  .refine((value) => value.leaseEndDate > value.availableFrom, {
    message: "Lease must end after the room becomes available",
    path: ["leaseEndDate"]
  })
  .refine((value) => value.availableFrom >= value.leaseStartDate, {
    message: "Availability must fall within the lease",
    path: ["availableFrom"]
  });

export type ListingInput = z.infer<typeof listingInputSchema>;

export const preferenceInputSchema = z
  .object({
    budgetMin: z.coerce.number().int().min(0).max(20_000),
    budgetMax: z.coerce.number().int().min(100).max(20_000),
    preferredArea: z.string().trim().min(1),
    commuteRadiusMiles: z.coerce.number().min(0.25).max(25),
    moveInDate: isoDate,
    leaseDurationMonths: z.coerce.number().int().min(1).max(12),
    roomType: roomType.nullable().default(null),
    wantsFurnished: z.boolean().default(false),
    lifestyleTags: tags
  })
  .refine((value) => value.budgetMax >= value.budgetMin, {
    message: "Max budget must be at least the min",
    path: ["budgetMax"]
  });

export type PreferenceInput = z.infer<typeof preferenceInputSchema>;

export function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function zodErrorMessage(error: z.ZodError) {
  const issue = error.issues[0];
  return issue ? `${issue.path.join(".") || "input"}: ${issue.message}` : "Invalid input";
}
