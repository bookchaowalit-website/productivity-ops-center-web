/** Canonical origin for metadata, robots.txt and sitemap.xml. */
// Unset, empty or blank all fall back to the default origin (`??` alone would keep "" and break new URL()).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://ops.bookchaowalit.com").replace(/\/$/, "");
