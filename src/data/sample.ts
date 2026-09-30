// SAMPLE DATA. Invented for the demo; must be labelled "Sample data" wherever it is shown.
// The one exception is the monthly price, which is a verified fact (see facts.ts).

import { GYM } from "./facts.js";

export type PlanId = "monthly" | "quarterly" | "annual" | "classes";

export interface Plan {
  id: PlanId;
  name: string;
  priceNgn: number;
  months: number;
  /** Only the monthly plan's price is a verified fact. */
  verified: boolean;
  perks: readonly string[];
}

export const PLANS: readonly Plan[] = [
  {
    id: "monthly",
    name: "Monthly",
    priceNgn: GYM.monthlyFeeNgn,
    months: 1,
    verified: true,
    perks: ["Full gym access, 6am–10pm", "All group classes", "Sauna"],
  },
  {
    id: "quarterly",
    name: "Quarterly",
    priceNgn: 50_000,
    months: 3,
    verified: false,
    perks: ["Everything in Monthly", "1 coaching check-in per month", "Save ₦4,000"],
  },
  {
    id: "annual",
    name: "Annual",
    priceNgn: 180_000,
    months: 12,
    verified: false,
    perks: ["Everything in Quarterly", "Weight-management plan", "2 months free"],
  },
  {
    id: "classes",
    name: "Classes only",
    priceNgn: 12_000,
    months: 1,
    verified: false,
    perks: ["Aerobics, Tabata, step, dance", "Evening & weekend slots"],
  },
];

export function planById(id: PlanId): Plan {
  const plan = PLANS.find((candidate) => candidate.id === id);
  if (!plan) throw new Error(`Unknown plan ${id}`);
  return plan;
}

/** Monthly-equivalent value, used for "revenue at risk". */
export function monthlyValue(plan: Plan): number {
  return Math.round(plan.priceNgn / plan.months);
}

export const TRAINERS = [
  { name: "Coach Tunde", focus: "Strength & Tabata" },
  { name: "Coach Ada", focus: "Aerobics & step" },
  { name: "Coach Musa", focus: "Kickboxing" },
  { name: "Coach Bisola", focus: "Dance & weight management" },
] as const;

export interface ClassSlot {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  time: string;
  name: (typeof GYM.classes)[number];
  coach: (typeof TRAINERS)[number]["name"];
}

// Class names are verified (Tabata runs morning and evening); days, times and coaches are sample.
export const TIMETABLE: readonly ClassSlot[] = [
  { day: "Mon", time: "6:30am", name: "Tabata", coach: "Coach Tunde" },
  { day: "Mon", time: "6:30pm", name: "Aerobics", coach: "Coach Ada" },
  { day: "Tue", time: "7:00am", name: "Step", coach: "Coach Ada" },
  { day: "Tue", time: "6:30pm", name: "Kickboxing", coach: "Coach Musa" },
  { day: "Wed", time: "6:30am", name: "Tabata", coach: "Coach Tunde" },
  { day: "Wed", time: "6:30pm", name: "Dance", coach: "Coach Bisola" },
  { day: "Thu", time: "7:00am", name: "Insanity", coach: "Coach Tunde" },
  { day: "Thu", time: "6:30pm", name: "Aerobics", coach: "Coach Ada" },
  { day: "Fri", time: "6:30am", name: "Tabata", coach: "Coach Tunde" },
  { day: "Fri", time: "6:00pm", name: "Kickboxing", coach: "Coach Musa" },
  { day: "Sat", time: "8:00am", name: "Aerobics", coach: "Coach Ada" },
  { day: "Sat", time: "10:00am", name: "Dance", coach: "Coach Bisola" },
  { day: "Sun", time: "9:00am", name: "Step", coach: "Coach Ada" },
];

export type LeadSource = "Instagram" | "WhatsApp" | "Walk-in" | "Referral" | "Website" | "Google";

export const LEAD_SOURCE_WEIGHTS: readonly (readonly [LeadSource, number])[] = [
  ["Instagram", 30],
  ["WhatsApp", 26],
  ["Walk-in", 18],
  ["Referral", 14],
  ["Website", 7],
  ["Google", 5],
];

export const INTERESTS = [
  "Weight loss",
  "Aerobics classes",
  "Strength training",
  "Tabata",
  "Kickboxing",
  "Toning after baby",
  "General fitness",
  "Dance fitness",
] as const;

export const FIRST_NAMES = [
  "Adaeze", "Tobi", "Chioma", "Emeka", "Funmi", "Kelechi", "Ngozi", "Seun", "Bola", "Ifeoma",
  "Tunde", "Amaka", "Yemi", "Chidi", "Temi", "Ifeanyi", "Aisha", "Dayo", "Nkechi", "Femi",
  "Zainab", "Obinna", "Titi", "Uche", "Kemi", "Gbenga", "Ebere", "Sade", "Musa", "Halima",
  "Damilola", "Nnamdi", "Bukola", "Segun", "Chinwe", "Kunle", "Rukayat", "Ikenna", "Folake", "Victor",
  "Blessing", "Samuel", "Esther", "Daniel", "Grace", "Joy", "Tosin", "Ayo", "Mercy", "Precious",
] as const;

export const SURNAMES = [
  "Okafor", "Adeyemi", "Balogun", "Eze", "Ogunleye", "Nwosu", "Bello", "Adebayo", "Okonkwo", "Ibrahim",
  "Akinola", "Chukwu", "Olawale", "Umeh", "Adewale", "Obi", "Salami", "Nnadi", "Afolabi", "Lawal",
  "Oyelaran", "Onyeka", "Babatunde", "Ojo", "Anyanwu", "Fashola", "Ekwueme", "Alabi", "Idowu", "Oduya",
] as const;

export const AREAS = [
  "Aguda", "Surulere", "Ijesha", "Itire", "Lawanson", "Ojuelegba", "Masha", "Iganmu", "Yaba", "Idi-Araba",
] as const;
