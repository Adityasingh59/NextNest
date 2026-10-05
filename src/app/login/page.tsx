import { LoginForm } from "@/components/client/login-form";
import { Banner } from "@/components/ui";

const ERRORS: Record<string, string> = {
  expired: "That sign-in link has expired or was already used. Request a new one.",
  unsupported: "Your university is not on NextNest yet."
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <h1 className="text-heading-lg">Sign in</h1>
        <p className="mt-1 text-ink-muted">We email you a one-time link. No password to remember.</p>
      </div>
      {error && ERRORS[error] ? <Banner tone="amber">{ERRORS[error]}</Banner> : null}
      <div className="nn-card p-5 sm:p-6">
        <LoginForm />
      </div>
    </div>
  );
}
