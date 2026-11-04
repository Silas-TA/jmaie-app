import { AlertTriangle, ChefHat, Pill, ShoppingCart, TrendingUp } from "lucide-react";
import { PageHeader, Tabs, HEALTH_TABS, Card } from "@/components/ui";
import {
  RECIPES, TARGETS, SLOTS, GASTRITIS_RULES, SUPPLEMENTS, SUPPLEMENT_NOTE, ADJUST_RULES, WEEKLY_SHOP, WHY_FOUR_MEALS, PROFILE, type Recipe,
} from "@/lib/plan/nutrition";

export const metadata = { title: "Meal plan · Jmaie" };

function RecipeCard({ r }: { r: Recipe }) {
  const m = r.perPortion;
  return (
    <details className="card group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 hover:bg-raised/40">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{r.name}</p>
          <p className="truncate text-sm text-muted">{r.short}</p>
        </div>
        <div className="num shrink-0 text-right text-xs text-muted">
          <p className="text-sm font-semibold text-ink">{m.kcal} kcal</p>
          <p>{m.protein} g protein</p>
        </div>
      </summary>
      <div className="border-t border-line p-4 text-sm">
        <div className="num mb-4 grid grid-cols-5 gap-2 rounded-xl bg-raised p-3 text-center text-xs">
          {([["kcal", m.kcal], ["protein", m.protein + " g"], ["carbs", m.carbs + " g"], ["fat", m.fat + " g"], ["fibre", m.fibre + " g"]] as const).map(([k, v]) => (
            <div key={k}><p className="font-semibold text-ink">{v}</p><p className="text-muted">{k}</p></div>
          ))}
        </div>
        <p className="mb-3 text-xs text-muted">
          Per portion. {r.portions > 1 ? `Makes ${r.portions} portions: 2 days of lunch + dinner.` : "Single portion."}
          {r.costEUR ? ` About €${r.costEUR} per batch.` : ""}
        </p>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="label">Ingredients</p>
            <ul className="space-y-1">
              {r.ingredients.map((i) => (
                <li key={i.item} className="flex justify-between gap-3 border-b border-line/60 pb-1">
                  <span>{i.item}</span><span className="num shrink-0 text-muted">{i.qty}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label">Method</p>
            <ol className="list-decimal space-y-1.5 pl-4 text-muted marker:text-muted">
              {r.steps.map((s) => <li key={s}><span className="text-ink">{s}</span></li>)}
            </ol>
          </div>
        </div>
        {r.changes && (
          <div className="mt-4">
            <p className="label">What changed from your version</p>
            <ul className="list-disc space-y-1 pl-4">{r.changes.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {r.nutrients.map((n) => <span key={n} className="rounded-full bg-good/10 px-2.5 py-1 text-xs text-good">{n}</span>)}
        </div>
        {r.gastritis && <p className="mt-3 rounded-lg bg-warn/10 px-3 py-2 text-xs text-warn">Gastritis tip: {r.gastritis}</p>}
      </div>
    </details>
  );
}

export default function MealsPage() {
  const mains = RECIPES.filter((r) => r.kind === "main");
  const breakfasts = RECIPES.filter((r) => r.kind === "breakfast");
  const snacks = RECIPES.filter((r) => r.kind === "snack");

  return (
    <>
      <PageHeader eyebrow="Health" title="Meal plan" sub={`Lean bulk: ${PROFILE.startKg} kg → ${PROFILE.goalKg} kg, gentle on the stomach.`} />
      <Tabs items={HEALTH_TABS} active="/health/meals" />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Calories", `${TARGETS.kcal.toLocaleString("en-GB")} kcal`, "≈ 300 above maintenance"],
          ["Protein", `${TARGETS.protein} g+`, "≈ 2 g per kg body weight"],
          ["Fibre", `${TARGETS.fibre} g+`, "Wholegrains, beans, veg"],
          ["Weight gain", `${TARGETS.weeklyGainMin}–${TARGETS.weeklyGainMax} kg/wk`, "Mostly muscle, little fat"],
        ].map(([l, v, s]) => (
          <div key={l} className="card p-4">
            <p className="text-xs uppercase tracking-wide text-muted">{l}</p>
            <p className="num mt-1 text-lg font-semibold">{v}</p>
            <p className="text-xs text-muted">{s}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card title="Your day">
          <p className="mb-4 text-sm text-muted">{WHY_FOUR_MEALS}</p>
          <ol className="space-y-2">
            {SLOTS.map((s) => (
              <li key={s.key} className="flex items-center gap-3 rounded-xl bg-raised px-3 py-2.5">
                <span className="num w-24 shrink-0 text-xs text-muted">{s.time}</span>
                <span className="text-sm font-medium">{s.label}</span>
                <span className="ml-auto text-xs text-muted">
                  {s.kind === "main" ? "Your cooked batch (~750–950 kcal)" : s.kind === "breakfast" ? "No-cook (~650 kcal)" : "No-cook (~480 kcal)"}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted">Cook one main every 2 days (4 portions). Rotate through all six so you get a mix of nutrients; the salmon meal once a week matters for vitamin D and omega-3.</p>
        </Card>
        <Card title={<span className="flex items-center gap-2"><AlertTriangle size={16} className="text-warn" /> Gastritis rules</span>}>
          <ul className="list-disc space-y-1.5 pl-4 text-sm">
            {GASTRITIS_RULES.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </Card>
      </div>

      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><ChefHat size={18} /> Batch meals (lunch & dinner)</h2>
      <div className="mb-6 grid gap-3 lg:grid-cols-2">{mains.map((r) => <RecipeCard key={r.key} r={r} />)}</div>

      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Breakfast</h2>
          <div className="space-y-3">{breakfasts.map((r) => <RecipeCard key={r.key} r={r} />)}</div>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold">Afternoon snack</h2>
          <div className="space-y-3">{snacks.map((r) => <RecipeCard key={r.key} r={r} />)}</div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title={<span className="flex items-center gap-2"><Pill size={16} /> Supplements</span>}>
          <ul className="space-y-3">
            {SUPPLEMENTS.map((s) => (
              <li key={s.name}>
                <p className="text-sm font-medium">{s.name} <span className="font-normal text-muted">· {s.dose}</span></p>
                <p className="text-sm text-muted">{s.why} {s.note}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">{SUPPLEMENT_NOTE}</p>
        </Card>
        <Card title={<span className="flex items-center gap-2"><ShoppingCart size={16} /> Weekly shop (Lidl/Maxima)</span>}>
          <ul className="columns-2 gap-4 text-sm">
            {WEEKLY_SHOP.map((i) => <li key={i} className="mb-1 break-inside-avoid">{i}</li>)}
          </ul>
          <p className="mt-3 text-xs text-muted">Roughly €65–70 a week, which fits your €300 monthly food budget. Buy rice, buckwheat, oats and lentils in big bags.</p>
        </Card>
        <Card title={<span className="flex items-center gap-2"><TrendingUp size={16} /> Adjusting</span>}>
          <ul className="list-disc space-y-1.5 pl-4 text-sm">
            {ADJUST_RULES.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </Card>
      </div>
      <p className="mt-6 text-xs text-muted">Calories and nutrients are estimates from standard food tables; brands vary. This plan isn&apos;t medical advice. If your gastritis gets worse, check with your doctor.</p>
    </>
  );
}
