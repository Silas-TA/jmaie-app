"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import clsx from "clsx";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { addCategoryRow, deleteCategoryRow, renameCategory, setBudget, setCategoryActual } from "@/app/actions";
import { SECTIONS, isHaircutExpense } from "@/lib/plan/budget";
import HaircutToggle from "./HaircutToggle";

type Row = { id: string; name: string; type: string; color: string; budgeted: number; actual: number; notes: string | null };

const fmt = (n: number) => n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (s: string) => Number(s.replace(",", ".")) || 0;
const clean = (s: string) => s.replace(/[^0-9.,]/g, "");

/** Budget vs actual, one card per section, like v0.1: type straight into Budget or Actual. */
export default function BudgetActual({ rows, year, month, includeHaircut }: { rows: Row[]; year: number; month: number; includeHaircut: boolean }) {
  const excluded = (r: Row) => !includeHaircut && (r.type === "income_haircut" || isHaircutExpense(r.type, r.name));
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Type into <b className="text-ink">Budget</b> or <b className="text-ink">Actual</b> and press Enter (or click away) to save.
        Click a name to rename it. Use <b className="text-ink">+ Add row</b> for something new.
      </p>
      {SECTIONS.map((s) => {
        const order = (t: string) => ["income_salary", "income_haircut", "income_other"].indexOf(t);
        const list = rows
          .filter((r) => (s.types as readonly string[]).includes(r.type))
          .sort((a, b) => order(a.type) - order(b.type) || a.name.localeCompare(b.name));
        const counted = list.filter((r) => !excluded(r));
        const bud = counted.reduce((a, r) => a + r.budgeted, 0);
        const act = counted.reduce((a, r) => a + r.actual, 0);
        return (
          <section key={s.type} className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3 sm:px-5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              <h2 className="text-sm font-semibold">{s.label}</h2>
              <span className="num ml-auto text-xs text-muted">
                <span className="text-ink">€{fmt(act)}</span> / €{fmt(bud)}
              </span>
            </div>
            <div className={clsx("hidden grid-cols-[1fr_7rem_7rem_6rem_2rem] gap-2 px-5 pt-2 text-[11px] uppercase tracking-wide text-muted", list.length > 0 && "sm:grid")}>
              <span>Name</span><span className="text-right">Budget</span><span className="text-right">Actual</span><span className="text-right">{s.income ? "Diff" : "Left"}</span><span />
            </div>
            <ul className="divide-y divide-line">
              {list.map((r) => <Line key={r.id} r={r} income={s.income} year={year} month={month} includeHaircut={includeHaircut} excluded={excluded(r)} />)}
            </ul>
            <AddRow type={s.type} year={year} month={month} locked={false} />
          </section>
        );
      })}
    </div>
  );
}

function MoneyInput({ value, onSave, label, disabled }: { value: number; onSave: (v: string) => void; label: string; disabled?: boolean }) {
  const [v, setV] = useState(value ? String(value) : "");
  // Keep in sync when the server value changes (e.g. after Quick add).
  useEffect(() => setV(value ? String(value) : ""), [value]);
  const commit = () => {
    if (Math.abs(num(v) - value) >= 0.005) onSave(v || "0");
  };
  return (
    <input
      aria-label={label}
      inputMode="decimal"
      disabled={disabled}
      className="input num !px-2 !py-1.5 text-right text-sm disabled:opacity-60"
      placeholder="0.00"
      value={v}
      onChange={(e) => setV(clean(e.target.value))}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}

function Line({ r, income, year, month, includeHaircut, excluded }: { r: Row; income: boolean; year: number; month: number; includeHaircut: boolean; excluded: boolean }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(r.name);
  const locked = r.type === "income_haircut";
  const diff = income ? r.actual - r.budgeted : r.budgeted - r.actual;
  const bad = r.budgeted > 0 && diff < -0.005 && !income;

  const run = (fn: () => Promise<void>) =>
    start(async () => {
      try { setErr(""); await fn(); } catch (e) { setErr(e instanceof Error ? e.message : "Could not save"); }
    });

  return (
    <li className={clsx("px-4 py-2.5 sm:px-5", pending && "opacity-60", excluded && "bg-raised/30")}>
      <div className="grid grid-cols-[1fr_auto] items-center gap-2 sm:grid-cols-[1fr_7rem_7rem_6rem_2rem]">
        {/* Name */}
        <div className="min-w-0">
          {editing ? (
            <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); run(async () => { await renameCategory(r.id, name); setEditing(false); }); }}>
              <input autoFocus aria-label="Row name" className="input !py-1.5 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
              <button aria-label="Save name" className="rounded p-1.5 text-good"><Check size={15} /></button>
              <button type="button" aria-label="Cancel" className="rounded p-1.5 text-muted" onClick={() => { setName(r.name); setEditing(false); }}><X size={15} /></button>
            </form>
          ) : (
            <button className="group flex max-w-full items-center gap-1.5 text-left" onClick={() => setEditing(true)} title="Rename">
              <span className="truncate text-sm font-medium">{r.name}</span>
              <Pencil size={12} className="shrink-0 text-muted opacity-60 group-hover:opacity-100" />
            </button>
          )}
          {r.notes && !editing && <p className="truncate text-xs text-muted">{r.notes}</p>}
        </div>
        {/* Delete (mobile position) */}
        <DeleteBtn r={r} year={year} month={month} run={run} className="sm:hidden" />

        <div className="col-span-2 grid grid-cols-3 gap-2 sm:col-span-3 sm:grid-cols-[7rem_7rem_6rem]">
          <label className="text-[11px] uppercase text-muted sm:contents">
            <span className="sm:hidden">Budget</span>
            <MoneyInput label={`Budget for ${r.name}`} value={r.budgeted} onSave={(v) => run(() => setBudget(r.id, year, month, num(v)))} />
          </label>
          <label className="text-[11px] uppercase text-muted sm:contents">
            <span className="sm:hidden">Actual</span>
            {locked ? (
              <Link href={`/cuts?year=${year}&month=${month}`} className="input num block !px-2 !py-1.5 text-right text-sm normal-case text-good" title="Comes from your haircuts on the iCut page">
                {fmt(r.actual)}
              </Link>
            ) : (
              <MoneyInput label={`Actual for ${r.name}`} value={r.actual} onSave={(v) => run(() => setCategoryActual(r.id, year, month, v))} />
            )}
          </label>
          <div className="text-[11px] uppercase text-muted sm:contents">
            <span className="sm:hidden">{income ? "Diff" : "Left"}</span>
            <p className={clsx("num py-1.5 text-right text-sm normal-case", bad ? "text-bad" : income && diff >= 0 && r.actual > 0 ? "text-good" : "text-ink")}>
              {r.budgeted || r.actual ? (diff < 0 ? "−" : income && diff > 0 ? "+" : "") + "€" + fmt(Math.abs(diff)) : "—"}
            </p>
          </div>
        </div>
        <DeleteBtn r={r} year={year} month={month} run={run} className="hidden sm:flex" />
      </div>
      {locked && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <HaircutToggle on={includeHaircut} compact />
          <p className="text-xs text-muted">
            {includeHaircut ? "Actual is the total of paid haircuts on the iCut page." : "Left out of your totals, along with iCut costs."}
          </p>
        </div>
      )}
      {!locked && excluded && <p className="mt-1 text-xs text-muted">Not counted while haircut income is switched off.</p>}
      {err && <p className="mt-1 text-xs text-bad">{err}</p>}
    </li>
  );
}

function DeleteBtn({ r, year, month, run, className }: {
  r: Row; year: number; month: number; run: (fn: () => Promise<void>) => void; className?: string;
}) {
  return (
    <button
      aria-label={`Delete ${r.name}`}
      title="Delete row"
      className={clsx("items-center justify-center justify-self-end rounded-md p-1.5 text-muted hover:text-bad", className)}
      onClick={() =>
        confirm(`Delete "${r.name}"?\n\nThis removes it and this month's amounts for it. Entries from earlier months stay in your history.`) &&
        run(() => deleteCategoryRow(r.id, year, month))
      }
    >
      <Trash2 size={15} />
    </button>
  );
}

function AddRow({ type, year, month, locked }: { type: string; year: number; month: number; locked: boolean }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", budget: "", actual: "" });
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="flex w-full items-center gap-1.5 border-t border-line px-4 py-2.5 text-sm text-muted hover:bg-raised/50 hover:text-ink sm:px-5">
        <Plus size={14} /> Add row
      </button>
    );

  return (
    <form
      className="grid grid-cols-3 gap-2 border-t border-line bg-raised/40 px-4 py-3 sm:grid-cols-[1fr_7rem_7rem_auto] sm:px-5"
      onSubmit={(e) => {
        e.preventDefault();
        setErr("");
        start(async () => {
          try {
            await addCategoryRow({ name: f.name, type, year, month, budget: f.budget, actual: locked ? "" : f.actual });
            setF({ name: "", budget: "", actual: "" });
            setOpen(false);
          } catch (e) {
            setErr(e instanceof Error ? e.message : "Could not add");
          }
        });
      }}
    >
      <input autoFocus aria-label="New row name" className="input col-span-3 !py-1.5 text-sm sm:col-span-1" placeholder="Name, e.g. Netflix" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input aria-label="New row budget" inputMode="decimal" className="input num !px-2 !py-1.5 text-right text-sm" placeholder="Budget" value={f.budget} onChange={(e) => setF({ ...f, budget: clean(e.target.value) })} />
      <input aria-label="New row actual" inputMode="decimal" disabled={locked} className="input num !px-2 !py-1.5 text-right text-sm disabled:opacity-50" placeholder="Actual" value={f.actual} onChange={(e) => setF({ ...f, actual: clean(e.target.value) })} />
      <div className="flex gap-1">
        <button className="btn-primary !px-3 !py-1.5" disabled={pending} aria-label="Add row"><Check size={16} /></button>
        <button type="button" className="btn-ghost !px-3 !py-1.5" aria-label="Cancel" onClick={() => { setOpen(false); setErr(""); }}><X size={16} /></button>
      </div>
      {err && <p className="col-span-3 text-xs text-bad sm:col-span-4">{err}</p>}
    </form>
  );
}
