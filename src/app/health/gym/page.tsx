import Link from "next/link";
import clsx from "clsx";
import { Check, ShieldAlert } from "lucide-react";
import { PageHeader, Tabs, HEALTH_TABS, Card } from "@/components/ui";
import Workout from "@/components/Workout";
import { getLastSessions, getSets, getWorkoutDays } from "@/lib/health";
import { addDays, prettyDate, todayISO, weekdayIndex } from "@/lib/dates";
import { PROGRAM, PAIN_RULES, TRAINING_RULES, dayByKey, dayForWeekday } from "@/lib/plan/training";

export const dynamic = "force-dynamic";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function GymPage({ searchParams }: { searchParams: { day?: string; date?: string } }) {
  const today = todayISO();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date ?? "") ? searchParams.date! : today;
  const wd = weekdayIndex(date);
  // Default: the plan for that weekday, else the next training day.
  const fallback = dayForWeekday(wd) ?? PROGRAM.find((d) => d.weekday > wd) ?? PROGRAM[0];
  const day = (searchParams.day && dayByKey(searchParams.day)) || fallback;

  const monday = addDays(date, -wd);
  const sunday = addDays(monday, 6);
  const [sets, last, weekDone] = await Promise.all([
    getSets(date),
    getLastSessions(date, day.exercises.map((e) => e.key)),
    getWorkoutDays(monday, sunday),
  ]);
  const isPlanned = dayForWeekday(wd)?.key === day.key;

  return (
    <>
      <PageHeader eyebrow="Health" title="Gym" sub="4 days a week · legs twice + a Friday finisher" />
      <Tabs items={HEALTH_TABS} active="/health/gym" />

      {/* This week */}
      <div className="card mb-5 grid grid-cols-7 gap-1 p-2">
        {WEEK.map((label, i) => {
          const d = addDays(monday, i);
          const plan = dayForWeekday(i);
          const didIt = weekDone.some((w) => w.date === d);
          const isToday = d === today;
          return (
            <Link
              key={label}
              href={plan ? `/health/gym?date=${d}&day=${plan.key}` : `/health/gym?date=${d}`}
              className={clsx("flex flex-col items-center gap-1 rounded-xl py-2 text-xs", d === date ? "bg-accent/15 text-accent" : "text-muted hover:bg-raised")}
            >
              <span className={clsx(isToday && "font-semibold text-ink")}>{label}</span>
              <span className={clsx("flex h-7 w-7 items-center justify-center rounded-full border text-[10px]",
                didIt ? "border-good bg-good text-white" : plan ? "border-accent/60" : "border-transparent")}>
                {didIt ? <Check size={13} /> : plan ? (plan.key.startsWith("lower") ? "L" : "U") : "·"}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{day.title}</h2>
              <p className="text-sm text-muted">
                {day.focus} · logging for {prettyDate(date)}
                {!isPlanned && " (not the usual day; that's fine)"}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PROGRAM.map((p) => (
                <Link key={p.key} href={`/health/gym?date=${date}&day=${p.key}`}
                  className={clsx("chip !py-1 text-xs", p.key === day.key ? "border-accent bg-accent/15 text-ink" : "text-muted")}>
                  {p.title.split("·")[1].trim()}
                </Link>
              ))}
            </div>
          </div>
          <Workout key={`${date}-${day.key}`} day={day} date={date} initial={sets} last={last} />
        </div>

        <div className="min-w-0 space-y-4 lg:sticky lg:top-8">
          <Card title={<span className="flex items-center gap-2"><ShieldAlert size={16} className="text-warn" /> Shoulder & hip</span>}>
            <ul className="list-disc space-y-2 pl-4 text-sm">
              {PAIN_RULES.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </Card>
          <Card title="How to progress">
            <ul className="space-y-3">
              {TRAINING_RULES.map((r) => (
                <li key={r.title}>
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-sm text-muted">{r.body}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
