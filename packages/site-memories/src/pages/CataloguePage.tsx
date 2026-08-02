import { Link } from "react-router-dom";
import { listExperienceCatalog } from "@platform/experiences";
import styles from "./CataloguePage.module.css";
import "@platform/experiences/tokens.css";

function MiniPreview({ kind, variant }: { kind: string; variant?: string }) {
  if (kind === "snow-globe") {
    return (
      <div className={styles.miniGlobe} aria-hidden data-variant={variant ?? "tower"}>
        <span className={styles.miniDome}>
          <span className={styles.miniCentre} />
        </span>
        <span className={styles.miniBase} />
      </div>
    );
  }
  if (kind === "music-box") {
    return (
      <div className={styles.miniBox} aria-hidden>
        <span className={styles.miniLid} />
        <span className={styles.miniBody} />
      </div>
    );
  }
  return (
    <div className={styles.miniFridge} aria-hidden>
      <span className={styles.miniDoor} />
      <span className={styles.miniMagnet} />
    </div>
  );
}

export function CataloguePage() {
  const entries = listExperienceCatalog();

  return (
    <main className={`mx ${styles.page}`}>
      <div className={styles.atmosphere} aria-hidden />
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Memory Experience Library</p>
        <h1 className={styles.title}>Memories</h1>
        <p className={styles.lede}>
          Handcrafted keepsake stages — open one, and it should feel like something
          you could lift from a museum cabinet.
        </p>
        <p className={styles.momentLinkWrap}>
          <Link to="/moment" className={styles.momentLink}>
            Moment playground — Find us
          </Link>
        </p>
      </header>

      <section className={styles.shelf} aria-label="Experience catalogue">
        <div className={styles.shelfRail} aria-hidden />
        <div className={styles.grid}>
          {entries.map((entry) => (
            <Link
              key={entry.id}
              to={`/${entry.slug}`}
              className={styles.card}
              data-kind={entry.kind}
            >
              <div className={styles.preview}>
                <MiniPreview
                  kind={entry.kind}
                  variant={entry.id.includes("tree") ? "tree" : entry.id.includes("paris") ? "tower" : undefined}
                />
              </div>
              <p className={styles.cardKind}>{entry.subtitle ?? entry.kind}</p>
              <h2 className={styles.cardTitle}>{entry.title}</h2>
              <p className={styles.cardBlurb}>{entry.blurb}</p>
              <p className={styles.cardEmotion}>{entry.emotion}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
