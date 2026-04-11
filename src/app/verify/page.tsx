import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { VerifyForm } from "@/components/verify-form";
import { getSessionFromCookies } from "@/lib/auth-server";
import { PENDING_LOGIN_COOKIE, readPendingLogin } from "@/lib/auth";

export default async function VerifyPage() {
  const session = await getSessionFromCookies();

  if (session) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const pending = await readPendingLogin(cookieStore.get(PENDING_LOGIN_COOKIE)?.value);

  if (!pending) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-81px)] max-w-5xl items-center px-6 py-10">
      <section className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-[hsl(var(--border))] bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[hsl(var(--primary))]">Step 2 of 2</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Confirm high-trust access.</h1>
          <p className="mt-4 text-base leading-7 text-[hsl(var(--muted-foreground))]">
            We recognized <span className="font-semibold text-[hsl(var(--foreground))]">{pending.email}</span>. Enter
            the secure code and the last four digits of your campus or employee ID to continue.
          </p>
          <div className="mt-8 rounded-[1.5rem] bg-[hsl(var(--background))] p-5 text-sm text-[hsl(var(--muted-foreground))]">
            This verification window expires after 15 minutes and locks after repeated failed attempts.
          </div>
        </div>

        <div className="rounded-[2rem] border border-[hsl(var(--border))] bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-semibold">Verification</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Your role will be applied after verification: {pending.role} · {pending.university}
          </p>
          <div className="mt-6">
            <VerifyForm />
          </div>
        </div>
      </section>
    </main>
  );
}
