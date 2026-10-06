import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(dollars: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(dollars);
}

/** Dates are stored at UTC midnight, so format in UTC to avoid off-by-one days. */
export function formatDate(date: Date, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(date);
}

export function formatDateRange(start: Date, end: Date) {
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  return `${formatDate(start, { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) })} – ${formatDate(end)}`;
}

export function formatPercent(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}
