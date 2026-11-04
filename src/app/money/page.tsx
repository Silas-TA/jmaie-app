import { PageHeader, MonthNav, Tabs, MONEY_TABS, Stat } from "@/components/ui";
import QuickAdd from "@/components/QuickAdd";
import TxList from "@/components/TxList";
import { getCategories, getFrequentCategoryIds, getMonthSummary, getTransactions } from "@/lib/finance";
import { eur, parseYM, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function MoneyPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const { year, month } = parseYM(searchParams);
  const [cats, frequent, txs, s] = await Promise.all([
    getCategories(),
    getFrequentCategoryIds(),
    getTransactions(year, month),
    getMonthSummary(year, month),
  ]);
  return (
    <>
      <PageHeader eyebrow="Money" title="Transactions" right={<MonthNav base="/money" year={year} month={month} />} />
      <Tabs items={MONEY_TABS} active="/money" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Income" value={eur(s.income)} tone="good" />
        <Stat label="Spent" value={eur(s.spent)} />
        <Stat label="Saved" value={eur(s.saved)} tone="accent" />
        <Stat label="Left over" value={eur(s.left)} tone={s.left < 0 ? "bad" : undefined} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
        <div className="lg:sticky lg:top-8">
          <QuickAdd categories={cats} frequent={frequent} today={todayISO()} />
        </div>
        <TxList txs={txs} categories={cats} />
      </div>
    </>
  );
}
