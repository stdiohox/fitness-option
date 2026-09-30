# Build plan

Scope agreed 30 Sep 2026: owner dashboard, pipeline, WhatsApp/AI agent, win-back automation,
website + trial booking, check-in. WhatsApp-first (every automation shows email + WhatsApp
preview). Fast-forward time control. Local seeded data, no database.

- [ ] 0. Scaffold (Vite + React + TS + Tailwind), CLAUDE.md, push `main`
- [ ] 1. Owner dashboard + seeded store + simulated clock (fast-forward)
- [ ] 2. Lead → trial → member pipeline (drag + keyboard move)
- [ ] 3. WhatsApp enquiry agent (Claude via `api/agent.ts`, scripted fallback)
- [ ] 4. Missed-visit win-back automation (email + WhatsApp previews, recovered ₦)
- [ ] 5. Public website + free-trial booking (feeds pipeline)
- [ ] 6. Front-desk check-in (feeds attendance, churn risk, dashboard)
- [ ] 7. Deploy Vercel preview

After each feature: `npm run build`, walk it in the browser, review agents
(typescript-reviewer, react-reviewer, a11y-architect, performance-optimizer; security-reviewer
on the agent + booking), fix High findings, commit + push.

## Out of scope (not built)

Member profiles, trial reminder / welcome / renewal emails, payments, real WhatsApp sending.
