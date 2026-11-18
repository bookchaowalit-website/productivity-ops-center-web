import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig from "@/next.config";

vi.mock("next/font/google", () => ({ Geist: () => ({ variable: "font-geist" }) }));

// lib/site reads NEXT_PUBLIC_SITE_URL at import time, so set or clear it first, then import fresh modules.
async function loadWith(url: string | undefined) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", url);
  const [{ default: robots }, { default: sitemap }, { metadata }] = await Promise.all([import("@/app/robots"), import("@/app/sitemap"), import("@/app/layout")]);
  return { robots, sitemap, metadata };
}

afterEach(() => { vi.unstubAllEnvs(); });

describe("site metadata", () => {
  it("defaults to the ops.bookchaowalit.com origin for robots, sitemap and canonical", async () => {
    const { robots, sitemap, metadata } = await loadWith(undefined);
    expect(robots().sitemap).toBe("https://ops.bookchaowalit.com/sitemap.xml");
    expect(sitemap()[0].url).toBe("https://ops.bookchaowalit.com");
    expect(String(metadata.metadataBase)).toBe("https://ops.bookchaowalit.com/");
  });

  it("follows NEXT_PUBLIC_SITE_URL when set, without a trailing slash", async () => {
    const { robots, sitemap } = await loadWith("https://preview.example.com/");
    expect(robots().sitemap).toBe("https://preview.example.com/sitemap.xml");
    expect(sitemap()[0].url).toBe("https://preview.example.com");
  });

  it("redirects the old /more-projects page to the main site", async () => {
    expect(await nextConfig.redirects!()).toContainEqual({ source: "/more-projects", destination: "https://bookchaowalit.com/", permanent: true });
  });
});
