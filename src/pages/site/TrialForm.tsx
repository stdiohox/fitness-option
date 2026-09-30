import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { MessagePreview } from "../../components/MessagePreview";
import { INTERESTS } from "../../data/sample";
import { formatDay } from "../../lib/dates";
import { firstName } from "../../lib/format";
import { useDemoStore } from "../../state/store";

const BOOKABLE_DAYS = 7;
const TIMES = ["Morning (6–10am)", "Afternoon (12–4pm)", "Evening (5–10pm)"] as const;

interface FormState {
  name: string;
  phone: string;
  email: string;
  interest: string;
  dayOffset: string;
  time: string;
  optIn: boolean;
}

type Errors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = { name: "", phone: "", email: "", interest: "", dayOffset: "1", time: TIMES[0], optIn: false };

/** Nigerian mobile: 080…, 070…, 090…, 081…, 091… (11 digits) or +234 followed by 10 digits. */
function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  const national = digits.replace(/^\+?234/, "").replace(/^0/, "");
  const local = `0${national}`;
  return /^0(70|80|81|90|91)\d{8}$/.test(local) ? local : null;
}

/** Shows only the last three digits; the demo never stores or displays a whole number. */
function maskPhone(local: string): string {
  return `+234 ••• ••• •${local.slice(-3)}`;
}

function validate(form: FormState): Errors {
  const errors: Errors = {};
  if (form.name.trim().length < 2) errors.name = "Please enter your name.";
  if (!normalisePhone(form.phone)) errors.phone = "Enter a Nigerian mobile number, e.g. 0803 123 4567.";
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "That email doesn't look right — or leave it blank.";
  }
  if (!form.optIn) errors.optIn = "We need your OK to confirm your trial on WhatsApp.";
  return errors;
}

interface Confirmation {
  name: string;
  phone: string;
  email: string | null;
  dayLabel: string;
  time: string;
}

export function TrialForm() {
  const { demo, bookTrial } = useDemoStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const idPrefix = useId();
  const headingRef = useRef<HTMLParagraphElement>(null);
  const [announcement, setAnnouncement] = useState("");

  // Swapping form ↔ confirmation unmounts the focused control; put focus somewhere sensible.
  useEffect(() => {
    if (confirmation) headingRef.current?.focus();
  }, [confirmation]);
  const id = (field: keyof FormState) => `${idPrefix}-${field}`;

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [field]: value }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    const firstInvalid = (Object.keys(found) as (keyof FormState)[])[0];
    if (firstInvalid) {
      document.getElementById(id(firstInvalid))?.focus();
      return;
    }
    const local = normalisePhone(form.phone);
    if (!local) return;
    const daysFromToday = Number(form.dayOffset);
    const name = Array.from(form.name.trim().replace(/\s+/g, " ")).slice(0, 60).join("");
    bookTrial({
      name,
      source: "Website",
      daysFromToday,
      time: form.time.split(" ")[0]?.toLowerCase() ?? "",
      interest: form.interest || "General fitness",
      phone: maskPhone(local),
    });
    setConfirmation({
      name,
      phone: maskPhone(local),
      email: form.email.trim() || null,
      dayLabel: formatDay(demo.today + daysFromToday, { weekday: "long" }),
      time: form.time,
    });
    setAnnouncement(`Booked: free trial for ${firstName(name)}. A WhatsApp confirmation is on its way.`);
    setForm(EMPTY);
  };

  const bookAnother = () => {
    setConfirmation(null);
    setAnnouncement("");
    // The form remounts on the next render; focus its first field.
    requestAnimationFrame(() => document.getElementById(id("name"))?.focus());
  };

  const status = (
    <p className="sr-only" role="status">
      {announcement}
    </p>
  );

  if (confirmation) {
    const first = firstName(confirmation.name);
    // Both branches render `status` first inside a fragment, so the live region stays mounted.
    return (
      <>
      {status}
      <div className="rise flex flex-col gap-5">
        <div>
          <p ref={headingRef} tabIndex={-1} className="display text-3xl text-white outline-none">
            You're booked, {first}! <span aria-hidden="true">🎉</span>
          </p>
          <p className="mt-2 text-white/85">
            Free trial on {confirmation.dayLabel}, {confirmation.time.toLowerCase()}. Here's the confirmation that goes
            out instantly (in this demo nothing is actually sent):
          </p>
        </div>
        <div className="rounded-2xl bg-paper p-3 text-ink">
          <MessagePreview
            recipient={`${confirmation.name} · ${confirmation.phone}`}
            emailTo={confirmation.email && `${confirmation.name} <${confirmation.email}>`}
            whatsapp={`Hi ${first}! 🎉 Your free trial at Fitness Options is booked for ${confirmation.dayLabel}, ${confirmation.time.toLowerCase()}. Bring water and trainers. We're in Aguda, Surulere — reply here and we'll send you our location pin. Enjoy your body ❤️💙`}
            emailSubject={`Your free trial is booked, ${first}`}
            emailBody={`Hi ${first},\n\nYour free trial at Fitness Options is booked for ${confirmation.dayLabel}, ${confirmation.time.toLowerCase()}.\n\nWe're open Mon–Sun, 6am–10pm. Any questions, WhatsApp us on +234 706 965 1085.\n\nSee you soon ❤️💙\nThe Fitness Options team`}
            sentLabel="Just now"
          />
        </div>
        <button type="button" onClick={bookAnother} className="btn self-start bg-white text-brand-blue hover:bg-paper">
          Book another trial
        </button>
      </div>
      </>
    );
  }

  const fieldClass = (field: keyof FormState) =>
    `mt-1.5 block min-h-12 w-full rounded-xl border bg-white px-4 text-ink ${
      errors[field] ? "border-brand-red ring-2 ring-brand-red/30" : "border-white/0"
    }`;

  return (
    <>
    {status}
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor={id("name")} className="text-sm font-semibold text-white">
          Your name
        </label>
        <input
          id={id("name")}
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          autoComplete="name"
          maxLength={60}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${id("name")}-error` : undefined}
          className={fieldClass("name")}
        />
        {errors.name && <p id={`${id("name")}-error`} className="mt-1 text-sm font-semibold text-white"><span aria-hidden="true">⚠ </span>{errors.name}</p>}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={id("phone")} className="text-sm font-semibold text-white">
          WhatsApp number
        </label>
        <input
          id={id("phone")}
          value={form.phone}
          onChange={(event) => update("phone", event.target.value)}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0803 123 4567"
          maxLength={20}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? `${id("phone")}-error` : undefined}
          className={fieldClass("phone")}
        />
        {errors.phone && <p id={`${id("phone")}-error`} className="mt-1 text-sm font-semibold text-white"><span aria-hidden="true">⚠ </span>{errors.phone}</p>}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={id("email")} className="text-sm font-semibold text-white">
          Email <span className="font-normal text-white/80">(optional)</span>
        </label>
        <input
          id={id("email")}
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          type="email"
          autoComplete="email"
          maxLength={100}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${id("email")}-error` : undefined}
          className={fieldClass("email")}
        />
        {errors.email && <p id={`${id("email")}-error`} className="mt-1 text-sm font-semibold text-white"><span aria-hidden="true">⚠ </span>{errors.email}</p>}
      </div>

      <div>
        <label htmlFor={id("dayOffset")} className="text-sm font-semibold text-white">
          Day
        </label>
        <select id={id("dayOffset")} value={form.dayOffset} onChange={(event) => update("dayOffset", event.target.value)} className={fieldClass("dayOffset")}>
          {Array.from({ length: BOOKABLE_DAYS }, (_, offset) => (
            <option key={offset} value={offset}>
              {offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : formatDay(demo.today + offset, { weekday: "long" })}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={id("time")} className="text-sm font-semibold text-white">
          Time
        </label>
        <select id={id("time")} value={form.time} onChange={(event) => update("time", event.target.value)} className={fieldClass("time")}>
          {TIMES.map((time) => (
            <option key={time}>{time}</option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={id("interest")} className="text-sm font-semibold text-white">
          What's your goal? <span className="font-normal text-white/80">(optional)</span>
        </label>
        <select id={id("interest")} value={form.interest} onChange={(event) => update("interest", event.target.value)} className={fieldClass("interest")}>
          <option value="">Choose one</option>
          {INTERESTS.map((interest) => (
            <option key={interest}>{interest}</option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="flex items-start gap-3 text-sm text-white">
          <input
            id={id("optIn")}
            type="checkbox"
            checked={form.optIn}
            onChange={(event) => update("optIn", event.target.checked)}
            aria-invalid={Boolean(errors.optIn)}
            aria-describedby={errors.optIn ? `${id("optIn")}-error` : undefined}
            className="mt-0.5 size-5 shrink-0 accent-brand-red"
          />
          <span>Fitness Options can message me on WhatsApp about my trial.</span>
        </label>
        {errors.optIn && <p id={`${id("optIn")}-error`} className="mt-1 text-sm font-semibold text-white"><span aria-hidden="true">⚠ </span>{errors.optIn}</p>}
      </div>

      <button type="submit" className="btn btn-red min-h-12 text-base sm:col-span-2">
        Book my free trial
      </button>
    </form>
    </>
  );
}
