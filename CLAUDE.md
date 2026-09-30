# Fitness Options — Sales Demo

A clickable sales demo for **Fitness Options Limited** (gym, Aguda, Surulere, Lagos):
public website + owner CRM + WhatsApp-first automations + AI enquiry agent.
It is a demo to show the client, not a production system.

## Rules for this repo

1. **npm only.** `package-lock.json` is the lockfile. `~/.bun/bin` is first on PATH, so never
   run `bun` or `bunx` here. If a `bun.lock`, `pnpm-lock.yaml` or `yarn.lock` appears, delete it
   and report it; never commit it.
2. **No backend database.** All CRM data is seeded in the browser (deterministic, per viewer,
   persisted to `localStorage`, "Reset demo" restores it). Do not add Supabase or any DB
   unless explicitly asked.
3. **Verified facts vs sample data.** Only the facts in the table below are real. Everything
   else (timetable, plan tiers, trainers, members, leads, revenue) is invented and **must be
   labelled "Sample data" in the UI** via the `SampleBadge` component. Never present invented
   data as fact. All verified facts live in `src/data/facts.ts` — change them there only.
4. **Never commit secrets.** `ANTHROPIC_API_KEY` goes in `.env.local` (gitignored) and in the
   Vercel project env. Without it the enquiry agent runs a scripted fallback.
5. **No real personal data.** Sample people use invented names, `@example.com` emails and
   masked phone numbers. The only real phone number in the repo is the gym's own.
6. Remote: `git@github.com:stdiohox/fitness-option.git` (note: singular). Branch `main`.

## Stack

React 19 · Vite · TypeScript · Tailwind CSS 4 · React Router · hand-built SVG charts.
AI agent: Vercel serverless function `api/agent.ts` → Claude via `@anthropic-ai/sdk`.
In `npm run dev` the same handler is served by a Vite middleware (see `vite.config.ts`).
Deploy: Vercel.

Scripts: `dev`, `build` (typecheck + build), `preview`, `lint`.

## Brand

| | |
|---|---|
| Red | `#C82028` (sampled from the logo) |
| Royal blue | `#003898` (sampled from the logo) |
| Tagline | "enjoy your body" |
| Voice | Warm, upbeat, community ("Fitness Options family"), signs off ❤️💙 |

## Verified facts (research, 30 Sep 2026)

| Fact | Value | Source |
|---|---|---|
| Legal name | Fitness Options Limited | Instagram @fitnessoptionsng |
| Bio | Transforming lives daily · Weight Management • Coaching • Wellness | Instagram |
| Branch | Aguda, Surulere, Lagos | Instagram location tags |
| Phone / WhatsApp | +234 706 965 1085 | Instagram wa.link |
| Hours | Mon–Sun 6am–10pm | africabz listing |
| Monthly fee | ₦18,000 (another source says "from ~₦15,000") | africabz / gymsquare |
| Facilities | Strength room, cardio room, treadmill & cycling room (4 treadmills, ~8 bikes), sauna | africabz reviews |
| Classes | Aerobics, Tabata (morning & evening), step, dance, insanity, kickboxing | Instagram, gymsquare |
| Events | "No Gym Wear Day" cultural aerobics day (12 June) | Instagram |

**Unresolved:** street address (two directory addresses conflict — do not show one);
exact price; old site `fitness-options.com` is dead; Aguda has no Google Maps listing;
Victoria Island branch is marked permanently closed on Google.
