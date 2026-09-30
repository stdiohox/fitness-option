import { useMemo, useRef, useState, type FormEvent } from "react";
import { SampleBadge } from "../../components/SampleBadge";
import { formatNaira, firstName } from "../../lib/format";
import { monthlyValue, planById } from "../../data/sample";
import { AT_RISK_DAYS } from "../../state/automations";
import { lookupCheckIn, planName, type CheckInOutcome } from "../../state/checkins";
import { useDemoStore } from "../../state/store";

const CODE_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"] as const;

function minuteOfDayNow(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function formatMinute(minute: number): string {
  const hours = Math.floor(minute / 60);
  const mins = String(minute % 60).padStart(2, "0");
  return `${hours % 12 || 12}:${mins}${hours < 12 ? "am" : "pm"}`;
}

function OutcomeCard({ outcome }: { outcome: CheckInOutcome }) {
  if (outcome.kind === "unknown") {
    return (
      <div className="rounded-2xl border border-brand-red/30 bg-brand-red-soft p-5">
        <p className="text-lg font-semibold text-brand-red"><span aria-hidden="true">⚠ </span>Code not recognised</p>
        <p className="mt-1 text-sm text-ink-2">Check the 4 digits on the member's card, or look them up at the desk.</p>
      </div>
    );
  }
  if (outcome.kind === "lapsed") {
    return (
      <div className="rounded-2xl border border-warn/40 bg-warn-soft p-5">
        <p className="text-lg font-semibold text-warn">Membership expired — {outcome.member.name}</p>
        <p className="mt-1 text-sm text-ink-2">
          Their {planName(outcome.member)} plan has ended. Renew at the desk ({formatNaira(planById(outcome.member.planId).priceNgn)}).
        </p>
      </div>
    );
  }
  if (outcome.kind === "already") {
    return (
      <div className="rounded-2xl border border-line bg-paper p-5">
        <p className="text-lg font-semibold">{outcome.member.name} is already in</p>
        <p className="mt-1 text-sm text-ink-2">Checked in today at {formatMinute(outcome.checkIn.minute)}.</p>
      </div>
    );
  }
  const name = firstName(outcome.member.name);
  return (
    <div className="rounded-2xl border border-good/40 bg-good-soft p-5">
      <p className="display text-3xl text-good">Welcome{outcome.daysAway >= AT_RISK_DAYS ? " back" : ""}, {name}! <span aria-hidden="true">💪🏽</span></p>
      <p className="mt-2 text-sm text-ink-2">
        {outcome.member.name} · {planName(outcome.member)} plan
      </p>
      {outcome.wonBack && (
        <p className="mt-2 text-sm font-semibold text-good">
          Back after a win-back message — {formatNaira(monthlyValue(planById(outcome.member.planId)))}/month kept.
        </p>
      )}
      {!outcome.wonBack && outcome.daysAway >= AT_RISK_DAYS && (
        <p className="mt-2 text-sm font-semibold text-good">First visit in {outcome.daysAway} days — off the churn-risk list.</p>
      )}
      {outcome.renewalInDays !== null && (
        <p className="mt-2 text-sm font-semibold text-warn">
          Renewal due {outcome.renewalInDays <= 0 ? "today" : `in ${outcome.renewalInDays} day${outcome.renewalInDays === 1 ? "" : "s"}`} — mention it at the desk.
        </p>
      )}
    </div>
  );
}

export function CheckIn() {
  const { demo, checkIn } = useDemoStore();
  const [code, setCode] = useState("");
  // `attempt` re-keys the result so the same message is announced again on a repeat try.
  const [result, setResult] = useState<{ outcome: CheckInOutcome; day: number; attempt: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const todayCheckIns = demo.checkIns.filter((entry) => entry.day === demo.today && entry.viaDesk);

  const memberById = useMemo(() => new Map(demo.members.map((member) => [member.id, member])), [demo.members]);

  // A few codes to try: someone drifting (ideally with a win-back pending), a regular, a lapsed member.
  // Picked once so the list doesn't reshuffle under the pointer after a check-in; notes stay live below.
  const [tryMemberIds] = useState(() => {
    const active = demo.members.filter((member) => member.status === "active");
    const drifting = active
      .filter((member) => demo.today - member.lastVisitDay >= AT_RISK_DAYS)
      .sort((a, b) => Number(Boolean(b.winback)) - Number(Boolean(a.winback)))
      .slice(0, 2);
    const regular = active.find((member) => demo.today - member.lastVisitDay < 3);
    const lapsed = demo.members.find((member) => member.status === "lapsed");
    return [...drifting, regular, lapsed].filter((member) => member !== undefined).map((member) => member.id);
  });
  const tryCodes = tryMemberIds
    .map((id) => memberById.get(id))
    .filter((member) => member !== undefined)
    .map((member) => {
      const daysAway = demo.today - member.lastVisitDay;
      const note =
        member.status !== "active"
          ? "expired"
          : todayCheckIns.some((entry) => entry.memberId === member.id)
            ? "checked in today"
            : member.winback
              ? "win-back sent"
              : daysAway >= AT_RISK_DAYS
                ? `${daysAway} days away`
                : "regular";
      return { member, note };
    });

  const submit = (value: string, fromInput = false) => {
    if (value.length !== CODE_LENGTH) return;
    const outcome = lookupCheckIn(demo, value);
    setResult((previous) => ({ outcome, day: demo.today, attempt: (previous?.attempt ?? 0) + 1 }));
    if (outcome.kind === "ok") checkIn(outcome.member.id, minuteOfDayNow());
    setCode("");
    // Only typed entries return to the input; keypad users keep their place (and no soft keyboard pops up).
    if (fromInput) inputRef.current?.focus();
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(code, true);
  };

  const onType = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) submit(digits, true);
  };

  const press = (key: (typeof KEYS)[number]) => {
    if (key === "clear") return setCode("");
    if (key === "back") return setCode((current) => current.slice(0, -1));
    const next = (code + key).slice(0, CODE_LENGTH);
    setCode(next);
    if (next.length === CODE_LENGTH) submit(next);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <p className="eyebrow">Front desk</p>
        <h1 className="display mt-1 text-4xl sm:text-5xl">Check-in</h1>
        <p className="mt-2 max-w-2xl text-ink-2">
          Members tap their 4-digit code at the desk tablet. Every check-in updates attendance, the churn-risk list and
          the dashboard — and closes the loop on win-back messages.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_1fr]">
        <section className="card p-6" aria-labelledby="kiosk-heading">
          <h2 id="kiosk-heading" className="sr-only">Check-in kiosk</h2>
          <form onSubmit={onSubmit}>
            <label htmlFor="checkin-code" className="text-sm font-semibold text-ink-2">
              Member code
            </label>
            <input
              ref={inputRef}
              id="checkin-code"
              value={code}
              onChange={(event) => onType(event.target.value)}
              aria-describedby="checkin-hint"
              inputMode="numeric"
              autoComplete="off"
              pattern="\d{4}"
              maxLength={CODE_LENGTH}
              placeholder="••••"
              className="mt-2 block h-16 w-full rounded-2xl border border-line-strong bg-paper text-center text-4xl font-semibold tracking-[0.5em]"
            />
          </form>
          <p id="checkin-hint" className="mt-2 text-xs text-muted">Checks in automatically at the 4th digit.</p>
          <p className="sr-only" role="status">
            {code.length > 0 && code.length < CODE_LENGTH ? `${code.length} of ${CODE_LENGTH} digits entered` : ""}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label="Keypad">
            {KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => press(key)}
                className={`h-14 rounded-xl bg-paper font-semibold transition-transform hover:bg-brand-blue-soft active:scale-95 ${
                  key === "back" || key === "clear" ? "text-sm" : "text-xl"
                }`}
              >
                {key === "back" ? "Delete" : key === "clear" ? "Clear" : key}
              </button>
            ))}
          </div>
          <div className="mt-5" role="status">
            {result && result.day === demo.today && <OutcomeCard key={result.attempt} outcome={result.outcome} />}
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="card p-5" aria-labelledby="try-heading">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="try-heading" className="font-semibold">Codes to try</h2>
              <SampleBadge label="Sample members" />
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {tryCodes.map(({ member, note }) => (
                <li key={member.id}>
                  <button
                    type="button"
                    onClick={() => submit(member.code)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5 text-left text-sm hover:bg-paper"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{member.name}</span>
                      <span className="block text-xs text-muted">{note}</span>
                    </span>
                    <span className="font-mono text-base font-semibold tracking-widest text-brand-blue">{member.code}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5" aria-labelledby="today-heading">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="today-heading" className="font-semibold">Checked in at the desk today</h2>
              <span className="text-sm text-muted">{demo.visitsByDay[demo.today] ?? 0} visits in total today</span>
            </div>
            {todayCheckIns.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No desk check-ins yet today.</p>
            ) : (
              <ul className="mt-3 flex flex-col divide-y divide-line">
                {todayCheckIns.map((entry) => {
                  const member = memberById.get(entry.memberId);
                  return (
                    <li key={`${entry.memberId}-${entry.minute}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="font-medium">{member?.name ?? "Member"}</span>
                      <span className="tabular-nums text-muted">{formatMinute(entry.minute)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
