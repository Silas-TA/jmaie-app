"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { Check, ChevronDown, Info, RefreshCw } from "lucide-react";
import { saveSet } from "@/app/actions";
import type { Day, Exercise } from "@/lib/plan/training";

type SetState = { w: string; r: string; done: boolean };
type Last = Record<string, { date: string; sets: { w: number | null; r: number | null }[] }>;

export default function Workout({ day, date, initial, last }: {
  day: Day; date: string; initial: { exerciseKey: string; setIndex: number; weightKg: number | null; reps: number | null; done: boolean }[]; last: Last;
}) {
  const [state, setState] = useState<Record<string, SetState[]>>(() => {
    const s: Record<string, SetState[]> = {};
    for (const ex of day.exercises) {
      const prev = last[ex.key]?.sets ?? [];
      s[ex.key] = Array.from({ length: ex.sets }, (_, i) => {
        const saved = initial.find((x) => x.exerciseKey === ex.key && x.setIndex === i);
        const pw = prev[i]?.w ?? prev.at(-1)?.w ?? null;
        return {
          w: saved?.weightKg != null ? String(saved.weightKg) : pw != null ? String(pw) : "",
          r: saved?.reps != null ? String(saved.reps) : "",
          done: saved?.done ?? false,
        };
      });
    }
    return s;
  });

  const total = day.exercises.reduce((a, e) => a + e.sets, 0);
  const done = Object.values(state).flat().filter((s) => s.done).length;

  return (
    <div>
      <div className="card mb-4 p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-sm font-medium">{done === total ? "Workout complete. Nice work!" : `${done} of ${total} sets done`}</p>
          <p className="num text-xs text-muted">{Math.round((done / total) * 100)}%</p>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-raised">
          <div className="h-full rounded-full bg-good transition-all" style={{ width: `${(done / total) * 100}%` }} />
        </div>
      </div>

      <details className="card mb-4 p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
          Warm-up (5–8 min) <ChevronDown size={16} className="text-muted" />
        </summary>
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-muted">{day.warmup.map((w) => <li key={w}>{w}</li>)}</ul>
      </details>

      <ol className="space-y-3">
        {day.exercises.map((ex, i) => (
          <ExerciseCard
            key={ex.key}
            n={i + 1}
            ex={ex}
            sets={state[ex.key]}
            last={last[ex.key]}
            onChange={(sets) => setState((s) => ({ ...s, [ex.key]: sets }))}
            date={date}
            dayKey={day.key}
          />
        ))}
      </ol>
    </div>
  );
}

function ExerciseCard({ n, ex, sets, last, onChange, date, dayKey }: {
  n: number; ex: Exercise; sets: SetState[]; last?: { date: string; sets: { w: number | null; r: number | null }[] };
  onChange: (s: SetState[]) => void; date: string; dayKey: string;
}) {
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const [err, setErr] = useState("");
  const allDone = sets.every((s) => s.done);

  const persist = (i: number, s: SetState) =>
    start(async () => {
      try {
        setErr("");
        await saveSet({ date, dayKey, exerciseKey: ex.key, setIndex: i, weightKg: s.w === "" ? null : Number(s.w.replace(",", ".")), reps: s.r === "" ? null : Number(s.r), done: s.done });
      } catch {
        setErr("Couldn't save. Check your connection.");
      }
    });

  const update = (i: number, patch: Partial<SetState>, save = false) => {
    const next = sets.map((s, j) => (j === i ? { ...s, ...patch } : s));
    // When a set is ticked, carry its weight to the next empty set.
    if (patch.done && next[i + 1] && next[i + 1].w === "") next[i + 1] = { ...next[i + 1], w: next[i].w };
    onChange(next);
    if (save) persist(i, next[i]);
  };

  const lastText = last ? last.sets.map((s) => `${s.w ?? "–"}×${s.r ?? "–"}`).join(", ") : null;

  return (
    <li className={clsx("card overflow-hidden", allDone && "border-good/40")}>
      <div className="flex items-start gap-3 p-4">
        <span className={clsx("num flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold", allDone ? "bg-good text-white" : "bg-raised text-muted")}>
          {allDone ? <Check size={14} /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <p className="font-medium">{ex.name}</p>
            {ex.tag === "legs" && <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent">legs</span>}
            {ex.tag === "shoulder-care" && <span className="rounded bg-good/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-good">shoulder care</span>}
          </div>
          <p className="num text-sm text-muted">{ex.sets} × {ex.reps} · rest {ex.rest}</p>
          {lastText && <p className="num mt-0.5 text-xs text-muted">Last time: {lastText} kg×reps</p>}
          {!lastText && ex.startKg && <p className="mt-0.5 text-xs text-muted">Start: {ex.startKg}</p>}
        </div>
        <button aria-label="How to do it" onClick={() => setOpen(!open)} className={clsx("rounded-lg p-2 text-muted hover:bg-raised hover:text-ink", open && "bg-raised text-ink")}>
          <Info size={16} />
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-raised/40 px-4 py-3 text-sm">
          <p>{ex.cue}</p>
          {ex.swap && <p className="mt-1.5 flex items-center gap-1.5 text-muted"><RefreshCw size={13} /> If it hurts or the machine is busy: {ex.swap}</p>}
        </div>
      )}
      <div className="border-t border-line">
        <div className="grid grid-cols-[2rem_1fr_1fr_3rem] gap-2 px-4 pt-2 text-[11px] uppercase tracking-wide text-muted">
          <span>Set</span><span>kg</span><span>Reps</span><span className="text-center">Done</span>
        </div>
        {sets.map((s, i) => (
          <div key={i} className={clsx("grid grid-cols-[2rem_1fr_1fr_3rem] items-center gap-2 px-4 py-1.5", s.done && "opacity-70")}>
            <span className="num text-sm text-muted">{i + 1}</span>
            <input aria-label={`Set ${i + 1} weight`} inputMode="decimal" className="input num !py-1.5 text-sm" placeholder="kg" value={s.w}
              onChange={(e) => update(i, { w: e.target.value.replace(/[^0-9.,]/g, "") })} onBlur={() => s.done && persist(i, s)} />
            <input aria-label={`Set ${i + 1} reps`} inputMode="numeric" className="input num !py-1.5 text-sm" placeholder={ex.reps} value={s.r}
              onChange={(e) => update(i, { r: e.target.value.replace(/[^0-9]/g, "") })} onBlur={() => s.done && persist(i, s)} />
            <button
              aria-label={s.done ? `Undo set ${i + 1}` : `Complete set ${i + 1}`}
              onClick={() => update(i, { done: !s.done }, true)}
              className={clsx("mx-auto flex h-9 w-9 items-center justify-center rounded-xl border transition", s.done ? "border-good bg-good text-white" : "border-line hover:border-good")}
            >
              <Check size={16} />
            </button>
          </div>
        ))}
        {err && <p className="px-4 pb-2 text-xs text-bad">{err}</p>}
        <div className="h-2" />
      </div>
    </li>
  );
}
