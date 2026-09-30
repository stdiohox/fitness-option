import type { Day } from "../lib/dates";
import { formatNaira } from "../lib/format";
import { createRng, pick, pickWeighted, type Rng } from "../lib/rng";
import { INTERESTS, LEAD_SOURCE_WEIGHTS, planById } from "../data/sample";
import { SEED, createPerson, periodDays, weekdayFactor } from "./seed";
import { AT_RISK_DAYS, RESPONSE_BOOST, driftingEngagement, recordRecovery, runWinback } from "./automations";
import { pushEvent } from "./events";
import type { DemoState } from "./types";

const VISIT_HISTORY_DAYS = 60;
const PAYMENT_HISTORY_DAYS = 420;
/** Engagement a member returns to after answering a win-back message. */
const REENGAGED_RATE = 0.25;
/** Daily chance that a regular member starts drifting away (work, travel, life). */
const DAILY_DRIFT_CHANCE = 0.002;
/** Regulars have habits: after this many days away they are very likely to come in. */
const HABIT_GAP_DAYS = 5;
const HABIT_PULL = 0.5;
/** Below this visit rate a member is drifting rather than just between sessions. */
const DRIFTING_BELOW = 0.05;

export interface AdvanceSummary {
  days: number;
  fromDay: Day;
  toDay: Day;
  newLeads: number;
  renewals: number;
  renewalRevenue: number;
  lapsed: number;
  visits: number;
  winbackSent: number;
  recovered: number;
  recoveredValue: number;
}

function rngForDay(day: Day): Rng {
  return createRng(SEED ^ Math.imul(day, 2654435761));
}

function simulateVisits(draft: DemoState, rng: Rng, summary: AdvanceSummary): number {
  let visits = 0;
  const factor = weekdayFactor(draft.today);
  for (const member of draft.members) {
    if (member.status !== "active") continue;
    if (!member.winback && member.engagement > REENGAGED_RATE / 2 && rng() < DAILY_DRIFT_CHANCE) {
      member.engagement = driftingEngagement(rng());
    }
    const boost = member.winback ? RESPONSE_BOOST[member.winback.step] : 0;
    const isRegular = member.engagement >= DRIFTING_BELOW;
    const habit = isRegular && draft.today - member.lastVisitDay >= HABIT_GAP_DAYS ? HABIT_PULL : 0;
    if (rng() < member.engagement * factor + boost + habit) {
      member.lastVisitDay = draft.today;
      visits++;
      if (member.winback) {
        summary.recovered++;
        summary.recoveredValue += recordRecovery(draft, member);
        member.engagement = Math.max(member.engagement, REENGAGED_RATE);
      }
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
      member.winback = undefined;
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
  const names = count ? new Set([...draft.members, ...draft.leads].map((person) => person.name)) : undefined;
  for (let n = 0; n < count; n++) {
    const person = createPerson(rng, draft.nextId, names);
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
  summary.visits += simulateVisits(draft, rng, summary);
  simulateRenewals(draft, rng, summary);
  summary.winbackSent += runWinback(draft);
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
    winbackSent: 0,
    recovered: 0,
    recoveredValue: 0,
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
