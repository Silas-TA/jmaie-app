"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { addGoal } from "@/app/actions";

export default function NewGoal() {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="card flex flex-col gap-2 border-dashed p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setErr("");
        start(async () => {
          try {
            await addGoal(name, Number(target.replace(",", ".")));
            setName("");
            setTarget("");
          } catch (e) {
            setErr(e instanceof Error ? e.message : "Could not save");
          }
        });
      }}
    >
      <p className="text-sm font-medium">New goal</p>
      <input className="input !py-1.5 text-sm" placeholder="e.g. Car" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input num !py-1.5 text-sm" inputMode="decimal" placeholder="Target €" value={target} onChange={(e) => setTarget(e.target.value)} />
      <button className="btn-ghost !py-1.5" disabled={pending}><Plus size={14} /> Add goal</button>
      {err && <p className="text-xs text-bad">{err}</p>}
    </form>
  );
}
