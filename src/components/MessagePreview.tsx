import { GYM } from "../data/facts";

interface MessagePreviewProps {
  recipient: string;
  whatsapp: string;
  emailSubject: string;
  emailBody: string;
  sentLabel: string;
}

/** Shows one automated message the way the member receives it: WhatsApp first, email alongside. */
export function MessagePreview({ recipient, whatsapp, emailSubject, emailBody, sentLabel }: MessagePreviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <figure className="overflow-hidden rounded-2xl border border-line">
        <figcaption className="flex items-center justify-between bg-brand-blue px-4 py-2.5 text-sm text-white">
          <span className="font-semibold">WhatsApp</span>
          <span className="text-white/80">to {recipient}</span>
        </figcaption>
        <div className="min-h-44 bg-[#efe9df] p-4">
          <p className="max-w-[90%] rounded-2xl rounded-bl-md bg-card px-3.5 py-2.5 text-sm leading-snug text-ink shadow-sm">
            {whatsapp}
            <span className="mt-1 block text-right text-[11px] text-muted">{sentLabel}</span>
          </p>
        </div>
      </figure>

      <figure className="overflow-hidden rounded-2xl border border-line bg-card">
        <figcaption className="border-b border-line px-4 py-2.5 text-sm">
          <span className="font-semibold">Email</span>
          <span className="text-muted"> · from {GYM.name}</span>
        </figcaption>
        <div className="p-4 text-sm">
          <p className="text-muted">To: {recipient}</p>
          <p className="mt-1 font-semibold text-ink">{emailSubject}</p>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-2">{emailBody}</p>
        </div>
      </figure>
    </div>
  );
}
