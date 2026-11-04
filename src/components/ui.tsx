import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel, shiftMonth } from "@/lib/dates";

export function PageHeader({ eyebrow, title, right, sub }: { eyebrow?: string; title: string; right?: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-muted">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {right}
    </header>
  );
}

export function Card({ title, right, children, className, pad = true }: {
  title?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string; pad?: boolean;
}) {
  return (
    <section className={clsx("card", className)}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {right}
        </div>
      )}
      <div className={pad ? "p-4 sm:p-5" : ""}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: React.ReactNode; tone?: "good" | "bad" | "accent" }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={clsx("num mt-1.5 text-2xl font-semibold", tone === "good" && "text-good", tone === "bad" && "text-bad", tone === "accent" && "text-accent")}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function Bar({ value, max, color, over }: { value: number; max: number; color?: string; over?: boolean }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : value > 0 ? 100 : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-raised">
      <div
        className={clsx("h-full rounded-full transition-all", over && "!bg-bad")}
        style={{ width: `${pct}%`, background: color ?? "rgb(var(--accent))" }}
      />
    </div>
  );
}

export function MonthNav({ base, year, month }: { base: string; year: number; month: number }) {
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const link = (y: number, m: number) => `${base}?year=${y}&month=${m}`;
  return (
    <div className="flex items-center gap-1 rounded-xl border border-line bg-panel p-1">
      <Link aria-label="Previous month" href={link(prev.year, prev.month)} className="rounded-lg p-2 text-muted hover:bg-raised hover:text-ink">
        <ChevronLeft size={16} />
      </Link>
      <span className="min-w-[8.5rem] text-center text-sm font-medium">{monthLabel(year, month)}</span>
      <Link aria-label="Next month" href={link(next.year, next.month)} className="rounded-lg p-2 text-muted hover:bg-raised hover:text-ink">
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

export function Tabs({ items, active }: { items: { href: string; label: string }[]; active: string }) {
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-line bg-panel p-1">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={clsx("whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition", active === i.href ? "bg-accent/15 font-medium text-accent" : "text-muted hover:text-ink")}
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted">{children}</p>;
}

export const MONEY_TABS = [
  { href: "/money", label: "Transactions" },
  { href: "/money/budget", label: "Budget" },
  { href: "/money/goals", label: "Savings & investing" },
  { href: "/cuts", label: "iCut" },
];

export const HEALTH_TABS = [
  { href: "/health", label: "Today" },
  { href: "/health/meals", label: "Meal plan" },
  { href: "/health/gym", label: "Gym" },
  { href: "/health/progress", label: "Progress" },
];
