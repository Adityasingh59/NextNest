import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, ListOrdered, ShieldCheck } from "lucide-react";
import { FitScoreBar } from "@/components/ui";
import { MARKET_CONFIGS } from "@/lib/markets";
import { getCurrentUser } from "@/lib/session";

const PILLARS = [
  {
    icon: BadgeCheck,
    title: "Only verified students",
    body: "Everyone signs in with a university .edu email. No anonymous posters."
  },
  {
    icon: ShieldCheck,
    title: "Every listing screened",
    body: "Listings pass fraud checks before anyone sees them. Suspicious ones are held for review."
  },
  {
    icon: ListOrdered,
    title: "Matches, not scrolling",
    body: "Tell us your budget, area and dates once. See listings ranked by fit, with the reasons."
  }
];

export default async function LandingPage() {
  if (await getCurrentUser()) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-5">
          <p className="nn-overline">Mid-term lease transfers for students</p>
          <h1 className="text-display sm:text-display-lg">Hand off your lease to a verified student. Or take one over.</h1>
          <p className="max-w-xl text-ink-muted">
            Leaving for an internship, study abroad, or a semester off? NextNest matches your room with a verified student who
            needs it, and handles the lease assignment signature in the app.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="nn-btn nn-btn-primary nn-btn-lg">
              Sign in with your .edu email
            </Link>
          </div>
          <p className="text-body-sm text-ink-muted">Live at {MARKET_CONFIGS.map((market) => market.universityName).join(", ")}.</p>
        </div>
        <div className="nn-card flex flex-col gap-3 p-5">
          <p className="nn-overline">Example match</p>
          <p className="text-heading-sm">Private room in a 3-bed, East Village</p>
          <FitScoreBar
            score={85}
            dimensions={[
              { key: "budget", label: "Budget", weight: 30, score: 100, points: 30, value: "Aligned", detail: "" },
              { key: "location", label: "Location", weight: 25, score: 100, points: 25, value: "0.8 mi", detail: "" },
              { key: "dates", label: "Dates", weight: 20, score: 80, points: 16, value: "4 mo overlap", detail: "" },
              { key: "roomType", label: "Room type", weight: 10, score: 50, points: 5, value: "No preference", detail: "" },
              { key: "lifestyle", label: "Lifestyle", weight: 10, score: 33, points: 3.3, value: "1 of 3 tags shared", detail: "" },
              { key: "furniture", label: "Furniture", weight: 5, score: 100, points: 5, value: "Included", detail: "" }
            ]}
          />
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {PILLARS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="nn-card flex flex-col gap-2 p-5">
            <Icon aria-hidden className="text-nest" size={22} />
            <h2 className="text-heading-sm">{title}</h2>
            <p className="text-body-sm text-ink-muted">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
