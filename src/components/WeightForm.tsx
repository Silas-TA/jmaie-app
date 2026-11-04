"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { logWeight } from "@/app/actions";

export default function WeightForm({ date, current }: { date: string; current: number | null }) {
  const [kg, setKg] = useState(current ? String(current) : "");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setErr("");
        start(async () => {
          try {
            await logWeight(date, kg);
            setOk(true);
            setTimeout(() => setOk(false), 1500);
          } catch (e) {
            setErr(e instanceof Error ? e.message : "Could not save");
          }
        });
      }}
    >
      <div className="relative flex-1">
        <input aria-label="Weight in kg" inputMode="decimal" className="input num pr-10" placeholder="65.0" value={kg} onChange={(e) => setKg(e.target.value)} />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">kg</span>
      </div>
      <button className="btn-primary" disabled={pending}>{ok ? <Check size={16} /> : "Save"}</button>
      {err && <p className="text-xs text-bad">{err}</p>}
    </form>
  );
}
