import type { Day } from "../lib/dates";
import { formatNaira } from "../lib/format";
import { createRng, pick, pickWeighted, type Rng } from "../lib/rng";
import { INTERESTS, LEAD_SOURCE_WEIGHTS, planById } from "../data/sample";
import { SEED, createPerson, periodDays, weekdayFactor } from "./seed";
import type { ActivityEvent, DemoState, EventTone } from "./types";

const MAX_EVENTS = 80;
const VISIT_HISTORY_DAYS = 60;
const PAYMENT_HISTORY_DAYS = 420;
/** A member who hasn't visited in this many days is at risk of not renewing. */
export const AT_RISK_DAYS = 10;

export interface AdvanceSummary {
  days: number;
  fromDay: Day;
  toDay: Day;
  newLeads: number;
  renewals: number;
  renewalRevenue: number;
  lapsed: number;
  visits: number;
}

function rngForDay(day: Day): Rng {
  return createRng(SEED ^ Math.imul(day, 2654435761));
}

/** Mutates `draft`, which is always a private copy made by `advanceDays`. */
export function pushEvent(draft: DemoState, text: string, tone: EventTone): void {
  const event: ActivityEvent = { id: `e${draft.nextId++}`, day: draft.today, text, tone };
  draft.events = [event, ...draft.events].slice(0, MAX_EVENTS);
}

function simulateVisits(draft: DemoState, rng: Rng): number {
  let visits = 0;
  const factor = weekdayFactor(draft.today);
  for (const member of draft.members) {
    if (member.status !== "active") continue;
    if (rng() < member.engagement * factor) {
      member.lastVisitDay = draft.today;
      visits++;
    }
  }
  draft.visitsByDay[draft.today] = visits;
  delete draft.visitsByDay[draft.today - VISIT_HISTORY_DAYS];
  return visits;
}

function simulateRenewals(draft: DemoState, rng: Rng, summary: AdvanceSummary): void {
  for (const member of draft.members) {
    if (member.status !== "active" || member.paidThroughDay >= draft.today) continue;
    const daysAway = draft.today - member.lastVisitDay;
    const renewChance = daysAway < AT_RISK_DAYS ? 0.9 : 0.3;
    if (rng() < renewChance) {
      const plan = planById(member.planId);
      member.paidThroughDay += periodDays(member.planId);
      draft.payments.push({ memberId: member.id, day: draft.today, amount: plan.priceNgn });
      summary.renewals++;
      summary.renewalRevenue += plan.priceNgn;
    } else {
      member.status = "lapsed";
      summary.lapsed++;
      pushEvent(
        draft,
        `${member.name} did not renew (${planById(member.planId).name}, last visit ${daysAway} days ago)`,
        "bad",
      );
    }
  }
}

function simulateNewLeads(draft: DemoState, rng: Rng): number {
  const count = pickWeighted(rng, [[0, 25], [1, 35], [2, 25], [3, 15]]);
  for (let n = 0; n < count; n++) {
    const person = createPerson(rng, draft.nextId);
    const source = pickWeighted(rng, LEAD_SOURCE_WEIGHTS);
    draft.leads.push({
      id: `l${draft.nextId++}`,
      ...person,
      source,
      interest: pick(rng, INTERESTS),
      stage: "new",
      createdDay: draft.today,
      stageDay: draft.today,
    });
    pushEvent(draft, `New lead: ${person.name} via ${source}`, "neutral");
  }
  return count;
}

function completeYesterdaysTrials(draft: DemoState): void {
  for (const lead of draft.leads) {
    if (lead.stage === "trial_booked" && lead.trialDay !== undefined && lead.trialDay < draft.today) {
      lead.stage = "trial_done";
      lead.stageDay = draft.today;
      pushEvent(draft, `${lead.name} completed a free trial — ready to convert`, "neutral");
    }
  }
}

function advanceOneDay(draft: DemoState, summary: AdvanceSummary): void {
  draft.today += 1;
  const rng = rngForDay(draft.today);
  completeYesterdaysTrials(draft);
  summary.visits += simulateVisits(draft, rng);
  simulateRenewals(draft, rng, summary);
  summary.newLeads += simulateNewLeads(draft, rng);
}

export function advanceDays(state: DemoState, days: number): { state: DemoState; summary: AdvanceSummary } {
  if (!Number.isInteger(days) || days < 1) throw new Error(`advanceDays needs a positive whole number, got ${days}`);
  const draft = structuredClone(state);
  const summary: AdvanceSummary = {
    days,
    fromDay: state.today,
    toDay: state.today + days,
    newLeads: 0,
    renewals: 0,
    renewalRevenue: 0,
    lapsed: 0,
    visits: 0,
  };
  for (let day = 0; day < days; day++) advanceOneDay(draft, summary);
  // Screens read at most 13 months of payments; drop older ones so long demos don't grow storage.
  draft.payments = draft.payments.filter((payment) => payment.day >= draft.today - PAYMENT_HISTORY_DAYS);
  if (summary.renewals > 0) {
    pushEvent(
      draft,
      `${summary.renewals} membership${summary.renewals === 1 ? "" : "s"} renewed — ${formatNaira(summary.renewalRevenue)}`,
      "good",
    );
  }
  return { state: draft, summary };
}
