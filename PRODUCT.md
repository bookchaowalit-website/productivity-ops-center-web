# Ops Center — Product truth

> Inferred from the code and copy (no user interview). Checked against the portfolio card claims review
> (`portfolio-site-web/docs/audits/CARD-CLAIMS-REVIEW-2026-10.md`, row `ops-center`, evidence Prototype) on
> 2026-10-23.

## What it is

A client-only demo of a runbook "control room" over three hard-coded sample runbooks with 3-4 steps each.

## Who it is for

A portfolio visitor who wants to see a calm procedure UI: one runbook, one focused step, one next action.

## What works today

1. Choose one of three runbooks; the rail shows how many steps of each are checked.
2. Focus any step to read its instruction; "Check and move on" checks it and focuses the next step.
3. The status panel shows "IN PROGRESS" until every step is checked, then "CLEAR TO CLOSE". Reset clears one runbook.
4. Front-end and server errors go to Sentry (errors only, personal data stripped) when `NEXT_PUBLIC_SENTRY_DSN` is set.

## What does not work (and must not be claimed)

- No 45+ domain operation, workflow automation, monitoring or live connection (claims removed from the portfolio
  card in the 2026-10 review). The clock, owners and cadences are fixed sample copy.
- No storage, account or sync; checks are lost on reload. No API route. No product analytics.

## Live URL and deploy state

- Live: https://ops.bookchaowalit.com (HTTP 200 on 2026-10-23).
- The Vercel project `bookchaowalit-ops-center-frontend` is linked to this repository
  (`bookchaowalit-website/productivity-ops-center-web`, branch `main`), so every push to `main` deploys to production.
  The Next 16.4.2 security patch (f34b749) deployed by Git on 2026-10-23.
- `NEXT_PUBLIC_SENTRY_DSN` is set on the Vercel project (Sentry project `productivity-ops-center-web`, org
  `personal-yu0`).

## Boundaries

- Browser-only. Synthetic workflows, owners and timestamps only; not an infrastructure console.
