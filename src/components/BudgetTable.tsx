"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { setBudget } from "@/app/actions";

type Row = { id: string; name: string; color: string; budgeted: number; actual: number; notes: string | null };

const fmt = (n: number) => n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function BudgetTable({ rows, year, month, income = false }: { rows: Row[]; year: number; month: number; income?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((r) => (
        <BudgetRow key={r.id} r={r} year={year} month={month} income={income} />
      ))}
    </ul>
  );
}

function BudgetRow({ r, year, month, income }: { r: Row; year: number; month: number; income: boolean }) {
  const [val, setVal] = useState(r.budgeted ? String(r.budgeted) : "");
  const [pending, start] = useTransition();
  const over = !income && r.budgeted > 0 && r.actual > r.budgeted + 0.005;
  const pct = r.budgeted > 0 ? Math.min(100, (r.actual / r.budgeted) * 100) : r.actual > 0 ? 100 : 0;
  const left = r.budgeted - r.actual;

  const commit = () => {
    const n = Number(val.replace(",", ".")) || 0;
    if (Math.abs(n - r.budgeted) < 0.005) return;
    start(() => setBudget(r.id, year, month, n));
  };

  return (
    <li className={clsx("px-4 py-3 sm:px-5", pending && "opacity-60")}>
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{r.name}</p>
          {r.notes && <p className="truncate text-xs text-muted">{r.notes}</p>}
        </div>
        <div className="num w-[4.5rem] shrink-0 text-right text-sm sm:w-24">
          <span className={clsx(over && "text-bad", income && r.actual > 0 && "text-good")}>€{fmt(r.actual)}</span>
        </div>
        <span className="hidden text-xs text-muted sm:inline">of</span>
        <input
          aria-label={`Budget for ${r.name}`}
          inputMode="decimal"
          className="input num !w-20 shrink-0 !px-2 !py-1.5 text-right text-sm sm:!w-24"
          placeholder="0"
          value={val}
          onChange={(e) => setVal(e.target.value.replace(/[^0-9.,]/g, ""))}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
      </div>
      {(r.budgeted > 0 || r.actual > 0) && (
        <div className="mt-2 flex items-center gap-3 pl-5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised">
            <div className={clsx("h-full rounded-full", over ? "bg-bad" : income ? "bg-good" : "")} style={{ width: `${pct}%`, background: over || income ? undefined : r.color }} />
          </div>
          <span className={clsx("num w-28 text-right text-xs", over ? "text-bad" : "text-muted")}>
            {income ? (r.actual >= r.budgeted ? "target reached" : `€${fmt(r.budgeted - r.actual)} to go`) : over ? `€${fmt(-left)} over` : `€${fmt(left)} left`}
          </span>
        </div>
      )}
    </li>
  );
}
