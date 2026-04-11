export default function NewListingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="rounded-[2rem] border border-[hsl(var(--border))] bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[hsl(var(--primary))]">Listing creation</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Draft a verified lease takeover listing.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[hsl(var(--muted-foreground))]">
          This page maps to Step 1 of the workflow: lease details, landlord info, lease PDF upload, furnishing options,
          and autosave-friendly draft fields.
        </p>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form className="space-y-6 rounded-[1.75rem] border border-[hsl(var(--border))] bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Listing title</span>
              <input className="mt-2 w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3" placeholder="Sunny studio near campus" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Monthly rent</span>
              <input className="mt-2 w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3" placeholder="$1850" />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium">Address</span>
            <input className="mt-2 w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3" placeholder="Street, city, state, ZIP" />
          </label>

          <div className="grid gap-6 md:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium">Lease start</span>
              <input type="date" className="mt-2 w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Lease end</span>
              <input type="date" className="mt-2 w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Available from</span>
              <input type="date" className="mt-2 w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3" />
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Landlord name</span>
              <input className="mt-2 w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3" placeholder="Property manager or landlord" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Landlord email</span>
              <input className="mt-2 w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3" placeholder="leasing@example.com" />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium">Description</span>
            <textarea
              rows={5}
              className="mt-2 w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3"
              placeholder="Add transit, roommate, move-in, and lease-transfer context."
            />
          </label>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-[hsl(var(--border))] p-5">
              <p className="text-sm font-semibold">Lease PDF upload</p>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                Max 10MB. Original lease gets stored in S3 and becomes the source document for e-signature.
              </p>
              <div className="mt-4 rounded-2xl border border-dashed border-[hsl(var(--border))] px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                Upload area placeholder
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[hsl(var(--border))] p-5">
              <p className="text-sm font-semibold">Furniture package</p>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                Add items that can route into escrow-backed payment and dispute handling later.
              </p>
              <div className="mt-4 space-y-3">
                <input className="w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3" placeholder="Desk - $180" />
                <input className="w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3" placeholder="Bed frame - $320" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-white">
              Save draft
            </button>
            <button className="rounded-full border border-[hsl(var(--border))] px-5 py-3 text-sm font-semibold">
              Publish when verified
            </button>
          </div>
        </form>

        <aside className="space-y-6">
          <div className="rounded-[1.75rem] border border-[hsl(var(--border))] bg-white p-6">
            <h2 className="text-lg font-semibold">Autosave checkpoints</h2>
            <div className="mt-4 space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
              <p className="rounded-2xl bg-[hsl(var(--background))] p-4">Address, rent, and dates save as a draft.</p>
              <p className="rounded-2xl bg-[hsl(var(--background))] p-4">Lease PDF metadata persists before upload completion.</p>
              <p className="rounded-2xl bg-[hsl(var(--background))] p-4">Unverified users are blocked from publishing until verification clears.</p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[hsl(var(--border))] bg-white p-6">
            <h2 className="text-lg font-semibold">Permission gates</h2>
            <p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              The final version of this page should require authentication, a verified university or approved manual
              review, and a successful lease file upload before activation.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
