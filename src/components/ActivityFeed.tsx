import { formatDay } from "../lib/dates";
import type { ActivityEvent } from "../state/types";

const TONE_DOT: Record<ActivityEvent["tone"], string> = {
  good: "bg-good",
  bad: "bg-brand-red",
  neutral: "bg-line-strong",
};

const TONE_LABEL: Record<ActivityEvent["tone"], string> = {
  good: "Good news",
  bad: "Needs attention",
  neutral: "Update",
};

export function ActivityFeed({ events, limit = 8 }: { events: ActivityEvent[]; limit?: number }) {
  if (events.length === 0) return <p className="text-sm text-muted">Nothing yet.</p>;
  return (
    <ol className="flex flex-col gap-3">
      {events.slice(0, limit).map((event) => (
        <li key={event.id} className="rise flex gap-3 text-sm">
          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${TONE_DOT[event.tone]}`} aria-hidden="true" />
          <div>
            <p className="text-ink">
              <span className="sr-only">{TONE_LABEL[event.tone]}: </span>
              {event.text}
            </p>
            <p className="text-xs text-muted">{formatDay(event.day)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
