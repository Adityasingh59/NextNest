import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  MATCH_PENDING: "bg-amber-100 text-amber-800",
  READY_FOR_SIGNATURE: "bg-sky-100 text-sky-800",
  "Verified Student": "bg-emerald-100 text-emerald-800",
  "ID Verified": "bg-sky-100 text-sky-800",
  "Pending Review": "bg-amber-100 text-amber-800",
  Done: "bg-emerald-100 text-emerald-800",
  Live: "bg-sky-100 text-sky-800",
  Queued: "bg-stone-200 text-stone-700"
};

export function StatusBadge({
  value,
  className
}: {
  value: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        styles[value] ?? "bg-stone-100 text-stone-700",
        className
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}
