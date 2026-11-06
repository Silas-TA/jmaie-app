import Link from "next/link";
import { Sparkles, Copy, ShieldCheck, TrendingUp, Info, ArrowRight } from "lucide-react";
import { PageHeader, MonthNav, Tabs, MONEY_TABS, Card } from "@/components/ui";
import GoalCard from "@/components/GoalCard";
import NewGoal from "@/components/NewGoal";
import ActionButton from "@/components/ActionButton";
import { getBudget, getGoals, getIncludeHaircut, getSections } from "@/lib/finance";
import { eur, monthLabel, parseYM } from "@/lib/dates";
import { PLAN_LINES, PLAN_TOTAL_INCOME, RULES, SAVINGS_PHASES, isHaircutExpense } from "@/lib/plan/budget";
import { INVESTING_BASICS, LITHUANIA_TAX, INVESTING_SOURCES } from "@/lib/plan/investing";
import { applySuggestedPlan, copyPreviousBudget, createStarterGoals } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function BudgetPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const { year, month } = parseYM(searchParams);
  const [rows, includeHaircut, sections, goals] = await Promise.all([getBudget(year, month), getIncludeHaircut(), getSections(), getGoals()]);
  const hasStarter = goals.some((g) => /emergency/i.test(g.name)) && goals.some((g) => /invest/i.test(g.name));
  const counts = (r: { type: string; name: string }) => includeHaircut || (r.type !== "income_haircut" && !isHaircutExpense(r.type, r.name));
  const incomeRows = rows.filter((r) => r.type.startsWith("income") && counts(r));
  const totalBudgeted = rows.filter((r) => !r.type.startsWith("income") && !r.isArchived && counts(r)).reduce((a, r) => a + r.budgeted, 0);
  const incomeBudget = incomeRows.reduce((a, r) => a + r.budgeted, 0) || PLAN_TOTAL_INCOME;
  const unassigned = incomeBudget - totalBudgeted;

  // Suggested plan split (for the explainer)
  // Savings is shown on its own so you can see it next to the spending sections.
  const isSaving = (n: string) => /saving/i.test(n);
  const planByGroup = [
    ...sections.filter((x) => !x.income).map((s) => ({
      key: s.type, label: s.label, color: s.color,
      amount: PLAN_LINES.filter((l) => l.type === s.type && !isSaving(l.name)).reduce((a, l) => a + l.amount, 0),
    })),
    { key: "savings", label: "Savings", color: "#34D399", amount: PLAN_LINES.filter((l) => isSaving(l.name)).reduce((a, l) => a + l.amount, 0) },
  ].filter((g) => g.amount > 0);

  const apply = applySuggestedPlan.bind(null, year, month);
  const copy = copyPreviousBudget.bind(null, year, month);

  return (
    <>
      <PageHeader eyebrow="Money" title="Budget & savings" sub="Your monthly plan, savings goals and how to start investing." right={<MonthNav base="/money/budget" year={year} month={month} />} />
      <Tabs items={MONEY_TABS} active="/money/budget" />

      <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card title="Your plan at a glance" right={<span className="num text-sm text-muted">{eur(PLAN_TOTAL_INCOME, 0)} / month</span>}>
          <div className="flex h-4 w-full overflow-hidden rounded-full">
            {planByGroup.map((g) => (
              <div key={g.key} title={g.label} style={{ width: `${(g.amount / PLAN_TOTAL_INCOME) * 100}%`, background: g.color }} />
            ))}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {planByGroup.map((g) => (
              <li key={g.key}>
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ background: g.color }} />
                  {g.label}
                </p>
                <p className="num text-lg font-semibold">{eur(g.amount, 0)}</p>
                <p className="num text-xs text-muted">{Math.round((g.amount / PLAN_TOTAL_INCOME) * 100)}%</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">
            Based on €1,200 salary + €500 from haircuts. Essential bills are a bit above the usual 50% because of the phone contract;
            from March 2027 that €211 a month moves to savings and you&apos;ll save about 40%.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton action={apply} className="btn-primary" confirmText={`Set ${monthLabel(year, month)}'s budget to the suggested plan? Existing amounts for those categories will be replaced.`}>
              <Sparkles size={16} /> Use suggested plan for {monthLabel(year, month)}
            </ActionButton>
            <ActionButton action={copy} confirmText="Copy every budget amount from last month into this month?">
              <Copy size={16} /> Copy last month
            </ActionButton>
          </div>
        </Card>

        <Card title="Rules this plan follows">
          <ul className="space-y-3">
            {RULES.map((r) => (
              <li key={r.title}>
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-sm text-muted">{r.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="card mb-8 flex flex-wrap items-center gap-3 p-4">
        <div className="mr-auto">
          <p className="text-sm font-medium">{monthLabel(year, month)}</p>
          <p className="text-sm text-muted">
            Budgeted <span className="num text-ink">{eur(totalBudgeted)}</span> of <span className="num text-ink">{eur(incomeBudget)}</span>
            {Math.abs(unassigned) > 0.5 && (
              <span className={unassigned < 0 ? " text-bad" : " text-warn"}> · {unassigned < 0 ? `${eur(-unassigned)} over-planned` : `${eur(unassigned)} not assigned yet`}</span>
            )}
          </p>
        </div>
        <Link href={`/money?year=${year}&month=${month}`} className="btn-ghost">
          Edit budget vs actual <ArrowRight size={14} />
        </Link>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="goals" className="scroll-mt-6 text-lg font-semibold">Your savings goals</h2>
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
