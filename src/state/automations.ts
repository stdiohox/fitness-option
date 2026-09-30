// Missed-visit win-back automation. WhatsApp first, email alongside.
// No visit in AT_RISK_DAYS → message 1. Still away at SECOND_TOUCH_DAYS → message 2 with an offer.

import { firstName, formatNaira } from "../lib/format";
import { monthlyValue, planById } from "../data/sample";
import { pushEvent } from "./events";
import type { DemoState, Member, OutboundMessage, WinbackStep } from "./types";

/** A member who hasn't visited in this many days is at risk of not renewing. */
export const AT_RISK_DAYS = 10;
export const SECOND_TOUCH_DAYS = 21;
const MIN_DAYS_BETWEEN_TOUCHES = 7;
const MAX_MESSAGES = 150;

/**
 * Extra daily chance that a messaged member comes back, on top of their own (drifting) visit rate.
 * Modest on purpose: about 1 in 5 return within a week, the upper end of typical win-back results.
 */
export const RESPONSE_BOOST: Record<WinbackStep, number> = { 1: 0.015, 2: 0.02 };

/** Visit rate of a member who has drifted away: they rarely come back unprompted. */
export function driftingEngagement(roll: number): number {
  return 0.005 + roll * 0.015;
}

export interface MessageContent {
  whatsapp: string;
  emailSubject: string;
  emailBody: string;
}

export function winbackContent(member: Pick<Member, "name">, step: WinbackStep, daysAway: number): MessageContent {
  const name = firstName(member.name);
  if (step === 1) {
    return {
      whatsapp: `Hi ${name}! 👋 We've missed you at Fitness Options — it's been ${daysAway} days. Everything okay? Reply and we'll save you a spot in this week's aerobics or Tabata class ❤️💙`,
      emailSubject: `We miss you at Fitness Options, ${name}`,
      emailBody: `Hi ${name},\n\nIt's been ${daysAway} days since your last session and the Fitness Options family has noticed! Life gets busy — we get it.\n\nMorning and evening classes run all week, 6am–10pm. Reply to this email or WhatsApp us on +234 706 965 1085 and we'll save you a spot.\n\nEnjoy your body ❤️💙\nThe Fitness Options team, Aguda`,
    };
  }
  return {
    whatsapp: `${name}, it's been ${daysAway} days! 💪🏽 Come back this week and your next coaching check-in is on us. Reply YES and we'll book it for you.`,
    emailSubject: `${name}, your free coaching check-in is waiting`,
    emailBody: `Hi ${name},\n\nWe'd love to see you back. Come in any day this week and your next one-to-one coaching check-in is free — we'll help you pick up where you left off, no pressure.\n\nReply YES or WhatsApp +234 706 965 1085 to book.\n\nThe Fitness Options team, Aguda`,
  };
}

function sendWinback(draft: DemoState, member: Member, step: WinbackStep, daysAway: number): void {
  const message: OutboundMessage = {
    id: `w${draft.nextId++}`,
    day: draft.today,
    step,
    memberId: member.id,
    memberName: member.name,
    daysAway,
    ...winbackContent(member, step, daysAway),
  };
  draft.messages = [message, ...draft.messages].slice(0, MAX_MESSAGES);
  member.winback = { step, sentDay: draft.today };
}

/** Sends today's win-back messages. Mutates `draft`, a private copy owned by the simulation. */
export function runWinback(draft: DemoState): number {
  if (!draft.winbackEnabled) return 0;
  let sent = 0;
  for (const member of draft.members) {
    if (member.status !== "active") continue;
    const daysAway = draft.today - member.lastVisitDay;
    if (!member.winback && daysAway >= AT_RISK_DAYS) {
      sendWinback(draft, member, 1, daysAway);
      sent++;
    } else if (
      member.winback?.step === 1 &&
      daysAway >= SECOND_TOUCH_DAYS &&
      draft.today - member.winback.sentDay >= MIN_DAYS_BETWEEN_TOUCHES
    ) {
      sendWinback(draft, member, 2, daysAway);
      sent++;
    }
  }
  if (sent > 0) pushEvent(draft, `Win-back sent to ${sent} member${sent === 1 ? "" : "s"} on WhatsApp + email`, "neutral");
  return sent;
}

/** Called when a member with a pending win-back message visits. Returns the monthly value kept. */
export function recordRecovery(draft: DemoState, member: Member): number {
  const value = monthlyValue(planById(member.planId));
  draft.recoveries.push({ memberId: member.id, day: draft.today, monthlyValue: value });
  // Every open message in this member's sequence gets the credit (message 1 and, if sent, message 2).
  for (const message of draft.messages) {
    if (message.memberId === member.id && message.returnedDay === undefined) message.returnedDay = draft.today;
  }
  member.winback = undefined;
  pushEvent(draft, `${member.name} came back after a win-back message — ${formatNaira(value)}/month kept`, "good");
  return value;
}

export function setWinback(state: DemoState, enabled: boolean): DemoState {
  if (state.winbackEnabled === enabled) return state;
  const draft = structuredClone(state);
  draft.winbackEnabled = enabled;
  pushEvent(
    draft,
    enabled ? "Win-back automation switched on — messages go out with the next simulated day" : "Win-back automation paused",
    "neutral",
  );
  return draft;
}
