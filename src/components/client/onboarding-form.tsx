"use client";

import { useState } from "react";
import { FormError, useApi } from "@/components/client/use-api";
import { cn } from "@/lib/utils";

const INTENTS = [
  { value: "leaving", title: "I'm leaving my place", body: "Find a verified student to take over your lease.", next: "/listings/new" },
  { value: "arriving", title: "I need a place", body: "Tell us what you need and see ranked matches.", next: "/preferences" }
] as const;

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const { call, error, isPending, router } = useApi();
  const [intent, setIntent] = useState<(typeof INTENTS)[number]["value"]>("arriving");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name") ?? "");
    const next = INTENTS.find((option) => option.value === intent)!.next;
    call("/api/me", { name }, () => router.push(next), "PATCH");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label htmlFor="name" className="nn-label">
          First name
        </label>
        <input id="name" name="name" required maxLength={80} defaultValue={defaultName} className="nn-input" autoComplete="given-name" />
        <p className="nn-help">Other students see this only after you both agree to a match.</p>
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="nn-label">What brings you here?</legend>
        {INTENTS.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
              intent === option.value ? "border-nest bg-nest-soft" : "border-line bg-surface-raised"
            )}
          >
            <input type="radio" name="intent" value={option.value} checked={intent === option.value} onChange={() => setIntent(option.value)} className="mt-1 accent-[var(--nest)]" />
            <span>
              <span className="block font-medium text-ink">{option.title}</span>
              <span className="block text-body-sm text-ink-muted">{option.body}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <FormError message={error} />
      <button type="submit" className="nn-btn nn-btn-primary nn-btn-lg" disabled={isPending}>
        Continue
      </button>
    </form>
  );
}
