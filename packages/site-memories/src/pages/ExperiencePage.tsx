import { Link, useParams } from "react-router-dom";
import { ExperienceStage, getExperienceBySlug } from "@platform/experiences";
import styles from "./ExperiencePage.module.css";

export function ExperiencePage() {
  const { kind = "", id = "" } = useParams();
  const slug = `${kind}/${id}`;

  let payload: ReturnType<typeof getExperienceBySlug>;
  try {
    payload = getExperienceBySlug(slug);
  } catch {
    return (
      <main className={styles.missing}>
        <h1>Memory not found</h1>
        <p>No experience is registered for “{slug}”.</p>
        <Link to="/">Back to catalogue</Link>
      </main>
    );
  }

  return (
    <div className={styles.wrap}>
      <nav className={styles.nav}>
        <Link to="/">← Catalogue</Link>
        <span>{payload.entry.emotion}</span>
      </nav>
      <ExperienceStage instance={payload.instance} />
    </div>
  );
}
