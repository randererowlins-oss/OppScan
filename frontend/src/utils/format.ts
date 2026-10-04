/** Small display helpers shared across pages. */

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "No deadline";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function deadlineCountdown(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return "Expired";
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes tomorrow";
  if (days <= 30) return `${days} days left`;
  return formatDate(iso);
}

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  NGN: "₦",
  KES: "KSh",
  GHS: "GH₵",
};

export function formatMoney(
  min?: number | null,
  max?: number | null,
  currency?: string | null,
): string | null {
  if (min == null && max == null) return null;
  const sym = currency ? (currencySymbols[currency] ?? `${currency} `) : "";
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
      : n >= 1_000
        ? `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}k`
        : n.toLocaleString();
  if (min != null && max != null) {
    if (min === max) return `${sym}${fmt(min)}`;
    return `${sym}${fmt(min)} – ${sym}${fmt(max)}`;
  }
  const v = min ?? max ?? 0;
  return `${min != null ? "from " : "up to "}${sym}${fmt(v)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function scoreTone(score: number): string {
  if (score >= 85) return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  if (score >= 70) return "bg-teal-100 text-teal-800 ring-teal-200";
  if (score >= 55) return "bg-amber-100 text-amber-800 ring-amber-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export function typeTone(type: string): string {
  switch (type) {
    case "Job":
      return "bg-blue-100 text-blue-800";
    case "Grant":
      return "bg-emerald-100 text-emerald-800";
    case "Tender":
      return "bg-purple-100 text-purple-800";
    case "Freelance":
      return "bg-orange-100 text-orange-800";
    case "Funding":
      return "bg-pink-100 text-pink-800";
    case "Scholarship":
      return "bg-cyan-100 text-cyan-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
