import type { ActivityEvent, DemoState, EventTone } from "./types";

const MAX_EVENTS = 80;

/** Adds to the activity feed. Mutates `draft`, which must be a private copy of the state. */
export function pushEvent(draft: DemoState, text: string, tone: EventTone): void {
  const event: ActivityEvent = { id: `e${draft.nextId++}`, day: draft.today, text, tone };
  draft.events = [event, ...draft.events].slice(0, MAX_EVENTS);
}
