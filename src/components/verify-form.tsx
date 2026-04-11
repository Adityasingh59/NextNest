"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

export function VerifyForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setError("");

      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code: String(formData.get("code") ?? ""),
          idSuffix: String(formData.get("idSuffix") ?? "")
        })
      });

      const payload = (await response.json()) as { error?: string; redirectTo?: string };

      if (!response.ok) {
        setError(payload.error ?? "Verification failed.");
        return;
      }

      router.push(payload.redirectTo ?? "/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-medium">6-digit verification code</label>
        <input
          name="code"
          inputMode="numeric"
          maxLength={6}
          className="mt-2 w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3"
          placeholder="246810"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Student or employee ID suffix</label>
        <input
          name="idSuffix"
          inputMode="numeric"
          maxLength={4}
          className="mt-2 w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3"
          placeholder="Last 4 digits"
        />
      </div>
      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
      >
        {isPending ? "Verifying access..." : "Unlock marketplace"}
      </button>
    </form>
  );
}
