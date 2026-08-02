import type { DemoEntry } from "../demos/catalog.js";
import { DemoCard } from "./DemoCard.js";

export interface ContinueExploringProps {
  demos: DemoEntry[];
}

export function ContinueExploring({ demos }: ContinueExploringProps) {
  if (demos.length === 0) {
    return null;
  }

  return (
    <section className="viz-gallery-continue" aria-labelledby="viz-gallery-continue-heading">
      <h2 id="viz-gallery-continue-heading" className="viz-gallery-section-title">
        Continue exploring
      </h2>
      <p className="viz-gallery-section-lead">
        Pick up where you left off — your recently viewed exhibits.
      </p>
      <ul className="viz-gallery-grid viz-gallery-grid--compact">
        {demos.map((demo) => (
          <li key={demo.id}>
            <DemoCard demo={demo} />
          </li>
        ))}
      </ul>
    </section>
  );
}
