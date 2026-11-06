"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import clsx from "clsx";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { addCategoryRow, deleteCategoryRow, moveCategory, renameCategory, renameSection, setBudget, setCategoryActual } from "@/app/actions";
import { isHaircutExpense, type Section } from "@/lib/plan/budget";
import HaircutToggle from "./HaircutToggle";

type Row = { id: string; name: string; type: string; color: string; budgeted: number; actual: number; notes: string | null };

const fmt = (n: number) => n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (s: string) => Number(s.replace(",", ".")) || 0;
const clean = (s: string) => s.replace(/[^0-9.,]/g, "");

/** Budget vs actual, one card per section. Budget and Actual are always typeable; "Edit" changes the section itself. */
export default function BudgetActual({ rows, year, month, includeHaircut, sections }: {
  rows: Row[]; year: number; month: number; includeHaircut: boolean; sections: Section[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Type into <b className="text-ink">Budget</b> or <b className="text-ink">Actual</b> and press Enter to save.
        Use <b className="text-ink">Edit</b> on a section to rename it, rename or move its rows, delete rows or add new ones.
      </p>
      {sections.map((s) => (
        <SectionCard key={s.type} s={s} rows={rows} year={year} month={month} includeHaircut={includeHaircut} sections={sections} />
      ))}
    </div>
  );
}

function SectionCard({ s, rows, year, month, includeHaircut, sections }: {
  s: Section; rows: Row[]; year: number; month: number; includeHaircut: boolean; sections: Section[];
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(s.label);
  const [pending, start] = useTransition();
  useEffect(() => setLabel(s.label), [s.label]);

  const excluded = (r: Row) => !includeHaircut && (r.type === "income_haircut" || isHaircutExpense(r.type, r.name));
  const order = (t: string) => ["income_salary", "income_haircut", "income_other"].indexOf(t);
  const list = rows
    .filter((r) => (s.types as readonly string[]).includes(r.type))
    .sort((a, b) => order(a.type) - order(b.type) || a.name.localeCompare(b.name));
  const counted = list.filter((r) => !excluded(r));
  const bud = counted.reduce((a, r) => a + r.budgeted, 0);
  const act = counted.reduce((a, r) => a + r.actual, 0);

  const saveLabel = () => {
    if (label.trim() && label.trim() !== s.label) start(() => renameSection(s.type, label));
    else setLabel(s.label);
  };

  return (
    <section className={clsx("card overflow-hidden", editing && "border-accent/60")}>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-5">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
        {editing ? (
          <input
            aria-label="Section name"
            className={clsx("input !w-52 !py-1 text-sm font-semibold", pending && "opacity-60")}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={saveLabel}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          />
        ) : (
          <h2 className="text-sm font-semibold">{s.label}</h2>
        )}
        <span className="num ml-auto text-xs text-muted">
          <span className="text-ink">€{fmt(act)}</span> / €{fmt(bud)}
        </span>
        <button
          onClick={() => setEditing(!editing)}
          className={clsx("btn !px-2.5 !py-1 text-xs", editing ? "bg-accent text-white" : "border border-line text-muted hover:text-ink")}
          aria-label={editing ? `Done editing ${s.label}` : `Edit ${s.label}`}
        >
          {editing ? <><Check size={13} /> Done</> : <><Pencil size={13} /> Edit</>}
        </button>
      </div>
      <div className={clsx("hidden grid-cols-[1fr_7rem_7rem_6rem] gap-2 px-5 pt-2 text-[11px] uppercase tracking-wide text-muted", list.length > 0 && "sm:grid")}>
        <span>Name</span><span className="text-right">Budget</span><span className="text-right">Actual</span><span className="text-right">{s.income ? "Diff" : "Left"}</span>
      </div>
      <ul className="divide-y divide-line">
        {list.map((r) => (
          <Line key={r.id} r={r} income={s.income} year={year} month={month} includeHaircut={includeHaircut}
            excluded={excluded(r)} sections={sections} current={s.type} editing={editing} />
        ))}
      </ul>
      {list.length === 0 && !editing && <p className="px-4 py-3 text-sm text-muted sm:px-5">Nothing here yet. Use Edit to add a row.</p>}
      {editing && <AddRow type={s.type} year={year} month={month} locked={false} />}
    </section>
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

function Line({ r, income, year, month, includeHaircut, excluded, sections, current, editing }: {
  r: Row; income: boolean; year: number; month: number; includeHaircut: boolean; excluded: boolean;
  sections: Section[]; current: string; editing: boolean;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [name, setName] = useState(r.name);
  useEffect(() => setName(r.name), [r.name]);
  const locked = r.type === "income_haircut";
  const diff = income ? r.actual - r.budgeted : r.budgeted - r.actual;
  const bad = r.budgeted > 0 && diff < -0.005 && !income;

  const run = (fn: () => Promise<void>) =>
    start(async () => {
      try { setErr(""); await fn(); } catch (e) { setErr(e instanceof Error ? e.message : "Could not save"); }
    });

  const saveName = () => {
    if (name.trim() && name.trim() !== r.name) run(() => renameCategory(r.id, name));
    else setName(r.name);
  };

  const move = (type: string) => {
    const x = sections.find((y) => y.type === type);
    if (!x) return;
    if (x.income !== income && !confirm(`Move "${r.name}" to ${x.label}?\n\nIts past entries will count as ${x.income ? "income" : "spending"} from now on.`)) return;
    run(() => moveCategory(r.id, type));
  };

  return (
    <li className={clsx("px-4 py-2.5 sm:px-5", pending && "opacity-60", excluded && "bg-raised/30")}>
      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_7rem_7rem_6rem]">
        <div className="min-w-0">
          {editing ? (
            <>
              <input
                aria-label={`Name of ${r.name}`}
                className="input !py-1.5 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              />
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {locked ? (
                  <span className="text-xs text-muted">Stays in Income (linked to the iCut page)</span>
                ) : (
                  <select
                    aria-label={`Move ${r.name} to`}
                    className="chip !py-1 bg-transparent text-xs text-muted"
                    value=""
                    onChange={(e) => e.target.value && move(e.target.value)}
                  >
                    <option value="">Move to…</option>
                    {sections.filter((x) => x.type !== current).map((x) => <option key={x.type} value={x.type}>{x.label}</option>)}
                  </select>
                )}
                <button
                  aria-label={`Delete ${r.name}`}
                  className="chip flex items-center gap-1 !py-1 text-xs text-bad hover:border-bad"
                  onClick={() =>
                    confirm(`Delete "${r.name}"?\n\nThis removes it and this month's amounts for it. Entries from earlier months stay in your history.`) &&
                    run(() => deleteCategoryRow(r.id, year, month))
                  }
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="truncate text-sm font-medium">{r.name}</p>
              {r.notes && <p className="truncate text-xs text-muted">{r.notes}</p>}
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:contents">
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
