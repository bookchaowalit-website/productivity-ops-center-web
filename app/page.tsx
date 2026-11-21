"use client";

import { type MouseEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { AppFoot, AppTop, ListButton, Pill } from "@/components/app-shell";
import { StepList } from "@/components/runbook";
import { type Completed, checkStep, checksStore, findRunbook, resetRunbook as clearRunbook, restoredStep, runbooks, statusLabel } from "@/lib/ops";

const SOURCE = "https://github.com/bookchaowalit-website/productivity-ops-center-web";

// Every reset that has not expired stays restorable: Undo restores them all. fromKeyboard: only a
// keyboard-initiated reset moves focus to Undo; a pointer reset leaves focus alone so the countdown starts.
type ResetEntry = { runbookId: string; steps: number[]; stepIndex: number };
type UndoState = { resets: ResetEntry[]; fromKeyboard: boolean };

function undoLabel(resets: ResetEntry[]): string {
  const ids = new Set(resets.map((entry) => entry.runbookId));
  return ids.size > 1 ? `Reset ${ids.size} runbooks` : `${findRunbook(resets[0].runbookId).name} reset`;
}

export default function Home() {
  const [runbookId, setRunbookId] = useState("release");
  const [stepIndex, setStepIndex] = useState(0);
  // Saved in this browser (server render and hydration start empty, then the saved checks appear).
  const completed = useSyncExternalStore(checksStore.subscribe, checksStore.getSnapshot, checksStore.getServerSnapshot);
  // Every write starts from the latest saved checks (another tab may have saved since this render), never
  // from the render's `completed`, so a check, Reset or Undo here cannot overwrite progress saved elsewhere.
  function saveFromLatest<R>(change: (latest: Completed) => { completed: Completed; result: R }): R {
    let result!: R;
    const saved = checksStore.update((latest) => {
      const next = change(latest);
      result = next.result;
      return next.completed;
    });
    // A refused write (storage blocked or full) keeps the change for this visit only: say so where the person
    // is working, instead of the usual "saved in this browser". The notice belongs to that unsaved snapshot:
    // a later save here, or another tab's save that this tab then shows, makes it go away.
    setUnsaved(saved ? null : checksStore.getSnapshot());
    return result;
  }
  const [unsaved, setUnsaved] = useState<Completed | null>(null);
  // Saved checks arrive after hydration (or from another tab after a clear): land on the first open step
  // then, as switching runbooks does, so the primary button is not stuck on "Step checked".
  const [landedOn, setLandedOn] = useState<Completed>(checksStore.getServerSnapshot);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [toastFocused, setToastFocused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const undoRef = useRef<HTMLButtonElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);
  // Reset is disabled until the restored checks render, so focus it after that render, not inline.
  const focusResetNext = useRef(false);
  const focusTitleRef = useRef<HTMLHeadingElement>(null);

  const runbook = findRunbook(runbookId);
  if (landedOn !== completed) {
    setLandedOn(completed);
    if (landedOn === checksStore.getServerSnapshot()) {
      const open = restoredStep(completed[runbook.id] ?? [], runbook, stepIndex);
      if (open !== stepIndex) setStepIndex(open);
    }
  }
  const finished = completed[runbook.id] ?? [];
  const total = runbook.steps.length;
  const step = runbook.steps[stepIndex] ?? runbook.steps[0];
  const isDone = finished.includes(stepIndex);
  // The focused step is the only one still open, so checking it closes the runbook.
  const isLast = !isDone && finished.length === total - 1;
  const clear = total > 0 && finished.length >= total;
  const percent = total ? Math.round((finished.length / total) * 100) : 0;

  useEffect(() => { if (undo?.fromKeyboard) undoRef.current?.focus(); }, [undo]);
  useEffect(() => {
    if (!focusResetNext.current) return;
    focusResetNext.current = false;
    resetRef.current?.focus();
  }, [completed]);
  // The toast closes after 8 s (restarting on each reset, since each one makes a new undo object), but never
  // while it holds focus (that would drop a keyboard user).
  useEffect(() => {
    if (!undo || toastFocused) return;
    const timer = window.setTimeout(() => setUndo(null), 8000);
    return () => window.clearTimeout(timer);
  }, [undo, toastFocused]);

  // Land on the first open step (saved checks can already cover step 1).
  function chooseRunbook(id: string) { setRunbookId(id); setStepIndex(restoredStep(completed[id] ?? [], findRunbook(id), 0)); }
  // A step row was chosen directly: the card sits above the list, so bring it to the person. The title
  // element stays mounted across steps, so focus and scroll right here, even when the row was already selected.
  function chooseStep(index: number) {
    // Render the new step first, so a screen reader reads the new title when focus lands on it.
    flushSync(() => setStepIndex(index));
    const title = focusTitleRef.current;
    if (!title) return;
    title.focus({ preventScroll: true });
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    title.closest("section")?.scrollIntoView?.({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }
  function markNext() {
    const next = saveFromLatest((latest) => {
      const checked = checkStep(latest, runbook, stepIndex);
      return { completed: checked.completed, result: checked };
    });
    setStepIndex(next.stepIndex);
    const left = total - (next.completed[runbook.id]?.length ?? 0);
    // checkStep always moves to an open step while one is left, so "Next" is always true here.
    setAnnouncement(left ? `Step checked. Next: ${runbook.steps[next.stepIndex].label}.` : "All steps checked. Clear to close.");
  }
  function resetRunbook(event: MouseEvent<HTMLButtonElement>) {
    // detail is 0 for a click synthesised from Enter or Space, at least 1 for a mouse or touch click.
    const steps = saveFromLatest((latest) => ({ completed: clearRunbook(latest, runbook), result: latest[runbook.id] ?? [] }));
    const entry = { runbookId: runbook.id, steps, stepIndex };
    setUndo((current) => ({ resets: [...(current?.resets ?? []), entry], fromKeyboard: event.detail === 0 }));
    setStepIndex(0);
    setAnnouncement(`${runbook.name} reset. Undo is available for a few seconds.`);
  }
  function restore() {
    if (!undo) return;
    // Undo reverses only the resets: keep any step checked since, alongside the ones each reset cleared.
    const { resets } = undo;
    const next = saveFromLatest((latest) => {
      const merged = { ...latest };
      for (const entry of resets) merged[entry.runbookId] = Array.from(new Set([...entry.steps, ...(merged[entry.runbookId] ?? [])])).sort((x, y) => x - y);
      return { completed: merged, result: merged };
    });
    const last = undo.resets[undo.resets.length - 1];
    setRunbookId(last.runbookId);
    // The saved step may have been checked after the reset; land on an open step instead.
    setStepIndex(restoredStep(next[last.runbookId], findRunbook(last.runbookId), last.stepIndex));
    setUndo(null);
    setToastFocused(false);
    const restored = new Set(undo.resets.map((entry) => entry.runbookId)).size;
    setAnnouncement(restored > 1 ? `${restored} runbooks restored.` : "Runbook restored.");
    focusResetNext.current = true;
  }
  function dismiss() {
    setUndo(null);
    setToastFocused(false);
    // The primary button is disabled once the focused step is checked; never drop focus on the body.
    const target = [primaryRef.current, resetRef.current].find((el) => el && !el.disabled) ?? focusTitleRef.current;
    target?.focus();
  }

  return (
    <div className="as">
      <a className="as-skip" href="#procedure">Skip to the procedure</a>
      <AppTop name="Ops Center" tagline="Runbook control room" href="/" />
      <div className="as-body">
        {/* Buttons that switch the runbook in place, not links: a labelled section, not a second navigation landmark. */}
        <section className="as-side" aria-label="Runbooks">
          <h2>Runbooks</h2>
          <ul className="as-lists">
            {runbooks.map((item) => {
              const count = (completed[item.id] ?? []).length;
              return (
                <ListButton
                  key={item.id}
                  label={item.name}
                  tone={count && count >= item.steps.length ? "green" : undefined}
                  count={<>{count}/{item.steps.length}<span className="as-sr"> steps checked</span></>}
                  current={item.id === runbook.id}
                  pressed
                  onSelect={() => chooseRunbook(item.id)}
                />
              );
            })}
          </ul>
          <p className="as-side-note"><strong>Rule of the room</strong>One checked action is more useful than a complete-looking dashboard.</p>
        </section>

        <main className="as-main" id="procedure">
          <div className="as-head">
            <div>
              <p className="as-eyebrow">{runbook.code} · {runbook.owner} · {runbook.cadence}</p>
              <h1>Ops Center</h1>
              <h2 className="as-runbook-title">{runbook.name}</h2>
              <p>{runbook.tone[0].toUpperCase() + runbook.tone.slice(1)}.</p>
              <p className="as-notice"><Pill tone="amber">Sample data</Pill>Synthetic study runbooks. No live connection to any service.</p>
            </div>
          </div>

          <section className="as-card as-focus" aria-labelledby="focus-title">
            {step ? (
              <>
                <p className="as-eyebrow">Step {stepIndex + 1} of {total} · {step.duration}</p>
                <h2 id="focus-title" ref={focusTitleRef} tabIndex={-1}>{step.label}</h2>
                <p>{step.instruction}</p>
                <div className="as-focus-actions">
                  <button ref={primaryRef} type="button" className={isDone ? "as-button is-done" : "as-button"} onClick={markNext} disabled={isDone}>
                    {isDone ? "Step checked" : isLast ? "Check final step" : "Check and move on"}
                  </button>
                  <button ref={resetRef} type="button" className="as-plain as-danger" onClick={resetRunbook} disabled={finished.length === 0}>Reset runbook</button>
                </div>
                {unsaved !== null && unsaved === completed ? <p className="as-notice" role="alert">Could not save in this browser (storage is blocked or full). These checks last until you reload or close the page.</p> : null}
                {/* In the DOM right after the buttons (shown fixed at the bottom), so Tab from Undo goes on to the steps. */}
                {undo ? (
                  <div
                    className="as-toast"
                    role="group"
                    aria-label="Undo reset"
                    onFocus={() => setToastFocused(true)}
                    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setToastFocused(false); }}
                    onKeyDown={(event) => { if (event.key === "Escape") dismiss(); }}
                  >
                    <span>{undoLabel(undo.resets)}</span>
                    <button ref={undoRef} type="button" className="as-plain" onClick={restore}>Undo</button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="as-empty"><strong id="focus-title">Nothing to run</strong>This runbook has no steps yet.</div>
            )}
          </section>

          <section aria-labelledby="steps-title">
            <h2 className="as-section-title" id="steps-title">Steps</h2>
            <StepList steps={runbook.steps} finished={finished} focused={stepIndex} onFocus={chooseStep} />
          </section>

          <section className="as-card as-progress-card" aria-label="Runbook status">
            <div className="as-progress-text">
              <strong>{finished.length} of {total}</strong>
              <span>steps checked</span>
            </div>
            <Pill tone={clear ? "green" : "amber"}>{statusLabel(finished.length, total)}</Pill>
            <div className="as-progress" role="progressbar" aria-label={`${percent}% of steps checked`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>
            <dl className="as-facts">
              <div><dt>Owner</dt><dd>{runbook.owner}</dd></div>
              <div><dt>Cadence</dt><dd>{runbook.cadence}</dd></div>
              <div><dt>Data</dt><dd>Illustrative only, saved in this browser</dd></div>
            </dl>
          </section>

          <p className="as-note">Nothing here pings a service; it only makes the next decision legible. Checks are saved in this browser only, with no account or sync. Reset runbook clears them.</p>
        </main>
      </div>
      <AppFoot source={SOURCE} />

      <p className="as-sr" role="status" aria-live="polite">{announcement}</p>
    </div>
  );
}
