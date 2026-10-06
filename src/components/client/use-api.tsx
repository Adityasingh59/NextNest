"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/** POSTs JSON to an API route and exposes pending/error state. */
export function useApi() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function call<T = Record<string, unknown>>(
    url: string,
    body: unknown,
    onSuccess: (payload: T) => void,
    method: "POST" | "PATCH" = "POST"
  ) {
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const payload = (await response.json().catch(() => ({}))) as T & { error?: string };

        if (!response.ok) {
          setError(payload.error ?? "Something went wrong. Try again.");
          return;
        }

        onSuccess(payload);
      } catch {
        setError("Network error. Check your connection and try again.");
      }
    });
  }

  return { call, error, isPending, router };
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md bg-red-soft px-3 py-2 text-body-sm text-red">
      {message}
    </p>
  );
}
