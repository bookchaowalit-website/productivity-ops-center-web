import { Pill } from "@/components/app-shell";
import type { Step } from "@/lib/ops";

const Tick = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 12.5 4 4 8-9" /></svg>
);

/**
 * The steps of one runbook. Each row is one button that focuses the step; the ring shows its number,
 * or a tick once checked, and the pill says the state in words (never colour alone).
 */
export function StepList({ steps, finished, focused, onFocus }: { steps: Step[]; finished: number[]; focused: number; onFocus: (index: number) => void }) {
  if (!steps.length) {
    return (
      <div className="as-list as-empty">
        <strong>No steps yet</strong>
        This runbook has no steps. Pick another runbook from the list.
      </div>
    );
  }
  return (
    <ol className="as-list as-steps">
      {steps.map((item, index) => {
        const done = finished.includes(index);
        return (
          <li key={item.label}>
            <button type="button" className="as-step" aria-current={index === focused ? "step" : undefined} onClick={() => onFocus(index)}>
              <span className="as-mark" data-done={done ? "true" : undefined} aria-hidden="true">{done ? <Tick /> : index + 1}</span>
              <span>
                <span className="as-step-title"><span className="as-sr">Step {index + 1}: </span>{item.label}</span>
                <span className="as-step-meta">{item.duration}</span>
              </span>
              <Pill tone={done ? "green" : "grey"}>{done ? "Checked" : "To do"}</Pill>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
