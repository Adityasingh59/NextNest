"use client";

import { useEffect, useRef, useState } from "react";
import { FormError, useApi } from "@/components/client/use-api";

export function RequestMatchForm({ listingId }: { listingId: string }) {
  const { call, error, isPending, router } = useApi();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const introMessage = String(new FormData(event.currentTarget).get("introMessage") ?? "");
    call(`/api/matches/${listingId}/request`, { introMessage }, () => router.refresh());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label htmlFor="introMessage" className="nn-label">
          Short intro (optional)
        </label>
        <textarea id="introMessage" name="introMessage" maxLength={300} rows={3} className="nn-input" placeholder="Who you are, your dates, anything the tenant should know." />
        <p className="nn-help">The tenant sees your university, fit score and this note. Your name is shared only if they accept.</p>
      </div>
      <FormError message={error} />
      <button type="submit" className="nn-btn nn-btn-primary nn-btn-lg" disabled={isPending}>
        {isPending ? "Sending…" : "Request match"}
      </button>
    </form>
  );
}

export function RespondToRequest({ matchId }: { matchId: string }) {
  const { call, error, isPending, router } = useApi();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="flex flex-col gap-2">
      {declining ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={`reason-${matchId}`} className="nn-label">
            Reason (optional, shown to the student)
          </label>
          <input id={`reason-${matchId}`} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} className="nn-input" />
          <div className="flex gap-2">
            <button type="button" className="nn-btn nn-btn-sm" onClick={() => setDeclining(false)} disabled={isPending}>
              Back
            </button>
            <button type="button" className="nn-btn nn-btn-sm nn-btn-danger" disabled={isPending} onClick={() => call(`/api/matches/${matchId}/decline`, { reason }, () => router.refresh())}>
              Decline request
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="nn-btn nn-btn-sm nn-btn-primary"
            disabled={isPending}
            onClick={() => call<{ transfer: { id: string } }>(`/api/matches/${matchId}/accept`, {}, (payload) => router.push(`/transfers/${payload.transfer.id}`))}
          >
            Accept and start transfer
          </button>
          <button type="button" className="nn-btn nn-btn-sm" onClick={() => setDeclining(true)} disabled={isPending}>
            Decline
          </button>
        </div>
      )}
      <FormError message={error} />
    </div>
  );
}

export function SignForm({ transferId, expectedName }: { transferId: string; expectedName: string }) {
  const { call, error, isPending, router } = useApi();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    call(
      `/api/transfers/${transferId}/sign`,
      { signatureName: String(form.get("signatureName") ?? ""), consent: form.get("consent") === "on" },
      () => router.refresh()
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="signatureName" className="nn-label">
          Type your full legal name
        </label>
        <input id="signatureName" name="signatureName" required minLength={3} maxLength={120} defaultValue={expectedName} className="nn-input font-medium" autoComplete="name" />
      </div>
      <label className="flex items-start gap-3">
        <input type="checkbox" name="consent" required className="mt-1 h-5 w-5 accent-[var(--nest)]" />
        <span className="text-body-sm text-ink-muted">
          I have read the lease assignment above and agree to sign it electronically. My typed name is my signature.
        </span>
      </label>
      <FormError message={error} />
      <button type="submit" className="nn-btn nn-btn-primary nn-btn-lg" disabled={isPending}>
        {isPending ? "Signing…" : "Sign lease assignment"}
      </button>
    </form>
  );
}

export function ReviewActions({ listingId }: { listingId: string }) {
  const { call, error, isPending, router } = useApi();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button type="button" className="nn-btn nn-btn-sm nn-btn-primary" disabled={isPending} onClick={() => call(`/api/listings/${listingId}/review`, { outcome: "APPROVED" }, () => router.refresh())}>
          Approve (legitimate)
        </button>
        <button type="button" className="nn-btn nn-btn-sm nn-btn-danger" disabled={isPending} onClick={() => call(`/api/listings/${listingId}/review`, { outcome: "REJECTED" }, () => router.refresh())}>
          Reject (scam)
        </button>
      </div>
      <FormError message={error} />
    </div>
  );
}

export function AppealForm({ listingId }: { listingId: string }) {
  const { call, error, isPending, router } = useApi();
  const [sent, setSent] = useState(false);

  if (sent) {
    return <p className="text-body-sm text-nest">Thanks. A reviewer will look at your note.</p>;
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        call(`/api/listings/${listingId}/appeal`, { note: String(new FormData(event.currentTarget).get("note") ?? "") }, () => {
          setSent(true);
          router.refresh();
        });
      }}
    >
      <label htmlFor="note" className="nn-label">
        Add context for the reviewer
      </label>
      <textarea id="note" name="note" rows={3} minLength={20} maxLength={1000} required className="nn-input" placeholder="For example: the low price is because the room is shared, and I can do a video tour." />
      <FormError message={error} />
      <button type="submit" className="nn-btn nn-btn-sm self-start" disabled={isPending}>
        Send to reviewer
      </button>
    </form>
  );
}

/** Logs match_viewed once per page view (client-side so link prefetches are not counted). */
export function MatchViewBeacon({ listingId, fitScore, rank }: { listingId: string; fitScore: number; rank: number | null }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "match_viewed", properties: { listing_id: listingId, fit_score: fitScore, fit_score_rank: rank } })
    });
  }, [listingId, fitScore, rank]);

  return null;
}
