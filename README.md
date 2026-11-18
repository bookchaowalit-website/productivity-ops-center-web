# Ops Center — Runbook Control Room

A client-only runbook checklist: three hard-coded sample runbooks (release, content handoff, weekly review). Pick a
runbook, focus a step to read its instruction, check steps off and reset (with Undo). Checks live in React state only
and are lost on reload. The page uses the shared App shell look (light and dark, Geist via `next/font`); see
`APP-SHELL.md` and `DESIGN.md`.

Live: https://ops.bookchaowalit.com (Vercel builds every push to `main`, see `PRODUCT.md`).

## What it does not do

- No live monitoring, automation, alerts, incident access or service connection. The owners and cadences are fixed
  sample copy.
- No account, storage or sync; nothing survives a reload.

## Run

```bash
npm ci
npm run dev
```

## Checks

```bash
npm test           # Vitest: runbook state logic, render + mounted happy-dom interaction tests, site metadata, Sentry
npm run lint
npm run typecheck
npm run build
```

CI (`.github/workflows/ci.yml`) runs the shared Node workflow (with a line-coverage gate) and the shared security
scan on every push and PR to `main`.

## Code map

- `lib/ops.ts`: the sample runbooks plus `findRunbook`, `checkStep`, `resetRunbook` and `statusLabel` (used by the
  page).
- `app/page.tsx`: the runbook page (client component): runbook list, focus card, steps, status card, Undo toast.
- `components/runbook.tsx`: the step list (with its empty state). `components/app-shell.tsx` + `app/app-shell.css`:
  the shared App shell pieces and tokens.
- `lib/site.ts`, `app/robots.ts`, `app/sitemap.ts`: canonical origin `https://ops.bookchaowalit.com`.
- `lib/sentry.ts` + `instrumentation*.ts`: error reporting to Sentry, errors only, personal data stripped; off when
  `NEXT_PUBLIC_SENTRY_DSN` is unset.
