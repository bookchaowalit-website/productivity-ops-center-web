import { describe, expect, it, vi } from "vitest";
import nextConfig from "@/next.config";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { metadata } from "@/app/layout";

vi.mock("next/font/google", () => ({ Geist: () => ({ variable: "font-geist" }) }));

describe("site metadata", () => {
  it("uses the ops.bookchaowalit.com origin for robots, sitemap and canonical", () => {
    expect(robots().sitemap).toBe("https://ops.bookchaowalit.com/sitemap.xml");
    expect(sitemap()[0].url).toBe("https://ops.bookchaowalit.com");
    expect(String(metadata.metadataBase)).toBe("https://ops.bookchaowalit.com/");
  });

  it("redirects the old /more-projects page to the main site", async () => {
    expect(await nextConfig.redirects!()).toContainEqual({ source: "/more-projects", destination: "https://bookchaowalit.com/", permanent: true });
  });
});
