import { PageHeader, Tabs, HEALTH_TABS, Card, Stat, Empty } from "@/components/ui";
import { WeightChart, CaloriesChart } from "@/components/Charts";
import WeightForm from "@/components/WeightForm";
import { getDailyTotals, getWeights, getWorkoutDays, rolling } from "@/lib/health";
import { addDays, prettyDate, todayISO } from "@/lib/dates";
import { PROFILE, TARGETS } from "@/lib/plan/nutrition";

export const dynamic = "force-dynamic";

const PLAN_RATE = 0.375; // kg per week, middle of the 0.25–0.5 range

export default async function ProgressPage() {
  const today = todayISO();
  const [weights, totals, workouts] = await Promise.all([
    getWeights(365),
    getDailyTotals(addDays(today, -13), today),
    getWorkoutDays(addDays(today, -55), today),
  ]);
  const withAvg = rolling(weights);
  const first = withAvg[0];
  const latest = withAvg.at(-1);

  // Weekly rate from the 7-day averages about 2 weeks apart
  let rate: number | null = null;
  if (latest) {
    const ref = [...withAvg].reverse().find((w) => w.date <= addDays(latest.date, -14));
    if (ref) rate = ((latest.avg - ref.avg) / ((new Date(latest.date).getTime() - new Date(ref.date).getTime()) / 6048e5));
  }
  const weeksToGoal = latest && rate && rate > 0.05 ? (PROFILE.goalKg - latest.avg) / rate : null;

  // Chart: weigh-ins + plan line from the first weigh-in
  const chart = withAvg.map((w) => ({
    date: w.date, kg: w.kg, avg: w.avg,
    plan: first ? Math.round((first.kg + PLAN_RATE * ((new Date(w.date).getTime() - new Date(first.date).getTime()) / 6048e5)) * 10) / 10 : undefined,
  }));

  // Calories: fill missing days with 0
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const cal = days.map((d) => totals.find((t) => t.date === d) ?? { date: d, kcal: 0, protein: 0 });
  const logged = cal.filter((c) => c.kcal > 0);
  const avgKcal = logged.length ? Math.round(logged.reduce((a, c) => a + c.kcal, 0) / logged.length) : 0;
  const avgProt = logged.length ? Math.round(logged.reduce((a, c) => a + c.protein, 0) / logged.length) : 0;

  // Workouts per week (last 8 weeks)
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = addDays(today, -7 * (7 - i));
    const start = addDays(end, -6);
    return { label: prettyDate(start).split(" ").slice(1).join(" "), n: workouts.filter((w) => w.date >= start && w.date <= end).length };
  });
  weeks[7] = { label: "This wk", n: workouts.filter((w) => w.date > addDays(today, -7)).length };

  return (
    <>
      <PageHeader eyebrow="Health" title="Progress" sub={`Goal: ${PROFILE.goalKg} kg at ${TARGETS.weeklyGainMin}–${TARGETS.weeklyGainMax} kg a week`} />
      <Tabs items={HEALTH_TABS} active="/health/progress" />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Current (7-day avg)" value={latest ? `${latest.avg} kg` : "—"} sub={latest ? `Last weigh-in ${prettyDate(latest.date)}` : "Log your first weigh-in"} />
        <Stat label="Change" value={latest && first ? `${latest.avg - first.kg >= 0 ? "+" : ""}${(latest.avg - first.kg).toFixed(1)} kg` : "—"} sub={first ? `since ${prettyDate(first.date)}` : undefined} tone="accent" />
        <Stat
          label="Weekly rate"
          value={rate === null ? "—" : `${rate >= 0 ? "+" : ""}${rate.toFixed(2)} kg`}
          tone={rate === null ? undefined : rate < TARGETS.weeklyGainMin ? "bad" : rate > TARGETS.weeklyGainMax ? "bad" : "good"}
          sub={rate === null ? "Takes 2+ weeks of weigh-ins" : rate < TARGETS.weeklyGainMin ? "Too slow: add ~150–200 kcal/day" : rate > TARGETS.weeklyGainMax ? "Too fast: cut ~150 kcal/day" : "On track"}
        />
        <Stat label="To 80 kg" value={weeksToGoal ? `${Math.round(weeksToGoal)} wks` : "—"} sub={weeksToGoal ? `≈ ${prettyDate(addDays(today, Math.round(weeksToGoal * 7)))} ${new Date(addDays(today, Math.round(weeksToGoal * 7))).getFullYear()}` : "At the current rate"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card title="Body weight">
          {chart.length ? <WeightChart data={chart} /> : <Empty>No weigh-ins yet. Add one on the right.</Empty>}
        </Card>
        <Card title="Weigh in">
          <WeightForm date={today} current={weights.find((w) => w.date === today)?.kg ?? null} />
          <p className="mt-3 text-xs text-muted">Daily weight jumps around by up to 1 kg (water, salt, food in the gut). The 7-day average is the number that matters.</p>
        </Card>
        <Card title="Calories, last 14 days" right={<span className="num text-xs text-muted">avg {avgKcal.toLocaleString("en-GB")} kcal · {avgProt} g protein</span>}>
          <CaloriesChart data={cal} target={TARGETS.kcal} />
        </Card>
        <Card title="Workouts per week">
          <ul className="space-y-2">
            {weeks.map((w) => (
              <li key={w.label} className="flex items-center gap-3 text-sm">
                <span className="w-16 shrink-0 text-xs text-muted">{w.label}</span>
                <div className="flex flex-1 gap-1">
                  {Array.from({ length: 4 }, (_, i) => (
                    <span key={i} className={i < w.n ? "h-3 flex-1 rounded bg-good" : "h-3 flex-1 rounded bg-raised"} />
                  ))}
                </div>
                <span className="num w-8 text-right text-xs">{w.n}/4</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
