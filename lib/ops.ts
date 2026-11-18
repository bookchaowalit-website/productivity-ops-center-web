// Runbook data and pure state helpers shared by the page. Three synthetic runbooks; nothing pings a service.

export type Step = { label: string; instruction: string; duration: string };
export type Runbook = { id: string; code: string; name: string; owner: string; cadence: string; tone: string; steps: Step[] };

export const runbooks: Runbook[] = [
  { id: "release", code: "RB-07", name: "Release checklist", owner: "Book Dev", cadence: "Friday / before publish", tone: "ship with a reversible door", steps: [
    { label: "Read the diff", instruction: "Scan the changed files and name the one behavior that could surprise a visitor.", duration: "08 min" },
    { label: "Run the narrow check", instruction: "Run the smallest relevant test, then keep the output attached to this release note.", duration: "06 min" },
    { label: "Open the preview", instruction: "Check the production-shaped preview at desktop and phone widths before promoting it.", duration: "12 min" },
    { label: "Write the rollback", instruction: "Leave one sentence that says exactly how to return to the last known-good commit.", duration: "04 min" },
  ] },
  { id: "content", code: "RB-12", name: "Content handoff", owner: "Book Content", cadence: "Tuesday / 10:30", tone: "make the source easy to trust", steps: [
    { label: "Check the source", instruction: "Confirm the draft has one source link, one owner, and one clear audience.", duration: "05 min" },
    { label: "Cut the throat-clearing", instruction: "Remove the first sentence if the second sentence says the useful thing more directly.", duration: "07 min" },
    { label: "Package the handoff", instruction: "Add the title, format, destination, and a single next action to the delivery note.", duration: "08 min" },
  ] },
  { id: "review", code: "RB-19", name: "Weekly review", owner: "Solo Empire", cadence: "Monday / first hour", tone: "notice the system before it shouts", steps: [
    { label: "Read the ledger", instruction: "Review the last seven days of commitments before adding anything new.", duration: "10 min" },
    { label: "Name the drag", instruction: "Choose one repeated friction point that deserves a smaller or clearer rule.", duration: "06 min" },
    { label: "Choose the bet", instruction: "Write one outcome for this week and the evidence that would make it feel real.", duration: "05 min" },
  ] },
];

export type Completed = Record<string, number[]>;

export function findRunbook(id: string): Runbook {
  return runbooks.find((item) => item.id === id) ?? runbooks[0];
}

// Check the focused step, keep the list sorted and unique, and move focus to the next open step after it,
// wrapping round to the first open step before it (checked steps are skipped). Focus stays put only when
// every step is checked.
export function checkStep(completed: Completed, runbook: Runbook, stepIndex: number): { completed: Completed; stepIndex: number } {
  const finished = completed[runbook.id] ?? [];
  const next = Array.from(new Set([...finished, stepIndex])).sort((x, y) => x - y);
  const isOpen = (index: number) => !next.includes(index);
  const after = runbook.steps.findIndex((_, index) => index > stepIndex && isOpen(index));
  const open = after === -1 ? runbook.steps.findIndex((_, index) => isOpen(index)) : after;
  return { completed: { ...completed, [runbook.id]: next }, stepIndex: open === -1 ? stepIndex : open };
}

export function resetRunbook(completed: Completed, runbook: Runbook): Completed {
  return { ...completed, [runbook.id]: [] };
}

export function statusLabel(checked: number, total: number): string {
  return checked >= total ? "Clear to close" : "In progress";
}
