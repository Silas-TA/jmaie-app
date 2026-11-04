// All "today" logic runs in Lithuanian time, wherever the server is.
export const TZ = "Europe/Vilnius";

export function todayISO(): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function currentYM(): { year: number; month: number } {
  const [y, m] = todayISO().split("-").map(Number);
  return { year: y, month: m };
}

export function parseYM(sp: { year?: string; month?: string }): { year: number; month: number } {
  const cur = currentYM();
  const year = Number(sp.year) || cur.year;
  const month = Number(sp.month) || cur.month;
  return { year, month: Math.min(12, Math.max(1, month)) };
}

export function monthRange(year: number, month: number): [string, string] {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const ny = month === 12 ? year + 1 : year;
  const nm = month === 12 ? 1 : month + 1;
  const end = `${ny}-${String(nm).padStart(2, "0")}-01`;
  return [start, end];
}

export function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

export function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** pg returns DATE columns as JS Dates at local midnight; turn them back into YYYY-MM-DD. */
export function isoDate(d: Date | string): string {
  if (typeof d === "string") return d.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 0 = Monday … 6 = Sunday */
export function weekdayIndex(iso: string): number {
  const d = new Date(iso + "T12:00:00Z").getUTCDay();
  return (d + 6) % 7;
}

export function prettyDate(iso: string): string {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export const eur = (n: number, digits = 2) =>
  "€" +
  n.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
