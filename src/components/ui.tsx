import Link from "next/link";
import { AlertTriangle, BadgeCheck, CircleSlash, Home, ShieldCheck } from "lucide-react";
import type { ListingState } from "@prisma/client";
import type { FitDimension } from "@/lib/fit-score";
import { cn, formatCurrency } from "@/lib/utils";

type Tone = "neutral" | "nest" | "sky" | "amber" | "red";

// Full class names (not built with template strings) so Tailwind keeps them.
const BADGE_TONES: Record<Tone, string> = {
  neutral: "",
  nest: "nn-badge-nest",
  sky: "nn-badge-sky",
  amber: "nn-badge-amber",
  red: "nn-badge-red"
};

export function Badge({ tone = "neutral", icon, children }: { tone?: Tone; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className={cn("nn-badge", BADGE_TONES[tone])}>
      {icon ? (
        <span aria-hidden className="inline-flex">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <Badge tone="nest" icon={<BadgeCheck size={12} />}>
      Verified student
    </Badge>
  );
}

export function ScreenedBadge() {
  return (
    <Badge tone="nest" icon={<ShieldCheck size={12} />}>
      Scam screened
    </Badge>
  );
}

const STATE_BADGES: Record<ListingState, { tone: Tone; label: string; icon?: React.ReactNode }> = {
  DRAFT: { tone: "neutral", label: "Draft" },
  SCREENING: { tone: "sky", label: "Screening" },
  UNDER_REVIEW: { tone: "amber", label: "Under review", icon: <AlertTriangle size={12} /> },
  ACTIVE: { tone: "nest", label: "Live", icon: <ShieldCheck size={12} /> },
  MATCHED: { tone: "sky", label: "Matched" },
  TRANSFERRED: { tone: "nest", label: "Transferred", icon: <BadgeCheck size={12} /> },
  REJECTED: { tone: "red", label: "Not approved", icon: <CircleSlash size={12} /> },
  ARCHIVED: { tone: "neutral", label: "Archived" }
};

export function ListingStateBadge({ state }: { state: ListingState }) {
  const badge = STATE_BADGES[state];
  return (
    <Badge tone={badge.tone} icon={badge.icon}>
      {badge.label}
    </Badge>
  );
}

/** Fit score with the numeric value always beside the bar; breakdown rows unless compact. */
export function FitScoreBar({
  score,
  dimensions,
  compact = false,
  label = "Fit score"
}: {
  score: number;
  dimensions?: FitDimension[];
  compact?: boolean;
  label?: string;
}) {
  const value = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-body-sm font-medium text-ink-muted">{label}</span>
        <span className="text-body font-semibold text-score">{value}% match</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-score-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div className="h-full rounded-full bg-score transition-[width] duration-300" style={{ width: `${value}%` }} />
      </div>
      {!compact && dimensions ? (
        <dl className="mt-2 flex flex-col divide-y divide-line-subtle">
          {dimensions.map((dimension) => (
            <div key={dimension.key} className="flex items-center justify-between gap-3 py-1.5 text-caption font-normal">
              <dt className="text-ink-muted">
                {dimension.label} <span className="text-ink-faint">· {dimension.weight}%</span>
              </dt>
              <dd className="flex items-center gap-2 text-right">
                <span className="font-medium text-ink">{dimension.value}</span>
                <span className="w-10 tabular-nums text-ink-faint">{Math.round(dimension.points)}/{dimension.weight}</span>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

export function PhotoPlaceholder() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-ink-faint">
      <Home size={32} strokeWidth={1.5} />
    </span>
  );
}

export type ListingCardProps = {
  href: string;
  title: string;
  monthlyRent: number;
  location: string;
  dates: string;
  photoUrl?: string;
  tags: string[];
  score?: number;
  summary?: string;
  isSample?: boolean;
  footer?: React.ReactNode;
};

export function ListingCard({ href, title, monthlyRent, location, dates, photoUrl, tags, score, summary, isSample, footer }: ListingCardProps) {
  return (
    <article className="nn-card overflow-hidden">
      <Link href={href} className="block focus-visible:outline-offset-[-2px]">
        <div
          className="relative flex h-[140px] items-start justify-between gap-2 bg-surface-sunken bg-cover bg-center p-3 sm:h-40"
          style={photoUrl ? { backgroundImage: `url(${JSON.stringify(photoUrl)})` } : undefined}
        >
          {photoUrl ? null : <PhotoPlaceholder />}
          <span className="relative">{isSample ? <Badge tone="sky">Sample listing</Badge> : null}</span>
          <div className="relative flex flex-wrap justify-end gap-1">
            <VerifiedBadge />
            <ScreenedBadge />
          </div>
        </div>
        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-heading-sm text-ink">{title}</h3>
            <span className="whitespace-nowrap text-heading-sm text-nest">{formatCurrency(monthlyRent)}/mo</span>
          </div>
          <p className="text-body-sm text-ink-muted">
            {location} · {dates}
          </p>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 4).map((tag) => (
                <span key={tag} className="nn-tag">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {score !== undefined ? <FitScoreBar score={score} compact /> : null}
          {summary ? <p className="text-body-sm text-ink-muted">{summary.replace(/^\d+% match: /, "")}</p> : null}
        </div>
      </Link>
      {footer ? <div className="border-t border-line-subtle px-4 py-3">{footer}</div> : null}
    </article>
  );
}

export function PageHeader({ overline, title, description, actions }: { overline?: string; title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {overline ? <p className="nn-overline mb-1">{overline}</p> : null}
        <h1 className="text-heading-lg sm:text-display">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-surface-sunken px-6 py-10 text-center">
      <p className="text-heading-sm">{title}</p>
      {children ? <div className="mx-auto mt-2 max-w-md text-body-sm text-ink-muted">{children}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Banner({ tone, icon, children }: { tone: "sky" | "amber" | "red" | "nest"; icon?: React.ReactNode; children: React.ReactNode }) {
  const tones = {
    sky: "bg-sky-soft text-sky",
    amber: "bg-amber-soft text-amber",
    red: "bg-red-soft text-red",
    nest: "bg-nest-soft text-nest"
  };

  return (
    <div className={cn("flex items-start gap-2 rounded-md px-4 py-3 text-body-sm", tones[tone])} role="status">
      {icon ? (
        <span aria-hidden className="mt-0.5">
          {icon}
        </span>
      ) : null}
      <div>{children}</div>
    </div>
  );
}
