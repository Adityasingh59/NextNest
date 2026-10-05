"use client";

import { MailCheck } from "lucide-react";
import { useState } from "react";
import { FormError, useApi } from "@/components/client/use-api";

export function LoginForm() {
  const { call, error, isPending } = useApi();
  const [sent, setSent] = useState<{ email: string; university: string; devLink?: string } | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    call<{ university: string; devLink?: string }>("/api/auth/verify", { email }, (payload) => setSent({ email, ...payload }));
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-3" role="status">
        <div className="flex items-center gap-2 text-nest">
          <MailCheck aria-hidden size={20} />
          <p className="text-heading-sm">Check your inbox</p>
        </div>
        <p className="text-ink-muted">
          We sent a sign-in link to <strong className="text-ink">{sent.email}</strong> to confirm you are a {sent.university}{" "}
          student. It works once and expires in 24 hours.
        </p>
        {sent.devLink ? (
          <p className="rounded-md bg-sky-soft px-3 py-2 text-body-sm text-sky">
            Demo mode (no email provider configured):{" "}
            <a className="font-medium underline" href={sent.devLink}>
              open the sign-in link
            </a>
          </p>
        ) : null}
        <button type="button" className="nn-link self-start text-body-sm" onClick={() => setSent(null)}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="nn-label">
          University email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="nn-input" placeholder="you@nyu.edu" />
        <p className="nn-help">Only .edu addresses from supported universities can join.</p>
      </div>
      <FormError message={error} />
      <button type="submit" className="nn-btn nn-btn-primary nn-btn-lg" disabled={isPending}>
        {isPending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
