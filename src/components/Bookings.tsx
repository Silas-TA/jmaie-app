"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { Check, Plus, Minus, Trash2, Scissors, Package } from "lucide-react";
import { addBooking, addBusinessExpense, deleteBooking, deleteTransaction, setBookingPaid } from "@/app/actions";

type B = { id: string; date: string; amount: number; paid: boolean; notes: string | null; client: string | null };
type E = { id: string; date: string; amount: number; description: string };

const fmt = (n: number) => n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dayLabel = (iso: string) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const SUPPLIES = ["Blades", "Clippers / trimmer", "Hair products", "Cleaning & disinfectant", "Capes & towels", "Neck strips"];

/** One form for both: a haircut (income) or an iCut expense. */
export function CutEntry({ clients, today }: { clients: string[]; today: string }) {
  const [mode, setMode] = useState<"cut" | "expense">("cut");
  const [client, setClient] = useState("");
  const [what, setWhat] = useState("");
  const [amount, setAmount] = useState("15");
  const [date, setDate] = useState(today);
  const [paid, setPaid] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  const switchTo = (m: "cut" | "expense") => {
    setMode(m);
    setErr("");
    setAmount(m === "cut" ? "15" : "");
  };

  return (
    <form
      className="card p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setErr("");
        start(async () => {
          try {
            if (mode === "cut") {
              await addBooking({ client, amount, date, paid });
              setClient("");
            } else {
              await addBusinessExpense({ amount, date, description: what });
              setWhat("");
              setAmount("");
            }
            setOk(true);
            setTimeout(() => setOk(false), 1500);
          } catch (e) {
            setErr(e instanceof Error ? e.message : "Could not save");
          }
        });
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Quick add</h2>
        <div className="flex rounded-lg border border-line bg-raised p-0.5 text-sm">
          <button type="button" onClick={() => switchTo("cut")}
            className={clsx("flex items-center gap-1.5 rounded-md px-3 py-1 transition", mode === "cut" ? "bg-good/15 text-good" : "text-muted")}>
            <Scissors size={13} /> Haircut
          </button>
          <button type="button" onClick={() => switchTo("expense")}
            className={clsx("flex items-center gap-1.5 rounded-md px-3 py-1 transition", mode === "expense" ? "bg-bad/15 text-bad" : "text-muted")}>
            <Package size={13} /> Expense
          </button>
        </div>
      </div>

      {mode === "cut" ? (
        <>
          <label className="label" htmlFor="bk-client">Client</label>
          <input id="bk-client" list="clients" className="input" placeholder="Name (optional)" value={client} onChange={(e) => setClient(e.target.value)} />
          <datalist id="clients">{clients.map((c) => <option key={c} value={c} />)}</datalist>
          <p className="label mt-4">Price</p>
          <div className="flex flex-wrap items-center gap-2">
            {["10", "15", "20", "25"].map((p) => (
              <button type="button" key={p} onClick={() => setAmount(p)} className={clsx("chip num", amount === p ? "border-accent bg-accent/15" : "text-muted")}>€{p}</button>
            ))}
            <input aria-label="Other price" inputMode="decimal" className="input num !w-24 !py-1.5" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))} />
          </div>
        </>
      ) : (
        <>
          <label className="label" htmlFor="ce-amount">Amount (€)</label>
          <input id="ce-amount" inputMode="decimal" className="input num text-xl font-semibold" placeholder="0.00" value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))} />
          <label className="label mt-4" htmlFor="ce-desc">What for</label>
          <input id="ce-desc" className="input" placeholder="e.g. Blades" value={what} onChange={(e) => setWhat(e.target.value)} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUPPLIES.map((s) => (
              <button type="button" key={s} onClick={() => setWhat(s)}
                className={clsx("chip !py-1 text-xs", what === s ? "border-accent bg-accent/15 text-ink" : "text-muted")}>{s}</button>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input aria-label="Date" type="date" className="chip bg-transparent text-muted" value={date} onChange={(e) => setDate(e.target.value)} />
        {mode === "cut" && (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--accent))]" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
            Paid already
          </label>
        )}
        <button className="btn-primary ml-auto min-w-[8rem]" disabled={pending}>
          {ok ? <><Check size={16} /> Saved</> : mode === "cut" ? <><Plus size={16} /> Log haircut</> : <><Minus size={16} /> Log expense</>}
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-bad">{err}</p>}
      <p className="mt-3 text-xs text-muted">
        {mode === "cut"
          ? "Paid haircuts are added to your income automatically; unpaid ones when you tick them."
          : "Expenses come off your iCut profit and count toward “Haircut Business Expenses” in Variable Expenses."}
      </p>
    </form>
  );
}

/** Haircuts and expenses together, newest first, grouped by day. */
export function CutActivity({ bookings, expenses }: { bookings: B[]; expenses: E[] }) {
  const [filter, setFilter] = useState<"all" | "cut" | "expense">("all");
  type Item = { kind: "cut"; b: B; date: string } | { kind: "expense"; e: E; date: string };
  const items: Item[] = [
    ...(filter !== "expense" ? bookings.map((b) => ({ kind: "cut" as const, b, date: b.date })) : []),
    ...(filter !== "cut" ? expenses.map((e) => ({ kind: "expense" as const, e, date: e.date })) : []),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const byDay = items.reduce<Record<string, Item[]>>((acc, i) => ((acc[i.date] ??= []).push(i), acc), {});

  return (
    <section className="card">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-5">
        <h2 className="mr-auto text-sm font-semibold">This month</h2>
        <div className="flex rounded-lg border border-line bg-raised p-0.5 text-xs">
          {([["all", "All"], ["cut", `Haircuts (${bookings.length})`], ["expense", `Expenses (${expenses.length})`]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={clsx("rounded-md px-2.5 py-1", filter === k ? "bg-panel text-ink" : "text-muted")}>{l}</button>
          ))}
        </div>
      </div>
      {!items.length && <p className="py-10 text-center text-sm text-muted">Nothing logged this month yet.</p>}
      {Object.entries(byDay).map(([day, list]) => (
        <div key={day}>
          <div className="bg-raised/50 px-4 py-1.5 text-xs text-muted sm:px-5">{dayLabel(day)}</div>
          <ul className="divide-y divide-line">
            {list.map((i) => (i.kind === "cut" ? <CutRow key={i.b.id} b={i.b} /> : <ExpenseRow key={i.e.id} e={i.e} />))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function CutRow({ b }: { b: B }) {
  const [pending, start] = useTransition();
  return (
    <li className={clsx("flex items-center gap-3 px-4 py-3 sm:px-5", pending && "opacity-50")}>
      <button
        aria-label={b.paid ? "Mark unpaid" : "Mark paid"}
        title={b.paid ? "Paid (tap to mark unpaid)" : "Unpaid (tap when paid)"}
        onClick={() => start(() => setBookingPaid(b.id, !b.paid))}
        className={clsx("flex h-6 w-6 shrink-0 items-center justify-center rounded-md border", b.paid ? "border-good bg-good text-white" : "border-line")}
      >
        {b.paid && <Check size={14} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-medium"><Scissors size={12} className="text-muted" />{b.client ?? "Walk-in"}</p>
        <p className="text-xs text-muted">Haircut{!b.paid && " · unpaid"}</p>
      </div>
      <span className={clsx("num text-sm font-semibold", b.paid ? "text-good" : "text-muted")}>+€{fmt(b.amount)}</span>
      <button aria-label="Delete" className="rounded-md p-1.5 text-muted hover:text-bad" onClick={() => confirm("Delete this haircut?") && start(() => deleteBooking(b.id))}>
        <Trash2 size={14} />
      </button>
    </li>
  );
}

function ExpenseRow({ e }: { e: E }) {
  const [pending, start] = useTransition();
  return (
    <li className={clsx("flex items-center gap-3 px-4 py-3 sm:px-5", pending && "opacity-50")}>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-bad/10 text-bad"><Package size={13} /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{e.description}</p>
        <p className="text-xs text-muted">Expense</p>
      </div>
      <span className="num text-sm font-semibold text-bad">−€{fmt(e.amount)}</span>
      <button aria-label="Delete" className="rounded-md p-1.5 text-muted hover:text-bad"
        onClick={() => confirm(`Delete "${e.description}" (€${fmt(e.amount)})?`) && start(() => deleteTransaction(e.id))}>
        <Trash2 size={14} />
      </button>
    </li>
  );
}
