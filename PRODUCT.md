# Ops Center — Product truth

> Inferred from the code and copy (no user interview). Checked against the portfolio card claims review
> (`portfolio-site-web/docs/audits/CARD-CLAIMS-REVIEW-2026-10.md`, row `ops-center`, evidence Prototype) on
> 2026-10-23.

## What it is

A client-only demo of a runbook "control room" over three hard-coded sample runbooks with 3-4 steps each.

## Who it is for

A portfolio visitor who wants to see a calm procedure UI: one runbook, one focused step, one next action.

## What works today

1. Choose one of three runbooks; the sidebar (a row of pills on phones) shows how many steps of each are checked.
2. Focus any step to read its instruction; "Check and move on" checks it and focuses the next step.
3. The status card shows "In progress" until every step is checked, then "Clear to close". "Reset runbook" clears one
   runbook and offers Undo for 8 seconds.
4. A "Sample data" notice sits under the title at every width, so phone visitors also see that nothing is live.
5. Front-end and server errors go to Sentry (errors only, personal data stripped) when `NEXT_PUBLIC_SENTRY_DSN` is set.

## What does not work (and must not be claimed)

- No 45+ domain operation, workflow automation, monitoring or live connection (claims removed from the portfolio
  card in the 2026-10 review). The owners and cadences are fixed sample copy (the fake clock was removed on 2026-11-18).
- No account or sync: checks are saved in this browser's localStorage only (since 2026-11-19; before that they were lost on reload). No API route. No product analytics.

## Live URL and deploy state

- Live: https://ops.bookchaowalit.com (HTTP 200 on 2026-10-23).
- The Vercel project `bookchaowalit-ops-center-frontend` is linked to this repository (`bookchaowalit-website/productivity-ops-center-web`, branch `main`), so every
  push to `main` deploys to production. Last production deploy: the Next 16.4.2 security patch (f34b749), by Git on
  2026-10-23.
- The L2 commits (lib/tests/Sentry/CI/docs) pushed on 2026-10-23 did not deploy: Vercel answered "Deployment rate
  limited — retry in 24 hours" (free-plan limit of 100 deployments per day). The live site shows the patch build
  until the next deploy of `main` after the quota resets.
- `NEXT_PUBLIC_SENTRY_DSN` is set on the Vercel project (Sentry project `productivity-ops-center-web`, org `personal-yu0`); it takes effect
  with that next deploy.

## Known limits

- Two tabs ticking steps at the same moment can overwrite each other: each tab reads the saved checks, then writes the whole set, so the later write wins (localStorage has no cross-tab transaction).
- When another tab ticks the step this tab is showing, this tab updates its counts but stays on that step (primary button reads "Step checked"); pick the next step or switch runbooks to move on.

## Boundaries

- Browser-only. Synthetic workflows, owners and timestamps only; not an infrastructure console.
