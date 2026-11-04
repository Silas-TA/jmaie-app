import { q } from "@/lib/db";
import { isoDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET() {
  const rows = await q<{ date: Date; direction: string; amount: string; category: string | null; description: string }>(
    `SELECT t.date, t.direction::text AS direction, t.amount, c.name AS category, t.description
       FROM transactions t LEFT JOIN categories c ON c.id = t.category_id ORDER BY t.date, t.created_at`
  );
  const csv = ["date,type,amount,category,description", ...rows.map((r) => [isoDate(r.date), r.direction, r.amount, r.category, r.description].map(cell).join(","))].join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="transactions.csv"` },
  });
}
