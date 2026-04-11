import { StatusBadge } from "@/components/status-badge";
import { integrationReadiness, workflowSteps } from "@/lib/marketplace";

export default function WorkflowPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="rounded-[2rem] border border-[hsl(var(--border))] bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[hsl(var(--primary))]">Workflow map</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Multi-party handoff states, from listing draft to signed lease.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[hsl(var(--muted-foreground))]">
          This page keeps the product honest about where the MVP already has UI coverage and where third-party
          integrations still need to be wired in.
        </p>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] border border-[hsl(var(--border))] bg-white p-8">
          <h2 className="text-2xl font-semibold">Lease transfer flow</h2>
          <div className="mt-6 space-y-4">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="grid gap-4 rounded-[1.5rem] border border-[hsl(var(--border))] p-5 md:grid-cols-[48px_minmax(0,1fr)_auto] md:items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--background))] text-sm font-semibold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{step.description}</p>
                </div>
                <StatusBadge value={step.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-[hsl(var(--border))] bg-white p-6">
            <h2 className="text-lg font-semibold">Landlord portal states</h2>
            <div className="mt-4 space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
              <p className="rounded-2xl bg-[hsl(var(--background))] p-4">Approve: move listing to `READY_FOR_SIGNATURE`.</p>
              <p className="rounded-2xl bg-[hsl(var(--background))] p-4">Reject: require reason and return listing to `ACTIVE`.</p>
              <p className="rounded-2xl bg-[hsl(var(--background))] p-4">Signed PDF: archive to S3 and make it downloadable to both parties.</p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[hsl(var(--border))] bg-white p-6">
            <h2 className="text-lg font-semibold">Integration readiness</h2>
            <div className="mt-4 space-y-4">
              {integrationReadiness.map((integration) => (
                <div key={integration.name} className="rounded-[1.5rem] bg-[hsl(var(--background))] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold">{integration.name}</p>
                    <StatusBadge value="Queued" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{integration.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
