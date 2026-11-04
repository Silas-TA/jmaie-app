"use server";

import { revalidatePath } from "next/cache";
import { q, one, newId, setSetting } from "@/lib/db";
import { PLAN_LINES, PLAN_INCOME } from "@/lib/plan/budget";
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
  const allowed = ["income_salary", "income_haircut", "income_other", "fixed", "subscription", "family_giving", "debt", "variable"];
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
