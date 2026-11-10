/** Short "time since posted" label, e.g. "just now", "5m", "3h", "2d", "4w", "1y". */
export function timeAgo(date: string | Date, now: Date = new Date()): string {
  const s = Math.max(0, Math.floor((now.getTime() - new Date(date).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (d < 365) return `${w}w ago`;
  return `${Math.floor(d / 365)}y ago`;
}
