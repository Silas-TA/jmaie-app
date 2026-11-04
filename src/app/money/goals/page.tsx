import { ShieldCheck, TrendingUp, Info } from "lucide-react";
import { PageHeader, Tabs, MONEY_TABS, Card } from "@/components/ui";
import GoalCard from "@/components/GoalCard";
import ActionButton from "@/components/ActionButton";
import NewGoal from "@/components/NewGoal";
import { getGoals } from "@/lib/finance";
import { SAVINGS_PHASES } from "@/lib/plan/budget";
import { INVESTING_BASICS, LITHUANIA_TAX, INVESTING_SOURCES } from "@/lib/plan/investing";
import { createStarterGoals } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const goals = await getGoals();
  const hasStarter = goals.some((g) => /emergency/i.test(g.name)) && goals.some((g) => /invest/i.test(g.name));

  return (
    <>
      <PageHeader eyebrow="Money" title="Savings & investing" sub="Safety net first, then invest regularly." />
      <Tabs items={MONEY_TABS} active="/money/goals" />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Your goals</h2>
        {!hasStarter && (
          <ActionButton action={createStarterGoals} className="btn-primary">
            <ShieldCheck size={16} /> Add emergency fund + investing goals
          </ActionButton>
        )}
      </div>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((g) => <GoalCard key={g.id} g={g} />)}
        <NewGoal />
      </div>

      <h2 className="mb-3 text-lg font-semibold">The three phases</h2>
      <ol className="mb-8 grid gap-4 lg:grid-cols-3">
        {SAVINGS_PHASES.map((p) => (
          <li key={p.title} className="card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-accent">{p.when}</p>
            <p className="mt-1 font-semibold">{p.title}</p>
            <p className="mt-2 text-sm"><span className="text-muted">Target: </span>{p.target}</p>
            <p className="mt-1 text-sm"><span className="text-muted">Each month: </span>{p.split}</p>
            <p className="mt-2 text-sm text-muted">{p.why}</p>
          </li>
        ))}
      </ol>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={<span className="flex items-center gap-2"><TrendingUp size={16} /> Starting with stocks</span>}>
          <ul className="space-y-4">
            {INVESTING_BASICS.map((b) => (
              <li key={b.title}>
                <p className="text-sm font-medium">{b.title}</p>
                <p className="text-sm text-muted">{b.body}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Tax in Lithuania (2026)">
          <ul className="space-y-4">
            {LITHUANIA_TAX.map((b) => (
              <li key={b.title}>
                <p className="text-sm font-medium">{b.title}</p>
                <p className="text-sm text-muted">{b.body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">
            Sources:{" "}
            {INVESTING_SOURCES.map((s, i) => (
              <span key={s.url}>
                {i > 0 && " · "}
                <a className="underline hover:text-ink" href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
              </span>
            ))}
          </p>
        </Card>
      </div>

      <p className="mt-6 flex gap-2 rounded-xl border border-line bg-panel p-4 text-sm text-muted">
        <Info size={16} className="mt-0.5 shrink-0" />
        This is general information, not personal financial advice, and tax rules change. Before opening an investment account or
        choosing what to buy, check the current rules with your bank or broker, or a licensed adviser.
      </p>
    </>
  );
}
