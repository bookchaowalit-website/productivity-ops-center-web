import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("home page", () => {
  it("renders the runbook rail, the first procedure and the no-live-connection notices", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("safe move.");
    for (const name of ["Release checklist", "Content handoff", "Weekly review"]) expect(html).toContain(name);
    expect(html).toContain("Scan the changed files and name the one behavior");
    expect(html).toContain("IN PROGRESS");
    expect(html).toContain("0<!-- --> of <!-- -->4<!-- --> steps checked");
    expect(html).toContain("LOCAL STUDY / NO LIVE CONNECTION");
    expect(html).toContain("SYNTHETIC DATA");
  });
});
