// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { StepList } from "@/components/runbook";

// Mounted tests for Ops Center on the App shell: choose a runbook, check steps, reset with Undo.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
const $ = <T extends Element = HTMLElement>(selector: string) => host.querySelector(selector) as T | null;
const button = (text: string, scope: ParentNode = host) => [...scope.querySelectorAll("button")].find((b) => b.textContent?.trim().startsWith(text)) as HTMLButtonElement;
const press = (el: Element) => act(() => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
const primary = () => $<HTMLButtonElement>(".as-focus .as-button")!;
const reset = () => button("Reset runbook");
const pills = () => [...host.querySelectorAll(".as-step .as-pill")].map((p) => p.textContent);
const count = (name: string) => button(name, $(".as-side")!).querySelector(".as-count")!.textContent;

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(<Home />));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
});

describe("choosing a runbook", () => {
  it("switches the procedure, marks the current list and starts on step 1", () => {
    press(button("Content handoff", $(".as-side")!));
    expect($("h1")!.textContent).toBe("Content handoff");
    expect(button("Content handoff", $(".as-side")!).getAttribute("aria-current")).toBe("true");
    expect(button("Release checklist", $(".as-side")!).getAttribute("aria-current")).toBeNull();
    expect($("#focus-title")!.textContent).toBe("Check the source");
    expect(host.textContent).toContain("Cut the throat-clearing");
    expect(host.textContent).toContain("Step 1 of 3");
  });

  it("focusing a step row shows its instruction", () => {
    press(host.querySelectorAll(".as-step")[2]);
    expect($("#focus-title")!.textContent).toBe("Open the preview");
    expect(host.querySelectorAll(".as-step")[2].getAttribute("aria-current")).toBe("step");
    expect(primary().textContent).toBe("Check and move on");
  });
});

describe("checking steps", () => {
  it("checks and advances, updates the counts, and closes on the final step", () => {
    expect(reset().disabled).toBe(true);
    press(primary());
    expect(pills()).toEqual(["Checked", "To do", "To do", "To do"]);
    expect($("#focus-title")!.textContent).toBe("Run the narrow check");
    expect(count("Release checklist")).toBe("1/4 steps checked");
    expect(host.textContent).toContain("Step checked. Next: Run the narrow check.");
    press(primary());
    press(primary());
    expect(primary().textContent).toBe("Check final step");
    press(primary());
    expect(primary().textContent).toBe("Step checked");
    expect(primary().disabled).toBe(true);
    expect(host.textContent).toContain("Clear to close");
    expect(host.textContent).toContain("Final step checked. Clear to close.");
    expect($('[role="progressbar"]')!.getAttribute("aria-valuenow")).toBe("100");
  });

  it("keeps each runbook's checks separate", () => {
    press(primary());
    press(button("Weekly review", $(".as-side")!));
    expect(pills()).toEqual(["To do", "To do", "To do"]);
    press(button("Release checklist", $(".as-side")!));
    expect(pills()[0]).toBe("Checked");
  });
});

describe("reset and undo", () => {
  it("reset clears the runbook and focuses Undo; Undo restores and focuses Reset", () => {
    press(primary());
    press(primary());
    press(reset());
    expect(pills()).toEqual(["To do", "To do", "To do", "To do"]);
    expect($(".as-toast")!.textContent).toContain("Release checklist reset");
    expect(document.activeElement?.textContent).toBe("Undo");
    press(button("Undo"));
    expect($(".as-toast")).toBeNull();
    expect(pills()).toEqual(["Checked", "Checked", "To do", "To do"]);
    expect($("#focus-title")!.textContent).toBe("Open the preview");
    expect(document.activeElement).toBe(reset());
  });

  it("Undo brings back the right runbook after switching away", () => {
    press(primary());
    press(reset());
    press(button("Weekly review", $(".as-side")!));
    press(button("Undo"));
    expect($("h1")!.textContent).toBe("Release checklist");
    expect(pills()[0]).toBe("Checked");
  });

  it("Escape dismisses without restoring; the toast times out after eight seconds when not focused", () => {
    press(primary());
    press(reset());
    act(() => { $(".as-toast")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    expect($(".as-toast")).toBeNull();
    expect(pills()[0]).toBe("To do");
    expect(document.activeElement).toBe(primary());

    vi.useFakeTimers();
    press(primary());
    press(reset());
    act(() => { (document.activeElement as HTMLElement).blur(); });
    act(() => { vi.advanceTimersByTime(8000); });
    expect($(".as-toast")).toBeNull();
  });

  it("does not time out while the toast holds focus", () => {
    vi.useFakeTimers();
    press(primary());
    press(reset());
    act(() => { $(".as-toast")!.dispatchEvent(new FocusEvent("focusin", { bubbles: true })); });
    act(() => { vi.advanceTimersByTime(9000); });
    expect($(".as-toast")).not.toBeNull();
  });
});

describe("StepList", () => {
  it("shows an empty state when a runbook has no steps", () => {
    const html = renderToString(<StepList steps={[]} finished={[]} focused={0} onFocus={() => {}} />);
    expect(html).toContain("No steps yet");
  });
});
