import { Sparkles, Copy } from "lucide-react";
import { PageHeader, MonthNav, Tabs, MONEY_TABS, Card } from "@/components/ui";
import BudgetActual from "@/components/BudgetActual";
import ActionButton from "@/components/ActionButton";
import { getBudget, getIncludeHaircut } from "@/lib/finance";
import { eur, monthLabel, parseYM } from "@/lib/dates";
import { EXPENSE_SECTIONS, PLAN_LINES, PLAN_TOTAL_INCOME, RULES, isHaircutExpense } from "@/lib/plan/budget";
import { applySuggestedPlan, copyPreviousBudget } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function BudgetPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const { year, month } = parseYM(searchParams);
  const [rows, includeHaircut] = await Promise.all([getBudget(year, month), getIncludeHaircut()]);
  const counts = (r: { type: string; name: string }) => includeHaircut || (r.type !== "income_haircut" && !isHaircutExpense(r.type, r.name));
  const incomeRows = rows.filter((r) => r.type.startsWith("income") && counts(r));
  const totalBudgeted = rows.filter((r) => !r.type.startsWith("income") && !r.isArchived && counts(r)).reduce((a, r) => a + r.budgeted, 0);
  const incomeBudget = incomeRows.reduce((a, r) => a + r.budgeted, 0) || PLAN_TOTAL_INCOME;
  const unassigned = incomeBudget - totalBudgeted;

  // Suggested plan split (for the explainer)
  // Savings is shown on its own so you can see it next to the spending sections.
  const isSaving = (n: string) => /saving/i.test(n);
  const planByGroup = [
    ...EXPENSE_SECTIONS.map((s) => ({
      key: s.type, label: s.label, color: s.color,
      amount: PLAN_LINES.filter((l) => l.type === s.type && !isSaving(l.name)).reduce((a, l) => a + l.amount, 0),
    })),
    { key: "savings", label: "Savings", color: "#34D399", amount: PLAN_LINES.filter((l) => isSaving(l.name)).reduce((a, l) => a + l.amount, 0) },
  ].filter((g) => g.amount > 0);

  const apply = applySuggestedPlan.bind(null, year, month);
  const copy = copyPreviousBudget.bind(null, year, month);

  return (
    <>
      <PageHeader eyebrow="Money" title="Budget" right={<MonthNav base="/money/budget" year={year} month={month} />} />
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

      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{monthLabel(year, month)}</h2>
        <p className="text-sm text-muted">
          Budgeted <span className="num text-ink">{eur(totalBudgeted)}</span> of <span className="num text-ink">{eur(incomeBudget)}</span>
          {Math.abs(unassigned) > 0.5 && (
            <span className={unassigned < 0 ? " text-bad" : " text-warn"}> · {unassigned < 0 ? `${eur(-unassigned)} over-planned` : `${eur(unassigned)} not assigned yet`}</span>
          )}
        </p>
      </div>
      <BudgetActual rows={rows.filter((r) => !r.isArchived)} year={year} month={month} includeHaircut={includeHaircut} />
    </>
  );
}
