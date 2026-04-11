import { StatusBadge } from "@/components/status-badge";
import { users } from "@/lib/marketplace";

export default function ProfilePage() {
  const currentUser = users[0];
  const pendingUser = users[2];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-[hsl(var(--border))] bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-[hsl(var(--secondary))] text-2xl font-semibold text-[hsl(var(--secondary-foreground))]">
                {currentUser.name
                  .split(" ")
                  .map((token) => token[0])
                  .join("")}
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[hsl(var(--primary))]">Verified profile</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">{currentUser.name}</h1>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  {currentUser.university} · Class of {currentUser.graduationYear}
                </p>
              </div>
            </div>
            <StatusBadge value={currentUser.badge} />
          </div>

          <p className="mt-6 max-w-2xl text-base leading-7 text-[hsl(var(--muted-foreground))]">{currentUser.bio}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Email domain", ".edu verified"],
              ["Manual review", "Not needed"],
              ["Profile bio", "200 char cap supported"]
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[hsl(var(--background))] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[hsl(var(--muted-foreground))]">{label}</p>
                <p className="mt-2 font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-[hsl(var(--border))] bg-white p-6">
            <h2 className="text-lg font-semibold">International fallback</h2>
            <div className="mt-4 rounded-[1.5rem] bg-[hsl(var(--background))] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{pendingUser.name}</p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{pendingUser.university}</p>
                </div>
                <StatusBadge value={pendingUser.badge} />
              </div>
              <p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Passport and enrollment PDFs are uploaded, the account is set to `PENDING_REVIEW`, and admin approval
                unblocks applications and listing creation.
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[hsl(var(--border))] bg-white p-6">
            <h2 className="text-lg font-semibold">Blocking rules</h2>
            <div className="mt-4 space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
              <p className="rounded-2xl bg-[hsl(var(--background))] p-4">Unverified users cannot apply to active listings.</p>
              <p className="rounded-2xl bg-[hsl(var(--background))] p-4">Unverified users cannot publish takeover listings.</p>
              <p className="rounded-2xl bg-[hsl(var(--background))] p-4">Approved manual verification can show the `ID Verified` badge.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
