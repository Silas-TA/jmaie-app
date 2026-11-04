"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { Check, Plus, Trash2 } from "lucide-react";
import { addBooking, deleteBooking, setBookingPaid } from "@/app/actions";

type B = { id: string; date: string; amount: number; paid: boolean; notes: string | null; client: string | null };
const fmt = (n: number) => n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pretty = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export function BookingForm({ clients, today }: { clients: string[]; today: string }) {
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("15");
  const [date, setDate] = useState(today);
  const [paid, setPaid] = useState(true);
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
            await addBooking({ client, amount, date, paid });
            setClient("");
            setOk(true);
            setTimeout(() => setOk(false), 1500);
          } catch (e) {
            setErr(e instanceof Error ? e.message : "Could not save");
          }
        });
      }}
    >
      <h2 className="mb-4 text-sm font-semibold">Log a haircut</h2>
      <label className="label" htmlFor="bk-client">Client</label>
      <input id="bk-client" list="clients" className="input" placeholder="Name (optional)" value={client} onChange={(e) => setClient(e.target.value)} />
      <datalist id="clients">{clients.map((c) => <option key={c} value={c} />)}</datalist>

      <p className="label mt-4">Price</p>
      <div className="flex flex-wrap items-center gap-2">
        {["10", "15", "20", "25"].map((p) => (
          <button type="button" key={p} onClick={() => setAmount(p)} className={clsx("chip num", amount === p ? "border-accent bg-accent/15" : "text-muted")}>€{p}</button>
        ))}
        <input aria-label="Other price" inputMode="decimal" className="input num !w-24 !py-1.5" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="bk-date">Date</label>
          <input id="bk-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <label className="mt-6 flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--accent))]" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
          Paid already
        </label>
      </div>
      <button className="btn-primary mt-4 w-full" disabled={pending}>{ok ? <><Check size={16} /> Logged</> : <><Plus size={16} /> Log haircut</>}</button>
      {err && <p className="mt-2 text-sm text-bad">{err}</p>}
      <p className="mt-3 text-xs text-muted">Paid haircuts are added to your income automatically. Unpaid ones are added when you tick them as paid.</p>
    </form>
  );
}

export function BookingList({ bookings }: { bookings: B[] }) {
  if (!bookings.length) return <p className="py-10 text-center text-sm text-muted">No haircuts logged this month.</p>;
  return (
    <ul className="divide-y divide-line">
      {bookings.map((b) => <Row key={b.id} b={b} />)}
    </ul>
  );
}

function Row({ b }: { b: B }) {
  const [pending, start] = useTransition();
  return (
    <li className={clsx("flex items-center gap-3 px-4 py-3 sm:px-5", pending && "opacity-50")}>
      <button
        aria-label={b.paid ? "Mark unpaid" : "Mark paid"}
        onClick={() => start(() => setBookingPaid(b.id, !b.paid))}
        className={clsx("flex h-6 w-6 shrink-0 items-center justify-center rounded-md border", b.paid ? "border-good bg-good text-white" : "border-line")}
      >
        {b.paid && <Check size={14} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{b.client ?? "Walk-in"}</p>
        <p className="text-xs text-muted">{pretty(b.date)}{!b.paid && " · unpaid"}</p>
      </div>
      <span className={clsx("num text-sm font-semibold", b.paid ? "text-good" : "text-muted")}>€{fmt(b.amount)}</span>
      <button aria-label="Delete" className="rounded-md p-1.5 text-muted hover:text-bad" onClick={() => confirm("Delete this haircut?") && start(() => deleteBooking(b.id))}>
        <Trash2 size={14} />
      </button>
    </li>
  );
}
