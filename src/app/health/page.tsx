import Link from "next/link";
import { ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { PageHeader, Tabs, HEALTH_TABS, Card, Bar } from "@/components/ui";
import DayFood from "@/components/DayFood";
import WeightForm from "@/components/WeightForm";
import { getCurrentBatch, getMeals, getRecentCustomFoods, getWeights } from "@/lib/health";
import { addDays, prettyDate, todayISO, weekdayIndex } from "@/lib/dates";
import { TARGETS, WHY_FOUR_MEALS } from "@/lib/plan/nutrition";
import { dayForWeekday } from "@/lib/plan/training";

export const dynamic = "force-dynamic";

export default async function HealthToday({ searchParams }: { searchParams: { date?: string } }) {
  const today = todayISO();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date ?? "") ? searchParams.date! : today;
  const [meals, batch, recent, weights] = await Promise.all([getMeals(date), getCurrentBatch(), getRecentCustomFoods(), getWeights(30)]);
  const kcal = meals.reduce((a, m) => a + m.kcal, 0);
  const protein = meals.reduce((a, m) => a + m.protein, 0);
  const todaysWeight = weights.find((w) => w.date === date)?.kg ?? null;
  const lastWeight = weights.at(-1);
  const gymDay = dayForWeekday(weekdayIndex(date));

  return (
    <>
      <PageHeader
        eyebrow="Health"
        title={date === today ? "Today's food" : prettyDate(date)}
        right={
          <div className="flex items-center gap-1 rounded-xl border border-line bg-panel p-1">
            <Link aria-label="Previous day" href={`/health?date=${addDays(date, -1)}`} className="rounded-lg p-2 text-muted hover:bg-raised hover:text-ink"><ChevronLeft size={16} /></Link>
            <Link href="/health" className="min-w-[7rem] text-center text-sm font-medium">{prettyDate(date)}</Link>
            <Link aria-label="Next day" href={`/health?date=${addDays(date, 1)}`} className="rounded-lg p-2 text-muted hover:bg-raised hover:text-ink"><ChevronRight size={16} /></Link>
          </div>
        }
      />
      <Tabs items={HEALTH_TABS} active="/health" />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="min-w-0 space-y-4">
          <div className="card grid grid-cols-2 gap-4 p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Calories</p>
              <p className="num mt-1 text-2xl font-semibold">{kcal.toLocaleString("en-GB")}<span className="text-sm font-normal text-muted"> / {TARGETS.kcal.toLocaleString("en-GB")}</span></p>
              <div className="mt-2"><Bar value={kcal} max={TARGETS.kcal} color="rgb(var(--warn))" /></div>
              <p className="num mt-1 text-xs text-muted">{kcal >= TARGETS.kcal ? "Target reached" : `${(TARGETS.kcal - kcal).toLocaleString("en-GB")} kcal to go`}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Protein</p>
              <p className="num mt-1 text-2xl font-semibold">{protein}<span className="text-sm font-normal text-muted"> / {TARGETS.protein} g</span></p>
              <div className="mt-2"><Bar value={protein} max={TARGETS.protein} color="rgb(var(--good))" /></div>
              <p className="num mt-1 text-xs text-muted">{protein >= TARGETS.protein ? "Target reached" : `${TARGETS.protein - protein} g to go`}</p>
            </div>
          </div>
          <DayFood date={date} meals={meals} batch={batch} recent={recent} />
        </div>

        <div className="min-w-0 space-y-4 lg:sticky lg:top-8">
          <Card title="Morning weigh-in">
            <WeightForm date={date} current={todaysWeight} />
            <p className="mt-2 text-xs text-muted">
              {lastWeight ? `Last: ${lastWeight.kg} kg on ${prettyDate(lastWeight.date)}. ` : ""}
              Weigh after the toilet, before eating, 3+ times a week.
            </p>
          </Card>
          <Card title="Training today">
            {gymDay ? (
              <Link href="/health/gym" className="flex items-center gap-3 rounded-xl bg-accent/10 p-3 hover:bg-accent/15">
                <Dumbbell size={18} className="text-accent" />
                <div>
                  <p className="text-sm font-medium">{gymDay.title.split("·")[1]?.trim()}</p>
                  <p className="text-xs text-muted">{gymDay.focus} · {gymDay.exercises.length} exercises</p>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-muted">Rest day. A 30-minute walk is perfect.</p>
            )}
          </Card>
          <Card title="Why 4 times a day?">
            <p className="text-sm text-muted">{WHY_FOUR_MEALS}</p>
          </Card>
        </div>
      </div>
    </>
  );
}
