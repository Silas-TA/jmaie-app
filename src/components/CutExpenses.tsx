"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { Check, Minus, Trash2 } from "lucide-react";
import { addBusinessExpense, deleteTransaction } from "@/app/actions";

type E = { id: string; date: string; amount: number; description: string };

const fmt = (n: number) => n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pretty = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const SUGGESTIONS = ["Blades", "Clippers / trimmer", "Hair products", "Cleaning & disinfectant", "Capes & towels", "Neck strips"];

export function CutExpenseForm({ today }: { today: string }) {
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(today);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  return (
    <form
      className="card p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setErr("");
        start(async () => {
          try {
            await addBusinessExpense({ amount, date, description: desc });
            setAmount("");
            setDesc("");
            setOk(true);
            setTimeout(() => setOk(false), 1500);
          } catch (e) {
            setErr(e instanceof Error ? e.message : "Could not save");
          }
        });
      }}
    >
      <h2 className="mb-4 text-sm font-semibold">Log an iCut expense</h2>
      <div className="grid grid-cols-[1fr_1.4fr] gap-3">
        <div>
          <label className="label" htmlFor="ce-amount">Amount (€)</label>
          <input id="ce-amount" inputMode="decimal" className="input num" placeholder="0.00" value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))} />
        </div>
        <div>
          <label className="label" htmlFor="ce-date">Date</label>
          <input id="ce-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <label className="label mt-4" htmlFor="ce-desc">What for</label>
      <input id="ce-desc" className="input" placeholder="e.g. Blades" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button type="button" key={s} onClick={() => setDesc(s)}
            className={clsx("chip !py-1 text-xs", desc === s ? "border-accent bg-accent/15 text-ink" : "text-muted")}>{s}</button>
        ))}
      </div>
      <button className="btn-ghost mt-4 w-full" disabled={pending}>
        {ok ? <><Check size={16} /> Logged</> : <><Minus size={16} /> Log expense</>}
      </button>
      {err && <p className="mt-2 text-sm text-bad">{err}</p>}
      <p className="mt-3 text-xs text-muted">Counts against your iCut profit and the &ldquo;iCut costs&rdquo; budget.</p>
    </form>
  );
}

export function CutExpenseList({ expenses }: { expenses: E[] }) {
  if (!expenses.length) return <p className="py-8 text-center text-sm text-muted">No iCut expenses this month.</p>;
  return (
    <ul className="divide-y divide-line">
      {expenses.map((e) => <Row key={e.id} e={e} />)}
    </ul>
  );
}

function Row({ e }: { e: E }) {
  const [pending, start] = useTransition();
  return (
    <li className={clsx("flex items-center gap-3 px-4 py-3 sm:px-5", pending && "opacity-50")}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{e.description}</p>
        <p className="text-xs text-muted">{pretty(e.date)}</p>
      </div>
      <span className="num text-sm font-semibold text-bad">−€{fmt(e.amount)}</span>
      <button aria-label="Delete" className="rounded-md p-1.5 text-muted hover:text-bad"
        onClick={() => confirm(`Delete "${e.description}" (€${fmt(e.amount)})?`) && start(() => deleteTransaction(e.id))}>
        <Trash2 size={14} />
      </button>
    </li>
  );
}
