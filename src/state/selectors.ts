import { monthKeyOf, type Day } from "../lib/dates";
import { monthlyValue, planById, type LeadSource } from "../data/sample";
import { AT_RISK_DAYS } from "./simulate";
import type { DemoState, Member } from "./types";

export function activeMembers(state: DemoState): Member[] {
  return state.members.filter((member) => member.status === "active");
}

export function revenueInMonth(state: DemoState, monthKey: string): number {
  return state.payments
    .filter((payment) => monthKeyOf(payment.day) === monthKey)
    .reduce((sum, payment) => sum + payment.amount, 0);
}

export interface MonthRevenue {
  month: string;
  revenue: number;
}

/** Revenue per calendar month, oldest first, ending with the current (partial) month. */
export function revenueByMonth(state: DemoState, months: number): MonthRevenue[] {
  const totals = new Map<string, number>();
  for (const payment of state.payments) {
    const key = monthKeyOf(payment.day);
    totals.set(key, (totals.get(key) ?? 0) + payment.amount);
  }
  const current = new Date(`${monthKeyOf(state.today)}-01T00:00:00Z`);
  const result: MonthRevenue[] = [];
  for (let offset = months - 1; offset >= 0; offset--) {
    const date = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - offset, 1));
    const key = date.toISOString().slice(0, 7);
    result.push({ month: key, revenue: totals.get(key) ?? 0 });
  }
  return result;
}

export function newLeadsSince(state: DemoState, sinceDay: Day): number {
  return state.leads.filter((lead) => lead.createdDay > sinceDay).length;
}

export interface TrialConversion {
  trials: number;
  won: number;
  rate: number;
}

/** Of the free trials held in the window, how many became paying members. */
export function trialConversion(state: DemoState, windowDays: number): TrialConversion {
  const from = state.today - windowDays;
  const trialled = state.leads.filter(
    (lead) =>
      lead.trialDay !== undefined &&
      lead.trialDay > from &&
      lead.trialDay <= state.today &&
      (lead.stage === "trial_done" || lead.stage === "won" || lead.stage === "lost"),
  );
  const won = trialled.filter((lead) => lead.stage === "won").length;
  return { trials: trialled.length, won, rate: trialled.length ? won / trialled.length : 0 };
}

export interface AtRiskMember {
  member: Member;
  daysAway: number;
  monthlyValue: number;
}

export function atRiskMembers(state: DemoState): AtRiskMember[] {
  return activeMembers(state)
    .map((member) => ({
      member,
      daysAway: state.today - member.lastVisitDay,
      monthlyValue: monthlyValue(planById(member.planId)),
    }))
    .filter((entry) => entry.daysAway >= AT_RISK_DAYS)
    .sort((a, b) => b.daysAway - a.daysAway);
}

export function leadSourceCounts(state: DemoState, windowDays: number): { source: LeadSource; count: number }[] {
  const counts = new Map<LeadSource, number>();
  for (const lead of state.leads) {
    if (lead.createdDay <= state.today - windowDays) continue;
    counts.set(lead.source, (counts.get(lead.source) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

export function visitsForLastDays(state: DemoState, days: number): { day: Day; visits: number }[] {
  const result: { day: Day; visits: number }[] = [];
  for (let day = state.today - days + 1; day <= state.today; day++) {
    result.push({ day, visits: state.visitsByDay[day] ?? 0 });
  }
  return result;
}
