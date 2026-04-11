"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/login");
          router.refresh();
        })
      }
      disabled={isPending}
      className="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold disabled:opacity-70"
    >
      {isPending ? "Logging out..." : "Logout"}
    </button>
  );
}
