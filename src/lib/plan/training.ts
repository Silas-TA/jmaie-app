// 4-day upper/lower split with extra leg volume.
// Built around a sore right shoulder (pressing) and left hip (standing/heavy squats).

export type Exercise = {
  key: string;
  name: string;
  sets: number;
  reps: string; // target range
  rest: string;
  cue: string;
  swap?: string; // if it hurts or the machine is taken
  tag?: "legs" | "shoulder-care" | "core";
  startKg?: string; // suggested starting point
};

export type Day = {
  key: string;
  weekday: number; // 0 = Monday
  title: string;
  focus: string;
  warmup: string[];
  exercises: Exercise[];
};

export const PROGRAM: Day[] = [
  {
    key: "lower_a",
    weekday: 0,
    title: "Monday · Legs A",
    focus: "Quads",
    warmup: [
      "5 min bike or incline walk",
      "Glute bridge 2 × 12",
      "90/90 hip switches 2 × 6 per side",
      "Bodyweight box squat 2 × 10",
    ],
    exercises: [
      { key: "leg_press", name: "Leg press", sets: 4, reps: "8–12", rest: "2–3 min", tag: "legs", cue: "Feet shoulder-width, mid-platform. Lower until your hips start to tuck, push through the whole foot.", swap: "Hack squat", startKg: "Start light and add 10 kg per session while all reps stay clean" },
      { key: "goblet_squat", name: "Goblet squat (to a box if needed)", sets: 3, reps: "8–10", rest: "2 min", tag: "legs", cue: "Dumbbell at chest, sit between your heels, chest up. Squat only as deep as the left hip is pain-free.", swap: "Smith machine squat", startKg: "16–22 kg dumbbell" },
      { key: "split_squat", name: "Bulgarian split squat", sets: 3, reps: "8–10 / leg", rest: "90 s", tag: "legs", cue: "Back foot on a bench, front foot far enough out that the front knee tracks over the toes. Start with your weaker side.", swap: "Reverse lunge", startKg: "Bodyweight, then 2 × 8–10 kg" },
      { key: "leg_ext", name: "Leg extension", sets: 3, reps: "12–15", rest: "60–90 s", tag: "legs", cue: "Pause 1 s at the top, lower slowly." },
      { key: "leg_curl_seated", name: "Seated leg curl", sets: 3, reps: "10–12", rest: "60–90 s", tag: "legs", cue: "Lean forward slightly, control the way up." , swap: "Lying leg curl"},
      { key: "calf_standing", name: "Standing calf raise", sets: 4, reps: "10–15", rest: "60 s", tag: "legs", cue: "Full stretch at the bottom, 1 s squeeze at the top." },
      { key: "plank", name: "Plank", sets: 3, reps: "30–45 s", rest: "45 s", tag: "core", cue: "Squeeze glutes, ribs down, breathe." },
    ],
  },
  {
    key: "upper_a",
    weekday: 1,
    title: "Tuesday · Upper A",
    focus: "Back & chest, shoulder-friendly",
    warmup: [
      "Band external rotations 2 × 15 per arm",
      "Band pull-aparts 2 × 15",
      "Scap push-ups 2 × 10",
      "1–2 light sets of the first exercise",
    ],
    exercises: [
      { key: "lat_pulldown", name: "Lat pulldown", sets: 4, reps: "8–12", rest: "2 min", cue: "Pull elbows down to your ribs, chest up, no swinging." },
      { key: "db_bench_neutral", name: "Dumbbell bench press, neutral grip", sets: 3, reps: "8–12", rest: "2 min", cue: "Palms facing each other, elbows ~45° from your body, stop 2 reps before failure. Stop if you get the sharp shoulder pain.", swap: "Machine chest press", startKg: "2 × 14–18 kg" },
      { key: "chest_row", name: "Chest-supported row", sets: 3, reps: "8–12", rest: "90 s", cue: "Chest on the pad, squeeze shoulder blades together at the top." },
      { key: "cable_lateral", name: "Cable lateral raise", sets: 3, reps: "12–15", rest: "60 s", tag: "shoulder-care", cue: "Raise to shoulder height only, thumbs neutral. Light and controlled.", startKg: "5 kg stack" },
      { key: "face_pull", name: "Face pull", sets: 3, reps: "15", rest: "60 s", tag: "shoulder-care", cue: "Rope to forehead, elbows high, rotate thumbs back. Protects the rotator cuff." },
      { key: "db_curl", name: "Dumbbell curl", sets: 3, reps: "10–12", rest: "60 s", cue: "No swinging; slow on the way down." },
      { key: "rope_pushdown", name: "Triceps rope pushdown", sets: 3, reps: "10–12", rest: "60 s", cue: "Elbows pinned to your sides." },
    ],
  },
  {
    key: "lower_b",
    weekday: 3,
    title: "Thursday · Legs B",
    focus: "Hamstrings & glutes",
    warmup: [
      "5 min bike",
      "Glute bridge 2 × 12",
      "Hip flexor stretch 30 s per side (gentle, especially left)",
      "Light Romanian deadlift 2 × 8 with the bar",
    ],
    exercises: [
      { key: "rdl", name: "Romanian deadlift", sets: 4, reps: "8–10", rest: "2–3 min", tag: "legs", cue: "Soft knees, push hips back, bar close to your legs, flat back. Stop when hamstrings are fully stretched.", swap: "Dumbbell RDL", startKg: "40 kg" },
      { key: "hip_thrust", name: "Hip thrust (barbell or machine)", sets: 3, reps: "8–12", rest: "2 min", tag: "legs", cue: "Chin tucked, ribs down, squeeze glutes hard for 1 s at the top.", startKg: "40–60 kg" },
      { key: "hack_squat", name: "Hack squat", sets: 3, reps: "8–10", rest: "2 min", tag: "legs", cue: "Back flat on the pad; depth only as far as the hip allows without pain.", swap: "Leg press (feet higher)" },
      { key: "walking_lunge", name: "Walking lunge", sets: 2, reps: "10 / leg", rest: "90 s", tag: "legs", cue: "Long steps, torso upright.", startKg: "Bodyweight → 2 × 8 kg" },
      { key: "hip_abduction", name: "Hip abduction machine", sets: 3, reps: "12–15", rest: "60 s", tag: "legs", cue: "Strengthens the side glutes, which help hip pain. Lean forward slightly." },
      { key: "calf_seated", name: "Seated calf raise", sets: 4, reps: "12–15", rest: "60 s", tag: "legs", cue: "Full range, pause at the bottom." },
      { key: "dead_bug", name: "Dead bug", sets: 3, reps: "8 / side", rest: "45 s", tag: "core", cue: "Lower back pressed into the floor." },
    ],
  },
  {
    key: "upper_b",
    weekday: 4,
    title: "Friday · Upper B + legs",
    focus: "Back, shoulders, arms, extra leg volume",
    warmup: [
      "Band external rotations 2 × 15 per arm",
      "Band pull-aparts 2 × 15",
      "Light cable rows 2 × 12",
    ],
    exercises: [
      { key: "cable_row", name: "Seated cable row", sets: 4, reps: "8–12", rest: "2 min", cue: "Tall chest, pull to your belly button." },
      { key: "landmine_press", name: "Half-kneeling landmine press", sets: 3, reps: "8–10 / arm", rest: "90 s", tag: "shoulder-care", cue: "Press up and forward in an arc; much kinder to the shoulder than overhead pressing. Start with the left arm.", swap: "Incline machine press" },
      { key: "assisted_pullup", name: "Pull-ups (assisted if needed)", sets: 3, reps: "6–10", rest: "2 min", cue: "Full hang to chin over bar, no kipping.", swap: "Lat pulldown, close grip" },
      { key: "cable_fly", name: "Cable fly (low to high)", sets: 3, reps: "10–12", rest: "60 s", cue: "Slight elbow bend; stop before the shoulder feels stretched hard." },
      { key: "rear_delt", name: "Reverse pec-deck / rear delt fly", sets: 3, reps: "12–15", rest: "60 s", tag: "shoulder-care", cue: "Lead with the elbows; light weight." },
      { key: "hammer_curl", name: "Hammer curl", sets: 3, reps: "10–12", rest: "60 s", cue: "Neutral grip, no swinging." },
      { key: "oh_cable_tri", name: "Overhead cable triceps extension", sets: 3, reps: "10–12", rest: "60 s", cue: "Only as high as the shoulder is comfortable; swap to pushdowns if it pinches.", swap: "Rope pushdown" },
      { key: "leg_superset", name: "Leg extension + leg curl (superset)", sets: 2, reps: "15 + 15", rest: "90 s", tag: "legs", cue: "Leg finisher: straight from one machine to the other." },
    ],
  },
];

export const dayForWeekday = (w: number) => PROGRAM.find((d) => d.weekday === w) ?? null;
export const dayByKey = (k: string) => PROGRAM.find((d) => d.key === k) ?? null;

export const TRAINING_RULES = [
  { title: "Double progression", body: "Each exercise has a rep range (e.g. 8–12). Keep the weight until you hit the top of the range on every set, then add the smallest jump (2.5 kg upper, 5 kg legs) and start again at the bottom." },
  { title: "Effort", body: "Finish most sets with 1–3 reps still in the tank. Only the last set of machine exercises goes close to failure." },
  { title: "Legs get the most work", body: "Legs train Monday, Thursday and a finisher on Friday: about 16–20 hard sets a week, compared with ~10–12 for upper-body muscles." },
  { title: "Eat and sleep", body: "Muscle is built on the meal plan and 7–9 hours of sleep. Training alone won't add weight." },
  { title: "Deload", body: "Every 6–8 weeks, do one easy week: same exercises, half the sets, lighter weights." },
];

export const PAIN_RULES = [
  "Sharp or pinching pain = stop that exercise for today and use the listed swap. Dull muscle burn is normal; sharp joint pain is not.",
  "Right shoulder: no behind-the-neck work, no heavy overhead barbell press, no dips for now. Do the band warm-up every upper day. Neutral-grip and landmine presses replace flat barbell bench and overhead press.",
  "Left hip: squat only to a pain-free depth (a box helps), choose leg press/hack squat over heavy barbell squats, and do the hip warm-up. Stand up and move every 30–45 min at work.",
  "Both issues have lasted a while. A sports physiotherapist can check the rotator cuff and hip in one or two visits and give you specific exercises. Worth doing before going heavy.",
];
