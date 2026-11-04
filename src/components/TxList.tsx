"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { deleteTransaction, updateTransaction } from "@/app/actions";

type Tx = {
  id: string; date: string; amount: number; direction: "income" | "expense"; description: string;
  categoryId: string | null; categoryName: string | null; categoryColor: string | null;
};
type Cat = { id: string; name: string; type: string };

const fmt = (n: number) => n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dayLabel = (iso: string) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export default function TxList({ txs, categories }: { txs: Tx[]; categories: Cat[] }) {
  const [filter, setFilter] = useState("");
  const [kind, setKind] = useState<"all" | "income" | "expense">("all");
  const [editing, setEditing] = useState<string | null>(null);

  const shown = txs.filter(
    (t) =>
      (kind === "all" || t.direction === kind) &&
      (!filter || `${t.description} ${t.categoryName ?? ""}`.toLowerCase().includes(filter.toLowerCase()))
  );
  const byDay = shown.reduce<Record<string, Tx[]>>((acc, t) => ((acc[t.date] ??= []).push(t), acc), {});

  return (
    <section className="card">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-5">
        <h2 className="mr-auto text-sm font-semibold">This month</h2>
        <input className="input !w-44 !py-1.5 text-sm" placeholder="Search…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <div className="flex rounded-lg border border-line bg-raised p-0.5 text-xs">
          {(["all", "expense", "income"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className={clsx("rounded-md px-2.5 py-1 capitalize", kind === k ? "bg-panel text-ink" : "text-muted")}>
              {k}
            </button>
          ))}
        </div>
      </div>

      {Object.keys(byDay).length === 0 && <p className="py-10 text-center text-sm text-muted">Nothing here yet. Add your first one above.</p>}

      {Object.entries(byDay).map(([day, list]) => (
        <div key={day}>
          <div className="flex justify-between bg-raised/50 px-4 py-1.5 text-xs text-muted sm:px-5">
            <span>{dayLabel(day)}</span>
            <span className="num">
              {(() => {
                const net = list.reduce((a, t) => a + (t.direction === "income" ? t.amount : -t.amount), 0);
                return (net >= 0 ? "+" : "−") + "€" + fmt(Math.abs(net));
              })()}
            </span>
          </div>
          <ul className="divide-y divide-line">
            {list.map((t) =>
              editing === t.id ? (
                <EditRow key={t.id} tx={t} categories={categories} onDone={() => setEditing(null)} />
              ) : (
                <Row key={t.id} tx={t} onEdit={() => setEditing(t.id)} />
              )
            )}
          </ul>
        </div>
      ))}
    </section>
  );
}

function Row({ tx, onEdit }: { tx: Tx; onEdit: () => void }) {
  const [pending, start] = useTransition();
  const clean = tx.description.replace(/\s*\[hb:[^\]]+\]$/, "");
  return (
    <li className={clsx("group flex items-center gap-3 px-4 py-3 sm:px-5", pending && "opacity-40")}>
      <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: tx.categoryColor ?? "rgb(var(--line))" }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{clean}</p>
        <p className="truncate text-xs text-muted">{tx.categoryName ?? "Uncategorised"}</p>
      </div>
      <span className={clsx("num text-sm font-semibold", tx.direction === "income" ? "text-good" : "text-ink")}>
        {tx.direction === "income" ? "+" : "−"}€{fmt(tx.amount)}
      </span>
      <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
        <button aria-label="Edit" onClick={onEdit} className="rounded-md p-1.5 text-muted hover:bg-raised hover:text-ink"><Pencil size={14} /></button>
        <button
          aria-label="Delete"
          onClick={() => confirm(`Delete "${clean}" (€${fmt(tx.amount)})?`) && start(() => deleteTransaction(tx.id))}
          className="rounded-md p-1.5 text-muted hover:bg-raised hover:text-bad"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

function EditRow({ tx, categories, onDone }: { tx: Tx; categories: Cat[]; onDone: () => void }) {
  const [v, setV] = useState({ ...tx, amount: String(tx.amount) });
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const save = () =>
    start(async () => {
      try {
        await updateTransaction(tx.id, { direction: v.direction, amount: v.amount, date: v.date, categoryId: v.categoryId, description: v.description });
        onDone();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not save");
      }
    });
  return (
    <li className="grid gap-2 bg-raised/40 px-4 py-3 sm:grid-cols-[110px_1fr_1fr_140px_auto] sm:px-5">
      <input className="input num" inputMode="decimal" value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value })} />
      <input className="input" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
      <select className="input" value={v.categoryId ?? ""} onChange={(e) => setV({ ...v, categoryId: e.target.value || null })}>
        <option value="">Uncategorised</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input type="date" className="input" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} />
      <div className="flex gap-1">
        <button className="btn-primary !px-3" onClick={save} disabled={pending} aria-label="Save"><Check size={16} /></button>
        <button className="btn-ghost !px-3" onClick={onDone} aria-label="Cancel"><X size={16} /></button>
      </div>
      {err && <p className="text-sm text-bad sm:col-span-5">{err}</p>}
    </li>
  );
}
