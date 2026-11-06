import Link from "next/link";
import clsx from "clsx";
import { PageHeader, MonthNav, Tabs, MONEY_TABS, Stat } from "@/components/ui";
import QuickAdd from "@/components/QuickAdd";
import TxList from "@/components/TxList";
import BudgetActual from "@/components/BudgetActual";
import { getBudget, getCategories, getFrequentCategoryIds, getMonthSummary, getSections, getTransactions } from "@/lib/finance";
import { addDays, eur, monthRange, parseYM, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function MoneyPage({ searchParams }: { searchParams: { year?: string; month?: string; view?: string } }) {
  const { year, month } = parseYM(searchParams);
  const view = searchParams.view === "list" ? "list" : "categories";
  const [cats, frequent, txs, s, budget, sections] = await Promise.all([
    getCategories(),
    getFrequentCategoryIds(),
    getTransactions(year, month),
    getMonthSummary(year, month),
    getBudget(year, month),
    getSections(),
  ]);

  // Date used when filling in the checklist: today if viewing this month,
  // otherwise the last day of a past month / first day of a future one.
  const today = todayISO();
  const [start, end] = monthRange(year, month);
  const entryDate = today >= start && today < end ? today : today >= end ? addDays(end, -1) : start;

  const viewLink = (v: string) => `/money?year=${year}&month=${month}${v === "list" ? "&view=list" : ""}`;

  return (
    <>
      <PageHeader eyebrow="Money" title="Transactions" right={<MonthNav base="/money" year={year} month={month} />} />
      <Tabs items={MONEY_TABS} active="/money" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Income" value={eur(s.income)} tone="good" sub={s.includeHaircut ? undefined : "Haircut income left out"} />
        <Stat label="Spent" value={eur(s.spent)} />
        <Stat label="Saved" value={eur(s.saved)} tone="accent" />
        <Stat label="Left over" value={eur(s.left)} tone={s.left < 0 ? "bad" : undefined} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
        <div className="min-w-0 lg:sticky lg:top-8">
          <QuickAdd categories={cats} frequent={frequent} today={entryDate} sections={sections} />
        </div>
        <div className="min-w-0">
          <div className="mb-3 flex w-fit rounded-xl border border-line bg-panel p-1 text-sm">
            {[["categories", "Budget vs actual"], ["list", `All transactions (${txs.length})`]].map(([k, label]) => (
              <Link key={k} href={viewLink(k)} className={clsx("rounded-lg px-3 py-1.5", view === k ? "bg-accent/15 font-medium text-accent" : "text-muted hover:text-ink")}>
                {label}
              </Link>
            ))}
          </div>
          {view === "categories" ? (
            <BudgetActual rows={budget.filter((r) => !r.isArchived)} year={year} month={month} includeHaircut={s.includeHaircut} sections={sections} />
          ) : (
            <TxList txs={txs} categories={cats} />
          )}
        </div>
      </div>
    </>
  );
}
