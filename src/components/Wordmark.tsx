export function Wordmark({ size = "md" }: { size?: "md" | "lg" }) {
  const text = size === "lg" ? "text-3xl" : "text-xl";
  return (
    <span className={`display inline-flex flex-col leading-none ${text}`}>
      <span className="text-brand-red">Fitness</span>
      <span className="text-brand-blue">Options</span>
    </span>
  );
}
