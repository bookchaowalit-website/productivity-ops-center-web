"use client";

import { useState } from "react";
import { type Completed, checkStep, findRunbook, resetRunbook as clearRunbook, runbooks, statusLabel } from "@/lib/ops";

export default function Home() {
  const [runbookId, setRunbookId] = useState("release");
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState<Completed>({});
  const runbook = findRunbook(runbookId);
  const finished = completed[runbook.id] ?? [];
  const step = runbook.steps[stepIndex] ?? runbook.steps[0];
  const isDone = finished.includes(stepIndex);

  function chooseRunbook(id: string) { setRunbookId(id); setStepIndex(0); }
  function markNext() {
    const next = checkStep(completed, runbook, stepIndex);
    setCompleted(next.completed);
    setStepIndex(next.stepIndex);
  }
  function resetRunbook() { setCompleted(clearRunbook(completed, runbook)); setStepIndex(0); }

  return (
    <main className="ops-page">
      <div className="ops-frame">
        <header className="ops-header">
          <div className="ops-brand"><span className="ops-mark">OC</span><span>OPS CENTER</span></div>
          <div className="ops-header-note"><span className="signal-dot" />LOCAL STUDY / NO LIVE CONNECTION</div>
          <span className="ops-clock">08:42 BKK</span>
        </header>
        <section className="ops-intro"><div><h1>Make the next<br /><strong>safe move.</strong></h1><p>Runbooks for a solo operation that needs memory outside the operator.</p></div><div className="ops-intro-rule"><span>ACTIVE RUNBOOK</span><strong>{runbook.code}</strong><small>{runbook.cadence}</small></div></section>
        <section className="ops-console" aria-label="Runbook control room">
          <aside className="runbook-rail"><div className="rail-heading"><span>RUNBOOKS</span><b>{runbooks.length} READY</b></div>{runbooks.map((item) => { const count = (completed[item.id] ?? []).length; return <button key={item.id} type="button" className={item.id === runbook.id ? "runbook-row is-active" : "runbook-row"} onClick={() => chooseRunbook(item.id)} aria-pressed={item.id === runbook.id}><span className="runbook-code">{item.code}</span><strong>{item.name}</strong><small>{item.owner} / {item.cadence}</small><b>{count}/{item.steps.length}</b></button>; })}<div className="rail-foot"><span>RULE OF THE ROOM</span><p>One checked action is more useful than a complete-looking dashboard.</p></div></aside>
          <div className="procedure-sheet"><div className="sheet-top"><div><span className="sheet-label">CURRENT PROCEDURE</span><h2>{runbook.name}</h2><p>{runbook.tone}</p></div><span className="sheet-owner">OWNER<br /><strong>{runbook.owner}</strong></span></div><div className="step-list">{runbook.steps.map((item, index) => <button key={item.label} type="button" className={index === stepIndex ? "procedure-step is-focused" : "procedure-step"} onClick={() => setStepIndex(index)} aria-pressed={index === stepIndex}><span className={finished.includes(index) ? "step-mark is-checked" : "step-mark"}>{finished.includes(index) ? "OK" : "--"}</span><span className="step-order">{String(index + 1).padStart(2, "0")}</span><strong>{item.label}</strong><small>{item.duration}</small></button>)}</div><div className="focus-note"><span className="sheet-label">FOCUS INSTRUCTION</span><h3>{step.label}</h3><p>{step.instruction}</p><div className="focus-actions"><button className="primary-action" type="button" onClick={markNext} disabled={isDone}>{isDone ? "Step checked" : stepIndex === runbook.steps.length - 1 ? "Check final step" : "Check and move on"}</button><button className="quiet-action" type="button" onClick={resetRunbook}>Reset runbook</button></div></div></div>
          <aside className="status-panel"><div className="panel-heading"><span>ROOM STATUS</span><span className="status-live">STUDY</span></div><div className="status-signal"><span className="signal-ring">{finished.length}</span><div><strong>{statusLabel(finished.length, runbook.steps.length)}</strong><small>{finished.length} of {runbook.steps.length} steps checked</small></div></div><div className="status-lines"><div><span>CADENCE</span><strong>{runbook.cadence}</strong></div><div><span>LAST REVIEW</span><strong>Today / local</strong></div><div><span>DATA BOUNDARY</span><strong>Illustrative only</strong></div></div><div className="status-note"><span>OPERATOR NOTE</span><p>Nothing here pings a service. It makes the next decision legible.</p></div></aside>
        </section>
        <footer className="ops-footer"><span>BOOKCHAOWALIT / OPS CENTER</span><span>RUNBOOK CONTROL ROOM · SYNTHETIC DATA</span></footer>
      </div>
    </main>
  );
}
