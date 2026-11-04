"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import { Check, Plus } from "lucide-react";
import { addTransaction } from "@/app/actions";

type Cat = { id: string; name: string; type: string; color: string };

export default function QuickAdd({ categories, frequent, today }: { categories: Cat[]; frequent: string[]; today: string }) {
  const [direction, setDirection] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(today);
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const amountRef = useRef<HTMLInputElement>(null);

  const yesterday = useMemo(() => {
    const d = new Date(today + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }, [today]);

  const list = categories.filter((c) => (direction === "income" ? c.type.startsWith("income") : !c.type.startsWith("income")));
  const chips = [
    ...frequent.map((id) => list.find((c) => c.id === id)).filter(Boolean),
    ...list.filter((c) => !frequent.includes(c.id)),
  ].slice(0, direction === "income" ? 6 : 9) as Cat[];
  const rest = list.filter((c) => !chips.some((x) => x.id === c.id));

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    if (!(Number(amount.replace(",", ".")) > 0)) {
      setError("Enter an amount");
      amountRef.current?.focus();
      return;
    }
    start(async () => {
      try {
        await addTransaction({ direction, amount, date, categoryId, description: desc });
        setAmount("");
        setDesc("");
        setCategoryId(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 1600);
        amountRef.current?.focus();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save");
      }
    });
  }

  return (
    <form onSubmit={submit} className="card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Quick add</h2>
        <div className="flex rounded-lg border border-line bg-raised p-0.5 text-sm">
          {(["expense", "income"] as const).map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => { setDirection(d); setCategoryId(null); }}
              className={clsx("rounded-md px-3 py-1 capitalize transition", direction === d ? (d === "expense" ? "bg-bad/15 text-bad" : "bg-good/15 text-good") : "text-muted")}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
        <div>
          <label className="label" htmlFor="qa-amount">Amount (€)</label>
          <input
            id="qa-amount"
            ref={amountRef}
            inputMode="decimal"
            className="input num text-xl font-semibold"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
          />
        </div>
        <div>
          <label className="label" htmlFor="qa-desc">Note (optional)</label>
          <input id="qa-desc" className="input" placeholder={direction === "expense" ? "e.g. Lidl" : "e.g. Salary"} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
      </div>

      <p className="label mt-4">Category</p>
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            type="button"
            key={c.id}
            onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}
            className={clsx("chip flex items-center gap-1.5", categoryId === c.id ? "border-accent bg-accent/15 text-ink" : "text-muted hover:text-ink")}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
            {c.name}
          </button>
        ))}
        {rest.length > 0 && (
          <select
            aria-label="More categories"
            className="chip bg-transparent text-muted"
            value={rest.some((c) => c.id === categoryId) ? categoryId! : ""}
            onChange={(e) => setCategoryId(e.target.value || null)}
          >
            <option value="">More…</option>
            {rest.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setDate(today)} className={clsx("chip", date === today ? "border-accent text-ink" : "text-muted")}>Today</button>
        <button type="button" onClick={() => setDate(yesterday)} className={clsx("chip", date === yesterday ? "border-accent text-ink" : "text-muted")}>Yesterday</button>
        <input type="date" aria-label="Date" className="chip bg-transparent text-muted" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn-primary ml-auto min-w-[7rem]" disabled={pending}>
          {saved ? <><Check size={16} /> Saved</> : <><Plus size={16} /> Add</>}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-bad">{error}</p>}
    </form>
  );
}
