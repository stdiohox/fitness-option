import type { Day } from "../lib/dates";
import type { LeadSource, PlanId } from "../data/sample";

export type LeadStage = "new" | "contacted" | "trial_booked" | "trial_done" | "won" | "lost";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: LeadSource;
  interest: string;
  stage: LeadStage;
  createdDay: Day;
  stageDay: Day;
  trialDay?: Day;
  /** Set when the lead converts and becomes a member. */
  memberId?: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  area: string;
  planId: PlanId;
  joinedDay: Day;
  /** Last day of the currently paid period. */
  paidThroughDay: Day;
  lastVisitDay: Day;
  /** Probability of visiting on any given day. */
  engagement: number;
  status: "active" | "lapsed";
  /** Front-desk check-in code. */
  code: string;
  /** Set while a win-back message is waiting for the member to come back. */
  winback?: { step: WinbackStep; sentDay: Day };
}

export type WinbackStep = 1 | 2;

export interface OutboundMessage {
  id: string;
  day: Day;
  step: WinbackStep;
  memberId: string;
  memberName: string;
  daysAway: number;
  whatsapp: string;
  emailSubject: string;
  emailBody: string;
  /** Day the member came back after this message, if they did. */
  returnedDay?: Day;
}

export interface Recovery {
  memberId: string;
  day: Day;
  monthlyValue: number;
}

export interface Payment {
  memberId: string;
  day: Day;
  amount: number;
}

export interface CheckIn {
  memberId: string;
  day: Day;
  /** Minutes after midnight. */
  minute: number;
  viaDesk: boolean;
}

export type EventTone = "good" | "bad" | "neutral";

export interface ActivityEvent {
  id: string;
  day: Day;
  text: string;
  tone: EventTone;
}

export interface DemoState {
  version: number;
  /** The real calendar day the demo was first opened; the simulation starts here. */
  startDay: Day;
  today: Day;
  members: Member[];
  leads: Lead[];
  payments: Payment[];
  /** Daily visit totals, keyed by day. */
  visitsByDay: Record<number, number>;
  checkIns: CheckIn[];
  events: ActivityEvent[];
  winbackEnabled: boolean;
  messages: OutboundMessage[];
  recoveries: Recovery[];
  nextId: number;
}
