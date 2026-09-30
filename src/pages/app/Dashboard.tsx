import { useMemo } from "react";
import { ActivityFeed } from "../../components/ActivityFeed";
import { BarList } from "../../components/charts/BarList";
import { ColumnStrip } from "../../components/charts/ColumnStrip";
import { LineChart } from "../../components/charts/LineChart";
import { SampleBadge } from "../../components/SampleBadge";
import { StatTile } from "../../components/StatTile";
import { planById } from "../../data/sample";
import { dateFromDay, formatDay, formatMonth, monthKeyOf } from "../../lib/dates";
import { firstName, formatNaira, formatNairaCompact, formatPercent } from "../../lib/format";
import {
  activeMembers,
  atRiskMembers,
  leadSourceCounts,
  newLeadsSince,
  revenueByMonth,
  revenueInMonth,
  trialConversion,
  visitsForLastDays,
} from "../../state/selectors";
import { useDemoStore } from "../../state/store";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function Dashboard() {
  const { demo, lastAdvance } = useDemoStore();

  const metrics = useMemo(() => {
    // The chart shows completed months only; a partial current month would read as a collapse.
    const months = revenueByMonth(demo, 13).slice(0, -1);
    const thisMonth = revenueInMonth(demo, monthKeyOf(demo.today));
    const previous = months[months.length - 1]?.revenue ?? 0;
    const atRisk = atRiskMembers(demo);
    return {
      months,
      thisMonth,
      previous,
      members: activeMembers(demo).length,
      leads7: newLeadsSince(demo, demo.today - 7),
      conversion: trialConversion(demo, 30),
      atRisk,
      atRiskValue: atRisk.reduce((sum, entry) => sum + entry.monthlyValue, 0),
      sources: leadSourceCounts(demo, 30),
      visits: visitsForLastDays(demo, 14),
    };
  }, [demo]);

  const dayOfMonth = dateFromDay(demo.today).getUTCDate();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Owner dashboard</p>
          <h1 className="display mt-1 text-4xl sm:text-5xl">{greeting()}, Fitness Options</h1>
        </div>
        <SampleBadge label="Sample data — members, leads and revenue are invented" />
      </div>

      {lastAdvance && (
        <section className="rise card flex flex-wrap items-center gap-x-8 gap-y-2 border-brand-blue/30 bg-brand-blue-soft px-5 py-4 text-sm">
          <p className="font-semibold text-brand-blue">
            While you were away ({formatDay(lastAdvance.fromDay + 1)} → {formatDay(lastAdvance.toDay)})
          </p>
          <p><span className="font-semibold">{lastAdvance.newLeads}</span> new leads</p>
          <p><span className="font-semibold">{lastAdvance.visits}</span> gym visits</p>
          <p>
            <span className="font-semibold">{lastAdvance.renewals}</span> renewals ·{" "}
            {formatNaira(lastAdvance.renewalRevenue)}
          </p>
          <p className={lastAdvance.lapsed ? "text-brand-red" : ""}>
            <span className="font-semibold">{lastAdvance.lapsed}</span> did not renew
          </p>
        </section>
      )}

      <section aria-label="Key numbers" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          hero
          label={`Revenue in ${formatMonth(monthKeyOf(demo.today))} so far`}
          value={formatNaira(metrics.thisMonth)}
          detail={`Day ${dayOfMonth} of the month · last month ${formatNairaCompact(metrics.previous)}`}
        />
        <StatTile
          label="Active members"
          value={String(metrics.members)}
          detail={`${metrics.visits[metrics.visits.length - 1]?.visits ?? 0} visits today`}
        />
        <StatTile
          label="New leads, last 7 days"
          value={String(metrics.leads7)}
          detail={`Free trial → member: ${formatPercent(metrics.conversion.rate)} (${metrics.conversion.won} of ${metrics.conversion.trials}, 30 days)`}
        />
        <StatTile
          tone="risk"
          label="Members at risk of leaving"
          value={String(metrics.atRisk.length)}
          detail={
            <span className="text-brand-red">
              {formatNaira(metrics.atRiskValue)}/month at risk · no visit in 10+ days
            </span>
          }
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-5" aria-labelledby="revenue-heading">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="revenue-heading" className="font-semibold">Monthly revenue, last 12 full months</h2>
            <p className="text-sm text-muted">This month so far is in the tile above</p>
          </div>
          <LineChart
            data={metrics.months.map((month) => ({ label: formatMonth(month.month), value: month.revenue }))}
            formatValue={formatNaira}
            formatTick={formatNairaCompact}
            ariaLabel={`Monthly revenue over the last 12 full months. Last month: ${formatNaira(metrics.previous)}.`}
          />
        </section>

        <section className="card p-5" aria-labelledby="risk-heading">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="risk-heading" className="font-semibold">Churn risk</h2>
            <p className="text-sm text-muted">Longest away first</p>
          </div>
          {metrics.atRisk.length === 0 ? (
            <p className="text-sm text-muted">Everyone has trained in the last 10 days.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {metrics.atRisk.slice(0, 6).map(({ member, daysAway, monthlyValue }) => (
                <li key={member.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{member.name}</p>
                    <p className="text-xs text-muted">
                      {planById(member.planId).name} · {member.area} · worth {formatNaira(monthlyValue)}/mo
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-red-soft px-2.5 py-1 text-xs font-semibold text-brand-red">
                    <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <circle cx="6" cy="6" r="4.5" />
                      <path d="M6 3.8V6l1.4 1" strokeLinecap="round" />
                    </svg>
                    {daysAway} days away
                  </span>
                </li>
              ))}
            </ul>
          )}
          {metrics.atRisk.length > 6 && (
            <p className="mt-3 text-sm text-muted">
              +{metrics.atRisk.length - 6} more, including {firstName(metrics.atRisk[6]?.member.name ?? "")}
            </p>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5" aria-labelledby="sources-heading">
          <h2 id="sources-heading" className="mb-4 font-semibold">Where leads came from, 30 days</h2>
          <BarList items={metrics.sources.map((entry) => ({ label: entry.source, value: entry.count }))} />
        </section>

        <section className="card p-5" aria-labelledby="visits-heading">
          <h2 id="visits-heading" className="mb-1 font-semibold">Gym visits, last 14 days</h2>
          <ColumnStrip
            valueLabel="visits"
            items={metrics.visits.map((entry) => ({
              key: entry.day,
              label: formatDay(entry.day),
              shortLabel: formatDay(entry.day, { weekday: undefined }),
              value: entry.visits,
            }))}
          />
        </section>

        <section className="card p-5" aria-labelledby="activity-heading">
          <h2 id="activity-heading" className="mb-4 font-semibold">Latest activity</h2>
          <ActivityFeed events={demo.events} />
        </section>
      </div>
    </div>
  );
}
