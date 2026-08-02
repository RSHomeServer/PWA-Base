import { useLocation } from "react-router-dom";
import "@platform/ui/tokens.css";
import "../site.css";
import { ExperienceShell } from "../components/ExperienceShell.js";
import { getExperienceByPath } from "../nav/experiences.js";

/**
 * Shared placeholder for experiences not yet built (lanterns, voice, etc.).
 */
export function PlaceholderExperiencePage() {
  const { pathname } = useLocation();
  const experience = getExperienceByPath(pathname);

  const title = experience?.title ?? "Coming soon";
  const description =
    experience?.description ?? "This moment is not ready yet.";

  return (
    <ExperienceShell
      path={experience?.path ?? pathname}
      title={title}
      description={description}
    />
  );
}
