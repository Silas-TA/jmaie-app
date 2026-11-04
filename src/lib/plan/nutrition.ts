// Diet plan: lean bulk from 65 kg toward 80 kg, gastritis-friendly.
// Nutrition values are estimates per portion from standard food tables.

export const PROFILE = { age: 24, heightCm: 176, startKg: 65, goalKg: 80 };

export const TARGETS = {
  kcal: 2800, // ≈ 2,500 maintenance + ~300 surplus
  protein: 130, // ≈ 2 g per kg
  carbs: 360,
  fat: 80,
  fibre: 30,
  weeklyGainMin: 0.25,
  weeklyGainMax: 0.5,
};

export type Macros = { kcal: number; protein: number; carbs: number; fat: number; fibre: number };

export type Recipe = {
  key: string;
  name: string;
  short: string;
  kind: "main" | "breakfast" | "snack";
  portions: number;
  perPortion: Macros;
  ingredients: { item: string; qty: string }[];
  steps: string[];
  changes?: string[]; // what changed vs. how you cook it now
  nutrients: string[]; // what this meal is good for
  gastritis?: string;
  costEUR?: number; // rough batch cost at Maxima/Lidl
};

export const RECIPES: Recipe[] = [
  {
    key: "fried_rice",
    name: "Chicken fried rice",
    short: "Rice, chicken thighs, eggs, lots of veg",
    kind: "main",
    portions: 4,
    perPortion: { kcal: 850, protein: 56, carbs: 101, fat: 22, fibre: 9 },
    ingredients: [
      { item: "White rice (dry)", qty: "250 g" },
      { item: "Brown rice (dry)", qty: "150 g" },
      { item: "Skinless chicken thighs", qty: "700 g" },
      { item: "Eggs", qty: "4" },
      { item: "Frozen Mexican veg mix", qty: "500 g" },
      { item: "Frozen peas", qty: "200 g" },
      { item: "Onion", qty: "1 large" },
      { item: "Rapeseed or olive oil", qty: "2 tbsp" },
      { item: "Low-salt soy sauce", qty: "3 tbsp" },
      { item: "Chicken seasoning (no chilli)", qty: "to taste" },
    ],
    steps: [
      "Cook both rices together (brown needs ~10 min longer: start it first). Spread on a tray to cool; day-old rice fries best.",
      "Cut chicken into bite-size pieces, season, and cook in 1 tbsp oil until golden. Set aside.",
      "Soften the onion in the rest of the oil, add frozen veg and peas, and cook until hot through, not charred.",
      "Push veg aside, scramble the eggs in the pan, then stir everything together with the rice and chicken.",
      "Add soy sauce at the end. Split into 4 boxes.",
    ],
    changes: [
      "Added 4 eggs and peas: more protein, B12, choline and fibre",
      "Part brown rice for extra fibre and magnesium",
      "Doubled the veg; low-salt soy sauce; no chilli",
    ],
    nutrients: ["Protein", "B vitamins", "Choline (eggs)", "Vitamin A & C (veg)", "Fibre"],
    gastritis: "Don't char the veg or rice; use the oil amounts above, not more.",
    costEUR: 10,
  },
  {
    key: "burrito",
    name: "Pork & bean burritos",
    short: "Lean mince, beans, rice, corn, carrot",
    kind: "main",
    portions: 4,
    perPortion: { kcal: 950, protein: 52, carbs: 114, fat: 30, fibre: 17 },
    ingredients: [
      { item: "Lean minced pork (≤10% fat)", qty: "450 g" },
      { item: "Red kidney beans, canned (drained, rinsed)", qty: "2 cans (≈ 480 g)" },
      { item: "White rice (dry)", qty: "100 g" },
      { item: "Sweetcorn, canned", qty: "1 small can (140 g)" },
      { item: "Carrot, grated", qty: "1 large" },
      { item: "Onion", qty: "1" },
      { item: "Tomato paste", qty: "2 tbsp (40 g)" },
      { item: "Wholegrain tortilla wraps", qty: "8" },
      { item: "Mild cheese, grated", qty: "60 g" },
      { item: "Natural yogurt (instead of sour cream)", qty: "200 g" },
      { item: "Oil", qty: "1 tbsp" },
    ],
    steps: [
      "Cook the rice.",
      "Brown the mince with the onion; pour off excess fat.",
      "Add grated carrot, beans, corn, tomato paste and a splash of water; simmer 10 min until thick. Mash a few beans to bind it.",
      "Mix in the rice. Store the filling in 4 boxes; keep wraps, cheese and yogurt separate so they don't go soggy.",
      "To serve: warm 2 wraps, fill, top with cheese and a spoon of yogurt, roll.",
    ],
    changes: [
      "Lean mince and pour off the fat",
      "Added rice, corn and carrot: more fuel and fibre for the bulk",
      "Wholegrain wraps; yogurt topping adds calcium and probiotics",
    ],
    nutrients: ["Protein", "Iron & zinc (pork, beans)", "Fibre", "Folate", "Vitamin A (carrot)", "Calcium"],
    gastritis: "Rinse the beans well and start with a smaller portion if beans make you bloated. Keep tomato paste to 2 tbsp.",
    costEUR: 11,
  },
  {
    key: "chicken_stew",
    name: "Chicken & lentil stew with rice",
    short: "Thighs, red lentils, carrot, courgette, spinach",
    kind: "main",
    portions: 4,
    perPortion: { kcal: 760, protein: 55, carbs: 100, fat: 15, fibre: 8 },
    ingredients: [
      { item: "Skinless chicken thighs", qty: "800 g" },
      { item: "Red lentils (dry)", qty: "100 g" },
      { item: "Carrots", qty: "2–3 (250 g)" },
      { item: "Courgette (zucchini) or pumpkin", qty: "250 g" },
      { item: "Frozen spinach", qty: "150 g" },
      { item: "Onion", qty: "1" },
      { item: "Tomato paste", qty: "2–3 tbsp (50 g)" },
      { item: "White rice (dry)", qty: "350 g" },
      { item: "Oil", qty: "1 tbsp" },
      { item: "Seasoning: paprika (sweet), garlic powder, thyme, bay leaf", qty: "to taste" },
    ],
    steps: [
      "Brown the chicken pieces in the oil; add onion and carrots and cook 5 min.",
      "Stir in tomato paste and seasoning, then the rinsed lentils and about 700 ml water.",
      "Simmer 20 min. Add courgette/pumpkin and spinach, simmer 10 more until lentils have melted into the sauce.",
      "Cook rice separately. Pack 4 boxes of stew + rice.",
    ],
    changes: [
      "Red lentils thicken the sauce and add fibre, iron and folate",
      "Carrot, courgette and spinach: vitamins A, C, K and magnesium",
      "Less tomato paste; sweet paprika instead of hot",
    ],
    nutrients: ["Protein", "Iron", "Folate", "Magnesium", "Vitamin A & K", "Fibre"],
    gastritis: "Pumpkin and carrot are gentle on the stomach. If tomato bothers you, swap the paste for 200 g pumpkin purée.",
    costEUR: 10,
  },
  {
    key: "sandwich",
    name: "Chicken, egg & cheese sandwiches",
    short: "Wholegrain bread, chicken breast, egg, cucumber",
    kind: "main",
    portions: 4,
    perPortion: { kcal: 715, protein: 65, carbs: 55, fat: 25, fibre: 9 },
    ingredients: [
      { item: "Wholegrain / rye sandwich bread", qty: "500 g loaf" },
      { item: "Chicken breasts", qty: "600 g" },
      { item: "Eggs, hard-boiled and sliced", qty: "4" },
      { item: "Mild cheese slices", qty: "120 g" },
      { item: "Cucumber", qty: "1" },
      { item: "Lettuce", qty: "a few leaves" },
      { item: "Natural yogurt + herbs (as spread)", qty: "80 g" },
      { item: "Oil", qty: "2 tsp" },
    ],
    steps: [
      "Season and bake or pan-cook the chicken breasts (200 °C, ~20 min), then slice.",
      "Boil the eggs 9 min, cool and slice.",
      "Build each portion with a quarter of the loaf: yogurt-herb spread, chicken, egg, cheese, cucumber, lettuce.",
      "Keep the filling in a box and build fresh so the bread stays good.",
    ],
    changes: [
      "Wholegrain or rye bread instead of white: fibre, B vitamins, magnesium",
      "Added egg and cucumber/lettuce",
      "Yogurt-herb spread instead of mayo",
    ],
    nutrients: ["Lots of protein", "Calcium", "B vitamins", "Fibre"],
    gastritis: "Bake or poach the chicken rather than frying.",
    costEUR: 10,
  },
  {
    key: "pork_stew",
    name: "Pork & veg stew with buckwheat",
    short: "Lean mince, beans, carrots, frozen veg, grikiai",
    kind: "main",
    portions: 4,
    perPortion: { kcal: 745, protein: 49, carbs: 89, fat: 22, fibre: 18 },
    ingredients: [
      { item: "Lean minced pork", qty: "600 g" },
      { item: "Kidney beans or baked beans", qty: "1 can (≈ 240 g drained)" },
      { item: "Frozen mixed veg", qty: "400 g" },
      { item: "Carrots", qty: "2 (200 g)" },
      { item: "Onions", qty: "1–2" },
      { item: "Tomato paste", qty: "2–3 tbsp (50 g)" },
      { item: "Buckwheat (grikiai), dry", qty: "320 g" },
      { item: "Oil", qty: "1 tbsp" },
      { item: "Seasoning (no chilli)", qty: "to taste" },
    ],
    steps: [
      "Brown the mince with the onions; pour off the fat.",
      "Add carrots, tomato paste, seasoning and ~400 ml water; simmer 15 min.",
      "Add frozen veg and beans; simmer 10 more.",
      "Cook buckwheat (1 part grain to 2 parts water, ~15 min). Pack 4 boxes.",
    ],
    changes: [
      "Buckwheat instead of nothing/white bread: lots of fibre, magnesium and protein, and it's cheap in Lithuania",
      "More veg; kidney beans preferred over baked beans (less sugar)",
    ],
    nutrients: ["Protein", "Iron & zinc", "Magnesium", "Fibre", "B vitamins"],
    gastritis: "Baked beans are sweet. If sugar is a trigger, use plain kidney beans.",
    costEUR: 10,
  },
  {
    key: "salmon_potatoes",
    name: "Baked salmon, potatoes & veg (new)",
    short: "Once a week for omega-3 and vitamin D",
    kind: "main",
    portions: 4,
    perPortion: { kcal: 685, protein: 42, carbs: 67, fat: 27, fibre: 12 },
    ingredients: [
      { item: "Salmon fillets (frozen from Lidl/Maxima is fine)", qty: "600 g" },
      { item: "Potatoes", qty: "1.2 kg" },
      { item: "Broccoli (frozen ok)", qty: "500 g" },
      { item: "Carrots", qty: "3 (300 g)" },
      { item: "Natural yogurt + dill (sauce)", qty: "200 g" },
      { item: "Oil", qty: "1½ tbsp" },
    ],
    steps: [
      "Chop potatoes and carrots, toss with 1 tbsp oil and salt, roast at 200 °C for 25 min.",
      "Add the salmon and broccoli to the tray and roast 15 more minutes.",
      "Mix yogurt with dill and a pinch of salt for the sauce. Pack 4 boxes.",
    ],
    changes: ["New meal: the only regular source of omega-3 and natural vitamin D in the plan"],
    nutrients: ["Omega-3", "Vitamin D", "Potassium", "Vitamin C & K", "Protein"],
    gastritis: "Baked, not fried; no lemon if citrus bothers you.",
    costEUR: 14,
  },
  // Breakfasts
  {
    key: "breakfast_oats",
    name: "Oats with milk, banana & peanut butter",
    short: "5 minutes, no cooking skills needed",
    kind: "breakfast",
    portions: 1,
    perPortion: { kcal: 655, protein: 25, carbs: 99, fat: 21, fibre: 12 },
    ingredients: [
      { item: "Oats", qty: "80 g" },
      { item: "Milk", qty: "300 ml" },
      { item: "Banana", qty: "1" },
      { item: "Peanut butter", qty: "1 tbsp (15 g)" },
    ],
    steps: ["Microwave oats and milk 2–3 min (or soak overnight). Top with sliced banana and peanut butter."],
    nutrients: ["Fibre", "Calcium", "Potassium", "Magnesium"],
    gastritis: "Oats and banana are among the most stomach-friendly foods.",
  },
  {
    key: "breakfast_eggs",
    name: "Scrambled eggs on toast + kefir",
    short: "Alternative breakfast",
    kind: "breakfast",
    portions: 1,
    perPortion: { kcal: 615, protein: 42, carbs: 48, fat: 26, fibre: 7 },
    ingredients: [
      { item: "Eggs", qty: "3" },
      { item: "Wholegrain bread", qty: "2 thick slices (100 g)" },
      { item: "Kefir", qty: "250 ml" },
    ],
    steps: ["Scramble the eggs gently in a non-stick pan with a few drops of oil. Serve on toast with a glass of kefir."],
    nutrients: ["Protein", "B12", "Choline", "Probiotics"],
  },
  // Snacks (no cooking)
  {
    key: "snack_kefir",
    name: "Kefir with oats & an apple",
    short: "Drink it at work",
    kind: "snack",
    portions: 1,
    perPortion: { kcal: 490, protein: 21, carbs: 68, fat: 15, fibre: 8 },
    ingredients: [
      { item: "Kefir", qty: "500 ml" },
      { item: "Oats", qty: "40 g" },
      { item: "Apple", qty: "1" },
    ],
    steps: ["Stir oats into kefir (or blend). Eat the apple alongside."],
    nutrients: ["Probiotics", "Calcium", "Fibre"],
  },
  {
    key: "snack_varske",
    name: "Varškė (cottage cheese) on rye bread",
    short: "High-protein snack",
    kind: "snack",
    portions: 1,
    perPortion: { kcal: 480, protein: 44, carbs: 48, fat: 12, fibre: 8 },
    ingredients: [
      { item: "Rye / wholegrain bread", qty: "2 slices (100 g)" },
      { item: "Varškė 5–9%", qty: "180 g" },
      { item: "Cucumber", qty: "½" },
    ],
    steps: ["Spread varškė on the bread, add cucumber slices and a pinch of salt and dill."],
    nutrients: ["Protein (casein)", "Calcium", "Fibre"],
  },
  {
    key: "snack_yogurt",
    name: "Yogurt, banana & walnuts",
    short: "Quick snack",
    kind: "snack",
    portions: 1,
    perPortion: { kcal: 485, protein: 16, carbs: 48, fat: 28, fibre: 5 },
    ingredients: [
      { item: "Natural yogurt", qty: "300 g" },
      { item: "Banana", qty: "1" },
      { item: "Walnuts", qty: "30 g" },
    ],
    steps: ["Slice the banana into the yogurt and top with walnuts."],
    nutrients: ["Omega-3 (ALA)", "Calcium", "Probiotics", "Potassium"],
  },
];

export const recipeByKey = (k: string) => RECIPES.find((r) => r.key === k);

export const MAIN_ROTATION = ["fried_rice", "chicken_stew", "burrito", "pork_stew", "sandwich", "salmon_potatoes"];

export const SLOTS = [
  { key: "breakfast", label: "Breakfast", time: "08:30–09:00", kind: "breakfast" as const, default: "breakfast_oats" },
  { key: "lunch", label: "Lunch", time: "12:00", kind: "main" as const, default: null },
  { key: "snack", label: "Afternoon snack", time: "15:30", kind: "snack" as const, default: "snack_kefir" },
  { key: "dinner", label: "Dinner", time: "19:00", kind: "main" as const, default: null },
];

export const WHY_FOUR_MEALS =
  "Two meals a day isn't enough here. Reaching ~2,800 kcal in two sittings means two very large plates, and big meals plus a 7-hour gap are both classic gastritis triggers. So the plan keeps your two cooked meals at 12:00 and 19:00 and adds a no-cook breakfast and an afternoon snack (5 minutes each).";

export const GASTRITIS_RULES = [
  "Don't skip breakfast and avoid long gaps: eat every 3–4 hours.",
  "Stop eating 2–3 hours before bed (dinner at 19:00 works if you sleep after 22:00).",
  "Keep avoiding what already triggers you: spicy food, very sweet food, fizzy drinks.",
  "Use little tomato paste (2–3 tbsp per batch). If you notice burning after tomato meals, switch to pumpkin purée.",
  "Bake, boil, stew or lightly pan-cook. Avoid deep-fried food and fatty processed meat (sausages, bacon).",
  "Go easy on coffee, strong tea and alcohol; never on an empty stomach.",
  "If symptoms flare (pain, black stools, vomiting, weight loss), see your GP. Gastritis can be caused by H. pylori, which is treatable.",
];

export const SUPPLEMENTS = [
  { name: "Vitamin D3", dose: "1,000–2,000 IU a day, Oct–Apr (all year is fine)", why: "Very little sun in Lithuania for half the year; most people are low in winter.", note: "Take with a meal." },
  { name: "Creatine monohydrate", dose: "3–5 g a day", why: "The most researched supplement for strength and muscle gain.", note: "With a meal and plenty of water. Optional." },
  { name: "Omega-3 (fish oil)", dose: "1 capsule a day", why: "Only needed in weeks you skip the salmon meal.", note: "Optional; can upset some stomachs." },
];

export const SUPPLEMENT_NOTE =
  "Ask a pharmacist before starting supplements, especially with gastritis. Avoid iron and vitamin C tablets on an empty stomach as they can irritate it. Food covers the rest of the plan's vitamins and minerals.";

export const ADJUST_RULES = [
  "Weigh yourself 3+ mornings a week (after the toilet, before eating). Watch the weekly average, not single days.",
  "Gaining 0.25–0.5 kg a week? Keep everything the same.",
  "Under 0.25 kg a week for 2 weeks in a row? Add ~150–200 kcal a day (a bigger breakfast or a second snack).",
  "Over 0.5 kg a week for 2 weeks? Remove ~150 kcal (smaller snack).",
  "Realistic pace: ~72–74 kg in 6 months, 80 kg in about 12–15 months, gained mostly as muscle.",
];

/** Rough weekly grocery list for 3–4 batches + breakfasts/snacks. */
export const WEEKLY_SHOP = [
  "Oats 1 kg", "Milk 2 L", "Kefir 3–4 L", "Natural yogurt 1 kg", "Varškė 2 × 180 g",
  "Eggs 10–15", "Bananas 7", "Apples 4", "Peanut butter (monthly)", "Walnuts 150 g",
  "Wholegrain/rye bread 1–2 loaves", "Rice / buckwheat (stock up)", "Red lentils (stock up)",
  "Chicken thighs 1.5 kg", "Lean pork mince 0.5–1 kg", "Chicken breast 0.6 kg (sandwich week)",
  "Salmon 600 g", "Frozen veg 1 kg", "Frozen spinach / broccoli", "Carrots 1 kg", "Onions", "Courgette or pumpkin",
  "Kidney beans 2–3 cans", "Sweetcorn 1 can", "Tomato paste (small jar)",
];
