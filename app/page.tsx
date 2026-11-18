"use client";

import { useEffect, useRef, useState } from "react";
import { AppFoot, AppTop, ListButton, Pill } from "@/components/app-shell";
import { StepList } from "@/components/runbook";
import { type Completed, checkStep, findRunbook, resetRunbook as clearRunbook, runbooks, statusLabel } from "@/lib/ops";

const SOURCE = "https://github.com/bookchaowalit-website/productivity-ops-center-web";

type UndoState = { runbookId: string; steps: number[]; stepIndex: number };

export default function Home() {
  const [runbookId, setRunbookId] = useState("release");
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState<Completed>({});
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [toastFocused, setToastFocused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const undoRef = useRef<HTMLButtonElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);
  // Reset is disabled until the restored checks render, so focus it after that render, not inline.
  const focusResetNext = useRef(false);

  const runbook = findRunbook(runbookId);
  const finished = completed[runbook.id] ?? [];
  const total = runbook.steps.length;
  const step = runbook.steps[stepIndex] ?? runbook.steps[0];
  const isDone = finished.includes(stepIndex);
  const isLast = stepIndex === total - 1;
  const clear = total > 0 && finished.length >= total;
  const percent = total ? Math.round((finished.length / total) * 100) : 0;

  useEffect(() => { if (undo) undoRef.current?.focus(); }, [undo]);
  useEffect(() => {
    if (!focusResetNext.current) return;
    focusResetNext.current = false;
    resetRef.current?.focus();
  }, [completed]);
  // The toast closes after 8 s, but never while it holds focus (that would drop a keyboard user).
  useEffect(() => {
    if (!undo || toastFocused) return;
    const timer = window.setTimeout(() => setUndo(null), 8000);
    return () => window.clearTimeout(timer);
  }, [undo, toastFocused]);

  function chooseRunbook(id: string) { setRunbookId(id); setStepIndex(0); }
  function markNext() {
    const next = checkStep(completed, runbook, stepIndex);
    setCompleted(next.completed);
    setStepIndex(next.stepIndex);
    const left = total - (next.completed[runbook.id]?.length ?? 0);
    setAnnouncement(left ? `Step checked. Next: ${runbook.steps[next.stepIndex].label}.` : "Final step checked. Clear to close.");
  }
  function resetRunbook() {
    setUndo({ runbookId: runbook.id, steps: finished, stepIndex });
    setCompleted(clearRunbook(completed, runbook));
    setStepIndex(0);
    setAnnouncement(`${runbook.name} reset. Undo is available for a few seconds.`);
  }
  function restore() {
    if (!undo) return;
    setCompleted((current) => ({ ...current, [undo.runbookId]: undo.steps }));
    setRunbookId(undo.runbookId);
    setStepIndex(undo.stepIndex);
    setUndo(null);
    setToastFocused(false);
    setAnnouncement("Runbook restored.");
    focusResetNext.current = true;
  }
  function dismiss() {
    setUndo(null);
    setToastFocused(false);
    primaryRef.current?.focus();
  }

  return (
    <div className="as">
      <a className="as-skip" href="#procedure">Skip to the procedure</a>
      <AppTop name="Ops Center" tagline="Runbook control room" />
      <div className="as-body">
        <nav className="as-side" aria-label="Runbooks">
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
                  onSelect={() => chooseRunbook(item.id)}
                />
              );
            })}
          </ul>
          <p className="as-side-note"><strong>Rule of the room</strong>One checked action is more useful than a complete-looking dashboard.</p>
        </nav>

        <main className="as-main" id="procedure">
          <div className="as-head">
            <div>
              <p className="as-eyebrow">{runbook.code} · {runbook.owner} · {runbook.cadence}</p>
              <h1>{runbook.name}</h1>
              <p>{runbook.tone[0].toUpperCase() + runbook.tone.slice(1)}.</p>
              <p className="as-notice"><Pill tone="amber">Sample data</Pill>Synthetic study runbooks. No live connection to any service.</p>
            </div>
          </div>

          <section className="as-card as-focus" aria-labelledby="focus-title">
            {step ? (
              <>
                <p className="as-eyebrow">Step {stepIndex + 1} of {total} · {step.duration}</p>
                <h2 id="focus-title">{step.label}</h2>
                <p>{step.instruction}</p>
                <div className="as-focus-actions">
                  <button ref={primaryRef} type="button" className={isDone ? "as-button is-done" : "as-button"} onClick={markNext} disabled={isDone}>
                    {isDone ? "Step checked" : isLast ? "Check final step" : "Check and move on"}
                  </button>
                  <button ref={resetRef} type="button" className="as-plain as-danger" onClick={resetRunbook} disabled={finished.length === 0}>Reset runbook</button>
                </div>
              </>
            ) : (
              <div className="as-empty"><strong id="focus-title">Nothing to run</strong>This runbook has no steps yet.</div>
            )}
          </section>

          <section aria-labelledby="steps-title">
            <h2 className="as-section-title" id="steps-title">Steps</h2>
            <StepList steps={runbook.steps} finished={finished} focused={stepIndex} onFocus={setStepIndex} />
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
              <div><dt>Data</dt><dd>Illustrative only, kept in this tab</dd></div>
            </dl>
          </section>

          <p className="as-note">Nothing here pings a service; it only makes the next decision legible. Checks live in this tab and clear on reload.</p>
        </main>
      </div>
      <AppFoot source={SOURCE} />

      <p className="as-sr" role="status" aria-live="polite">{announcement}</p>
      {undo ? (
        <div
          className="as-toast"
          role="group"
          aria-label="Undo reset"
          onFocus={() => setToastFocused(true)}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setToastFocused(false); }}
          onKeyDown={(event) => { if (event.key === "Escape") dismiss(); }}
        >
          <span>{findRunbook(undo.runbookId).name} reset</span>
          <button ref={undoRef} type="button" className="as-plain" onClick={restore}>Undo</button>
        </div>
      ) : null}
    </div>
  );
}
