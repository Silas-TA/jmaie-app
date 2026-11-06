"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import { Check, Plus } from "lucide-react";
import { addTransaction } from "@/app/actions";
import type { Section } from "@/lib/plan/budget";

type Cat = { id: string; name: string; type: string; color: string };

export default function QuickAdd({ categories, frequent, today, sections }: { categories: Cat[]; frequent: string[]; today: string; sections: Section[] }) {
  const [direction, setDirection] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sectionType, setSectionType] = useState<string | null>(null);
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

  // Sections for this direction; income has a single section so its items show straight away.
  const dirSections = sections.filter((x) => x.income === (direction === "income"));
  const activeSection = dirSections.length === 1 ? dirSections[0] : dirSections.find((x) => x.type === sectionType) ?? null;
  const rank = (id: string) => (frequent.includes(id) ? frequent.indexOf(id) : 99);
  const items = activeSection
    ? categories.filter((c) => activeSection.types.includes(c.type)).sort((a, b) => rank(a.id) - rank(b.id) || a.name.localeCompare(b.name))
    : [];

  function pickSection(type: string) {
    if (sectionType === type) { setSectionType(null); setCategoryId(null); return; }
    setSectionType(type);
    const sec = sections.find((x) => x.type === type)!;
    const inSec = categories.filter((c) => sec.types.includes(c.type));
    setCategoryId(inSec.length === 1 ? inSec[0].id : null);
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    if (!categoryId) {
      setError(activeSection ? (items.length ? `Pick which one in ${activeSection.label}` : `Add a row to ${activeSection.label} first`) : "Pick a category");
      return;
    }
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
        setSectionType(null);
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
              onClick={() => { setDirection(d); setCategoryId(null); setSectionType(null); }}
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

      {dirSections.length > 1 && (
        <>
          <p className="label mt-4">Category</p>
          <div className="flex flex-wrap gap-2">
            {dirSections.map((x) => (
              <button
                type="button"
                key={x.type}
                onClick={() => pickSection(x.type)}
                className={clsx("chip flex items-center gap-1.5", activeSection?.type === x.type ? "border-accent bg-accent/15 text-ink" : "text-muted hover:text-ink")}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: x.color }} />
                {x.label}
              </button>
            ))}
          </div>
        </>
      )}

      {activeSection && (
        <>
          <p className="label mt-4">{dirSections.length > 1 ? `Which one? (${activeSection.label})` : activeSection.label}</p>
          {items.length === 0 ? (
            <p className="text-sm text-muted">Nothing in {activeSection.label} yet. Add a row to it on the Budget vs actual list.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {items.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}
                  className={clsx("chip !py-1 text-sm", categoryId === c.id ? "border-accent bg-accent/15 text-ink" : "text-muted hover:text-ink")}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}

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
