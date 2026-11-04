import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { getMonthSummary, getBudget, getGoals } from "@/lib/finance";
import { getMeals, getWeights, rolling } from "@/lib/health";
import { currentYM, todayISO } from "@/lib/dates";
import { PLAN_LINES, PLAN_TOTAL_INCOME } from "@/lib/plan/budget";
import { TARGETS, GASTRITIS_RULES, RECIPES } from "@/lib/plan/nutrition";
import { PROGRAM, PAIN_RULES } from "@/lib/plan/training";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("The assistant isn't set up: ANTHROPIC_API_KEY is missing.", { status: 503 });
  }
  const { messages } = await req.json();
  const { year, month } = currentYM();
  const today = todayISO();
  const [summary, budget, goals, meals, weights] = await Promise.all([
    getMonthSummary(year, month), getBudget(year, month), getGoals(), getMeals(today), getWeights(60),
  ]);
  const w = rolling(weights).at(-1);

  const context = `
Today is ${today} (Kaunas, Lithuania). You are the assistant inside the user's personal money + health app.
Be concise, practical and friendly. Use euros. You give general guidance only: not licensed financial or medical advice.
Never recommend specific stocks or funds to buy; explain concepts and trade-offs instead.

MONEY THIS MONTH: income €${summary.income.toFixed(2)} (salary €${summary.salary.toFixed(2)}, haircuts €${summary.haircut.toFixed(2)}), spent €${summary.spent.toFixed(2)}, saved €${summary.saved.toFixed(2)}, left €${summary.left.toFixed(2)}.
Budget lines (actual/budget): ${budget.filter((b) => b.budgeted || b.actual).map((b) => `${b.name} ${b.actual.toFixed(0)}/${b.budgeted.toFixed(0)}`).join("; ")}
Goals: ${goals.map((g) => `${g.name} €${g.current}/${g.target}`).join("; ") || "none"}
Plan: €${PLAN_TOTAL_INCOME}/month income; ${PLAN_LINES.map((l) => `${l.name} €${l.amount}`).join(", ")}.

HEALTH: male, 24, 176 cm, goal 65→80 kg lean bulk. Latest 7-day avg weight: ${w ? w.avg + " kg" : "unknown"}.
Targets: ${TARGETS.kcal} kcal, ${TARGETS.protein} g protein. Eaten today: ${meals.reduce((a, m) => a + m.kcal, 0)} kcal, ${meals.reduce((a, m) => a + m.protein, 0)} g protein (${meals.map((m) => m.name).join(", ") || "nothing logged"}).
Has gastritis; triggers: spicy, very sweet, fizzy drinks. Rules: ${GASTRITIS_RULES.join(" ")}
Recipes: ${RECIPES.map((r) => `${r.name} (${r.perPortion.kcal} kcal, ${r.perPortion.protein} g P)`).join("; ")}.
Training (Mon/Tue/Thu/Fri): ${PROGRAM.map((d) => `${d.title}: ${d.exercises.map((e) => e.name).join(", ")}`).join(" | ")}.
Pain notes: ${PAIN_RULES.join(" ")}
`;

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const result = streamText({
    model: anthropic(process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5"),
    system: context,
    messages: (messages ?? []).slice(-20),
    maxTokens: 1200,
  });
  return result.toDataStreamResponse();
}
