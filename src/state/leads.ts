import { formatDay } from "../lib/dates";
import { formatNaira } from "../lib/format";
import { createRng } from "../lib/rng";
import { AREAS, planById } from "../data/sample";
import { SEED, createCheckInCode, periodDays } from "./seed";
import { pushEvent } from "./events";
import type { DemoState, LeadStage } from "./types";

export const STAGES: readonly { id: LeadStage; label: string; hint: string }[] = [
  { id: "new", label: "New lead", hint: "Reply within the hour" },
  { id: "contacted", label: "Contacted", hint: "Offer a free trial" },
  { id: "trial_booked", label: "Trial booked", hint: "Confirm the day before" },
  { id: "trial_done", label: "Trial done", hint: "Ask them to join today" },
  { id: "won", label: "Member", hint: "Welcome to the family" },
  { id: "lost", label: "Lost", hint: "Re-engage in 30 days" },
];

export function stageLabel(stage: LeadStage): string {
  return STAGES.find((candidate) => candidate.id === stage)?.label ?? stage;
}

export interface ChatBooking {
  firstName: string;
  daysFromToday: number;
  time: string;
  interest: string;
}

/** A trial booked by the WhatsApp agent lands in the pipeline as a new lead at "Trial booked". */
export function addChatBooking(state: DemoState, booking: ChatBooking): DemoState {
  const draft = structuredClone(state);
  const trialDay = draft.today + booking.daysFromToday;
  draft.leads.push({
    id: `l${draft.nextId++}`,
    name: booking.firstName,
    phone: "WhatsApp chat",
    email: "",
    source: "WhatsApp",
    interest: booking.interest || "General fitness",
    stage: "trial_booked",
    createdDay: draft.today,
    stageDay: draft.today,
    trialDay,
  });
  pushEvent(
    draft,
    `${booking.firstName} booked a free trial for ${formatDay(trialDay)}${booking.time ? `, ${booking.time}` : ""} — via the WhatsApp agent`,
    "good",
  );
  return draft;
}

/** Days until a newly booked trial, when the owner books one from the board. */
const DEFAULT_TRIAL_LEAD_TIME = 2;

export function moveLead(state: DemoState, leadId: string, stage: LeadStage): DemoState {
  const current = state.leads.find((lead) => lead.id === leadId);
  // A converted lead is a paying member; moving the card back would orphan the membership.
  if (!current || current.stage === stage || current.stage === "won") return state;

  const draft = structuredClone(state);
  const lead = draft.leads.find((candidate) => candidate.id === leadId);
  if (!lead) return state;

  lead.stage = stage;
  lead.stageDay = draft.today;

  // Keep trialDay meaning "a trial that did or will happen", because trial conversion counts it.
  const trialStillAhead = lead.trialDay !== undefined && lead.trialDay >= draft.today;
  if (stage === "trial_booked") {
    if (!trialStillAhead) lead.trialDay = draft.today + DEFAULT_TRIAL_LEAD_TIME;
    pushEvent(draft, `${lead.name} booked a free trial`, "neutral");
  } else if (stage === "trial_done") {
    lead.trialDay = Math.min(lead.trialDay ?? draft.today, draft.today);
  } else if (stage === "won") {
    // Joined before the booked trial: count the trial as today so the KPI doesn't shift later.
    if (trialStillAhead) lead.trialDay = draft.today;
  } else if (trialStillAhead) {
    lead.trialDay = undefined;
  }

  if (stage === "won") {
    const plan = planById("monthly");
    const rng = createRng(SEED ^ draft.nextId);
    const memberId = `m${draft.nextId++}`;
    const codes = new Set(draft.members.map((member) => member.code));
    draft.members.push({
      id: memberId,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      area: AREAS[Math.floor(rng() * AREAS.length)] ?? "Aguda",
      planId: plan.id,
      joinedDay: draft.today,
      paidThroughDay: draft.today + periodDays(plan.id) - 1,
      lastVisitDay: draft.today,
      engagement: 0.3 + rng() * 0.3,
      status: "active",
      code: createCheckInCode(rng, codes),
    });
    draft.payments.push({ memberId, day: draft.today, amount: plan.priceNgn });
    lead.memberId = memberId;
    pushEvent(draft, `${lead.name} joined on ${plan.name} — ${formatNaira(plan.priceNgn)}`, "good");
  }

  if (stage === "lost") pushEvent(draft, `${lead.name} marked as lost`, "neutral");

  return draft;
}
