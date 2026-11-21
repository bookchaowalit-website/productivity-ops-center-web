// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { StepList } from "@/components/runbook";
import { findRunbook } from "@/lib/ops";

// Mounted tests for Ops Center on the App shell: choose a runbook, check steps, reset with Undo.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
const $ = <T extends Element = HTMLElement>(selector: string) => host.querySelector(selector) as T | null;
const button = (text: string, scope: ParentNode = host) => [...scope.querySelectorAll("button")].find((b) => b.textContent?.trim().startsWith(text)) as HTMLButtonElement;
// detail 0 = a keyboard-synthesised click (Enter/Space); 1 = mouse or touch.
const press = (el: Element, detail = 0) => act(() => { el.dispatchEvent(new MouseEvent("click", { bubbles: true, detail })); });
const primary = () => $<HTMLButtonElement>(".as-focus .as-button")!;
const reset = () => button("Reset runbook");
const pills = () => [...host.querySelectorAll(".as-step .as-pill")].map((p) => p.textContent);
const count = (name: string) => button(name, $(".as-side")!).querySelector(".as-count")!.textContent;

beforeEach(() => {
  localStorage.clear();
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
    expect($("h1")!.textContent).toBe("Ops Center");
    expect($(".as-runbook-title")!.textContent).toBe("Content handoff");
    expect(button("Content handoff", $(".as-side")!).getAttribute("aria-pressed")).toBe("true");
    expect(button("Release checklist", $(".as-side")!).getAttribute("aria-pressed")).toBe("false");
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
    expect(host.textContent).toContain("All steps checked. Clear to close.");
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
    expect($("h1")!.textContent).toBe("Ops Center");
    expect($(".as-runbook-title")!.textContent).toBe("Release checklist");
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

describe("review fixes", () => {
  it("Undo reverses only the reset and keeps steps checked after it", () => {
    press(primary());
    press(reset());
    press(host.querySelectorAll(".as-step")[2]);
    press(primary());
    expect(pills()).toEqual(["To do", "To do", "Checked", "To do"]);
    press(button("Undo"));
    expect(pills()).toEqual(["Checked", "To do", "Checked", "To do"]);
    expect(count("Release checklist")).toBe("2/4 steps checked");
  });

  it("Undo lands on an open step when the saved step was checked after the reset", () => {
    press(primary()); // check step 1; the card moves to step 2
    press(reset()); // saves step 2 (index 1) as the place to return to
    press(primary()); // check step 1 again
    press(primary()); // check step 2, the saved step
    press(button("Undo"));
    expect(pills()).toEqual(["Checked", "Checked", "To do", "To do"]);
    expect($("#focus-title")!.textContent).toBe(findRunbook("release").steps[2].label);
    expect(primary().disabled).toBe(false);
    expect(primary().textContent).toBe("Check and move on");
  });

  it("Undo keeps the saved step when it is still open", () => {
    press(primary());
    press(reset());
    press(button("Undo"));
    expect($("#focus-title")!.textContent).toBe(findRunbook("release").steps[1].label);
  });

  it("choosing a step row moves focus to the card title and scrolls the card into view", () => {
    const scroll = vi.fn();
    (HTMLElement.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = scroll;
    press(host.querySelectorAll(".as-step")[3]);
    expect(document.activeElement).toBe($("#focus-title"));
    expect($("#focus-title")!.textContent).toBe("Write the rollback");
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll.mock.contexts[0]).toBe($(".as-focus"));
    expect(scroll.mock.calls[0][0]).toMatchObject({ block: "nearest" });
    // Check and move on advances the card without stealing focus from the button.
    press(host.querySelectorAll(".as-step")[0]);
    primary().focus();
    press(primary());
    expect(document.activeElement).toBe(primary());
    expect(scroll).toHaveBeenCalledTimes(2);
  });

  it("uses an instant scroll when the person prefers reduced motion", () => {
    const scroll = vi.fn();
    (HTMLElement.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = scroll;
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: query.includes("reduce"), media: query })) as unknown as typeof window.matchMedia;
    press(host.querySelectorAll(".as-step")[1]);
    expect(scroll.mock.calls[0][0]).toMatchObject({ behavior: "auto" });
    window.matchMedia = original;
  });

  it("a pointer reset leaves focus alone so the toast counts down", () => {
    vi.useFakeTimers();
    press(primary());
    const resetButton = reset();
    resetButton.focus();
    press(resetButton, 1);
    expect($(".as-toast")).not.toBeNull();
    expect(document.activeElement?.textContent).not.toBe("Undo");
    act(() => { vi.advanceTimersByTime(8000); });
    expect($(".as-toast")).toBeNull();
  });
});

describe("review fixes, round 2", () => {
  it("resetting two runbooks keeps both restorable; one Undo restores both", () => {
    press(primary());
    press(reset(), 1);
    press(button("Weekly review", $(".as-side")!));
    press(primary());
    press(primary());
    press(reset(), 1);
    expect($(".as-toast span")!.textContent).toBe("Reset 2 runbooks");
    press(button("Undo"));
    expect(count("Release checklist")).toBe("1/4 steps checked");
    expect(count("Weekly review")).toBe("2/3 steps checked");
    expect($("h1")!.textContent).toBe("Ops Center");
    expect($(".as-runbook-title")!.textContent).toBe("Weekly review");
    expect(host.textContent).toContain("2 runbooks restored.");
  });

  it("each reset restarts the 8-second countdown", () => {
    vi.useFakeTimers();
    press(primary());
    press(reset(), 1);
    act(() => { vi.advanceTimersByTime(6000); });
    press(button("Content handoff", $(".as-side")!));
    press(primary());
    press(reset(), 1);
    act(() => { vi.advanceTimersByTime(6000); });
    expect($(".as-toast")).not.toBeNull();
    act(() => { vi.advanceTimersByTime(2000); });
    expect($(".as-toast")).toBeNull();
  });

  it("clicking the already-selected row still brings the card into view, and leaves nothing pending", () => {
    const scroll = vi.fn();
    (HTMLElement.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = scroll;
    press(host.querySelectorAll(".as-step")[0]);
    expect(document.activeElement).toBe($("#focus-title"));
    expect(scroll).toHaveBeenCalledTimes(1);
    primary().focus();
    press(primary());
    expect(document.activeElement).toBe(primary());
    expect(scroll).toHaveBeenCalledTimes(1);
  });

  it("announces the step focus actually moves to", () => {
    press(host.querySelectorAll(".as-step")[1]);
    press(primary());
    expect(host.textContent).toContain("Step checked. Next: Open the preview.");
  });
});

describe("review fixes, round 3", () => {
  it("focus lands on the card title after it shows the chosen step", () => {
    const read: string[] = [];
    $("#focus-title")!.addEventListener("focus", (event) => read.push((event.target as HTMLElement).textContent ?? ""));
    press(host.querySelectorAll(".as-step")[2]);
    expect(read).toEqual(["Open the preview"]);
    expect(document.activeElement?.textContent).toBe("Open the preview");
  });

  it("Escape on the toast falls back to Reset when the primary button is disabled", () => {
    press(primary());
    press(reset(), 1);
    for (let i = 0; i < 4; i += 1) press(primary());
    expect(primary().disabled).toBe(true);
    act(() => { $(".as-toast")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    expect($(".as-toast")).toBeNull();
    expect(document.activeElement).toBe(reset());
  });

  it("counts restored runbooks, not resets, when one runbook was reset twice", () => {
    press(primary());
    press(reset(), 1);
    press(primary());
    press(reset(), 1);
    expect($(".as-toast span")!.textContent).toBe("Release checklist reset");
    press(button("Undo"));
    expect(host.textContent).toContain("Runbook restored.");
    expect(host.textContent).not.toContain("2 runbooks restored.");
  });

  it("the skip-link target clears the sticky top bar", async () => {
    const { readFileSync } = await import("node:fs");
    expect(readFileSync("app/app-shell.css", "utf8")).toMatch(/#procedure \{ scroll-margin-top: 64px; \}/);
    expect($("main#procedure")).not.toBeNull();
  });
});

describe("review fixes, round 4", () => {
  it("checking a later step first wraps back to the earlier open steps; only all-done disables", () => {
    press(host.querySelectorAll(".as-step")[3]);
    expect(primary().textContent).toBe("Check and move on");
    press(primary());
    expect($("#focus-title")!.textContent).toBe("Read the diff");
    expect(host.textContent).toContain("Step checked. Next: Read the diff.");
    press(host.querySelectorAll(".as-step")[2]);
    press(primary());
    expect($("#focus-title")!.textContent).toBe("Read the diff");
    expect(primary().disabled).toBe(false);
    press(primary());
    expect($("#focus-title")!.textContent).toBe("Run the narrow check");
    expect(primary().textContent).toBe("Check final step");
    press(primary());
    expect(primary().disabled).toBe(true);
    expect(host.textContent).toContain("All steps checked. Clear to close.");
  });

  it("the Undo toast sits right after the card buttons, so Tab goes on to the step list", () => {
    press(primary());
    press(reset());
    const toast = $(".as-toast")!;
    expect(toast.previousElementSibling).toBe($(".as-focus-actions"));
    const focusable = [...host.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
    const undoIndex = focusable.indexOf(button("Undo"));
    expect(focusable[undoIndex + 1]).toBe(host.querySelector(".as-step"));
  });
});

describe("StepList", () => {
  it("shows an empty state when a runbook has no steps", () => {
    const html = renderToString(<StepList steps={[]} finished={[]} focused={0} onFocus={() => {}} />);
    expect(html).toContain("No steps yet");
  });
});

describe("review 2026-11-18", () => {
  it("checks survive a reload (saved in this browser) and Reset runbook clears them", () => {
    press(primary());
    press(primary());
    expect(JSON.parse(localStorage.getItem("ops-center-checks-v1")!)).toEqual({ release: [0, 1] });
    act(() => root.unmount());
    root = createRoot(host);
    act(() => root.render(<Home />));
    expect(count("Release checklist")).toBe("2/4 steps checked");
    press(reset());
    expect(JSON.parse(localStorage.getItem("ops-center-checks-v1")!)).toEqual({ release: [] });
  });

  it("switching to a runbook lands on its first open step", () => {
    localStorage.setItem("ops-center-checks-v1", JSON.stringify({ content: [0] }));
    act(() => root.unmount());
    root = createRoot(host);
    act(() => root.render(<Home />));
    press(button("Content handoff", $(".as-side")!));
    expect($("#focus-title")!.textContent).toBe("Cut the throat-clearing");
  });

  it("the brand links home; the runbook switcher is a labelled section with toggle buttons, not a nav", () => {
    expect($<HTMLAnchorElement>("a.as-brand")!.getAttribute("href")).toBe("/");
    expect(host.querySelectorAll("nav")).toHaveLength(1);
    expect($('section.as-side[aria-label="Runbooks"]')).not.toBeNull();
    expect([...host.querySelectorAll(".as-side .as-lists button")].map((b) => b.getAttribute("aria-pressed"))).toEqual(["true", "false", "false"]);
    expect($(".as-side .as-lists button[aria-current]")).toBeNull();
  });
});

describe("deferred review 2026-11-19", () => {
  const KEY = "ops-center-checks-v1";
  const saved = () => JSON.parse(localStorage.getItem(KEY)!);
  const remount = () => {
    act(() => root.unmount());
    root = createRoot(host);
    act(() => root.render(<Home />));
  };

  it("a check saves on top of progress another tab saved since this render (no lost update)", () => {
    // Another tab saves Content progress; this tab has not re-rendered (no storage event yet).
    localStorage.setItem(KEY, JSON.stringify({ content: [0] }));
    press(primary()); // check Release step 1 here
    expect(saved()).toEqual({ content: [0], release: [0] });
  });

  it("Reset and Undo also start from the latest saved checks", () => {
    press(primary());
    localStorage.setItem(KEY, JSON.stringify({ release: [0, 1], content: [0] })); // other tab: one more Release step, and Content
    press(reset(), 1);
    expect(saved()).toEqual({ release: [], content: [0] });
    localStorage.setItem(KEY, JSON.stringify({ release: [], content: [0, 1] })); // other tab works on while Undo is open
    press(button("Undo"));
    expect(saved()).toEqual({ release: [0, 1], content: [0, 1] }); // the reset's own steps come back, the rest is kept
  });

  it("after a reload, the card opens on the first unfinished step with a working primary button", () => {
    press(primary());
    remount();
    expect($("#focus-title")!.textContent).toBe(findRunbook("release").steps[1].label);
    expect(primary().disabled).toBe(false);
    expect(primary().textContent).toBe("Check and move on");
  });

  it("after hydration of the server HTML, saved checks also move the card to the first open step", async () => {
    const { hydrateRoot } = await import("react-dom/client");
    act(() => root.unmount());
    localStorage.setItem(KEY, JSON.stringify({ release: [0, 1] }));
    host.innerHTML = renderToString(<Home />);
    act(() => { root = hydrateRoot(host, <Home />); });
    expect($("#focus-title")!.textContent).toBe(findRunbook("release").steps[2].label);
    expect(primary().disabled).toBe(false);
  });
});

describe("storage refused (Codex 2026-11-19)", () => {
  it("shows a visible notice when a check could not be saved, and clears it once a save works again", () => {
    const setItem = vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
    press(button("Check and move on"));
    const notice = host.querySelector('.as-notice[role="alert"]');
    expect(notice?.textContent).toBe("Could not save in this browser (storage is blocked or full). These checks last until you reload or close the page.");
    setItem.mockRestore();
    press(button("Check and move on"));
    expect(host.querySelector('.as-notice[role="alert"]')).toBeNull();
  });

  it("drops the notice when another tab's save replaces the unsaved checks on screen", () => {
    const setItem = vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
    press(button("Check and move on"));
    expect(host.querySelector('.as-notice[role="alert"]')).not.toBeNull();
    setItem.mockRestore();
    localStorage.setItem("ops-center-checks-v1", JSON.stringify({ release: [0, 1] })); // another tab saved
    act(() => { window.dispatchEvent(new StorageEvent("storage", { key: "ops-center-checks-v1" })); });
    expect(host.querySelector('.as-notice[role="alert"]')).toBeNull();
  });
});
