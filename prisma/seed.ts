import { PrismaClient, type RoomType } from "@prisma/client";
import { MARKET_CONFIGS } from "../src/lib/markets";

const prisma = new PrismaClient();

/**
 * Seeds the configured university markets and a few clearly marked sample
 * listings per market, so arriving students see what matching looks like
 * before real listings exist (spec: "Cold Start Problem", step 3).
 * Safe to re-run.
 */

type Sample = {
  title: string;
  description: string;
  neighborhood: string;
  rentFactor: number;
  roomType: RoomType;
  isFurnished: boolean;
  lifestyleTags: string[];
  startMonthOffset: number;
  months: number;
};

const SAMPLES: Sample[] = [
  {
    title: "Sample: furnished private room, short walk to campus",
    description:
      "Example listing. A furnished private room in a 3-bedroom apartment shared with two grad students. Quiet weeknights, shared kitchen, laundry in the building.",
    neighborhood: "0",
    rentFactor: 1,
    roomType: "PRIVATE_ROOM",
    isFurnished: true,
    lifestyleTags: ["quiet", "non-smoking", "studious"],
    startMonthOffset: 1,
    months: 5
  },
  {
    title: "Sample: studio for one semester",
    description: "Example listing. A small studio with its own kitchenette, available for one semester while the current tenant studies abroad.",
    neighborhood: "1",
    rentFactor: 1.2,
    roomType: "STUDIO",
    isFurnished: false,
    lifestyleTags: ["quiet"],
    startMonthOffset: 2,
    months: 4
  },
  {
    title: "Sample: shared room in a social house",
    description: "Example listing. One spot in a shared double in a 5-person house. Friendly roommates, a cat, and regular house dinners.",
    neighborhood: "2",
    rentFactor: 0.7,
    roomType: "SHARED_ROOM",
    isFurnished: true,
    lifestyleTags: ["social", "pet-friendly", "night-owl"],
    startMonthOffset: 1,
    months: 6
  }
];

function monthStart(offset: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCMonth(date.getUTCMonth() + offset, 1);
  return date;
}

async function main() {
  const sampleOwner = await prisma.user.upsert({
    where: { email: "samples@nextnest.app" },
    update: {},
    create: { email: "samples@nextnest.app", name: "NextNest samples", universityName: "NextNest", roles: ["STUDENT_LISTER"] }
  });

  for (const config of MARKET_CONFIGS) {
    const data = {
      name: config.name,
      universityName: config.universityName,
      emailDomains: config.emailDomains,
      city: config.city,
      stateRegion: config.stateRegion,
      campusLatitude: config.campus.lat,
      campusLongitude: config.campus.lng,
      marketAvgRentCents: config.marketAvgRentCents,
      neighborhoods: config.neighborhoods
    };
    const market = await prisma.market.upsert({ where: { slug: config.slug }, update: data, create: { slug: config.slug, ...data } });

    const existingSamples = await prisma.listing.count({ where: { marketId: market.id, isSample: true } });
    if (existingSamples > 0) continue;

    for (const sample of SAMPLES) {
      const neighborhood = config.neighborhoods[Number(sample.neighborhood)];
      const start = monthStart(sample.startMonthOffset);
      const end = monthStart(sample.startMonthOffset + sample.months);

      await prisma.listing.create({
        data: {
          ownerId: sampleOwner.id,
          marketId: market.id,
          isSample: true,
          title: sample.title,
          description: sample.description,
          streetLine1: "Sample listing",
          city: config.city,
          stateRegion: config.stateRegion,
          postalCode: "",
          campusName: config.universityName,
          neighborhood: neighborhood.name,
          latitude: neighborhood.lat,
          longitude: neighborhood.lng,
          monthlyRentCents: Math.round((config.marketAvgRentCents * sample.rentFactor) / 500) * 500,
          leaseStartDate: monthStart(-6),
          leaseEndDate: end,
          availableFrom: start,
          availableUntil: end,
          roomType: sample.roomType,
          isFurnished: sample.isFurnished,
          furnishingStatus: sample.isFurnished ? "FULLY_FURNISHED" : "UNFURNISHED",
          lifestyleTags: sample.lifestyleTags,
          state: "ACTIVE",
          publishedAt: new Date()
        }
      });
    }
  }

  console.log(`Seeded ${MARKET_CONFIGS.length} markets.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
