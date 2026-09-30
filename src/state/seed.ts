import type { Day } from "../lib/dates";
import { weekdayOf } from "../lib/dates";
import { createRng, intBetween, pick, pickWeighted, type Rng } from "../lib/rng";
import {
  AREAS,
  FIRST_NAMES,
  INTERESTS,
  LEAD_SOURCE_WEIGHTS,
  SURNAMES,
  planById,
  type PlanId,
} from "../data/sample";
import { AT_RISK_DAYS, driftingEngagement } from "./automations";
import type { DemoState, Lead, LeadStage, Member, Payment } from "./types";

export const STATE_VERSION = 3;
export const SEED = 20260930;
export const DAYS_PER_MONTH = 30;
/** History older than this is not needed by any screen, so it is not generated. */
const HISTORY_DAYS = 400;

const PLAN_WEIGHTS: readonly (readonly [PlanId, number])[] = [
  ["monthly", 60],
  ["quarterly", 20],
  ["classes", 12],
  ["annual", 8],
];

/** Mean membership length in paid periods, per plan. */
const MEAN_TENURE_PERIODS: Record<PlanId, number> = { monthly: 10, classes: 7, quarterly: 4, annual: 2 };

const MOBILE_PREFIXES = ["803", "806", "810", "813", "816", "703", "706", "708", "905", "901"] as const;

export function weekdayFactor(day: Day): number {
  const weekday = weekdayOf(day);
  if (weekday === 0) return 0.55;
  if (weekday === 6) return 0.85;
  return 1;
}

export function periodDays(planId: PlanId): number {
  return planById(planId).months * DAYS_PER_MONTH;
}

export interface Person {
  name: string;
  phone: string;
  email: string;
}

/** Invented people. Phones are masked so no generated number can belong to a real person. */
export function createPerson(rng: Rng, serial: number, takenNames?: Set<string>): Person {
  let first = pick(rng, FIRST_NAMES);
  let last = pick(rng, SURNAMES);
  // Avoid two different people with the same name on screen; give up after a few tries.
  for (let attempt = 0; takenNames?.has(`${first} ${last}`) && attempt < 20; attempt++) {
    first = pick(rng, FIRST_NAMES);
    last = pick(rng, SURNAMES);
  }
  takenNames?.add(`${first} ${last}`);
  return {
    name: `${first} ${last}`,
    phone: `+234 ${pick(rng, MOBILE_PREFIXES)} ••• ${String(intBetween(rng, 0, 9999)).padStart(4, "0")}`,
    email: `${first}.${last}${serial}@example.com`.toLowerCase(),
  };
}

export function createCheckInCode(rng: Rng, taken: ReadonlySet<string>): string {
  for (;;) {
    const code = String(intBetween(rng, 1000, 9999));
    if (!taken.has(code)) return code;
  }
}

function daysSinceLastVisit(rng: Rng, engagement: number): number {
  // Geometric gap: how many days since a member with this visit probability last came in.
  return Math.min(30, Math.floor(Math.log(1 - rng()) / Math.log(1 - engagement)));
}

interface MemberDraft {
  planId: PlanId;
  joinedDay: Day;
  tenurePeriods: number;
  engagement: number;
}

function buildMember(
  rng: Rng,
  today: Day,
  id: string,
  person: Person,
  draft: MemberDraft,
  codes: Set<string>,
): { member: Member; payments: Payment[] } | null {
  const length = periodDays(draft.planId);
  const tenureEnd = draft.joinedDay + draft.tenurePeriods * length - 1;
  if (tenureEnd < today - HISTORY_DAYS) return null;

  const isActive = tenureEnd >= today;
  const paidThroughDay = isActive
    ? draft.joinedDay + (Math.floor((today - draft.joinedDay) / length) + 1) * length - 1
    : tenureEnd;

  const payments: Payment[] = [];
  const price = planById(draft.planId).priceNgn;
  for (let start = draft.joinedDay; start <= Math.min(today, paidThroughDay); start += length) {
    if (start >= today - HISTORY_DAYS) payments.push({ memberId: id, day: start, amount: price });
  }

  const lastVisitDay = isActive
    ? Math.max(draft.joinedDay, today - daysSinceLastVisit(rng, draft.engagement))
    : Math.max(draft.joinedDay, paidThroughDay - intBetween(rng, 0, 20));

  const code = createCheckInCode(rng, codes);
  codes.add(code);

  return {
    member: {
      id,
      ...person,
      area: pick(rng, AREAS),
      planId: draft.planId,
      joinedDay: draft.joinedDay,
      paidThroughDay,
      lastVisitDay,
      engagement: draft.engagement,
      status: isActive ? "active" : "lapsed",
      code,
    },
    payments,
  };
}

function stageForLeadAge(rng: Rng, age: number): LeadStage {
  if (age <= 2) return pickWeighted(rng, [["new", 70], ["contacted", 30]]);
  if (age <= 7)
    return pickWeighted(rng, [["new", 10], ["contacted", 40], ["trial_booked", 35], ["lost", 15]]);
  if (age <= 14)
    return pickWeighted(rng, [["trial_booked", 15], ["trial_done", 25], ["won", 28], ["lost", 32]]);
  return pickWeighted(rng, [["contacted", 5], ["trial_done", 4], ["won", 38], ["lost", 53]]);
}

export function createSeedState(today: Day): DemoState {
  const rng = createRng(SEED);
  let nextId = 1;
  const newId = (prefix: string) => `${prefix}${nextId++}`;
  const codes = new Set<string>();
  const names = new Set<string>();
  const members: Member[] = [];
  const payments: Payment[] = [];

  for (let index = 0; index < 330; index++) {
    const planId = pickWeighted(rng, PLAN_WEIGHTS);
    const draft: MemberDraft = {
      planId,
      joinedDay: today - intBetween(rng, 3, 760),
      tenurePeriods: Math.max(1, Math.round(-Math.log(1 - rng()) * MEAN_TENURE_PERIODS[planId])),
      engagement: 0.2 + rng() * 0.3,
    };
    const id = newId("m");
    const built = buildMember(rng, today, id, createPerson(rng, nextId, names), draft, codes);
    if (!built) continue;
    members.push(built.member);
    payments.push(...built.payments);
  }

  // A handful of drifting members so the churn-risk story is visible from the first screen.
  const active = members.filter((member) => member.status === "active");
  for (let index = 0; index < 13; index++) {
    const member = active[Math.floor(rng() * active.length)];
    if (!member) continue;
    member.lastVisitDay = Math.max(member.joinedDay, today - intBetween(rng, 10, 26));
  }

  const leads: Lead[] = [];
  for (let day = today - 75; day <= today; day++) {
    const count = pickWeighted(rng, [[0, 25], [1, 35], [2, 25], [3, 15]]);
    for (let n = 0; n < count; n++) {
      const person = createPerson(rng, nextId, names);
      const id = newId("l");
      const stage = stageForLeadAge(rng, today - day);
      const hadTrial =
        stage === "trial_done" || stage === "won" || (stage === "lost" && rng() < 0.6);
      const trialDay =
        stage === "trial_booked"
          ? today + intBetween(rng, 0, 4)
          : hadTrial
            ? Math.min(today, day + intBetween(rng, 1, 6))
            : undefined;
      const lead: Lead = {
        id,
        ...person,
        source: pickWeighted(rng, LEAD_SOURCE_WEIGHTS),
        interest: pick(rng, INTERESTS),
        stage,
        createdDay: day,
        // A booked trial is still ahead, so the lead moved to that stage some time after it came in.
        stageDay: Math.min(
          today,
          stage === "trial_booked" ? day + intBetween(rng, 0, 2) : (trialDay ?? day + intBetween(rng, 0, 2)),
        ),
        trialDay,
      };

      if (stage === "won") {
        const memberId = newId("m");
        const built = buildMember(
          rng,
          today,
          memberId,
          person,
          {
            planId: pickWeighted(rng, PLAN_WEIGHTS),
            joinedDay: lead.stageDay,
            tenurePeriods: 99,
            engagement: 0.2 + rng() * 0.35,
          },
          codes,
        );
        if (built) {
          members.push(built.member);
          payments.push(...built.payments);
          lead.memberId = memberId;
        }
      }
      leads.push(lead);
    }
  }

  // Anyone already 10+ days away has drifted: they rarely come back on their own.
  for (const member of members) {
    if (member.status === "active" && today - member.lastVisitDay >= AT_RISK_DAYS) {
      member.engagement = driftingEngagement(rng());
    }
  }

  const visitsByDay: Record<number, number> = {};
  const expectedDaily = members
    .filter((member) => member.status === "active")
    .reduce((sum, member) => sum + member.engagement, 0);
  for (let day = today - 59; day <= today; day++) {
    const partialToday = day === today ? 0.55 : 1;
    visitsByDay[day] = Math.round(
      expectedDaily * weekdayFactor(day) * (0.88 + rng() * 0.24) * partialToday,
    );
  }

  return {
    version: STATE_VERSION,
    startDay: today,
    today,
    members,
    leads,
    payments,
    visitsByDay,
    checkIns: [],
    winbackEnabled: false,
    messages: [],
    recoveries: [],
    events: [
      {
        id: newId("e"),
        day: today,
        text: "Demo opened. Use Fast-forward to watch the gym run for a day or a week.",
        tone: "neutral",
      },
    ],
    nextId,
  };
}
