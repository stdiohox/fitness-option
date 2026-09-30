import { useState } from "react";

interface ColumnStripProps {
  items: { key: number; label: string; shortLabel: string; value: number }[];
  valueLabel: string;
}

/** Compact column chart: hover shows a readout, and every value is also in the table view. */
export function ColumnStrip({ items, valueLabel }: ColumnStripProps) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...items.map((item) => item.value));
  const shown = items.find((item) => item.key === active) ?? items[items.length - 1];

  return (
    <figure>
      <p className="mb-3 min-h-5 text-sm text-ink-2">
        {shown && (
          <>
            <span className="font-semibold text-ink">{shown.value}</span> {valueLabel} · {shown.label}
          </>
        )}
      </p>
      <div className="flex h-28 items-end gap-[2px]" onPointerLeave={() => setActive(null)} aria-hidden="true">
        {items.map((item) => (
          <div key={item.key} className="flex h-full flex-1 items-end" onPointerEnter={() => setActive(item.key)}>
            <span
              className={`w-full rounded-t-[4px] bg-chart-1 transition-opacity ${
                active === null || active === item.key ? "opacity-100" : "opacity-40"
              }`}
              style={{ height: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted" aria-hidden="true">
        <span>{items[0]?.shortLabel}</span>
        <span>{items[items.length - 1]?.shortLabel}</span>
      </div>
      <details className="mt-2 text-sm text-ink-2">
        <summary className="cursor-pointer text-muted hover:text-ink">View as table</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="text-muted">
              <th scope="col" className="py-1 font-medium">Day</th>
              <th scope="col" className="py-1 text-right font-medium">Visits</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.key} className="border-t border-line">
                <th scope="row" className="py-1 font-medium">{item.label}</th>
                <td className="py-1 text-right tabular-nums">{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
