import { useMemo, useState } from "react";
import { MessagePreview } from "../../components/MessagePreview";
import { SampleBadge } from "../../components/SampleBadge";
import { formatDay } from "../../lib/dates";
import { formatNaira, formatPercent } from "../../lib/format";
import { AT_RISK_DAYS, SECOND_TOUCH_DAYS, winbackContent } from "../../state/automations";
import { atRiskMembers, winbackStats } from "../../state/selectors";
import { useDemoStore } from "../../state/store";

const LOG_ROWS = 12;

export function Automations() {
  const { demo, setWinbackEnabled, advance } = useDemoStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const atRisk = useMemo(() => atRiskMembers(demo), [demo]);
  const stats = useMemo(() => winbackStats(demo), [demo]);
  const selected = demo.messages.find((message) => message.id === selectedId) ?? demo.messages[0] ?? null;

  // Before anything has been sent, preview what the first at-risk member would receive.
  const example = atRisk[0];
  const preview = selected
    ? {
        recipient: selected.memberName,
        whatsapp: selected.whatsapp,
        emailSubject: selected.emailSubject,
        emailBody: selected.emailBody,
        sentLabel: `Sent ${formatDay(selected.day)}`,
      }
    : example
      ? {
          recipient: example.member.name,
          ...winbackContent(example.member, 1, example.daysAway),
          sentLabel: "Preview — not sent",
        }
      : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Automation</p>
          <h1 className="display mt-1 text-4xl sm:text-5xl">Missed-visit win-back</h1>
          <p className="mt-2 max-w-2xl text-ink-2">
            Members rarely cancel — they drift. This spots anyone who hasn't trained in {AT_RISK_DAYS} days and brings
            them back on WhatsApp before their renewal comes round.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={demo.winbackEnabled}
          aria-label="Win-back automation"
          onClick={() => setWinbackEnabled(!demo.winbackEnabled)}
          className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            demo.winbackEnabled ? "border-good/40 bg-good-soft text-good" : "border-line-strong bg-card text-ink"
          }`}
        >
          <span
            aria-hidden="true"
            className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors ${demo.winbackEnabled ? "bg-good" : "bg-line-strong"}`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 ${
                demo.winbackEnabled ? "translate-x-[1.375rem]" : "translate-x-0.5"
              }`}
            />
          </span>
          <span aria-hidden="true">Win-back automation {demo.winbackEnabled ? "on" : "off"}</span>
        </button>
      </div>

      <ol className="grid gap-3 md:grid-cols-3" aria-label="How it works">
        <li className="card p-4">
          <p className="eyebrow">Day {AT_RISK_DAYS} without a visit</p>
          <p className="mt-1 font-semibold">Friendly check-in</p>
          <p className="mt-1 text-sm text-ink-2">WhatsApp + email: "We've missed you — shall we save you a spot?"</p>
        </li>
        <li className="card p-4">
          <p className="eyebrow">Day {SECOND_TOUCH_DAYS}, still away</p>
          <p className="mt-1 font-semibold">Second message with an offer</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-2">
            A free coaching check-in to come back. <SampleBadge label="Sample offer" />
          </p>
        </li>
        <li className="card p-4">
          <p className="eyebrow">They walk back in</p>
          <p className="mt-1 font-semibold">Counted as recovered</p>
          <p className="mt-1 text-sm text-ink-2">Their next check-in stops the sequence and shows the ₦ kept.</p>
        </li>
      </ol>

      <div className="-mb-3 flex justify-end">
        <SampleBadge label="Simulated results on sample members" />
      </div>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card border-brand-red/30 bg-brand-red-soft p-4">
          <dt className="text-sm text-ink-2">At risk right now</dt>
          <dd className="text-3xl font-semibold text-brand-red">{atRisk.length}</dd>
        </div>
        <div className="card p-4">
          <dt className="text-sm text-ink-2">Messages sent</dt>
          <dd className="text-3xl font-semibold">{stats.sent}</dd>
        </div>
        <div className="card p-4">
          <dt className="text-sm text-ink-2">Came back after a message</dt>
          <dd className="text-3xl font-semibold">
            {stats.recovered}
            {stats.membersMessaged > 0 && (
              <span className="ml-2 text-base font-normal text-muted">{formatPercent(stats.rate)} of messaged</span>
            )}
          </dd>
        </div>
        <div className="card border-good/30 bg-good-soft p-4">
          <dt className="text-sm text-ink-2">Revenue kept</dt>
          <dd className="text-3xl font-semibold text-good">{formatNaira(stats.recoveredValue)}<span className="text-base font-normal">/mo</span></dd>
        </div>
      </dl>

      {!demo.winbackEnabled && stats.sent === 0 && (
        <div className="rise card flex flex-wrap items-center justify-between gap-4 border-brand-blue/30 bg-brand-blue-soft p-5">
          <p className="max-w-xl text-sm text-ink">
            <strong>Try it:</strong> switch the automation on, then fast-forward a week. Watch messages go out and
            members come back.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setWinbackEnabled(true)}>
            Switch on win-back
          </button>
        </div>
      )}
      {demo.winbackEnabled && stats.sent === 0 && (
        <div className="rise card flex flex-wrap items-center justify-between gap-4 border-good/30 bg-good-soft p-5">
          <p className="max-w-xl text-sm text-ink">
            <strong>It's on.</strong> Messages go out as each simulated day passes.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => advance(7)}>
            Fast-forward a week
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5" aria-labelledby="preview-heading">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="preview-heading" className="font-semibold">
              {selected ? `Message ${selected.step} to ${selected.memberName}` : "What they'll receive"}
            </h2>
            <SampleBadge label="Sample member" />
          </div>
          <p className="sr-only" role="status">
            {selected ? `Previewing message ${selected.step} to ${selected.memberName}` : ""}
          </p>
          {preview ? (
            <MessagePreview {...preview} />
          ) : (
            <p className="text-sm text-muted">No one is at risk right now.</p>
          )}
        </section>

        <section className="card p-5" aria-labelledby="log-heading">
          <h2 id="log-heading" className="mb-3 font-semibold">Message log</h2>
          {demo.messages.length === 0 ? (
            <p className="text-sm text-muted">Nothing sent yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {demo.messages.slice(0, LOG_ROWS).map((message) => (
                <li key={message.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(message.id)}
                    aria-pressed={selected?.id === message.id}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border-l-4 px-2 py-2.5 text-left text-sm hover:bg-paper ${
                      selected?.id === message.id ? "border-brand-blue bg-brand-blue-soft" : "border-transparent"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{message.memberName}</span>
                      <span className="block text-xs text-muted">
                        {formatDay(message.day)} · message {message.step} · {message.daysAway} days away
                      </span>
                    </span>
                    {message.returnedDay !== undefined ? (
                      <span className="shrink-0 rounded-full bg-good-soft px-2.5 py-1 text-xs font-semibold text-good">
                        <span aria-hidden="true">✓ </span>Came back {formatDay(message.returnedDay, { weekday: undefined })}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-paper px-2.5 py-1 text-xs font-medium text-ink-2">Sent</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
