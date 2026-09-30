import { useState } from "react";
import { Link } from "react-router";
import { SampleBadge, VerifiedBadge } from "../../components/SampleBadge";
import { Wordmark } from "../../components/Wordmark";
import { GYM } from "../../data/facts";
import { PLANS, TIMETABLE, TRAINERS, type ClassSlot } from "../../data/sample";
import { formatNaira } from "../../lib/format";
import { TrialForm } from "./TrialForm";

const WHATSAPP_URL = `https://wa.me/${GYM.phoneE164}?text=${encodeURIComponent("Hi Fitness Options, I'd like to book a free trial")}`;
const INSTAGRAM_URL = `https://www.instagram.com/${GYM.instagram}/`;
const DAYS: ClassSlot["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function FigureMark({ className = "" }: { className?: string }) {
  // Drawn after the logo's figure: a red head over a sweeping blue body.
  return (
    <svg viewBox="-12 0 230 250" className={className} aria-hidden="true">
      <circle cx="118" cy="46" r="24" fill="var(--color-brand-red)" />
      <path
        d="M70 228C92 170 104 128 118 96m0 0c20-26 44-44 74-60M118 96C90 88 58 90 22 104"
        fill="none"
        stroke="var(--color-brand-blue)"
        strokeWidth="22"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <a href="#top" aria-label="Fitness Options — back to top">
          <Wordmark />
        </a>
        <nav aria-label="Website" className="hidden items-center gap-6 text-sm font-medium text-ink-2 md:flex">
          <a href="#classes" className="hover:text-ink">Classes</a>
          <a href="#prices" className="hover:text-ink">Prices</a>
          <a href="#gym" className="hover:text-ink">The gym</a>
          <a href="#visit" className="hover:text-ink">Visit</a>
        </nav>
        <a href="#trial" className="btn btn-red">
          Free trial
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-end gap-10 px-4 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.35fr_1fr] lg:pb-24 lg:pt-20">
        <div>
          <p className="eyebrow text-brand-red">Community gym · {GYM.area}</p>
          <h1 className="display mt-4 text-[clamp(3.5rem,11vw,9rem)] text-ink">
            Enjoy
            <br />
            your <span className="text-brand-red">body.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-2">
            Strength, cardio, aerobics, Tabata, kickboxing and a sauna — with coaches who show up ready to work.
            Weight management, coaching and wellness, every day of the week.
          </p>
          <div className="rise mt-8 flex flex-wrap gap-3 [animation-delay:240ms]">
            <a href="#trial" className="btn btn-red min-h-12 px-6 text-base">
              Book a free trial
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="btn btn-ghost min-h-12 px-6 text-base">
              WhatsApp us<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          <dl className="rise mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-line pt-6 [animation-delay:320ms]">
            <div>
              <dt className="eyebrow">Open</dt>
              <dd className="mt-1 font-semibold">Every day<br />6am – 10pm</dd>
            </div>
            <div>
              <dt className="eyebrow">Membership</dt>
              <dd className="mt-1 font-semibold">{formatNaira(GYM.monthlyFeeNgn)}<br />per month</dd>
            </div>
            <div>
              <dt className="eyebrow">Where</dt>
              <dd className="mt-1 font-semibold">Aguda,<br />Surulere</dd>
            </div>
          </dl>
        </div>

        <div className="relative hidden lg:block" aria-hidden="true">
          <div className="absolute -right-24 -top-10 size-[30rem] rounded-full bg-brand-blue-soft" />
          <FigureMark className="rise relative mx-auto h-[26rem] [animation-delay:200ms]" />
        </div>
      </div>

      <ClassMarquee />
    </section>
  );
}

function ClassMarquee() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="relative border-y border-ink bg-ink py-3 text-white">
      <div className="overflow-hidden" aria-hidden="true">
        <div
          className="flex w-max animate-[marquee_28s_linear_infinite] gap-10 whitespace-nowrap"
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-10">
              {GYM.classes.map((name) => (
                <span key={`${copy}-${name}`} className="display text-2xl">
                  {name} <span className="text-brand-red">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/40 hover:bg-white hover:text-ink focus-visible:outline-white"
      >
        {paused ? "Play" : "Pause"}<span className="sr-only"> scrolling class names</span>
      </button>
    </div>
  );
}

function Classes() {
  return (
    <section id="classes" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Classes</p>
          <h2 className="display mt-2 text-5xl">Morning & evening, all week</h2>
          <p className="mt-3 max-w-2xl text-ink-2">
            Aerobics is the house favourite. Tabata runs morning and evening. Step, dance, insanity and kickboxing
            round out the week — every class is included in membership.
          </p>
        </div>
        <SampleBadge label="Sample timetable — class names are real, times are examples" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {DAYS.map((day) => (
          <div key={day} className="card p-4">
            <p className="display text-xl text-brand-blue">{day}</p>
            <ul className="mt-3 flex flex-col gap-3">
              {TIMETABLE.filter((slot) => slot.day === day).map((slot) => (
                <li key={`${slot.day}-${slot.time}`}>
                  <p className="text-sm font-semibold">{slot.name}</p>
                  <p className="text-xs text-muted">
                    {slot.time} · {slot.coach}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Prices() {
  return (
    <section id="prices" className="scroll-mt-20 bg-card">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
        <p className="eyebrow">Membership</p>
        <h2 className="display mt-2 text-5xl">Fair prices. No wahala.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`flex flex-col rounded-2xl border p-6 ${plan.verified ? "border-brand-blue bg-brand-blue text-white" : "border-line bg-paper"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {plan.verified ? <VerifiedBadge /> : <SampleBadge label="Sample price" />}
              </div>
              <p className="mt-4 text-4xl font-semibold tracking-tight">{formatNaira(plan.priceNgn)}</p>
              <p className={`text-sm ${plan.verified ? "text-white/80" : "text-muted"}`}>
                {plan.months === 1 ? "per month" : `for ${plan.months} months`}
              </p>
              <ul className={`mt-5 flex flex-1 flex-col gap-2 text-sm ${plan.verified ? "text-white/90" : "text-ink-2"}`}>
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex gap-2">
                    <span aria-hidden="true" className={plan.verified ? "text-white" : "text-brand-red"}>✓</span>
                    {perk}
                  </li>
                ))}
              </ul>
              <a
                href="#trial"
                aria-label={`Try the ${plan.name} plan free first`}
                className={`btn mt-6 ${plan.verified ? "bg-white text-brand-blue hover:bg-paper" : "btn-ghost"}`}
              >
                Try it free first
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TheGym() {
  return (
    <section id="gym" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow">The gym</p>
          <h2 className="display mt-2 text-5xl">Everything you need. Nothing you don't.</h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {GYM.facilities.map((facility) => (
              <li key={facility} className="card flex items-center gap-3 p-4 font-medium">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-red-soft text-brand-red" aria-hidden="true">
                  ✦
                </span>
                {facility}
              </li>
            ))}
          </ul>
          <p className="mt-6 flex flex-wrap items-center gap-2 text-sm text-ink-2">
            <VerifiedBadge /> From member reviews of the Aguda gym.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <article className="rounded-2xl bg-brand-red p-8 text-white">
            <p className="eyebrow text-white">Community</p>
            <h3 className="display mt-2 text-3xl">No Gym Wear Day</h3>
            <p className="mt-3 text-white/90">
              Aerobics in your traditional outfit — Ankara, native wear, beads — with games, step and dance. Fitness is
              more fun together. ❤️💙
            </p>
          </article>
          <article className="card p-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="eyebrow">Coaches</h3>
              <SampleBadge label="Sample names" />
            </div>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {TRAINERS.map((trainer) => (
                <li key={trainer.name}>
                  <p className="font-semibold">{trainer.name}</p>
                  <p className="text-sm text-muted">{trainer.focus}</p>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}

function Trial() {
  return (
    <section id="trial" className="scroll-mt-20 bg-brand-blue">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="text-white">
          <p className="eyebrow text-white/80">Free trial</p>
          <h2 className="display mt-2 text-5xl">Your first session is on us.</h2>
          <p className="mt-4 max-w-md text-white/85">
            Pick a day, come in, meet the coaches and try a class. We'll confirm on WhatsApp straight away.
          </p>
          <SampleBadge label="Sample offer" className="mt-4" />
        </div>
        <div className="rounded-3xl bg-brand-blue-deep p-6 sm:p-8">
          <TrialForm />
        </div>
      </div>
    </section>
  );
}

function Visit() {
  return (
    <section id="visit" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-8">
      <p className="eyebrow">Visit</p>
      <h2 className="display mt-2 text-5xl">Come and see us</h2>
      <dl className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="card p-6">
          <dt className="eyebrow">Where</dt>
          <dd className="mt-2 font-semibold">{GYM.area}</dd>
          <dd className="mt-1 text-sm text-muted">Message us for the location pin.</dd>
        </div>
        <div className="card p-6">
          <dt className="eyebrow">Hours</dt>
          <dd className="mt-2 font-semibold">{GYM.hours}</dd>
        </div>
        <div className="card p-6">
          <dt className="eyebrow">Talk to us</dt>
          <dd className="mt-2 font-semibold">
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-brand-blue">
              WhatsApp {GYM.phoneDisplay}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </dd>
          <dd className="mt-1 text-sm">
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="text-muted underline underline-offset-4 hover:text-ink">
              Instagram @{GYM.instagram}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function Home() {
  return (
    <div className="min-h-dvh bg-paper">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Classes />
        <Prices />
        <TheGym />
        <Trial />
        <Visit />
      </main>
      <footer className="border-t border-line bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:px-8">
          <p>
            © {GYM.legalName} · {GYM.tagline} ❤️💙
          </p>
          <p>
            Demo website — items marked "Sample" are placeholders.{" "}
            <Link to="/app/dashboard" className="font-semibold text-brand-blue underline underline-offset-4">
              Open the owner console
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
