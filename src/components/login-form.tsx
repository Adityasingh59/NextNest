"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setError("");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
          consent: formData.get("consent") === "accepted"
        })
      });

      const payload = (await response.json()) as { error?: string; redirectTo?: string };

      if (!response.ok) {
        setError(payload.error ?? "Login failed.");
        return;
      }

      router.push(payload.redirectTo ?? "/verify");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-medium">Institutional email</label>
        <input
          name="email"
          type="email"
          className="mt-2 w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3"
          placeholder="name@school.edu"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Password</label>
        <input
          name="password"
          type="password"
          className="mt-2 w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3"
          placeholder="At least 12 chars, mixed complexity"
        />
      </div>
      <label className="flex items-start gap-3 rounded-2xl bg-[hsl(var(--background))] px-4 py-4">
        <input name="consent" type="checkbox" value="accepted" className="mt-1" />
        <span className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          I understand this is a restricted marketplace and only verified or approved accounts may proceed.
        </span>
      </label>
      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
      >
        {isPending ? "Checking account..." : "Continue to verification"}
      </button>
    </form>
  );
}
