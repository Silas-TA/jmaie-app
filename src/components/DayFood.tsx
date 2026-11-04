"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { Check, Plus, Trash2, Utensils, X } from "lucide-react";
import { deleteMeal, logCustomFood, logRecipe, setCurrentBatch } from "@/app/actions";
import { RECIPES, SLOTS, MAIN_ROTATION, recipeByKey } from "@/lib/plan/nutrition";
import { COMMON_FOODS } from "@/lib/plan/foods";

type Meal = { id: string; slot: string; recipeKey: string | null; name: string; kcal: number; protein: number };
type Food = { name: string; kcal: number; protein: number; carbs?: number; fat?: number };

export default function DayFood({ date, meals, batch, recent }: { date: string; meals: Meal[]; batch: string; recent: Food[] }) {
  const [pending, start] = useTransition();
  const [customFor, setCustomFor] = useState<string | null>(null);
  const [choice, setChoice] = useState<Record<string, string>>({});

  return (
    <div className={clsx("space-y-4", pending && "opacity-70")}>
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <Utensils size={18} className="text-accent" />
        <div className="mr-auto">
          <p className="text-sm font-medium">Cooking this batch</p>
          <p className="text-xs text-muted">Lunch and dinner use this until you switch</p>
        </div>
        <select aria-label="Current batch" className="input !w-auto max-w-full !py-2" value={batch} onChange={(e) => start(() => setCurrentBatch(e.target.value))}>
          {MAIN_ROTATION.map((k) => <option key={k} value={k}>{recipeByKey(k)!.name}</option>)}
        </select>
      </div>

      {SLOTS.map((slot) => {
        const logged = meals.filter((m) => m.slot === slot.key);
        const options = slot.kind === "main" ? [batch, ...MAIN_ROTATION.filter((k) => k !== batch)] : RECIPES.filter((r) => r.kind === slot.kind).map((r) => r.key);
        const selected = choice[slot.key] ?? (slot.kind === "main" ? batch : slot.default!);
        const r = recipeByKey(selected)!;
        return (
          <section key={slot.key} className="card p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-semibold">{slot.label}</h3>
              <span className="text-xs text-muted">{slot.time}</span>
            </div>

            {logged.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {logged.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 rounded-xl bg-good/10 px-3 py-2.5">
                    <Check size={16} className="shrink-0 text-good" />
                    <span className="min-w-0 flex-1 truncate text-sm">{m.name}</span>
                    <span className="num text-xs text-muted">{m.kcal} kcal · {m.protein} g P</span>
                    <button aria-label="Remove" className="rounded p-1 text-muted hover:text-bad" onClick={() => start(() => deleteMeal(m.id))}><Trash2 size={14} /></button>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                {options.length > 1 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {options.slice(0, slot.kind === "main" ? 3 : 3).map((k) => (
                      <button key={k} onClick={() => setChoice({ ...choice, [slot.key]: k })}
                        className={clsx("chip !py-1 text-xs", selected === k ? "border-accent bg-accent/15 text-ink" : "text-muted")}>
                        {recipeByKey(k)!.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="mr-auto min-w-0">
                    <p className="truncate text-sm">{r.name}</p>
                    <p className="num text-xs text-muted">{r.perPortion.kcal} kcal · {r.perPortion.protein} g protein</p>
                  </div>
                  <button className="btn-primary" onClick={() => start(() => logRecipe(date, slot.key, selected))}><Check size={16} /> Ate it</button>
                  <button className="btn-ghost" onClick={() => setCustomFor(slot.key)}>Something else</button>
                </div>
              </>
            )}
            {logged.length > 0 && (
              <button className="mt-2 text-xs text-muted hover:text-ink" onClick={() => setCustomFor(slot.key)}>+ add more to {slot.label.toLowerCase()}</button>
            )}
            {customFor === slot.key && <Custom date={date} slot={slot.key} recent={recent} onClose={() => setCustomFor(null)} />}
          </section>
        );
      })}

      <section className="card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Extras</h3>
          {customFor !== "extra" && <button className="btn-ghost !py-1.5 text-sm" onClick={() => setCustomFor("extra")}><Plus size={14} /> Add food</button>}
        </div>
        <ul className="mt-2 space-y-2">
          {meals.filter((m) => m.slot === "extra").map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-xl bg-raised px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-sm">{m.name}</span>
              <span className="num text-xs text-muted">{m.kcal} kcal · {m.protein} g P</span>
              <button aria-label="Remove" className="rounded p-1 text-muted hover:text-bad" onClick={() => start(() => deleteMeal(m.id))}><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
        {customFor === "extra" && <Custom date={date} slot="extra" recent={recent} onClose={() => setCustomFor(null)} />}
      </section>
    </div>
  );
}

function Custom({ date, slot, recent, onClose }: { date: string; slot: string; recent: Food[]; onClose: () => void }) {
  const [f, setF] = useState({ name: "", kcal: "", protein: "", carbs: "", fat: "" });
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const quick = [...recent, ...COMMON_FOODS.filter((c) => !recent.some((r) => r.name.toLowerCase() === c.name.toLowerCase()))].slice(0, 14);

  const save = (food: Food) =>
    start(async () => {
      try {
        await logCustomFood(date, slot, food);
        onClose();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not save");
      }
    });

  return (
    <div className="mt-3 rounded-xl border border-line bg-raised/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">What did you eat?</p>
        <button aria-label="Close" onClick={onClose} className="rounded p-1 text-muted hover:text-ink"><X size={16} /></button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {quick.map((q) => (
          <button key={q.name} disabled={pending} onClick={() => save(q)} className="chip !py-1 text-xs text-muted hover:text-ink">
            {q.name} <span className="num opacity-70">· {q.kcal}</span>
          </button>
        ))}
      </div>
      <form
        className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!f.name || !f.kcal) return setErr("Add a name and calories");
          save({ name: f.name, kcal: Number(f.kcal), protein: Number(f.protein) || 0, carbs: Number(f.carbs) || 0, fat: Number(f.fat) || 0 });
        }}
      >
        <input className="input col-span-2 !py-2 text-sm sm:col-span-1" placeholder="Food" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="input num !py-2 text-sm" inputMode="numeric" placeholder="kcal" value={f.kcal} onChange={(e) => setF({ ...f, kcal: e.target.value })} />
        <input className="input num !py-2 text-sm" inputMode="numeric" placeholder="protein g" value={f.protein} onChange={(e) => setF({ ...f, protein: e.target.value })} />
        <button className="btn-primary col-span-2 !py-2 sm:col-span-1" disabled={pending}>Log</button>
      </form>
      {err && <p className="mt-2 text-xs text-bad">{err}</p>}
      <p className="mt-2 text-xs text-muted">Not sure of the numbers? A rough guess is fine. Food labels list kcal and protein per 100 g.</p>
    </div>
  );
}
