import { describe, expect, it } from "vitest";
import { checkStep, findRunbook, resetRunbook, runbooks, statusLabel } from "@/lib/ops";

const release = findRunbook("release");

describe("runbooks", () => {
  it("holds three runbooks and falls back to the first for an unknown id", () => {
    expect(runbooks.map((r) => r.code)).toEqual(["RB-07", "RB-12", "RB-19"]);
    expect(findRunbook("content").steps).toHaveLength(3);
    expect(findRunbook("nope").id).toBe("release");
  });
});

describe("checkStep", () => {
  it("checks the focused step and moves focus to the next one", () => {
    const next = checkStep({}, release, 0);
    expect(next.completed.release).toEqual([0]);
    expect(next.stepIndex).toBe(1);
  });

  it("keeps focus on the final step and does not duplicate checks", () => {
    let state = checkStep({}, release, 3);
    expect(state.stepIndex).toBe(3);
    state = checkStep(state.completed, release, 3);
    expect(state.completed.release).toEqual([3]);
  });

  it("keeps checks sorted and leaves other runbooks untouched", () => {
    const state = checkStep({ release: [2], review: [0] }, release, 0);
    expect(state.completed).toEqual({ release: [0, 2], review: [0] });
  });

  it("does not mutate the previous state", () => {
    const before = { release: [1] };
    checkStep(before, release, 2);
    expect(before).toEqual({ release: [1] });
  });
});

describe("resetRunbook and statusLabel", () => {
  it("clears only the chosen runbook", () => {
    expect(resetRunbook({ release: [0, 1], review: [2] }, release)).toEqual({ release: [], review: [2] });
  });

  it("is clear to close only when every step is checked", () => {
    expect(statusLabel(3, 4)).toBe("IN PROGRESS");
    expect(statusLabel(4, 4)).toBe("CLEAR TO CLOSE");
  });
});
