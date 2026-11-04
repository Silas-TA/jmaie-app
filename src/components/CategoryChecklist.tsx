"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";
import { addTransaction } from "@/app/actions";

type Row = { id: string; name: string; color: string; group: string; budgeted: number; actual: number; notes: string | null };

const GROUPS: { key: string; label: string }[] = [
  { key: "income", label: "Income" },
  { key: "needs", label: "Needs" },
  { key: "wants", label: "Wants" },
  { key: "giving", label: "Family" },
  { key: "business", label: "iCut costs" },
  { key: "savings", label: "Savings" },
];

const fmt = (n: number) => n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Every category for the month, with a box to type what you spent / received. */
export default function CategoryChecklist({ rows, date }: { rows: Row[]; date: string }) {
  return (
    <section className="card">
      <div className="border-b border-line px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold">Fill in this month</h2>
        <p className="text-xs text-muted">Type what you spent or received next to a category and press Enter. Amounts add up if you enter more than once.</p>
      </div>
      {GROUPS.map((g) => {
        const list = rows.filter((r) => r.group === g.key).sort((a, b) => Number(b.budgeted > 0) - Number(a.budgeted > 0) || a.name.localeCompare(b.name));
        if (!list.length) return null;
        const act = list.reduce((a, r) => a + r.actual, 0);
        const bud = list.reduce((a, r) => a + r.budgeted, 0);
        return (
          <details key={g.key} open className="group border-b border-line last:border-b-0">
            <summary className="flex cursor-pointer list-none items-center gap-2 bg-raised/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted sm:px-5">
              <ChevronDown size={14} className="transition group-open:rotate-0 -rotate-90" />
              {g.label}
              <span className="num ml-auto font-normal normal-case tracking-normal">€{fmt(act)}{bud > 0 && ` / €${fmt(bud)}`}</span>
            </summary>
            <ul className="divide-y divide-line">
              {list.map((r) => <Item key={r.id} r={r} income={g.key === "income"} date={date} />)}
            </ul>
          </details>
        );
      })}
    </section>
  );
}

function Item({ r, income, date }: { r: Row; income: boolean; date: string }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");
  const [flash, setFlash] = useState(false);
  const [pending, start] = useTransition();
  const remaining = Math.round((r.budgeted - r.actual) * 100) / 100;
  const done = r.budgeted > 0 && r.actual >= r.budgeted - 0.005;
  const over = !income && r.budgeted > 0 && r.actual > r.budgeted + 0.005;

  const log = (amount: number | string) =>
    start(async () => {
      try {
        setErr("");
        await addTransaction({ direction: income ? "income" : "expense", amount, date, categoryId: r.id, description: r.name });
        setVal("");
        setFlash(true);
        setTimeout(() => setFlash(false), 1200);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not save");
      }
    });

  return (
    <li className={clsx("flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 sm:px-5", pending && "opacity-60")}>
      <span className={clsx("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", done ? "border-good bg-good text-white" : "border-line")}>
        {done && <Check size={12} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{r.name}</p>
        <p className={clsx("num text-xs", over ? "text-bad" : "text-muted")}>
          €{fmt(r.actual)}{r.budgeted > 0 ? ` of €${fmt(r.budgeted)}` : " so far"}
          {over && ` · €${fmt(r.actual - r.budgeted)} over`}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => log(remaining)}
            disabled={pending}
            className="chip num !px-2.5 !py-1 text-xs text-muted hover:border-accent hover:text-ink"
            title={r.actual > 0 ? "Log the rest of the budget" : "Log the full budgeted amount"}
          >
            {income ? "+" : ""}€{fmt(remaining)}
          </button>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (Number(val.replace(",", ".")) > 0) log(val);
          }}
          className="flex items-center gap-1"
        >
          <input
            aria-label={`Amount for ${r.name}`}
            inputMode="decimal"
            className={clsx("input num !w-24 !px-2 !py-1.5 text-right text-sm", flash && "!border-good")}
            placeholder="€"
            value={val}
            onChange={(e) => setVal(e.target.value.replace(/[^0-9.,]/g, ""))}
          />
          <button aria-label={`Add to ${r.name}`} className="btn-ghost !px-2.5 !py-1.5" disabled={pending || !val}>
            <Check size={14} />
          </button>
        </form>
      </div>
      {err && <p className="w-full text-xs text-bad">{err}</p>}
    </li>
  );
}
