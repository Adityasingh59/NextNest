import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getSessionFromCookies } from "@/lib/auth-server";
import { getApprovedAccounts } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getSessionFromCookies();

  if (session) {
    redirect("/");
  }

  const approvedAccounts = getApprovedAccounts();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-81px)] max-w-7xl items-center px-6 py-10">
      <section className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-[hsl(var(--border))] bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[hsl(var(--primary))]">Secure access</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Strict login for verified lease transfers.</h1>
          <p className="mt-4 text-base leading-7 text-[hsl(var(--muted-foreground))]">
            Access requires an approved institutional or partner-landlord account, a strong password, and a second
            verification step before the marketplace unlocks.
          </p>
          <div className="mt-8 space-y-4 rounded-[1.5rem] bg-[hsl(var(--background))] p-5">
            <p className="text-sm font-semibold">Security checkpoints</p>
            <ul className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
              <li>Only approved `.edu` or partner landlord emails can begin sign-in.</li>
              <li>Passwords must satisfy a stricter complexity rule before credentials are accepted.</li>
              <li>A six-digit verification code and ID suffix are required in step two.</li>
              <li>Marketplace routes redirect unauthenticated visitors back to this page.</li>
            </ul>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-[2rem] border border-[hsl(var(--border))] bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-semibold">Login</h2>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Use one of the approved preview accounts below while the full Auth.js flow is still being wired in.
            </p>
            <div className="mt-6">
              <LoginForm />
            </div>
          </div>

          <div className="rounded-[2rem] border border-[hsl(var(--border))] bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-semibold">Approved preview accounts</h2>
            <div className="mt-5 space-y-4">
              {approvedAccounts.map((account) => (
                <div key={account.email} className="rounded-[1.5rem] bg-[hsl(var(--background))] p-5">
                  <p className="font-semibold">{account.displayName}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{account.email}</p>
                  <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                    Password: <span className="font-semibold text-[hsl(var(--foreground))]">{account.password}</span>
                  </p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    Verification code: <span className="font-semibold text-[hsl(var(--foreground))]">{account.verificationCode}</span>
                  </p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    ID suffix: <span className="font-semibold text-[hsl(var(--foreground))]">{account.idSuffix}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
