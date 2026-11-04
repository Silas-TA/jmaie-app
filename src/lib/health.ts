import { q, getSetting } from "./db";
import { addDays, isoDate } from "./dates";
import { MAIN_ROTATION } from "./plan/nutrition";

export type MealEntry = {
  id: string; date: string; slot: string; recipeKey: string | null; name: string;
  kcal: number; protein: number; carbs: number; fat: number;
};

export async function getMeals(date: string): Promise<MealEntry[]> {
  const rows = await q<{ id: string; date: Date; slot: string; recipe_key: string | null; name: string; kcal: number; protein: number; carbs: number; fat: number }>(
    `SELECT id, date, slot, recipe_key, name, kcal, protein, carbs, fat FROM meal_logs WHERE date = $1 ORDER BY created_at`,
    [date]
  );
  return rows.map((r) => ({ id: r.id, date: isoDate(r.date), slot: r.slot, recipeKey: r.recipe_key, name: r.name, kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat }));
}

export async function getDailyTotals(from: string, to: string) {
  const rows = await q<{ date: Date; kcal: string; protein: string }>(
    `SELECT date, SUM(kcal) AS kcal, SUM(protein) AS protein FROM meal_logs
      WHERE date >= $1 AND date <= $2 GROUP BY date ORDER BY date`,
    [from, to]
  );
  return rows.map((r) => ({ date: isoDate(r.date), kcal: Number(r.kcal), protein: Number(r.protein) }));
}

/** Recent custom foods (for one-tap re-logging). */
export async function getRecentCustomFoods(limit = 8) {
  return q<{ name: string; kcal: number; protein: number; carbs: number; fat: number }>(
    `SELECT name, kcal, protein, carbs, fat FROM (
       SELECT DISTINCT ON (lower(name)) name, kcal, protein, carbs, fat, created_at FROM meal_logs
        WHERE recipe_key IS NULL ORDER BY lower(name), created_at DESC) x
      ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
}

export async function getCurrentBatch(): Promise<string> {
  const v = await getSetting("current_batch");
  return v && MAIN_ROTATION.includes(v) ? v : MAIN_ROTATION[0];
}

export async function getWeights(days = 365) {
  const rows = await q<{ date: Date; weight_kg: string }>(
    `SELECT date, weight_kg FROM body_weights WHERE date >= CURRENT_DATE - $1::int ORDER BY date`,
    [days]
  );
  return rows.map((r) => ({ date: isoDate(r.date), kg: Number(r.weight_kg) }));
}

/** 7-day rolling average of weigh-ins (needs at least one entry in the window). */
export function rolling(weights: { date: string; kg: number }[]) {
  return weights.map((w) => {
    const from = addDays(w.date, -6);
    const win = weights.filter((x) => x.date >= from && x.date <= w.date);
    return { ...w, avg: Math.round((win.reduce((a, x) => a + x.kg, 0) / win.length) * 10) / 10 };
  });
}

export type SetRow = { exerciseKey: string; setIndex: number; weightKg: number | null; reps: number | null; done: boolean };

export async function getSets(date: string): Promise<SetRow[]> {
  const rows = await q<{ exercise_key: string; set_index: number; weight_kg: string | null; reps: number | null; done: boolean }>(
    `SELECT exercise_key, set_index, weight_kg, reps, done FROM workout_sets WHERE date = $1`,
    [date]
  );
  return rows.map((r) => ({ exerciseKey: r.exercise_key, setIndex: r.set_index, weightKg: r.weight_kg === null ? null : Number(r.weight_kg), reps: r.reps, done: r.done }));
}

/** Last session before `date` for each exercise: date + sets. */
export async function getLastSessions(date: string, keys: string[]) {
  if (!keys.length) return {} as Record<string, { date: string; sets: { w: number | null; r: number | null }[] }>;
  const rows = await q<{ exercise_key: string; date: Date; set_index: number; weight_kg: string | null; reps: number | null }>(
    `WITH last AS (
       SELECT exercise_key, MAX(date) AS d FROM workout_sets
        WHERE date < $1 AND exercise_key = ANY($2) AND done GROUP BY exercise_key)
     SELECT s.exercise_key, s.date, s.set_index, s.weight_kg, s.reps
       FROM workout_sets s JOIN last l ON l.exercise_key = s.exercise_key AND l.d = s.date
      WHERE s.done ORDER BY s.set_index`,
    [date, keys]
  );
  const out: Record<string, { date: string; sets: { w: number | null; r: number | null }[] }> = {};
  for (const r of rows) {
    out[r.exercise_key] ??= { date: isoDate(r.date), sets: [] };
    out[r.exercise_key].sets.push({ w: r.weight_kg === null ? null : Number(r.weight_kg), r: r.reps });
  }
  return out;
}

/** Dates in a range that have at least one completed set, with their day key. */
export async function getWorkoutDays(from: string, to: string) {
  const rows = await q<{ date: Date; day_key: string; done: string; total: string }>(
    `SELECT date, MIN(day_key) AS day_key, SUM(CASE WHEN done THEN 1 ELSE 0 END) AS done, COUNT(*) AS total
       FROM workout_sets WHERE date >= $1 AND date <= $2 GROUP BY date ORDER BY date`,
    [from, to]
  );
  return rows.filter((r) => Number(r.done) > 0).map((r) => ({ date: isoDate(r.date), dayKey: r.day_key, done: Number(r.done) }));
}
