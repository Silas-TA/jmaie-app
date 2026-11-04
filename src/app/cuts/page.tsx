import { PageHeader, MonthNav, Tabs, MONEY_TABS, Stat } from "@/components/ui";
import { CutEntry, CutActivity } from "@/components/Bookings";
import { getBookings, getBudget, getClientNames, getTransactions } from "@/lib/finance";
import { eur, parseYM, todayISO } from "@/lib/dates";
import { PLAN_INCOME } from "@/lib/plan/budget";

export const dynamic = "force-dynamic";

export default async function CutsPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const { year, month } = parseYM(searchParams);
  const [bookings, clients, budget, txs] = await Promise.all([
    getBookings(year, month), getClientNames(), getBudget(year, month), getTransactions(year, month),
  ]);
  const paid = bookings.filter((b) => b.paid).reduce((a, b) => a + b.amount, 0);
  const unpaid = bookings.filter((b) => !b.paid).reduce((a, b) => a + b.amount, 0);
  const haircutIncome = budget.filter((r) => r.type === "income_haircut").reduce((a, r) => a + r.actual, 0);
  const businessIds = new Set(budget.filter((r) => r.group === "business").map((r) => r.id));
  const expenseList = txs.filter((t) => t.direction === "expense" && t.categoryId && businessIds.has(t.categoryId));
  const expenses = expenseList.reduce((a, t) => a + t.amount, 0);
  const profit = haircutIncome - expenses;
  const today = todayISO();

  return (
    <>
      <PageHeader eyebrow="Money" title="iCut business" right={<MonthNav base="/cuts" year={year} month={month} />} />
      <Tabs items={MONEY_TABS} active="/cuts" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Haircut income" value={eur(haircutIncome)} tone="good" sub={`${bookings.filter((b) => b.paid).length} paid cuts logged · ${eur(paid)}`} />
        <Stat label="Unpaid" value={eur(unpaid)} />
        <Stat label="Expenses" value={eur(expenses)} tone={expenses ? "bad" : undefined} sub={`${expenseList.length} this month`} />
        <Stat label="Profit" value={eur(profit)} tone="accent" sub={profit >= PLAN_INCOME.haircuts ? "On target (€500)" : `€${Math.round(PLAN_INCOME.haircuts - profit)} below the €500 plan`} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,400px)_1fr] lg:items-start">
        <div className="min-w-0 lg:sticky lg:top-8">
          <CutEntry clients={clients} today={today} />
        </div>
        <div className="min-w-0">
          <CutActivity bookings={bookings} expenses={expenseList} />
        </div>
      </div>
    </>
  );
}
