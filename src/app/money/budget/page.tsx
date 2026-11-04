import { Sparkles, Copy } from "lucide-react";
import { PageHeader, MonthNav, Tabs, MONEY_TABS, Card } from "@/components/ui";
import BudgetTable from "@/components/BudgetTable";
import ActionButton from "@/components/ActionButton";
import { getBudget } from "@/lib/finance";
import { eur, monthLabel, parseYM } from "@/lib/dates";
import { GROUP_META, PLAN_LINES, PLAN_TOTAL_INCOME, RULES, groupOf } from "@/lib/plan/budget";
import { applySuggestedPlan, copyPreviousBudget } from "@/app/actions";

export const dynamic = "force-dynamic";

const ORDER = ["needs", "wants", "giving", "business", "savings"] as const;

export default async function BudgetPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const { year, month } = parseYM(searchParams);
  const rows = await getBudget(year, month);
  const incomeRows = rows.filter((r) => r.group === "income");
  const totalBudgeted = rows.filter((r) => r.group !== "income").reduce((a, r) => a + r.budgeted, 0);
  const incomeBudget = incomeRows.reduce((a, r) => a + r.budgeted, 0) || PLAN_TOTAL_INCOME;
  const unassigned = incomeBudget - totalBudgeted;

  // Suggested plan split (for the explainer)
  const planByGroup = ORDER.map((g) => ({
    g,
    amount: PLAN_LINES.filter((l) => groupOf(l.type, l.name) === g).reduce((a, l) => a + l.amount, 0),
  }));

  const apply = applySuggestedPlan.bind(null, year, month);
  const copy = copyPreviousBudget.bind(null, year, month);

  return (
    <>
      <PageHeader eyebrow="Money" title="Budget" right={<MonthNav base="/money/budget" year={year} month={month} />} />
      <Tabs items={MONEY_TABS} active="/money/budget" />

      <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card title="Your plan at a glance" right={<span className="num text-sm text-muted">{eur(PLAN_TOTAL_INCOME, 0)} / month</span>}>
          <div className="flex h-4 w-full overflow-hidden rounded-full">
            {planByGroup.map(({ g, amount }) => (
              <div key={g} title={GROUP_META[g].label} style={{ width: `${(amount / PLAN_TOTAL_INCOME) * 100}%`, background: GROUP_META[g].color }} />
            ))}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {planByGroup.map(({ g, amount }) => (
              <li key={g}>
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ background: GROUP_META[g].color }} />
                  {GROUP_META[g].label}
                </p>
                <p className="num text-lg font-semibold">{eur(amount, 0)}</p>
                <p className="num text-xs text-muted">{Math.round((amount / PLAN_TOTAL_INCOME) * 100)}%</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">
            Based on €1,200 salary + €500 from haircuts. Needs are a bit above the usual 50% because of the phone contract;
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

      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{monthLabel(year, month)}</h2>
        <p className="text-sm text-muted">
          Budgeted <span className="num text-ink">{eur(totalBudgeted)}</span> of <span className="num text-ink">{eur(incomeBudget)}</span>
          {Math.abs(unassigned) > 0.5 && (
            <span className={unassigned < 0 ? " text-bad" : " text-warn"}> · {unassigned < 0 ? `${eur(-unassigned)} over-planned` : `${eur(unassigned)} not assigned yet`}</span>
          )}
        </p>
      </div>
      <p className="mb-4 text-sm text-muted">Type a number in any box to change the budget; it saves when you leave the box.</p>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Income" pad={false}>
          <BudgetTable rows={incomeRows} year={year} month={month} income />
        </Card>
        {ORDER.map((g) => {
          const list = rows.filter((r) => r.group === g);
          if (!list.length) return null;
          const b = list.reduce((a, r) => a + r.budgeted, 0);
          const act = list.reduce((a, r) => a + r.actual, 0);
          return (
            <Card
              key={g}
              pad={false}
              title={<span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: GROUP_META[g].color }} />{GROUP_META[g].label}</span>}
              right={<span className="num text-xs text-muted">{eur(act)} / {eur(b)}</span>}
            >
              <BudgetTable rows={list} year={year} month={month} />
            </Card>
          );
        })}
      </div>
    </>
  );
}
