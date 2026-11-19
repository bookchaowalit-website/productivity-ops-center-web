import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../app/app-shell.css", import.meta.url), "utf8");

describe("review 2026-11-18 (app shell CSS)", () => {
  it("phone runbook pills wrap instead of hiding one past the right edge", () => {
    expect(css).toMatch(/@media \(max-width: 760px\) \{ \.as-lists \{ flex-wrap: wrap; overflow-x: visible; \} \}/);
  });
  it("reserves room under the Undo toast while it shows (focus not obscured)", () => {
    expect(css).toContain("html:has(.as-toast) { scroll-padding-bottom: 96px; }");
    expect(css).toContain("html:has(.as-toast) body { padding-bottom: 96px; }");
  });
  it("toast and dot colours are tokens, with a raised edged toast in dark mode", () => {
    expect(css).not.toMatch(/\.as-toast[^{]*\{[^}]*#1d1d1f/);
    expect(css).not.toMatch(/\.as-dot\[[^{]*\{[^}]*#(e0a100|8e8e93)/);
    expect(css).toContain("--as-toast-bg: #2c2c2e; --as-toast-line: #636366;");
  });
  it("muted text uses #636366 in light mode for headroom over 4.5:1", () => {
    expect(css).toContain("--as-muted: #636366;");
  });
  it("the Undo toast sizes from its text and wraps it, never cutting it off on phones", () => {
    expect(css).toContain(".as-toast { width: max-content; border-radius: 22px; }");
    expect(css).toMatch(/\.as-toast span \{ min-width: 0; overflow-wrap: anywhere;/);
    expect(css).not.toMatch(/\.as-toast span \{[^}]*text-overflow: ellipsis/);
  });
});
