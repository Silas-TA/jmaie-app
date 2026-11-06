"use server";

import { revalidatePath } from "next/cache";
import { q, one, newId, setSetting, getSetting } from "@/lib/db";
import { PLAN_LINES, PLAN_INCOME, SECTIONS } from "@/lib/plan/budget";
import { recipeByKey, MAIN_ROTATION } from "@/lib/plan/nutrition";
import { EMERGENCY_FUND_TARGET } from "@/lib/plan/budget";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const money = (v: unknown) => {
  const n = Math.round(Number(String(v).replace(",", ".")) * 100) / 100;
  if (!Number.isFinite(n) || n <= 0 || n > 1_000_000) throw new Error("Enter an amount above 0");
  return n;
};
const date = (v: unknown) => {
  const s = String(v ?? "");
  if (!ISO.test(s)) throw new Error("Invalid date");
  return s;
};
const refreshAll = () => revalidatePath("/", "layout");

// ─── Transactions ────────────────────────────────────────────

export async function addTransaction(input: {
  direction: "income" | "expense"; amount: number | string; date: string; categoryId: string | null; description: string;
}) {
  const amount = money(input.amount);
  const d = date(input.date);
  const direction = input.direction === "income" ? "income" : "expense";
  let desc = String(input.description || "").trim().slice(0, 200);
  if (!desc && input.categoryId) {
    const c = await one<{ name: string }>(`SELECT name FROM categories WHERE id = $1`, [input.categoryId]);
    desc = c?.name ?? "";
  }
  await q(
    `INSERT INTO transactions (id, category_id, direction, amount, date, description, source)
     VALUES ($1, $2, $3::"Direction", $4, $5, $6, 'manual')`,
    [newId(), input.categoryId || null, direction, amount, d, desc || (direction === "income" ? "Income" : "Expense")]
  );
  refreshAll();
}

export async function updateTransaction(id: string, input: {
  direction: "income" | "expense"; amount: number | string; date: string; categoryId: string | null; description: string;
}) {
  await q(
    `UPDATE transactions SET direction = $2::"Direction", amount = $3, date = $4, category_id = $5, description = $6 WHERE id = $1`,
    [id, input.direction === "income" ? "income" : "expense", money(input.amount), date(input.date), input.categoryId || null, String(input.description || "").trim().slice(0, 200) || "—"]
  );
  refreshAll();
}

export async function deleteTransaction(id: string) {
  await q(`DELETE FROM transactions WHERE id = $1`, [id]);
  refreshAll();
}

// ─── Categories & budget ─────────────────────────────────────

const PALETTE = ["#60A5FA", "#F472B6", "#34D399", "#FBBF24", "#A78BFA", "#22D3EE", "#FB923C", "#F87171"];

export async function addCategory(name: string, type: string) {
  const clean = name.trim().slice(0, 60);
  if (!clean) throw new Error("Name required");
  const allowed = ["income_salary", "income_haircut", "income_other", "fixed", "subscription", "family_giving", "debt", "variable", "savings"];
  if (!allowed.includes(type)) throw new Error("Invalid type");
  const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  await q(`INSERT INTO categories (id, name, type, color) VALUES ($1, $2, $3::"CategoryType", $4)`, [newId(), clean, type, color]);
  refreshAll();
}

export async function setCategoryArchived(id: string, archived: boolean) {
  await q(`UPDATE categories SET is_archived = $2 WHERE id = $1`, [id, archived]);
  refreshAll();
}

export async function setBudget(categoryId: string, year: number, month: number, amount: number) {
  const a = Math.max(0, Math.round(Number(amount) * 100) / 100);
  await q(
    `INSERT INTO budgets (id, category_id, year, month, budgeted_amount) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (category_id, year, month) DO UPDATE SET budgeted_amount = EXCLUDED.budgeted_amount`,
    [newId(), categoryId, year, month, a]
  );
  refreshAll();
}

const CATEGORY_TYPES = ["income_salary", "income_haircut", "income_other", "fixed", "subscription", "family_giving", "debt", "variable", "savings"];
const amountOrZero = (v: unknown) => {
  const n = Math.round(Number(String(v ?? "").replace(",", ".")) * 100) / 100;
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) throw new Error("Enter a valid amount");
  return n;
};
function monthBounds(year: number, month: number): [string, string, string] {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  // Entry date for a summary amount: today if it falls in the month, else the 1st.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vilnius" }).format(new Date());
  return [start, next, today >= start && today < next ? today : start];
}

/**
 * Sets a category's actual for a month (like v0.1). If the new total is higher,
 * the difference is added as one entry so earlier entries are kept; if it's
 * lower, that month's entries are replaced by a single entry for the new total.
 */
export async function setCategoryActual(categoryId: string, year: number, month: number, amount: number | string) {
  const target = amountOrZero(amount);
  const cat = await one<{ name: string; type: string }>(`SELECT name, type::text AS type FROM categories WHERE id = $1`, [categoryId]);
  if (!cat) throw new Error("Category not found");
  if (cat.type === "income_haircut") throw new Error("Haircut income comes from the iCut page");
  const [start, next, entryDate] = monthBounds(year, month);
  const cur = await one<{ total: string | null }>(
    `SELECT SUM(amount) AS total FROM transactions WHERE category_id = $1 AND date >= $2 AND date < $3`,
    [categoryId, start, next]
  );
  const current = Number(cur?.total ?? 0);
  const diff = Math.round((target - current) * 100) / 100;
  if (Math.abs(diff) < 0.005) return;
  const direction = cat.type.startsWith("income") ? "income" : "expense";
  if (diff > 0) {
    await q(
      `INSERT INTO transactions (id, category_id, direction, amount, date, description, source)
       VALUES ($1, $2, $3::"Direction", $4, $5, $6, 'manual')`,
      [newId(), categoryId, direction, diff, entryDate, cat.name]
    );
  } else {
    await q(`DELETE FROM transactions WHERE category_id = $1 AND date >= $2 AND date < $3`, [categoryId, start, next]);
    if (target > 0) {
      await q(
        `INSERT INTO transactions (id, category_id, direction, amount, date, description, source)
         VALUES ($1, $2, $3::"Direction", $4, $5, $6, 'manual')`,
        [newId(), categoryId, direction, target, entryDate, cat.name]
      );
    }
  }
  refreshAll();
}

/** Turns haircut income (and iCut costs) on or off in the main totals. */
export async function setIncludeHaircut(on: boolean) {
  await setSetting("include_haircut", on ? "true" : "false");
  refreshAll();
}

/** Renames one of the six sections (empty name = back to the default). */
export async function renameSection(sectionType: string, label: string) {
  if (!SECTIONS.some((s) => s.type === sectionType)) throw new Error("Unknown section");
  let labels: Record<string, string> = {};
  try { labels = JSON.parse((await getSetting("section_labels")) || "{}"); } catch {}
  const clean = label.trim().slice(0, 40);
  if (clean) labels[sectionType] = clean;
  else delete labels[sectionType];
  await setSetting("section_labels", JSON.stringify(labels));
  refreshAll();
}

/**
 * Moves a row to another section. Moving between income and spending also flips
 * its past entries so totals stay right.
 */
export async function moveCategory(id: string, sectionType: string) {
  const target = SECTIONS.find((s) => s.type === sectionType);
  if (!target) throw new Error("Unknown section");
  const cat = await one<{ type: string }>(`SELECT type::text AS type FROM categories WHERE id = $1`, [id]);
  if (!cat) throw new Error("Row not found");
  if (cat.type === "income_haircut") throw new Error("Haircut Business is linked to the iCut page and stays in Income");
  if ((target.types as readonly string[]).includes(cat.type)) return;
  const newType = target.type;
  await q(`UPDATE categories SET type = $2::"CategoryType" WHERE id = $1`, [id, newType]);
  const wasIncome = cat.type.startsWith("income");
  if (wasIncome !== target.income) {
    await q(`UPDATE transactions SET direction = $2::"Direction" WHERE category_id = $1`, [id, target.income ? "income" : "expense"]);
  }
  refreshAll();
}

export async function renameCategory(id: string, name: string) {
  const clean = name.trim().slice(0, 60);
  if (!clean) throw new Error("Name can't be empty");
  await q(`UPDATE categories SET name = $2 WHERE id = $1`, [id, clean]);
  refreshAll();
}

/** Adds a new row (category) to a section, with optional budget and actual for this month. */
export async function addCategoryRow(input: { name: string; type: string; year: number; month: number; budget?: string; actual?: string }) {
  const name = input.name.trim().slice(0, 60);
  if (!name) throw new Error("Give the row a name");
  if (!CATEGORY_TYPES.includes(input.type)) throw new Error("Invalid section");
  const budget = amountOrZero(input.budget || 0);
  const actual = amountOrZero(input.actual || 0);
  const existing = await one<{ id: string; is_archived: boolean }>(
    `SELECT id, is_archived FROM categories WHERE lower(name) = lower($1) AND type = $2::"CategoryType" LIMIT 1`,
    [name, input.type]
  );
  let id = existing?.id;
  if (existing) {
    if (!existing.is_archived) throw new Error(`"${name}" already exists in this section`);
    await q(`UPDATE categories SET is_archived = false WHERE id = $1`, [id]);
  } else {
    id = newId();
    await q(`INSERT INTO categories (id, name, type, color) VALUES ($1, $2, $3::"CategoryType", $4)`, [id, name, input.type, PALETTE[Math.floor(Math.random() * PALETTE.length)]]);
  }
  if (budget > 0) await setBudget(id!, input.year, input.month, budget);
  if (actual > 0) await setCategoryActual(id!, input.year, input.month, actual);
  refreshAll();
}

/**
 * Deletes a row. A category with no transactions at all is removed completely;
 * one with past transactions is hidden (archived) so your history stays correct,
 * and this month's entries and budget for it are removed.
 */
export async function deleteCategoryRow(id: string, year: number, month: number) {
  const [start, next] = monthBounds(year, month);
  await q(`DELETE FROM transactions WHERE category_id = $1 AND date >= $2 AND date < $3 AND description NOT LIKE '%[hb:%'`, [id, start, next]);
  await q(`DELETE FROM budgets WHERE category_id = $1 AND (year > $2 OR (year = $2 AND month >= $3))`, [id, year, month]);
  const left = await one<{ n: string }>(`SELECT COUNT(*) AS n FROM transactions WHERE category_id = $1`, [id]);
  const goals = await one<{ n: string }>(`SELECT COUNT(*) AS n FROM goals WHERE linked_category_id = $1`, [id]);
  if (Number(left?.n) === 0 && Number(goals?.n) === 0) {
    await q(`DELETE FROM budgets WHERE category_id = $1`, [id]);
    await q(`DELETE FROM categories WHERE id = $1`, [id]);
  } else {
    await q(`UPDATE categories SET is_archived = true WHERE id = $1`, [id]);
  }
  refreshAll();
}

/** Copies the suggested plan into a month, creating any missing categories. */
export async function applySuggestedPlan(year: number, month: number) {
  const cats = await q<{ id: string; name: string; is_archived: boolean }>(`SELECT id, name, is_archived FROM categories`);
  for (const line of PLAN_LINES) {
    let cat = cats.find((c) => c.name.toLowerCase() === line.name.toLowerCase());
    if (!cat) {
      const id = newId();
      await q(`INSERT INTO categories (id, name, type, color) VALUES ($1, $2, $3::"CategoryType", $4)`, [id, line.name, line.type, PALETTE[cats.length % PALETTE.length]]);
      cat = { id, name: line.name, is_archived: false };
      cats.push(cat);
    } else if (cat.is_archived) {
      await q(`UPDATE categories SET is_archived = false WHERE id = $1`, [cat.id]);
    }
    // Savings has no budget (only an actual): it's whatever you put aside.
    if (line.type === "savings") {
      await q(`UPDATE categories SET type = 'savings' WHERE id = $1`, [cat.id]);
      await q(`DELETE FROM budgets WHERE category_id = $1 AND year = $2 AND month = $3`, [cat.id, year, month]);
      continue;
    }
    await q(
      `INSERT INTO budgets (id, category_id, year, month, budgeted_amount, notes) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (category_id, year, month) DO UPDATE SET budgeted_amount = EXCLUDED.budgeted_amount, notes = EXCLUDED.notes`,
      [newId(), cat.id, year, month, line.amount, line.note ?? null]
    );
  }
  // Income targets
  for (const [type, amount] of [["income_salary", PLAN_INCOME.salary], ["income_haircut", PLAN_INCOME.haircuts]] as const) {
    const c = await one<{ id: string }>(`SELECT id FROM categories WHERE type = $1::"CategoryType" AND is_archived = false ORDER BY name LIMIT 1`, [type]);
    if (c) {
      await q(
        `INSERT INTO budgets (id, category_id, year, month, budgeted_amount) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (category_id, year, month) DO UPDATE SET budgeted_amount = EXCLUDED.budgeted_amount`,
        [newId(), c.id, year, month, amount]
      );
    }
  }
  refreshAll();
}

/** Copies all budget amounts from the previous month. */
export async function copyPreviousBudget(year: number, month: number) {
  const py = month === 1 ? year - 1 : year;
  const pm = month === 1 ? 12 : month - 1;
  await q(
    `INSERT INTO budgets (id, category_id, year, month, budgeted_amount, notes)
     SELECT 'c' || md5(random()::text || category_id), category_id, $3, $4, budgeted_amount, notes
       FROM budgets WHERE year = $1 AND month = $2
     ON CONFLICT (category_id, year, month) DO UPDATE SET budgeted_amount = EXCLUDED.budgeted_amount`,
    [py, pm, year, month]
  );
  refreshAll();
}

// ─── Haircuts ────────────────────────────────────────────────

async function haircutCategoryId(): Promise<string | null> {
  const c = await one<{ id: string }>(`SELECT id FROM categories WHERE type = 'income_haircut' AND is_archived = false ORDER BY name LIMIT 1`);
  return c?.id ?? null;
}

const bookingTag = (id: string) => `[hb:${id}]`;

async function syncBookingIncome(bookingId: string) {
  const b = await one<{ date: Date; amount: string; paid: boolean; client: string | null }>(
    `SELECT b.date, b.amount, b.paid, c.name AS client FROM haircut_bookings b LEFT JOIN haircut_clients c ON c.id = b.client_id WHERE b.id = $1`,
    [bookingId]
  );
  await q(`DELETE FROM transactions WHERE description LIKE $1`, [`%${bookingTag(bookingId)}`]);
  if (b?.paid) {
    await q(
      `INSERT INTO transactions (id, category_id, direction, amount, date, description, source)
       VALUES ($1, $2, 'income', $3, $4, $5, 'manual')`,
      [newId(), await haircutCategoryId(), b.amount, b.date, `iCut: ${b.client ?? "client"} ${bookingTag(bookingId)}`]
    );
  }
}

export async function addBooking(input: { client: string; amount: number | string; date: string; paid: boolean; notes?: string }) {
  const name = input.client.trim().slice(0, 80);
  let clientId: string | null = null;
  if (name) {
    const existing = await one<{ id: string }>(`SELECT id FROM haircut_clients WHERE lower(name) = lower($1) LIMIT 1`, [name]);
    clientId = existing?.id ?? newId();
    if (!existing) await q(`INSERT INTO haircut_clients (id, name, first_booking_date) VALUES ($1, $2, $3)`, [clientId, name, date(input.date)]);
  }
  const id = newId();
  await q(
    `INSERT INTO haircut_bookings (id, client_id, date, amount, paid, notes) VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, clientId, date(input.date), money(input.amount), !!input.paid, input.notes?.trim() || null]
  );
  await syncBookingIncome(id);
  refreshAll();
}

export async function setBookingPaid(id: string, paid: boolean) {
  await q(`UPDATE haircut_bookings SET paid = $2 WHERE id = $1`, [id, paid]);
  await syncBookingIncome(id);
  refreshAll();
}

export async function deleteBooking(id: string) {
  await q(`DELETE FROM transactions WHERE description LIKE $1`, [`%${bookingTag(id)}`]);
  await q(`DELETE FROM haircut_bookings WHERE id = $1`, [id]);
  refreshAll();
}

/** Logs an iCut business expense (supplies, tools…) under the business expense category. */
export async function addBusinessExpense(input: { amount: number | string; date: string; description: string }) {
  let cat = await one<{ id: string }>(
    `SELECT id FROM categories WHERE name ILIKE '%haircut business%' AND type <> 'income_haircut' ORDER BY is_archived, name LIMIT 1`
  );
  if (!cat) {
    const id = newId();
    await q(`INSERT INTO categories (id, name, type, color) VALUES ($1, 'Haircut Business Expenses', 'variable', '#C084FC')`, [id]);
    cat = { id };
  }
  await q(
    `INSERT INTO transactions (id, category_id, direction, amount, date, description, source, is_business_expense)
     VALUES ($1, $2, 'expense', $3, $4, $5, 'manual', true)`,
    [newId(), cat.id, money(input.amount), date(input.date), String(input.description || "").trim().slice(0, 200) || "iCut supplies"]
  );
  refreshAll();
}

// ─── Goals ───────────────────────────────────────────────────

export async function createStarterGoals() {
  const existing = await q<{ name: string }>(`SELECT name FROM goals`);
  const names = existing.map((g) => g.name.toLowerCase());
  if (!names.some((n) => n.includes("emergency"))) {
    await q(`INSERT INTO goals (id, name, type, target_amount, current_amount) VALUES ($1, 'Emergency fund', 'savings', $2, 0)`, [newId(), EMERGENCY_FUND_TARGET]);
  }
  if (!names.some((n) => n.includes("invest"))) {
    await q(`INSERT INTO goals (id, name, type, target_amount, current_amount) VALUES ($1, 'Investing (first year)', 'savings', 1800, 0)`, [newId()]);
  }
  refreshAll();
}

export async function updateGoalAmount(id: string, current: number) {
  await q(`UPDATE goals SET current_amount = $2 WHERE id = $1`, [id, Math.max(0, Number(current) || 0)]);
  refreshAll();
}

export async function addGoal(name: string, target: number) {
  if (!name.trim()) throw new Error("Name required");
  await q(`INSERT INTO goals (id, name, type, target_amount, current_amount) VALUES ($1, $2, 'savings', $3, 0)`, [newId(), name.trim().slice(0, 80), money(target)]);
  refreshAll();
}

export async function deleteGoal(id: string) {
  await q(`DELETE FROM goals WHERE id = $1`, [id]);
  refreshAll();
}

// ─── Meals ───────────────────────────────────────────────────

export async function logRecipe(day: string, slot: string, recipeKey: string) {
  const r = recipeByKey(recipeKey);
  if (!r) throw new Error("Unknown recipe");
  const m = r.perPortion;
  await q(
    `INSERT INTO meal_logs (id, date, slot, recipe_key, name, kcal, protein, carbs, fat) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [newId(), date(day), slot, r.key, r.name, m.kcal, m.protein, m.carbs, m.fat]
  );
  refreshAll();
}

export async function logCustomFood(day: string, slot: string, input: { name: string; kcal: number; protein: number; carbs?: number; fat?: number }) {
  const name = input.name.trim().slice(0, 80);
  if (!name) throw new Error("Name required");
  const n = (v: unknown) => Math.max(0, Math.min(5000, Math.round(Number(v) || 0)));
  await q(
    `INSERT INTO meal_logs (id, date, slot, recipe_key, name, kcal, protein, carbs, fat) VALUES ($1,$2,$3,NULL,$4,$5,$6,$7,$8)`,
    [newId(), date(day), slot, name, n(input.kcal), n(input.protein), n(input.carbs), n(input.fat)]
  );
  refreshAll();
}

export async function deleteMeal(id: string) {
  await q(`DELETE FROM meal_logs WHERE id = $1`, [id]);
  refreshAll();
}

export async function setCurrentBatch(key: string) {
  if (!MAIN_ROTATION.includes(key)) throw new Error("Unknown recipe");
  await setSetting("current_batch", key);
  refreshAll();
}

export async function logWeight(day: string, kg: number | string) {
  const w = Math.round(Number(String(kg).replace(",", ".")) * 100) / 100;
  if (!(w > 30 && w < 250)) throw new Error("Enter your weight in kg");
  await q(
    `INSERT INTO body_weights (id, date, weight_kg) VALUES ($1, $2, $3)
     ON CONFLICT (date) DO UPDATE SET weight_kg = EXCLUDED.weight_kg`,
    [newId(), date(day), w]
  );
  refreshAll();
}

export async function deleteWeight(day: string) {
  await q(`DELETE FROM body_weights WHERE date = $1`, [date(day)]);
  refreshAll();
}

// ─── Workouts ────────────────────────────────────────────────

export async function saveSet(input: {
  date: string; dayKey: string; exerciseKey: string; setIndex: number; weightKg: number | null; reps: number | null; done: boolean;
}) {
  const w = input.weightKg === null || input.weightKg === undefined || Number.isNaN(Number(input.weightKg)) ? null : Math.max(0, Math.min(1000, Number(input.weightKg)));
  const r = input.reps === null || input.reps === undefined || Number.isNaN(Number(input.reps)) ? null : Math.max(0, Math.min(200, Math.round(Number(input.reps))));
  await q(
    `INSERT INTO workout_sets (id, date, day_key, exercise_key, set_index, weight_kg, reps, done, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, CURRENT_TIMESTAMP)
     ON CONFLICT (date, exercise_key, set_index)
     DO UPDATE SET weight_kg = EXCLUDED.weight_kg, reps = EXCLUDED.reps, done = EXCLUDED.done, day_key = EXCLUDED.day_key, updated_at = CURRENT_TIMESTAMP`,
    [newId(), date(input.date), input.dayKey, input.exerciseKey, input.setIndex, w, r, !!input.done]
  );
  revalidatePath("/health/gym");
  revalidatePath("/");
}
