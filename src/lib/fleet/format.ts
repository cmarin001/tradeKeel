export const EPOCH = Date.UTC(2026, 10, 14, 14, 30, 0);

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function round(n: number, digits = 2): number {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

export function formatUsd(n: number, digits?: number): string {
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(n);
  if (!Number.isFinite(v)) return "—";
  if (v >= 1_000_000) return `${sign}$${(v / 1_000_000).toFixed(2)}M`;
  const d = digits ?? (v >= 1000 ? 0 : 2);
  const [whole, frac] = v.toFixed(d).split(".");
  const withComma = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}$${frac ? `${withComma}.${frac}` : withComma}`;
}

export function formatSignedUsd(n: number): string {
  const body = formatUsd(Math.abs(n), Math.abs(n) < 1000 ? 2 : 0);
  if (n > 0.004) return `+${body}`;
  if (n < -0.004) return `-${body}`;
  return formatUsd(0, 2);
}

export function formatPct(fraction: number, digits = 1): string {
  if (!Number.isFinite(fraction)) return "—";
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function formatBps(bps: number): string {
  return `${Math.round(bps)} bps`;
}

export function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "—";
  if (sec < 90) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatAge(sec: number): string {
  if (sec < 90) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.max(1, Math.round(sec / 60))}m`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h`;
  return `${Math.round(sec / 86400)}d`;
}

export function formatClock(simSec: number): string {
  const total = Math.floor(EPOCH / 1000 + simSec);
  const h = Math.floor(total / 3600) % 24;
  const m = Math.floor(total / 60) % 60;
  const s = ((total % 60) + 60) % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatPx(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 100) return n.toFixed(2);
  if (n >= 1) return n.toFixed(4);
  if (n >= 0.01) return n.toFixed(5);
  return n.toPrecision(3);
}

export function formatTokens(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const v = Math.abs(n);
  if (v >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  if (v >= 1) return n.toFixed(2);
  return n.toPrecision(3);
}

export function formatPctPoints(fraction: number): string {
  const sign = fraction > 0 ? "+" : fraction < 0 ? "" : "";
  return `${sign}${(fraction * 100).toFixed(1)}%`;
}
