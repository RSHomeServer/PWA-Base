export type {
  AudioRef,
  CentrepieceRef,
  ExperienceCatalogEntry,
  ExperienceInstance,
  ExperienceInstanceBase,
  ExperienceKind,
  ExperienceLighting,
  ExperiencePalette,
  FridgeDoorInstance,
  FridgeItem,
  FridgeItemKind,
  MediaRef,
  MusicBoxFigurine,
  MusicBoxInstance,
  SnowGlobeEnvironment,
  SnowGlobeIntro,
  SnowGlobeInstance,
} from "./types.js";

export { parseExperienceInstance } from "./parseInstance.js";
export {
  experienceCatalog,
  getExperienceBySlug,
  getExperienceInstance,
  listExperienceCatalog,
} from "./registry.js";
export { ExperienceStage } from "./ExperienceStage.js";
export { ExperienceShell } from "./theme/ExperienceShell.js";
export { SnowGlobeExperience } from "./snow-globe/SnowGlobeExperience.js";
export { MusicBoxExperience } from "./music-box/MusicBoxExperience.js";
export { FridgeDoorExperience } from "./fridge-door/FridgeDoorExperience.js";
