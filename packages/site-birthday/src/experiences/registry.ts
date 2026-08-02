import type { ComponentType } from "react";
import { ConstellationPage } from "../pages/ConstellationPage.js";
import { LanternsPage } from "../pages/LanternsPage.js";
import { PhotosPage } from "../pages/PhotosPage.js";
import { PlaceholderExperiencePage } from "../pages/PlaceholderExperiencePage.js";
import { VideosPage } from "../pages/VideosPage.js";
import { VoicePage } from "../pages/VoicePage.js";
import { BIRTHDAY_EXPERIENCES } from "../nav/experiences.js";
import {
  constellationPreview,
  placeholderPreview,
} from "./previews/index.js";
import type {
  ExperienceDefinition,
  ExperiencePreviewAssets,
} from "./types.js";

const PREVIEW_BY_ID: Record<string, ComponentType> = {
  constellation: ConstellationPage,
  lanterns: LanternsPage,
  voice: VoicePage,
  photos: PhotosPage,
  videos: VideosPage,
  messages: PlaceholderExperiencePage,
};

const ASSETS_BY_ID: Record<string, ExperiencePreviewAssets> = {
  constellation: constellationPreview,
  lanterns: placeholderPreview(),
  voice: placeholderPreview(),
  photos: placeholderPreview(),
  videos: placeholderPreview(),
  messages: placeholderPreview(),
};

/** Experiences that participate in Home / Portals launchers (not keepsake). */
export const LAUNCHER_EXPERIENCES: readonly ExperienceDefinition[] =
  BIRTHDAY_EXPERIENCES.filter((experience) => experience.showOnLanding).map(
    (experience) => {
      const Preview = PREVIEW_BY_ID[experience.id];
      const preview = ASSETS_BY_ID[experience.id];
      if (!Preview || !preview) {
        throw new Error(
          `Missing preview registration for experience "${experience.id}"`,
        );
      }
      return {
        id: experience.id,
        title: experience.title,
        icon: experience.cardEmoji,
        route: experience.path,
        description: experience.description,
        Preview,
        preview,
      };
    },
  );

/** Home prototype shows a single object launcher for now. */
export const HOME_EXPERIENCE_IDS = ["constellation"] as const;

export function getExperienceDefinition(
  id: string,
): ExperienceDefinition | undefined {
  return LAUNCHER_EXPERIENCES.find((experience) => experience.id === id);
}

export function getExperienceDefinitionByRoute(
  route: string,
): ExperienceDefinition | undefined {
  return LAUNCHER_EXPERIENCES.find((experience) => experience.route === route);
}

export function listHomeExperiences(): ExperienceDefinition[] {
  return HOME_EXPERIENCE_IDS.map((id) => {
    const experience = getExperienceDefinition(id);
    if (!experience) {
      throw new Error(`Home experience "${id}" is not registered`);
    }
    return experience;
  });
}

export function listPortalExperiences(): ExperienceDefinition[] {
  return [...LAUNCHER_EXPERIENCES];
}
