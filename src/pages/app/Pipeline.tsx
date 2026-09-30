import { useEffect, useMemo, useState, type DragEvent } from "react";
import { SampleBadge } from "../../components/SampleBadge";
import { formatDay } from "../../lib/dates";
import { formatPercent } from "../../lib/format";
import { STAGES, stageLabel } from "../../state/leads";
import { trialConversion } from "../../state/selectors";
import { useDemoStore } from "../../state/store";
import type { Lead, LeadStage } from "../../state/types";

/** Closed columns only show recent outcomes; open columns show everything. */
const CLOSED_WINDOW_DAYS = 30;
/** Closed columns show the most recent outcomes; the count in the header covers the rest. */
const CLOSED_VISIBLE = 8;
const DRAG_TYPE = "application/x-lead-id";

function isClosed(stage: LeadStage): boolean {
  return stage === "won" || stage === "lost";
}

const OPEN_STAGES: readonly LeadStage[] = STAGES.map((stage) => stage.id).filter((id) => !isClosed(id));

function stageTimeLabel(lead: Lead, daysInStage: number): string {
  if (lead.stage === "new" && daysInStage >= 1) return `Waiting for a reply · ${daysInStage} day${daysInStage === 1 ? "" : "s"}`;
  if (daysInStage === 0) return lead.stage === "new" ? "Added today" : "Moved here today";
  return `${daysInStage} day${daysInStage === 1 ? "" : "s"} in this stage`;
}

interface LeadCardProps {
  lead: Lead;
  today: number;
  onMove: (stage: LeadStage) => void;
}

function LeadCard({ lead, today, onMove }: LeadCardProps) {
  const [target, setTarget] = useState<LeadStage>(lead.stage);
  const daysInStage = today - lead.stageDay;
  const locked = lead.stage === "won";
  const waiting = lead.stage === "new" && daysInStage >= 1;
  const selectId = `move-${lead.id}`;

  return (
    <li
      draggable={!locked}
      onDragStart={(event) => {
        event.dataTransfer.setData(DRAG_TYPE, lead.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className={`rise rounded-xl border border-line bg-card p-3 text-sm ${locked ? "" : "cursor-grab active:cursor-grabbing"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-tight">{lead.name}</p>
        <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-[11px] font-medium text-ink-2">{lead.source}</span>
      </div>
      <p className="mt-1 text-xs text-muted">{lead.interest}</p>
      {lead.stage === "trial_booked" && lead.trialDay !== undefined && (
        <p className="mt-2 text-xs font-medium text-brand-blue">
          Trial {lead.trialDay === today ? "today" : formatDay(lead.trialDay)}
        </p>
      )}
      <p className={`mt-2 text-xs ${waiting ? "font-semibold text-brand-red" : "text-muted"}`}>
        {stageTimeLabel(lead, daysInStage)}
      </p>

      {locked ? (
        <p className="mt-2 text-xs font-medium text-good">Active member — membership started</p>
      ) : (
        <div className="mt-2 flex items-end gap-1.5">
          <label htmlFor={selectId} className="sr-only">
            Move {lead.name} to
          </label>
          <select
            id={selectId}
            value={target}
            onChange={(event) => setTarget(event.target.value as LeadStage)}
            className="min-h-8 min-w-0 flex-1 rounded-md border border-line bg-card px-1.5 text-xs text-ink-2"
          >
            {STAGES.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={target === lead.stage}
            onClick={() => onMove(target)}
            className="min-h-8 rounded-md bg-brand-blue px-2.5 text-xs font-semibold text-white disabled:bg-paper disabled:text-muted"
          >
            Move
          </button>
        </div>
      )}
    </li>
  );
}

export function Pipeline() {
  const { demo, moveLead } = useDemoStore();
  const [dropTarget, setDropTarget] = useState<LeadStage | null>(null);
  const [lastMove, setLastMove] = useState<{ leadId: string; message: string } | null>(null);

  const columns = useMemo(() => {
    const byStage = new Map<LeadStage, Lead[]>(STAGES.map((stage) => [stage.id, []]));
    for (const lead of demo.leads) {
      if (isClosed(lead.stage) && lead.stageDay < demo.today - CLOSED_WINDOW_DAYS) continue;
      byStage.get(lead.stage)?.push(lead);
    }
    for (const leads of byStage.values()) leads.sort((a, b) => b.stageDay - a.stageDay);
    return byStage;
  }, [demo.leads, demo.today]);

  // After a move the card remounts in another column; put focus back on it (or its column).
  useEffect(() => {
    if (!lastMove) return;
    const lead = demo.leads.find((candidate) => candidate.id === lastMove.leadId);
    const focusTarget =
      document.getElementById(`move-${lastMove.leadId}`) ?? (lead && document.getElementById(`stage-${lead.stage}`));
    focusTarget?.focus();
  }, [lastMove, demo.leads]);

  const handleMove = (lead: Lead, stage: LeadStage) => {
    moveLead(lead.id, stage);
    const extra = stage === "won" ? " Monthly membership started." : "";
    setLastMove({ leadId: lead.id, message: `${lead.name} moved to ${stageLabel(stage)}.${extra}` });
  };

  const conversion = trialConversion(demo, 30);
  const openCount = OPEN_STAGES.reduce((sum, stage) => sum + (columns.get(stage)?.length ?? 0), 0);
  const waitingReply = (columns.get("new") ?? []).filter((lead) => demo.today - lead.stageDay >= 1).length;

  const isLeadDrag = (event: DragEvent) => event.dataTransfer.types.includes(DRAG_TYPE);

  const onDrop = (stage: LeadStage) => (event: DragEvent) => {
    if (!isLeadDrag(event)) return;
    event.preventDefault();
    setDropTarget(null);
    const lead = demo.leads.find((candidate) => candidate.id === event.dataTransfer.getData(DRAG_TYPE));
    if (lead && lead.stage !== stage) handleMove(lead, stage);
  };

  return (
    <div className="mx-auto flex max-w-[100rem] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Lead → trial → member</p>
          <h1 className="display mt-1 text-4xl sm:text-5xl">Pipeline</h1>
          <p className="mt-2 max-w-2xl text-ink-2">
            Drag a card to move it, or pick a stage and press <strong>Move</strong>. Moving a lead to{" "}
            <strong>Member</strong> starts their monthly membership and books the payment.
          </p>
        </div>
        <SampleBadge label="Sample data — leads are invented" />
      </div>

      <p className="sr-only" role="status">
        {lastMove?.message ?? ""}
      </p>

      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <dt className="text-sm text-ink-2">Open leads</dt>
          <dd className="text-3xl font-semibold">{openCount}</dd>
        </div>
        <div className={`card p-4 ${waitingReply ? "border-brand-red/30 bg-brand-red-soft" : ""}`}>
          <dt className="text-sm text-ink-2">New leads waiting 1+ day for a reply</dt>
          <dd className={`text-3xl font-semibold ${waitingReply ? "text-brand-red" : ""}`}>{waitingReply}</dd>
        </div>
        <div className="card p-4">
          <dt className="text-sm text-ink-2">Free trial → member, 30 days</dt>
          <dd className="text-3xl font-semibold">
            {formatPercent(conversion.rate)}{" "}
            <span className="text-base font-normal text-muted">
              {conversion.won} of {conversion.trials}
            </span>
          </dd>
        </div>
      </dl>

      <div
        role="region"
        aria-label="Pipeline board, scrolls sideways"
        tabIndex={0}
        className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8"
        onDragEnd={() => setDropTarget(null)}
      >
        <div className="grid min-w-[72rem] grid-cols-6 gap-3">
          {STAGES.map((stage) => {
            const leads = columns.get(stage.id) ?? [];
            const visible = isClosed(stage.id) ? leads.slice(0, CLOSED_VISIBLE) : leads;
            return (
              <div
                key={stage.id}
                role="group"
                aria-labelledby={`stage-${stage.id}`}
                onDragOver={(event) => {
                  if (!isLeadDrag(event)) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDropTarget(stage.id);
                }}
                onDragLeave={(event) => {
                  if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                  setDropTarget((current) => (current === stage.id ? null : current));
                }}
                onDrop={onDrop(stage.id)}
                className={`flex min-h-[28rem] flex-col rounded-2xl border p-2.5 transition-colors ${
                  dropTarget === stage.id ? "border-brand-blue bg-brand-blue-soft" : "border-line bg-paper"
                }`}
              >
                <div className="px-1.5 pb-2.5 pt-1">
                  <div className="flex items-baseline justify-between">
                    <h2 id={`stage-${stage.id}`} tabIndex={-1} className="font-semibold outline-none">
                      {stage.label}
                    </h2>
                    <span className="text-sm font-semibold tabular-nums text-ink-2">{leads.length}</span>
                  </div>
                  <p className="text-xs text-muted">{isClosed(stage.id) ? "Last 30 days" : stage.hint}</p>
                </div>
                <ul className="flex flex-col gap-2">
                  {visible.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} today={demo.today} onMove={(next) => handleMove(lead, next)} />
                  ))}
                </ul>
                {leads.length > visible.length && (
                  <p className="px-1.5 pt-2 text-xs text-muted">+{leads.length - visible.length} more</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
