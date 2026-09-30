import { planById } from "../data/sample";
import { recordRecovery } from "./automations";
import { pushEvent } from "./events";
import type { CheckIn, DemoState, Member } from "./types";

const MAX_CHECKINS = 60;
/** Show a renewal reminder at the desk when the paid period ends within this many days. */
const RENEWAL_NOTICE_DAYS = 5;
/** A member who walks back in after drifting gets their normal habit back. */
const RETURNING_ENGAGEMENT = 0.25;

export type CheckInOutcome =
  | { kind: "unknown" }
  | { kind: "lapsed"; member: Member }
  | { kind: "already"; member: Member; checkIn: CheckIn }
  | { kind: "ok"; member: Member; daysAway: number; renewalInDays: number | null; wonBack: boolean };

/** Decides what the desk should say for a code, without changing anything. */
export function lookupCheckIn(state: DemoState, code: string): CheckInOutcome {
  const member = state.members.find((candidate) => candidate.code === code);
  if (!member) return { kind: "unknown" };
  if (member.status !== "active") return { kind: "lapsed", member };
  const earlier = state.checkIns.find((checkIn) => checkIn.memberId === member.id && checkIn.day === state.today);
  if (earlier) return { kind: "already", member, checkIn: earlier };
  const renewalIn = member.paidThroughDay - state.today;
  return {
    kind: "ok",
    member,
    daysAway: state.today - member.lastVisitDay,
    renewalInDays: renewalIn <= RENEWAL_NOTICE_DAYS ? renewalIn : null,
    wonBack: member.winback !== undefined,
  };
}

export function recordCheckIn(state: DemoState, memberId: string, minute: number): DemoState {
  const outcome = lookupCheckIn(state, state.members.find((member) => member.id === memberId)?.code ?? "");
  if (outcome.kind !== "ok") return state;

  const draft = structuredClone(state);
  const member = draft.members.find((candidate) => candidate.id === memberId);
  if (!member) return state;

  const daysAway = draft.today - member.lastVisitDay;
  member.lastVisitDay = draft.today;
  draft.visitsByDay[draft.today] = (draft.visitsByDay[draft.today] ?? 0) + 1;
  draft.checkIns = [{ memberId, day: draft.today, minute, viaDesk: true }, ...draft.checkIns].slice(0, MAX_CHECKINS);

  if (member.winback) {
    recordRecovery(draft, member);
    member.engagement = Math.max(member.engagement, RETURNING_ENGAGEMENT);
  } else if (daysAway >= 10) {
    member.engagement = Math.max(member.engagement, RETURNING_ENGAGEMENT);
    pushEvent(draft, `${member.name} checked in after ${daysAway} days away`, "good");
  }
  return draft;
}

export function planName(member: Member): string {
  return planById(member.planId).name;
}
