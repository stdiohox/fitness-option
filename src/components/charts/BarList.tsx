interface BarListProps {
  items: { label: string; value: number }[];
  formatValue?: (value: number) => string;
}

/** Horizontal bars, one series, value at the tip. Every value is visible, so no tooltip or table is needed. */
export function BarList({ items, formatValue = String }: BarListProps) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3 text-sm">
          <span className="break-words text-ink-2">{item.label}</span>
          <span className="h-3 rounded-r-[4px] bg-chart-1" style={{ width: `${(item.value / max) * 100}%` }} aria-hidden="true" />
          <span className="text-right font-semibold tabular-nums text-ink">{formatValue(item.value)}</span>
        </li>
      ))}
    </ul>
  );
}
