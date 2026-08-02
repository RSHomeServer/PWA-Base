import type { ExperienceCatalogEntry } from "./types.js";
import parisWinter from "./content/instances/snow-globe-paris.json";
import quietTree from "./content/instances/snow-globe-tree.json";
import constellation from "./content/instances/snow-globe-constellation.json";
import ballerinaBox from "./content/instances/music-box-ballerina.json";
import sundayFridge from "./content/instances/fridge-sunday.json";
import { parseExperienceInstance } from "./parseInstance.js";
import type { ExperienceInstance } from "./types.js";

/** Showcase catalogue — Storybook-like index of demo memories. */
export const experienceCatalog: readonly ExperienceCatalogEntry[] = [
  {
    id: "snow-globe-constellation",
    kind: "snow-globe",
    title: "Constellation",
    subtitle: "Snow Globe · Birthday intro",
    slug: "snow-globe/constellation",
    blurb: "Night sky, a dedication drawing itself, then the museum dome that held it — the Birthday opening.",
    emotion: "reverent wonder",
  },
  {
    id: "snow-globe-paris",
    kind: "snow-globe",
    title: "Paris in Winter",
    subtitle: "Snow Globe · Landmark",
    slug: "snow-globe/paris",
    blurb: "Same dome, different soul — a CC-BY Eiffel miniature under amber light and soft snow.",
    emotion: "nostalgic wanderlust",
  },
  {
    id: "snow-globe-tree",
    kind: "snow-globe",
    title: "Quiet Tree",
    subtitle: "Snow Globe",
    slug: "snow-globe/tree",
    blurb: "Kenney's holiday tree under cooler moonlight — parameterisation without rewriting craft.",
    emotion: "hushed comfort",
  },
  {
    id: "music-box-ballerina",
    kind: "music-box",
    title: "Wind-Up Ballerina",
    subtitle: "Music Box",
    slug: "music-box/ballerina",
    blurb: "Walnut, brass hinges, a slow turn — craftsmanship before spectacle.",
    emotion: "tender longing",
  },
  {
    id: "fridge-sunday",
    kind: "fridge-door",
    title: "Sunday Morning Fridge",
    subtitle: "Fridge Door",
    slug: "fridge-door/sunday",
    blurb: "One fridge, many stories — magnets, tickets, and notes rearrange the narrative.",
    emotion: "familial warmth",
  },
];

const rawById: Record<string, unknown> = {
  "snow-globe-constellation": constellation,
  "snow-globe-paris": parisWinter,
  "snow-globe-tree": quietTree,
  "music-box-ballerina": ballerinaBox,
  "fridge-sunday": sundayFridge,
};

export function listExperienceCatalog(): readonly ExperienceCatalogEntry[] {
  return experienceCatalog;
}

export function getExperienceInstance(id: string): ExperienceInstance {
  const raw = rawById[id];
  if (!raw) throw new Error(`Unknown experience instance: ${id}`);
  return parseExperienceInstance(raw);
}

export function getExperienceBySlug(slug: string): {
  entry: ExperienceCatalogEntry;
  instance: ExperienceInstance;
} {
  const entry = experienceCatalog.find((e) => e.slug === slug);
  if (!entry) throw new Error(`Unknown experience slug: ${slug}`);
  return { entry, instance: getExperienceInstance(entry.id) };
}
