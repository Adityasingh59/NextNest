import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { getFunnel, getKpis, getScamStats, getTransparencyExperiment } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { cn, formatPercent } from "@/lib/utils";

const KPI_TARGETS = [
  { key: "activationRate", label: "Activation rate", target: 0.6, help: "Listing or preferences within 48h of signup" },
  { key: "matchToRequestRate", label: "Match-to-request", target: 0.15, help: "Viewed matches that were requested" },
  { key: "requestToAcceptRate", label: "Request-to-accept", target: 0.4, help: "Requests accepted by the tenant" },
  { key: "acceptToSignRate", label: "Accept-to-sign", target: 0.8, help: "Accepted matches where both signed" }
] as const;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ market?: string }> }) {
  await requireAdmin();
  const { market: slug } = await searchParams;
  const markets = await prisma.market.findMany({ orderBy: { name: "asc" } });
  const market = markets.find((candidate) => candidate.slug === slug);

  const [funnel, kpis, experiment, scam] = await Promise.all([
    getFunnel(market?.id),
    getKpis(market?.id),
    getTransparencyExperiment(market?.id),
    getScamStats(market?.id)
  ]);
  const maxCount = Math.max(1, ...funnel.map((stage) => stage.count));
  const weakest = funnel
    .slice(1)
    .filter((stage) => stage.conversionFromPrevious !== null)
    .sort((a, b) => (a.conversionFromPrevious ?? 1) - (b.conversionFromPrevious ?? 1))[0];

  return (
    <div className="flex flex-col gap-10">
      <PageHeader overline="North star: completed transfers per month" title="Analytics" />

      <nav aria-label="Market" className="flex flex-wrap gap-2">
        {[{ slug: undefined, name: "All markets" }, ...markets].map((option) => (
          <Link
            key={option.slug ?? "all"}
            href={option.slug ? `/analytics?market=${option.slug}` : "/analytics"}
            aria-current={option.slug === market?.slug ? "page" : undefined}
            className={cn("nn-btn nn-btn-sm", option.slug === market?.slug && "nn-btn-primary")}
          >
            {option.name}
          </Link>
        ))}
      </nav>

      <section className="flex flex-col gap-4" aria-labelledby="funnel-heading">
        <h2 id="funnel-heading" className="text-heading">
          Funnel
        </h2>
        <ol className="nn-card flex flex-col gap-3 p-5">
          {funnel.map((stage) => (
            <li key={stage.key} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3">
              <span className="text-body-sm">{stage.label}</span>
              <span className="h-3 overflow-hidden rounded-full bg-score-track">
                <span className="block h-full rounded-full bg-score" style={{ width: `${(stage.count / maxCount) * 100}%` }} />
              </span>
              <span className="w-24 text-right text-body-sm tabular-nums">
                <strong>{stage.count}</strong>
                {stage.conversionFromPrevious !== null ? <span className="text-ink-muted"> · {formatPercent(stage.conversionFromPrevious)}</span> : null}
              </span>
            </li>
          ))}
        </ol>
        {weakest ? (
          <p className="text-body-sm text-ink-muted">
            Weakest step: <strong className="text-ink">{weakest.label}</strong> at {formatPercent(weakest.conversionFromPrevious)} from the step before.
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="text-heading">
          KPIs
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {KPI_TARGETS.map((kpi) => {
            const value = kpis[kpi.key];
            const onTarget = value !== null && value >= kpi.target;
            return (
              <div key={kpi.key} className="nn-card p-4">
                <p className="text-body-sm text-ink-muted">{kpi.label}</p>
                <p className="text-display tabular-nums">{formatPercent(value)}</p>
                <p className={cn("text-caption", value === null ? "text-ink-faint" : onTarget ? "text-nest" : "text-amber")}>
                  Target {formatPercent(kpi.target)} · {kpi.help}
                </p>
              </div>
            );
          })}
          <div className="nn-card p-4">
            <p className="text-body-sm text-ink-muted">Time to first match view</p>
            <p className="text-display tabular-nums">{kpis.medianHoursToFirstMatchView === null ? "—" : `${kpis.medianHoursToFirstMatchView.toFixed(1)}h`}</p>
            <p className="text-caption text-ink-faint">Median, target under 24h</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="exp-heading">
        <h2 id="exp-heading" className="text-heading">
          Experiment 1: fit score transparency
        </h2>
        <p className="text-body-sm text-ink-muted">Control sees the score only; treatment sees the per-dimension breakdown. Directional signal at 50+ views per group.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {experiment.map((group) => (
            <div key={group.variant} className="nn-card p-4">
              <p className="nn-overline">{group.variant}</p>
              <p className="text-display tabular-nums">{formatPercent(group.rate)}</p>
              <p className="text-caption text-ink-muted">
                {group.requested} requests / {group.viewed} viewed matches
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="scam-heading">
        <h2 id="scam-heading" className="text-heading">
          Scam detection
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Listings screened", value: String(scam.screened) },
            { label: "Held for review", value: `${scam.held} (${scam.pendingReview} pending)` },
            { label: "Precision (target 85%+)", value: formatPercent(scam.precision) },
            { label: "False positive rate (target <5%)", value: formatPercent(scam.falsePositiveRate) }
          ].map((stat) => (
            <div key={stat.label} className="nn-card p-4">
              <p className="text-body-sm text-ink-muted">{stat.label}</p>
              <p className="text-heading-lg tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
