import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("home page", () => {
  it("renders the runbook list, the first procedure and the sample-data notice near the title", () => {
    const html = renderToString(<Home />);
    for (const name of ["Release checklist", "Content handoff", "Weekly review"]) expect(html).toContain(name);
    expect(html).toContain("<h1>Release checklist</h1>");
    expect(html).toContain("Scan the changed files and name the one behavior");
    expect(html).toContain("In progress");
    expect(html).toContain("Sample data");
    expect(html).toContain("No live connection to any service.");
    expect(html.indexOf("Sample data")).toBeLessThan(html.indexOf("Check and move on"));
    expect(html).toContain('href="https://bookchaowalit.com/"');
  });
});
