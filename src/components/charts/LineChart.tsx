import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export interface LinePoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LinePoint[];
  formatValue: (value: number) => string;
  formatTick: (value: number) => string;
  ariaLabel: string;
}

const DEFAULT_WIDTH = 640;
const HEIGHT = 240;

/** Draw at the container's real width so axis text never scales down to an unreadable size. */
function useContainerWidth() {
  const ref = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(280, Math.round(entry.contentRect.width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}
const PAD = { top: 16, right: 20, bottom: 30, left: 52 };
const TICK_COUNT = 4;

function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude >= value) ?? 10;
  return step * magnitude;
}

export function LineChart({ data, formatValue, formatTick, ariaLabel }: LineChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const tableId = useId();
  const { ref, width: WIDTH } = useContainerWidth();
  // On narrow screens, label every other month so the axis stays legible.
  const labelEvery = WIDTH < 480 ? 2 : 1;
  if (data.length === 0) return <p className="text-sm text-muted">No data yet.</p>;
  const maxValue = niceCeiling(Math.max(...data.map((point) => point.value)) * 1.08);
  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) => PAD.left + (data.length > 1 ? (index / (data.length - 1)) * plotWidth : 0);
  const y = (value: number) => PAD.top + plotHeight - (value / maxValue) * plotHeight;
  const path = data.map((point, index) => `${index ? "L" : "M"}${x(index)},${y(point.value)}`).join("");
  const area = `${path}L${x(data.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, index) => (maxValue / TICK_COUNT) * index);
  const last = data.length - 1;
  const activePoint = active === null ? null : data[active];

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const index = Math.round(((svgX - PAD.left) / plotWidth) * last);
    setActive(Math.max(0, Math.min(last, index)));
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setActive((current) => {
      const start = current ?? last;
      return Math.max(0, Math.min(last, start + (event.key === "ArrowRight" ? 1 : -1)));
    });
  };

  return (
    <figure className="relative" ref={ref}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width={WIDTH}
        height={HEIGHT}
        className="block max-w-full touch-pan-y select-none"
        role="img"
        aria-label={`${ariaLabel} Use left and right arrow keys to read each month.`}
        tabIndex={0}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        {ticks.map((tick, index) => (
          <g key={index}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--color-line)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
              {formatTick(tick)}
            </text>
          </g>
        ))}
        {data.map((point, index) =>
          (last - index) % labelEvery === 0 ? (
            <text key={point.label} x={x(index)} y={HEIGHT - 8} textAnchor="middle" className="fill-muted text-[11px]">
              {point.label}
            </text>
          ) : null,
        )}
        <path d={area} fill="var(--color-chart-1-wash)" />
        <path d={path} fill="none" stroke="var(--color-chart-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {activePoint && active !== null && (
          <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={y(0)} stroke="var(--color-line-strong)" strokeWidth={1} />
        )}
        {[active ?? last].map((index) => {
          const point = data[index];
          if (!point) return null;
          return (
            <circle key={index} cx={x(index)} cy={y(point.value)} r={5} fill="var(--color-chart-1)" stroke="var(--color-card)" strokeWidth={2} />
          );
        })}
        {active === null && data[last] && (
          <text x={x(last) - 8} y={y(data[last].value) - 12} textAnchor="end" className="fill-ink text-[12px] font-semibold">
            {formatValue(data[last].value)}
          </text>
        )}
      </svg>

      {activePoint && active !== null && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg border border-line bg-card px-3 py-2 text-sm shadow-lg"
          style={{
            left: `${(x(active) / WIDTH) * 100}%`,
            transform: `translateX(${active > last / 2 ? "-105%" : "5%"})`,
          }}
          aria-hidden="true"
        >
          <p className="text-muted">{activePoint.label}</p>
          <p className="font-semibold text-ink">{formatValue(activePoint.value)}</p>
        </div>
      )}
      {/* Always rendered so keyboard readouts are announced. */}
      <p className="sr-only" role="status">
        {activePoint ? `${activePoint.label}: ${formatValue(activePoint.value)}` : ""}
      </p>

      <details className="mt-2 text-sm text-ink-2">
        <summary className="cursor-pointer text-muted hover:text-ink">View as table</summary>
        <table id={tableId} className="mt-2 w-full text-left">
          <thead>
            <tr className="text-muted">
              <th scope="col" className="py-1 font-medium">Month</th>
              <th scope="col" className="py-1 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.label} className="border-t border-line">
                <th scope="row" className="py-1 font-medium">{point.label}</th>
                <td className="py-1 text-right tabular-nums">{formatValue(point.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
