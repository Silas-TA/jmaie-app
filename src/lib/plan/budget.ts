// The money plan. Edit amounts here; the Budget page can copy them into any month.

export type Group = "income" | "needs" | "wants" | "giving" | "business" | "savings";

export const GROUP_META: Record<Exclude<Group, "income">, { label: string; color: string; hint: string }> = {
  needs: { label: "Essentials", color: "#60A5FA", hint: "Rent, bills, food, transport, debt" },
  wants: { label: "Lifestyle", color: "#F472B6", hint: "Subscriptions, outings, personal care" },
  giving: { label: "Family", color: "#FBBF24", hint: "Money for family" },
  business: { label: "iCut costs", color: "#C084FC", hint: "Barber supplies" },
  savings: { label: "Savings", color: "#34D399", hint: "Emergency fund and investing" },
};

/** Which group a category belongs to, from its type and name. */
export function groupOf(type: string, name: string): Group {
  if (type.startsWith("income")) return "income";
  const n = name.toLowerCase();
  if (n.includes("saving") || n.includes("invest") || n.includes("emergency")) return "savings";
  if (type === "family_giving" || ["mum", "jeremiah"].includes(n)) return "giving";
  if (n.includes("haircut business") || n.includes("icut")) return "business";
  if (type === "fixed" || type === "debt") return "needs";
  if (n.includes("food") || n.includes("grocer")) return "needs";
  return "wants";
}

/**
 * The six sections used everywhere in the app. `type` is the category type new
 * rows get; `types` lists every category type shown in the section.
 */
export const SECTIONS = [
  { type: "income_other", types: ["income_salary", "income_haircut", "income_other"], label: "Income", color: "#10B981", income: true },
  { type: "fixed", types: ["fixed"], label: "Fixed Expenses", color: "#64748B", income: false },
  { type: "subscription", types: ["subscription"], label: "Subscriptions", color: "#D946EF", income: false },
  { type: "family_giving", types: ["family_giving"], label: "Family & Giving", color: "#F59E0B", income: false },
  { type: "debt", types: ["debt"], label: "Debt Repayment", color: "#F43F5E", income: false },
  { type: "variable", types: ["variable"], label: "Miscellaneous", color: "#FB923C", income: false },
] as const;

export type Section = { type: string; types: readonly string[]; label: string; color: string; income: boolean };

/** Sections with any names you've changed applied. */
export function withLabels(labels: Record<string, string>): Section[] {
  return SECTIONS.map((s) => ({ ...s, label: labels[s.type]?.trim() || s.label }));
}

export const EXPENSE_SECTIONS = SECTIONS.filter((s) => !s.income);
export const sectionOf = (type: string) => SECTIONS.find((s) => (s.types as readonly string[]).includes(type));

/** iCut costs (e.g. "Haircut Business Expenses"), left out with haircut income when that's switched off. */
export const isHaircutExpense = (type: string, name: string) =>
  !type.startsWith("income") && /haircut business|icut/i.test(name);

export const PLAN_INCOME = { salary: 1200, haircuts: 500 };
export const PLAN_TOTAL_INCOME = PLAN_INCOME.salary + PLAN_INCOME.haircuts;

export type PlanLine = {
  name: string; // matches an existing category name, or is created
  type: "fixed" | "subscription" | "family_giving" | "debt" | "variable";
  amount: number;
  note?: string;
};

export const PLAN_LINES: PlanLine[] = [
  // Needs
  { name: "Rent + Utilities", type: "fixed", amount: 350 },
  { name: "Phone Bill", type: "fixed", amount: 239.23, note: "Contract €211.33 (ends Feb 2027) + phone internet €27.90" },
  { name: "Home Internet", type: "fixed", amount: 10.8, note: "Modem €3.00 (ends Feb 2028) + modem internet €7.80" },
  { name: "Transportation", type: "fixed", amount: 28 },
  { name: "Food & Groceries", type: "variable", amount: 300, note: "Includes about €15 for vitamin D and other supplements" },
  { name: "Driving School", type: "debt", amount: 60 },
  // Wants
  { name: "Gym", type: "subscription", amount: 27 },
  { name: "Spotify", type: "subscription", amount: 8.99 },
  { name: "iCloud", type: "subscription", amount: 2.99 },
  { name: "Google One", type: "subscription", amount: 2.99 },
  { name: "Outing", type: "variable", amount: 60 },
  { name: "Braids", type: "variable", amount: 40 },
  // Family
  { name: "Mum", type: "variable", amount: 50 },
  { name: "Jeremiah", type: "variable", amount: 20 },
  // iCut
  { name: "Haircut Business Expenses", type: "variable", amount: 20 },
  // Savings: whatever is left over (€480)
  { name: "Savings", type: "fixed", amount: 480, note: "Emergency fund first, then investing (see Goals)" },
];

export const EMERGENCY_FUND_TARGET = 3000; // ≈ 3 months of essentials once the phone contract ends
export const STARTER_FUND = 1000;

export const SAVINGS_PHASES = [
  {
    title: "1 · Starter safety net",
    when: "Now → about Jan 2027",
    target: "€1,000 in an easy-access savings account",
    split: "All €480 a month to the emergency fund",
    why: "Covers a surprise bill without touching a credit card.",
  },
  {
    title: "2 · Full emergency fund + first investments",
    when: "About Feb → Jun 2027",
    target: "€3,000 emergency fund (≈ 3 months of essentials)",
    split: "€330 to the fund, €150 to investing. From March 2027 the phone contract ends: add that €211 to savings.",
    why: "Start investing small to learn how it works while the safety net finishes.",
  },
  {
    title: "3 · Invest steadily",
    when: "Once the fund reaches €3,000",
    target: "Invest most of the surplus every month",
    split: "About €600+ a month to investing; top the fund back up if you ever use it.",
    why: "Money you won't need for 5+ years has time to ride out market drops.",
  },
];

export const RULES = [
  { title: "Pay yourself first", body: "Move the savings amount on payday, before spending. Whatever is left is yours to spend." },
  { title: "50 / 30 / 20 as a check", body: "A common guideline: about 50% on essential bills, 30% on everything else, 20%+ to savings. Your plan saves 28% even with the phone contract; essential bills drop below 50% when it ends." },
  { title: "Emergency fund before risk", body: "Keep 3–6 months of essential costs in cash before putting serious money into the stock market." },
  { title: "Barber income is variable", body: "The plan uses €500. In good months, put everything above €500 straight into savings; in slow months the fund absorbs the gap." },
];
