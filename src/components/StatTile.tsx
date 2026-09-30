import type { ReactNode } from "react";

interface StatTileProps {
  label: string;
  value: string;
  detail?: ReactNode;
  tone?: "default" | "risk";
  hero?: boolean;
}

export function StatTile({ label, value, detail, tone = "default", hero = false }: StatTileProps) {
  return (
    <div
      className={`card flex flex-col gap-2 p-5 ${tone === "risk" ? "border-brand-red/30 bg-brand-red-soft" : ""}`}
    >
      <p className="text-sm font-medium text-ink-2">{label}</p>
      {/* key={value} replays the flash when fast-forward changes the number. */}
      <p
        key={value}
        className={`rounded-md font-semibold tracking-tight [animation:flash_1.2s_ease-out] ${
          hero ? "text-5xl" : "text-3xl"
        } ${tone === "risk" ? "text-brand-red" : "text-ink"}`}
      >
        {value}
      </p>
      {detail && <div className="text-sm text-muted">{detail}</div>}
    </div>
  );
}
