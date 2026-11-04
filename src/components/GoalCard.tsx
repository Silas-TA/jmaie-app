"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteGoal, updateGoalAmount } from "@/app/actions";

const fmt = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 0 });

export default function GoalCard({ g }: { g: { id: string; name: string; target: number; current: number } }) {
  const [val, setVal] = useState(String(g.current));
  const [add, setAdd] = useState("");
  const [pending, start] = useTransition();
  const pct = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0;

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{g.name}</p>
          <p className="num text-sm text-muted">€{fmt(g.current)} of €{fmt(g.target)}</p>
        </div>
        <button aria-label="Delete goal" className="rounded-md p-1.5 text-muted hover:text-bad"
          onClick={() => confirm(`Delete goal "${g.name}"?`) && start(() => deleteGoal(g.id))}>
          <Trash2 size={14} />
        </button>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-raised">
        <div className="h-full rounded-full bg-good transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="num mt-1 text-xs text-muted">{Math.round(pct)}%{g.target > g.current && ` · €${fmt(g.target - g.current)} to go`}</p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(add.replace(",", "."));
          if (!n) return;
          start(async () => { await updateGoalAmount(g.id, g.current + n); setAdd(""); setVal(String(g.current + n)); });
        }}
      >
        <input className="input num !py-1.5 text-sm" inputMode="decimal" placeholder="Add €" value={add} onChange={(e) => setAdd(e.target.value)} />
        <button className="btn-primary !py-1.5" disabled={pending}>Add</button>
      </form>
      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer">Set exact balance</summary>
        <div className="mt-2 flex gap-2">
          <input className="input num !py-1.5 text-sm" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} />
          <button className="btn-ghost !py-1.5" disabled={pending} onClick={() => start(() => updateGoalAmount(g.id, Number(val.replace(",", ".")) || 0))}>Save</button>
        </div>
      </details>
    </div>
  );
}
