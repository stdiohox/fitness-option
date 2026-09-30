interface SampleBadgeProps {
  label?: string;
  className?: string;
}

/** Marks anything invented for the demo. Required wherever sample data is shown. */
export function SampleBadge({ label = "Sample data", className = "" }: SampleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-dashed border-warn/60 bg-warn-soft px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-warn ${className}`}
      title="Invented for this demo — not real Fitness Options data"
    >
      <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3">
        <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 3.5v3M6 8.2v.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {label}
    </span>
  );
}

export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-good-soft px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-good ${className}`}
      title="Verified from Fitness Options' public listings"
    >
      <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3">
        <path d="M2.5 6.5l2.2 2.2L9.5 3.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verified
    </span>
  );
}
