import { useMemo } from "react";
import {
  NAV_CYCLE_EXPERIENCES,
  getExperienceByPath,
  type BirthdayExperience,
} from "./experiences.js";

export type ExperienceNav = {
  current: BirthdayExperience | undefined;
  previous: BirthdayExperience | null;
  next: BirthdayExperience | null;
  /** Individual experiences return to the keepsake shelf. */
  homePath: "/experiences";
};

/**
 * Prev/Next cycle among in-nav experiences only (circular).
 * Website, Bedroom, and Experiences shelf are not part of the cycle.
 */
export function useExperienceNav(currentPath: string): ExperienceNav {
  return useMemo(() => {
    const cycle = NAV_CYCLE_EXPERIENCES;
    const index = cycle.findIndex((experience) => experience.path === currentPath);
    if (index < 0) {
      return {
        current: getExperienceByPath(currentPath),
        previous: null,
        next: null,
        homePath: "/experiences",
      };
    }

    const previous = cycle[(index - 1 + cycle.length) % cycle.length]!;
    const next = cycle[(index + 1) % cycle.length]!;

    return {
      current: cycle[index],
      previous,
      next,
      homePath: "/experiences",
    };
  }, [currentPath]);
}
