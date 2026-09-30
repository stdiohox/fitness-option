import { formatDay } from "../lib/dates";
import { formatNaira } from "../lib/format";
import { useDemoStore } from "../state/store";

export function TimeMachine() {
  const { demo, lastAdvance, advance, reset } = useDemoStore();
  const elapsed = demo.today - demo.startDay;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-xl bg-brand-blue text-white" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
        <div>
          <p className="eyebrow" aria-hidden="true">Simulated date</p>
          <p className="text-lg font-semibold">
            <span className="sr-only">Simulated date: </span>
            {formatDay(demo.today, { year: "numeric" })}
            {elapsed > 0 && <span className="ml-2 text-sm font-medium text-muted">+{elapsed} days</span>}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Fast-forward the simulated date">
        <span className="eyebrow mr-1 hidden md:inline" aria-hidden="true">Fast-forward</span>
        <button type="button" className="btn btn-primary" onClick={() => advance(1)}>
          +1 day
        </button>
        <button type="button" className="btn btn-primary" onClick={() => advance(7)}>
          +1 week
        </button>
        <button type="button" className="btn btn-ghost" onClick={reset}>
          Reset demo
        </button>
      </div>

      {/* Always rendered: a live region inserted already-filled is often not announced. */}
      <p className="sr-only" role="status">
        {lastAdvance &&
          `${lastAdvance.days} day${lastAdvance.days === 1 ? "" : "s"} passed: ${lastAdvance.newLeads} new leads, ${
            lastAdvance.renewals
          } renewals worth ${formatNaira(lastAdvance.renewalRevenue)}, ${lastAdvance.lapsed} lapsed.`}
      </p>
    </div>
  );
}
