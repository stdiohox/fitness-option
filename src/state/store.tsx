import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { dayFromDate } from "../lib/dates";
import { addChatBooking, moveLead, type ChatBooking } from "./leads";
import { setWinback } from "./automations";
import { STATE_VERSION, createSeedState } from "./seed";
import { advanceDays, type AdvanceSummary } from "./simulate";
import type { DemoState, LeadStage } from "./types";

const STORAGE_KEY = "fitness-options-demo";

interface StoreState {
  demo: DemoState;
  lastAdvance: AdvanceSummary | null;
}

type Action =
  | { type: "advance"; days: number }
  | { type: "reset" }
  | { type: "moveLead"; leadId: string; stage: LeadStage }
  | { type: "chatBooking"; booking: ChatBooking }
  | { type: "setWinback"; enabled: boolean };

function reducer(store: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "advance": {
      const { state, summary } = advanceDays(store.demo, action.days);
      return { demo: state, lastAdvance: summary };
    }
    case "reset":
      return { demo: createSeedState(dayFromDate(new Date())), lastAdvance: null };
    case "moveLead": {
      const demo = moveLead(store.demo, action.leadId, action.stage);
      return demo === store.demo ? store : { ...store, demo };
    }
    case "chatBooking":
      return { ...store, demo: addChatBooking(store.demo, action.booking) };
    case "setWinback":
      return { ...store, demo: setWinback(store.demo, action.enabled) };
  }
}

function isDemoState(value: unknown): value is DemoState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<DemoState>;
  return (
    candidate.version === STATE_VERSION &&
    typeof candidate.today === "number" &&
    typeof candidate.startDay === "number" &&
    typeof candidate.nextId === "number" &&
    Array.isArray(candidate.members) &&
    Array.isArray(candidate.leads) &&
    Array.isArray(candidate.payments) &&
    Array.isArray(candidate.checkIns) &&
    Array.isArray(candidate.events) &&
    Array.isArray(candidate.messages) &&
    Array.isArray(candidate.recoveries) &&
    typeof candidate.winbackEnabled === "boolean" &&
    typeof candidate.visitsByDay === "object" &&
    candidate.visitsByDay !== null
  );
}

// Storage can be unavailable (private windows, blocked site data) or hold an old shape;
// either way the demo must still open, so anything unexpected falls back to a fresh seed.
function loadDemo(): DemoState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (isDemoState(parsed)) return parsed;
    }
  } catch {
    // Fall through to a fresh seed.
  }
  return createSeedState(dayFromDate(new Date()));
}

function saveDemo(demo: DemoState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
  } catch {
    // Not persisting is acceptable; the in-memory demo keeps working.
  }
}

interface StoreActions {
  advance: (days: number) => void;
  reset: () => void;
  moveLead: (leadId: string, stage: LeadStage) => void;
  bookFromChat: (booking: ChatBooking) => void;
  setWinbackEnabled: (enabled: boolean) => void;
}

interface StoreValue extends StoreActions {
  demo: DemoState;
  lastAdvance: AdvanceSummary | null;
}

const StoreContext = createContext<StoreValue | null>(null);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [store, dispatch] = useReducer(reducer, undefined, () => ({
    demo: loadDemo(),
    lastAdvance: null,
  }));

  useEffect(() => saveDemo(store.demo), [store.demo]);

  // dispatch is stable, so the action functions keep their identity across state changes.
  const actions = useMemo<StoreActions>(
    () => ({
      advance: (days) => dispatch({ type: "advance", days }),
      reset: () => dispatch({ type: "reset" }),
      moveLead: (leadId, stage) => dispatch({ type: "moveLead", leadId, stage }),
      bookFromChat: (booking) => dispatch({ type: "chatBooking", booking }),
      setWinbackEnabled: (enabled) => dispatch({ type: "setWinback", enabled }),
    }),
    [],
  );

  const value = useMemo<StoreValue>(
    () => ({ ...actions, demo: store.demo, lastAdvance: store.lastAdvance }),
    [actions, store],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useDemoStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useDemoStore must be used inside DemoStoreProvider");
  return value;
}
