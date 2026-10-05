import { OnboardingForm } from "@/components/client/onboarding-form";
import { VerifiedBadge } from "@/components/ui";
import { requireUser } from "@/lib/session";

export default async function OnboardingPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-2">
        <VerifiedBadge />
        <h1 className="text-heading-lg">You’re verified at {user.market.universityName}</h1>
        <p className="text-ink-muted">Two quick questions and you’re in.</p>
      </div>
      <div className="nn-card p-5 sm:p-6">
        <OnboardingForm defaultName={user.name ?? ""} />
      </div>
    </div>
  );
}
