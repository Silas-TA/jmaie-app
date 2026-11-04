import { PageHeader, MonthNav, Tabs, MONEY_TABS, Card, Stat } from "@/components/ui";
import { BookingForm, BookingList } from "@/components/Bookings";
import { getBookings, getBudget, getClientNames } from "@/lib/finance";
import { eur, parseYM, todayISO } from "@/lib/dates";
import { PLAN_INCOME } from "@/lib/plan/budget";

export const dynamic = "force-dynamic";

export default async function CutsPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const { year, month } = parseYM(searchParams);
  const [bookings, clients, budget] = await Promise.all([getBookings(year, month), getClientNames(), getBudget(year, month)]);
  const paid = bookings.filter((b) => b.paid).reduce((a, b) => a + b.amount, 0);
  const unpaid = bookings.filter((b) => !b.paid).reduce((a, b) => a + b.amount, 0);
  const haircutIncome = budget.filter((r) => r.type === "income_haircut").reduce((a, r) => a + r.actual, 0);
  const expenses = budget.filter((r) => r.group === "business").reduce((a, r) => a + r.actual, 0);
  const profit = haircutIncome - expenses;

  return (
    <>
      <PageHeader eyebrow="Money" title="iCut business" right={<MonthNav base="/cuts" year={year} month={month} />} />
      <Tabs items={MONEY_TABS} active="/cuts" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Haircut income" value={eur(haircutIncome)} tone="good" sub={`${bookings.filter((b) => b.paid).length} paid cuts logged · ${eur(paid)}`} />
        <Stat label="Unpaid" value={eur(unpaid)} />
        <Stat label="Supplies" value={eur(expenses)} tone={expenses ? "bad" : undefined} />
        <Stat label="Profit" value={eur(profit)} tone="accent" sub={profit >= PLAN_INCOME.haircuts ? "On target (€500)" : `€${Math.round(PLAN_INCOME.haircuts - profit)} below the €500 plan`} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
        <BookingForm clients={clients} today={todayISO()} />
        <Card title="Haircuts this month" pad={false}>
          <BookingList bookings={bookings} />
        </Card>
      </div>
    </>
  );
}
