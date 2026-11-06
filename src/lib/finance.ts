import { q, one, getSetting } from "./db";
import { isoDate, monthRange } from "./dates";
import { groupOf, isHaircutExpense, withLabels, type Group, type Section } from "./plan/budget";

/** The six sections, with your own names if you renamed any. */
export async function getSections(): Promise<Section[]> {
  let labels: Record<string, string> = {};
  try { labels = JSON.parse((await getSetting("section_labels")) || "{}"); } catch {}
  return withLabels(labels);
}

/** Whether haircut income (and iCut costs) count in the main totals. On by default. */
export async function getIncludeHaircut(): Promise<boolean> {
  return (await getSetting("include_haircut")) !== "false";
}

export type Category = {
  id: string;
  name: string;
  type: string;
  color: string;
  isArchived: boolean;
  group: Group;
};

export type Tx = {
  id: string;
  date: string;
  amount: number;
  direction: "income" | "expense";
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  source: string;
};

export async function getCategories(includeArchived = false): Promise<Category[]> {
  const rows = await q<{ id: string; name: string; type: string; color: string; is_archived: boolean }>(
    `SELECT id, name, type::text AS type, color, is_archived FROM categories
     ${includeArchived ? "" : "WHERE is_archived = false"}
     ORDER BY name`
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    color: r.color,
    isArchived: r.is_archived,
    group: groupOf(r.type, r.name),
  }));
}

export async function getTransactions(year: number, month: number): Promise<Tx[]> {
  const [start, end] = monthRange(year, month);
  const rows = await q<{
    id: string; date: Date; amount: string; direction: "income" | "expense"; description: string;
    category_id: string | null; cname: string | null; ccolor: string | null; source: string;
  }>(
    `SELECT t.id, t.date, t.amount, t.direction::text AS direction, t.description, t.category_id,
            c.name AS cname, c.color AS ccolor, t.source::text AS source
       FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.date >= $1 AND t.date < $2
      ORDER BY t.date DESC, t.created_at DESC`,
    [start, end]
  );
  return rows.map((r) => ({
    id: r.id,
    date: isoDate(r.date),
    amount: Number(r.amount),
    direction: r.direction,
    description: r.description,
    categoryId: r.category_id,
    categoryName: r.cname,
    categoryColor: r.ccolor,
    source: r.source,
  }));
}

export type BudgetRow = Category & { budgeted: number; actual: number; notes: string | null };

export async function getBudget(year: number, month: number): Promise<BudgetRow[]> {
  const [start, end] = monthRange(year, month);
  const cats = await getCategories(true);
  const budgets = await q<{ category_id: string; budgeted_amount: string; notes: string | null }>(
    `SELECT category_id, budgeted_amount, notes FROM budgets WHERE year = $1 AND month = $2`,
    [year, month]
  );
  const actuals = await q<{ category_id: string; total: string }>(
    `SELECT category_id, SUM(amount) AS total FROM transactions
      WHERE date >= $1 AND date < $2 AND category_id IS NOT NULL
      GROUP BY category_id`,
    [start, end]
  );
  const bMap = new Map(budgets.map((b) => [b.category_id, b]));
  const aMap = new Map(actuals.map((a) => [a.category_id, Number(a.total)]));
  return cats
    .map((c) => ({
      ...c,
      budgeted: Number(bMap.get(c.id)?.budgeted_amount ?? 0),
      notes: bMap.get(c.id)?.notes ?? null,
      actual: aMap.get(c.id) ?? 0,
    }))
    .filter((r) => !r.isArchived || r.budgeted || r.actual);
}

export type MonthSummary = {
  income: number;
  salary: number;
  haircut: number;
  otherIncome: number;
  spent: number; // all expenses except savings transfers
  saved: number; // expenses categorised as savings
  left: number; // income - spent - saved
  savingsRate: number; // (saved + left) / income
  byGroup: Record<string, { budgeted: number; actual: number }>;
  /** Budget vs actual per category type (the v0.1 sections). */
  byType: Record<string, { budgeted: number; actual: number }>;
  budgetedSpend: number;
  includeHaircut: boolean;
};

export async function getMonthSummary(year: number, month: number): Promise<MonthSummary> {
  const [allRows, includeHaircut] = await Promise.all([getBudget(year, month), getIncludeHaircut()]);
  const rows = includeHaircut ? allRows : allRows.filter((r) => r.type !== "income_haircut" && !isHaircutExpense(r.type, r.name));
  const [start, end] = monthRange(year, month);
  const uncategorised = await one<{ income: string | null; expense: string | null }>(
    `SELECT SUM(CASE WHEN direction='income' THEN amount END) AS income,
            SUM(CASE WHEN direction='expense' THEN amount END) AS expense
       FROM transactions WHERE date >= $1 AND date < $2 AND category_id IS NULL`,
    [start, end]
  );
  let salary = 0, haircut = 0, otherIncome = Number(uncategorised?.income ?? 0);
  let spent = Number(uncategorised?.expense ?? 0), saved = 0, budgetedSpend = 0;
  const byGroup: MonthSummary["byGroup"] = {};
  const byType: MonthSummary["byType"] = {};
  for (const r of rows) {
    byType[r.type] ??= { budgeted: 0, actual: 0 };
    byType[r.type].budgeted += r.budgeted;
    byType[r.type].actual += r.actual;
    if (r.group === "income") {
      if (r.type === "income_salary") salary += r.actual;
      else if (r.type === "income_haircut") haircut += r.actual;
      else otherIncome += r.actual;
      continue;
    }
    byGroup[r.group] ??= { budgeted: 0, actual: 0 };
    byGroup[r.group].budgeted += r.budgeted;
    byGroup[r.group].actual += r.actual;
    if (r.group === "savings") saved += r.actual;
    else {
      spent += r.actual;
      budgetedSpend += r.budgeted;
    }
  }
  const income = salary + haircut + otherIncome;
  const left = income - spent - saved;
  return {
    income, salary, haircut, otherIncome, spent, saved, left,
    savingsRate: income > 0 ? (saved + Math.max(0, left)) / income : 0,
    byGroup, byType, budgetedSpend, includeHaircut,
  };
}

/** Income vs spending for the last n months (oldest first). */
export async function getTrend(year: number, month: number, n = 6) {
  const startD = new Date(Date.UTC(year, month - n, 1));
  const [, end] = monthRange(year, month);
  const includeHaircut = await getIncludeHaircut();
  const rows = await q<{ ym: string; direction: string; savings: boolean; total: string }>(
    `SELECT to_char(t.date, 'YYYY-MM') AS ym, t.direction::text AS direction,
            (COALESCE(c.type::text,'') = 'savings' OR COALESCE(c.name,'') ILIKE '%saving%') AS savings, SUM(t.amount) AS total
       FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.date >= $1 AND t.date < $2
        AND ($3::boolean OR (COALESCE(c.type::text,'') <> 'income_haircut'
             AND NOT (COALESCE(c.type::text,'') NOT LIKE 'income%' AND COALESCE(c.name,'') ~* 'haircut business|icut')))
      GROUP BY 1, 2, 3`,
    [startD.toISOString().slice(0, 10), end, includeHaircut]
  );
  const out: { ym: string; label: string; income: number; spent: number; saved: number }[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(year, month - n + i, 1));
    const ym = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
    const forM = rows.filter((r) => r.ym === ym);
    out.push({
      ym, label,
      income: forM.filter((r) => r.direction === "income").reduce((a, r) => a + Number(r.total), 0),
      spent: forM.filter((r) => r.direction === "expense" && !r.savings).reduce((a, r) => a + Number(r.total), 0),
      saved: forM.filter((r) => r.direction === "expense" && r.savings).reduce((a, r) => a + Number(r.total), 0),
    });
  }
  return out;
}

export type Booking = { id: string; date: string; amount: number; paid: boolean; notes: string | null; client: string | null };

export async function getBookings(year: number, month: number): Promise<Booking[]> {
  const [start, end] = monthRange(year, month);
  const rows = await q<{ id: string; date: Date; amount: string; paid: boolean; notes: string | null; client: string | null }>(
    `SELECT b.id, b.date, b.amount, b.paid, b.notes, c.name AS client
       FROM haircut_bookings b LEFT JOIN haircut_clients c ON c.id = b.client_id
      WHERE b.date >= $1 AND b.date < $2 ORDER BY b.date DESC, b.created_at DESC`,
    [start, end]
  );
  return rows.map((r) => ({ id: r.id, date: isoDate(r.date), amount: Number(r.amount), paid: r.paid, notes: r.notes, client: r.client }));
}

export async function getClientNames(): Promise<string[]> {
  const rows = await q<{ name: string }>(
    `SELECT c.name FROM haircut_clients c
       LEFT JOIN haircut_bookings b ON b.client_id = c.id
      GROUP BY c.id, c.name ORDER BY MAX(b.date) DESC NULLS LAST, c.name LIMIT 200`
  );
  return rows.map((r) => r.name);
}

export type GoalRow = { id: string; name: string; type: string; target: number; current: number; targetDate: string | null };

export async function getGoals(): Promise<GoalRow[]> {
  const rows = await q<{ id: string; name: string; type: string; target_amount: string; current_amount: string | null; target_date: Date | null }>(
    `SELECT id, name, type::text AS type, target_amount, current_amount, target_date FROM goals ORDER BY created_at`
  );
  return rows.map((r) => ({
    id: r.id, name: r.name, type: r.type,
    target: Number(r.target_amount), current: Number(r.current_amount ?? 0),
    targetDate: r.target_date ? isoDate(r.target_date) : null,
  }));
}

/** Most-used categories (for quick-add chips). */
export async function getFrequentCategoryIds(limit = 8): Promise<string[]> {
  const rows = await q<{ category_id: string }>(
    `SELECT category_id FROM transactions WHERE category_id IS NOT NULL AND date > CURRENT_DATE - 120
      GROUP BY category_id ORDER BY COUNT(*) DESC LIMIT $1`,
    [limit]
  );
  return rows.map((r) => r.category_id);
}
