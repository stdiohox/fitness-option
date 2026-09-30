// What the enquiry agent knows. Shared by the Claude prompt (api/agent.ts) and the scripted fallback,
// so both answer from the same facts. Verified facts and sample data are kept visibly separate.

import { GYM } from "../data/facts.js";
import { PLANS, TIMETABLE } from "../data/sample.js";
import { formatNaira } from "../lib/format.js";

export const FREE_TRIAL_NOTE = "one free trial session (sample offer for this demo)";

export function plansText(): string {
  return PLANS.map((plan) => `${plan.name}: ${formatNaira(plan.priceNgn)}${plan.verified ? "" : " (sample)"}`).join(
    "; ",
  );
}

export function timetableText(): string {
  return TIMETABLE.map((slot) => `${slot.day} ${slot.time} ${slot.name}`).join(", ");
}

/** The stable, cacheable part of the system prompt. Must not contain anything per-request. */
export const KNOWLEDGE = `
VERIFIED FACTS (safe to state as fact):
- Name: ${GYM.name} (${GYM.legalName}). Tagline: "${GYM.tagline}". "${GYM.bio}" — ${GYM.focus.join(", ")}.
- Location: ${GYM.area}. The exact street address is not confirmed — say you'll share the location pin on WhatsApp; never invent an address.
- Phone / WhatsApp: ${GYM.phoneDisplay}. Instagram: @${GYM.instagram}.
- Hours: ${GYM.hours}.
- Monthly membership: ${formatNaira(GYM.monthlyFeeNgn)}.
- Facilities: ${GYM.facilities.join("; ")}.
- Classes: ${GYM.classes.join(", ")}. Tabata runs morning and evening.
- Community events such as "${GYM.signature}".

SAMPLE DATA FOR THIS DEMO (use it, but it is not confirmed by the gym):
- Plans: ${plansText()}.
- Timetable: ${timetableText()}.
- Offer: ${FREE_TRIAL_NOTE}.
`.trim();
