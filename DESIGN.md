# Ops Center — Design Direction

Since 2026-11-18 Ops Center uses the shared App shell (`APP-SHELL.md`, `app/app-shell.css`): the calm,
Apple-like look shared with the other list-style apps, in light and dark (prefers-color-scheme), with Geist loaded
through `next/font` and Thai system fallbacks. It replaced the dark-only "operations wall" with macOS-only fonts.

Layout: top bar, then the runbooks as a sidebar (a scrollable pill row on phones), then the main pane in the
order a phone visitor needs it: title with the "Sample data" notice, the focus card (current step, its instruction,
the one filled button "Check and move on", plain "Reset runbook"), the numbered step rows, and the status card
(progress, owner, cadence, data boundary). Footer links back to bookchaowalit.com.

Floor: text at least 12px, every control at least 44px, 3px focus ring, 4.5:1 text contrast in both themes,
state shown in words (pills "Checked" / "To do", "In progress" / "Clear to close"), never by colour alone. Reset is
undoable for 8 seconds instead of a confirm dialog. The step list has an empty state.
