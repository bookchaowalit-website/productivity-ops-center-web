import { useSyncExternalStore, type ReactNode } from "react";

/**
 * App shell building blocks (styles in app/app-shell.css). Copy both files into the next
 * list-style app; see APP-SHELL.md for the page structure.
 */

export const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
);

export type Tone = "green" | "amber" | "grey" | "red";

/** `href` makes the app name a link back to the app's home. */
export function AppTop({ name, tagline, href }: { name: string; tagline: string; href?: string }) {
  return (
    <header className="as-top">
      {href ? <a className="as-brand" href={href}>{name}<small>{tagline}</small></a> : <div className="as-brand">{name}<small>{tagline}</small></div>}
      <nav aria-label="Site">
        <a href="https://bookchaowalit.com/">Bookchaowalit</a>
      </nav>
    </header>
  );
}

export function AppFoot({ source }: { source: string }) {
  return (
    <footer className="as-foot">
      <a href="https://bookchaowalit.com/">More projects</a>
      <a href={source}>Source</a>
      <a href="https://bookchaowalit.com/privacy">Privacy</a>
      <a href="https://monitor.bookchaowalit.com/">Status</a>
    </footer>
  );
}

/** One entry in the sidebar list of lists. */
/** `pressed`: the lists switch state in place (toggle buttons), so mark the chosen one with aria-pressed instead of aria-current. */
export function ListButton({ label, count, tone, current, pressed, onSelect }: { label: string; count: ReactNode; tone?: Tone; current: boolean; pressed?: boolean; onSelect: () => void }) {
  return (
    <li>
      <button type="button" aria-current={!pressed && current ? "true" : undefined} aria-pressed={pressed ? current : undefined} onClick={onSelect}>
        <span>{tone ? <span className="as-dot" data-tone={tone} aria-hidden="true" /> : null}{label}</span>
        <span className="as-count">{count}</span>
      </button>
    </li>
  );
}

export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className="as-pill" data-tone={tone}>{children}</span>;
}

const noopSubscribe = () => () => {};
/**
 * False on the server and during hydration, true afterwards. Use it for anything that depends on
 * the viewer's clock or time zone (today, overdue, a default time) so the HTML never mismatches.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
