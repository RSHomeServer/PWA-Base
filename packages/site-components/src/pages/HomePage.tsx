import { Link, Stack } from "@platform/ui";
import { ComponentPreview } from "../components/ComponentPreview.js";
import { componentHref, getComponentsByCategory } from "../catalog.js";
import "../site.css";

export function HomePage() {
  const groups = getComponentsByCategory();

  return (
    <main className="components-page">
      <Stack gap="sm">
        <h1>Components</h1>
        <p className="components-lead">
          Songara Studio design system reference. Browse live examples, variants, and intended usage
          for every reusable primitive in <code>@platform/ui</code> and{" "}
          <code>@platform/controls</code>.
        </p>
      </Stack>

      <section className="components-principles" aria-labelledby="principles-heading">
        <h2 id="principles-heading">Design principles</h2>
        <ul>
          <li>
            <strong>Token-driven</strong> — spacing, colour, and typography come from CSS custom
            properties in <code>@platform/ui/tokens.css</code>.
          </li>
          <li>
            <strong>Accessible by default</strong> — semantic landmarks, labelled controls, and
            visible focus states on interactive elements.
          </li>
          <li>
            <strong>Composable</strong> — small primitives (<code>Stack</code>, <code>Surface</code>
            ) combine into site-specific layouts without bespoke CSS.
          </li>
          <li>
            <strong>Theme-aware</strong> — components respond to light and dark themes via the host{" "}
            <code>ThemeProvider</code>; use <code>ThemeToggle</code> where users choose preference.
          </li>
        </ul>
      </section>

      <nav aria-label="Component sections">
        {groups.map((group) => (
          <section key={group.category} className="components-category">
            <h2>{group.category}</h2>
            <ul className="components-grid">
              {group.items.map((entry) => (
                <li key={entry.id}>
                  <ComponentPreview componentId={entry.id} />
                  <h3>{entry.title}</h3>
                  <p>{entry.summary}</p>
                  <dl className="component-meta">
                    <div>
                      <dt>Purpose</dt>
                      <dd>{entry.purpose || "—"}</dd>
                    </div>
                    <div>
                      <dt>Props</dt>
                      <dd>{formatList(entry.props)}</dd>
                    </div>
                    <div>
                      <dt>States</dt>
                      <dd>{formatList(entry.states)}</dd>
                    </div>
                    <div>
                      <dt>Screenshots</dt>
                      <dd>{formatList(entry.screenshots)}</dd>
                    </div>
                    <div>
                      <dt>Files</dt>
                      <dd>{formatList(entry.files)}</dd>
                    </div>
                    <div>
                      <dt>Where used</dt>
                      <dd>{formatList(entry.whereUsed)}</dd>
                    </div>
                    <div>
                      <dt>Recently updated</dt>
                      <dd>{entry.recentlyUpdated ?? "—"}</dd>
                    </div>
                  </dl>
                  <Link href={componentHref(entry.path)}>View component</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </main>
  );
}

function formatList(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "—";
}
