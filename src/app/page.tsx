import Link from "next/link";
import { ArrowRight, Dumbbell, Salad, Target, Scale } from "lucide-react";
import { PageHeader, Card, Stat, Bar, MonthNav } from "@/components/ui";
import QuickAdd from "@/components/QuickAdd";
import { MoneyTrend } from "@/components/Charts";
import { getCategories, getFrequentCategoryIds, getGoals, getMonthSummary, getTrend } from "@/lib/finance";
import { getMeals, getSets, getWeights, rolling } from "@/lib/health";
import { eur, monthLabel, parseYM, todayISO, weekdayIndex, currentYM } from "@/lib/dates";
import { EXPENSE_SECTIONS, PLAN_TOTAL_INCOME } from "@/lib/plan/budget";
import { TARGETS } from "@/lib/plan/nutrition";
import { dayForWeekday } from "@/lib/plan/training";

export const dynamic = "force-dynamic";


export default async function Overview({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const { year, month } = parseYM(searchParams);
  const today = todayISO();
  const isCurrent = year === currentYM().year && month === currentYM().month;
  const [s, trend, cats, frequent, goals, meals, sets, weights] = await Promise.all([
    getMonthSummary(year, month),
    getTrend(year, month, 6),
    getCategories(),
    getFrequentCategoryIds(),
    getGoals(),
    getMeals(today),
    getSets(today),
    getWeights(60),
  ]);
  const kcal = meals.reduce((a, m) => a + m.kcal, 0);
  const protein = meals.reduce((a, m) => a + m.protein, 0);
  const gymDay = dayForWeekday(weekdayIndex(today));
  const totalSets = gymDay?.exercises.reduce((a, e) => a + e.sets, 0) ?? 0;
  const doneSets = sets.filter((x) => x.done).length;
  const w = rolling(weights).at(-1);
  const emergency = goals.find((g) => /emergency/i.test(g.name));

  return (
    <>
      <PageHeader
        eyebrow={new Date(today + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
        title="Overview"
        right={<MonthNav base="/" year={year} month={month} />}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Income" value={eur(s.income)} tone="good" sub={`Salary ${eur(s.salary, 0)} · iCut ${eur(s.haircut, 0)}`} />
        <Stat label="Spent" value={eur(s.spent)} sub={s.budgetedSpend ? `${Math.round((s.spent / s.budgetedSpend) * 100)}% of budget` : "No budget set yet"} />
        <Stat label="Saved" value={eur(s.saved)} tone="accent" sub={`Plan: ${eur(480, 0)} / month`} />
        {isCurrent ? (
          <Stat label="Left to spend" value={eur(s.left)} tone={s.left < 0 ? "bad" : undefined} sub={s.saved < 480 ? `Keep ${eur(480 - s.saved, 0)} of it for savings` : "Savings done for this month"} />
        ) : (
          <Stat label="Savings rate" value={`${Math.round(s.savingsRate * 100)}%`} tone={s.savingsRate >= 0.2 ? "good" : undefined} sub="Saved + left over, of income" />
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
        <div className="min-w-0 space-y-5">
          <Card title={`Budget · ${monthLabel(year, month)}`} right={<Link href={`/money/budget?year=${year}&month=${month}`} className="flex items-center gap-1 text-xs text-accent">Open <ArrowRight size={12} /></Link>}>
            {EXPENSE_SECTIONS.every((x) => !s.byType[x.type]?.budgeted) ? (
              <p className="text-sm text-muted">
                No budget for this month yet.{" "}
                <Link className="text-accent underline" href={`/money/budget?year=${year}&month=${month}`}>Set it up with the suggested plan</Link> (one click).
              </p>
            ) : (
              <ul className="space-y-4">
                {EXPENSE_SECTIONS.filter((x) => s.byType[x.type]?.budgeted || s.byType[x.type]?.actual).map((x) => {
                  const v = s.byType[x.type];
                  const over = v.budgeted > 0 && v.actual > v.budgeted;
                  return (
                    <li key={x.type}>
                      <div className="mb-1.5 flex items-baseline justify-between text-sm">
                        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} />{x.label}</span>
                        <span className="num text-muted"><span className={over ? "text-bad" : "text-ink"}>{eur(v.actual, 0)}</span> / {eur(v.budgeted, 0)}</span>
                      </div>
                      <Bar value={v.actual} max={v.budgeted} color={x.color} over={over} />
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <Card title="Last 6 months">
            <MoneyTrend data={trend} />
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          {isCurrent && <QuickAdd categories={cats} frequent={frequent} today={today} />}

          <div className="grid grid-cols-2 gap-3">
            <Link href="/health" className="card p-4 hover:border-accent">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted"><Salad size={14} /> Food today</p>
              <p className="num mt-1.5 text-xl font-semibold">{kcal.toLocaleString("en-GB")}<span className="text-xs font-normal text-muted"> kcal</span></p>
              <div className="mt-2"><Bar value={kcal} max={TARGETS.kcal} color="rgb(var(--warn))" /></div>
              <p className="num mt-1 text-xs text-muted">{protein} / {TARGETS.protein} g protein</p>
            </Link>
            <Link href="/health/gym" className="card p-4 hover:border-accent">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted"><Dumbbell size={14} /> Gym</p>
              {gymDay ? (
                <>
                  <p className="mt-1.5 truncate text-sm font-semibold">{gymDay.title.split("·")[1].trim()}</p>
                  <div className="mt-2"><Bar value={doneSets} max={totalSets} color="rgb(var(--good))" /></div>
                  <p className="num mt-1 text-xs text-muted">{doneSets} / {totalSets} sets</p>
                </>
              ) : (
                <p className="mt-1.5 text-sm text-muted">Rest day</p>
              )}
            </Link>
            <Link href="/health/progress" className="card p-4 hover:border-accent">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted"><Scale size={14} /> Weight</p>
              <p className="num mt-1.5 text-xl font-semibold">{w ? `${w.avg}` : "—"}<span className="text-xs font-normal text-muted"> kg</span></p>
              <p className="mt-1 text-xs text-muted">Goal 80 kg</p>
            </Link>
            <Link href="/money/goals" className="card p-4 hover:border-accent">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted"><Target size={14} /> Safety net</p>
              {emergency ? (
                <>
                  <p className="num mt-1.5 text-xl font-semibold">{eur(emergency.current, 0)}</p>
                  <div className="mt-2"><Bar value={emergency.current} max={emergency.target} color="rgb(var(--good))" /></div>
                  <p className="num mt-1 text-xs text-muted">of {eur(emergency.target, 0)}</p>
                </>
              ) : (
                <p className="mt-1.5 text-sm text-muted">Set up your emergency fund →</p>
              )}
            </Link>
          </div>
          <p className="text-xs text-muted">Monthly plan: {eur(PLAN_TOTAL_INCOME, 0)} in · {eur(PLAN_TOTAL_INCOME - 480, 0)} spending · {eur(480, 0)} saved.</p>
        </div>
      </div>
    </>
  );
}
