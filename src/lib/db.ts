import { Pool, type QueryResultRow } from "pg";
import { randomBytes } from "crypto";

// One pool per server instance (re-used across hot reloads in dev).
const g = globalThis as unknown as { __pfPool?: Pool; __pfSchema?: Promise<void> };

function pool(): Pool {
  if (!g.__pfPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const local = /localhost|127\.0\.0\.1|host=\/tmp/.test(url);
    // Remove sslmode/sslaccept from the URL so the ssl option below is the one that applies.
    let connectionString = url;
    try {
      const u = new URL(url);
      ["sslmode", "sslaccept", "sslcert", "sslrootcert"].forEach((k) => u.searchParams.delete(k));
      connectionString = u.toString();
    } catch {}
    g.__pfPool = new Pool({
      connectionString,
      max: 3,
      ssl: local ? undefined : { rejectUnauthorized: false },
    });
  }
  return g.__pfPool;
}

export async function q<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  await ensureSchema();
  const res = await pool().query<T>(text, params);
  return res.rows;
}

export async function one<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}

/** cuid-like id so new rows look like the ones Prisma created. */
export function newId(): string {
  return "c" + Date.now().toString(36) + randomBytes(8).toString("hex");
}

/**
 * Creates the v0.2 health tables if they are missing. Additive only: it never
 * alters or drops the existing finance tables.
 */
export function ensureSchema(): Promise<void> {
  if (!g.__pfSchema) {
    g.__pfSchema = pool()
      .query(
        `
      CREATE TABLE IF NOT EXISTS meal_logs (
        id text PRIMARY KEY,
        date date NOT NULL,
        slot text NOT NULL,
        recipe_key text,
        name text NOT NULL,
        kcal int NOT NULL,
        protein int NOT NULL,
        carbs int NOT NULL DEFAULT 0,
        fat int NOT NULL DEFAULT 0,
        created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS meal_logs_date_idx ON meal_logs(date);

      CREATE TABLE IF NOT EXISTS body_weights (
        id text PRIMARY KEY,
        date date NOT NULL UNIQUE,
        weight_kg numeric(5,2) NOT NULL,
        created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workout_sets (
        id text PRIMARY KEY,
        date date NOT NULL,
        day_key text NOT NULL,
        exercise_key text NOT NULL,
        set_index int NOT NULL,
        weight_kg numeric(6,2),
        reps int,
        done boolean NOT NULL DEFAULT false,
        updated_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (date, exercise_key, set_index)
      );
      CREATE INDEX IF NOT EXISTS workout_sets_ex_idx ON workout_sets(exercise_key, date);

      CREATE TABLE IF NOT EXISTS app_settings (
        key text PRIMARY KEY,
        value text NOT NULL
      );
    `
      )
      .then(() => undefined)
      .catch((e) => {
        g.__pfSchema = undefined;
        throw e;
      });
  }
  return g.__pfSchema;
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await one<{ value: string }>(`SELECT value FROM app_settings WHERE key = $1`, [key]);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await q(
    `INSERT INTO app_settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, value]
  );
}
