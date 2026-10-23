# Ops Center — Runbook Control Room

A client-only runbook checklist: three hard-coded sample runbooks (release, content handoff, weekly review). Pick a
runbook, focus a step to read its instruction, check steps off and reset. Checks live in React state only and are
lost on reload.

Live: https://ops.bookchaowalit.com (Vercel builds every push to `main`, see `PRODUCT.md`).

## What it does not do

- No live monitoring, automation, alerts, incident access or service connection. The "08:42 BKK" clock and the
  owners/cadences are fixed sample copy.
- No account, storage or sync; nothing survives a reload.

## Run

```bash
npm ci
npm run dev
```

## Checks

```bash
npm test           # Vitest: runbook state logic, home page render, Sentry scrubbing
npm run lint
npm run typecheck
npm run build
```

CI (`.github/workflows/ci.yml`) runs the shared Node workflow (with a line-coverage gate) and the shared security
scan on every push and PR to `main`.

## Code map

- `lib/ops.ts`: the sample runbooks plus `findRunbook`, `checkStep`, `resetRunbook` and `statusLabel` (used by the
  page).
- `app/page.tsx`: the control-room page (client component).
- `lib/sentry.ts` + `instrumentation*.ts`: error reporting to Sentry, errors only, personal data stripped; off when
  `NEXT_PUBLIC_SENTRY_DSN` is unset.
