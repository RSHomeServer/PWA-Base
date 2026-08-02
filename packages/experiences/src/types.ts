/**
 * Memory Experience contracts.
 *
 * An *experience* is a reusable stage (snow-globe, music-box, fridge-door).
 * An *instance* is a memory: the same stage with different parameters + assets.
 */

export type ExperienceKind = "snow-globe" | "music-box" | "fridge-door";

export type ExperiencePalette = {
  wood?: string;
  brass?: string;
  glass?: string;
  paper?: string;
  accent?: string;
  atmosphere?: string;
};

export type ExperienceLighting = {
  /** warm | cool | candle | daylight */
  mood?: "warm" | "cool" | "candle" | "daylight";
  intensity?: number;
};

export type MediaRef = {
  src: string;
  alt?: string;
  caption?: string;
};

export type AudioRef = {
  src?: string;
  /** Built-in melody id when no src (music-box). */
  melodyId?: string;
  label?: string;
  loop?: boolean;
};

/** Shared fields every instance carries. */
export type ExperienceInstanceBase = {
  schemaVersion: 1;
  id: string;
  kind: ExperienceKind;
  title: string;
  subtitle?: string;
  description?: string;
  palette?: ExperiencePalette;
  lighting?: ExperienceLighting;
  photographs?: MediaRef[];
  music?: AudioRef;
  tags?: string[];
};

export type CentrepieceRef =
  | {
      /** Procedural low-poly stand-ins shipped with the library (CC0-style primitives). */
      kind: "procedural";
      id: "eiffel" | "christmas-tree" | "ballet-shoes" | "constellation";
      scale?: number;
    }
  | {
      /** External free/licensed GLTF/GLB — path under app public (e.g. /models/…). */
      kind: "gltf";
      src: string;
      scale?: number;
      attribution?: string;
    };

export type SnowGlobeEnvironment = "winter-park" | "night-city" | "quiet-room" | "night-sky";

/** Camera choreography for Birthday-style reveals. */
export type SnowGlobeIntro = "none" | "constellation-reveal";

export type SnowGlobeInstance = ExperienceInstanceBase & {
  kind: "snow-globe";
  centrepiece: CentrepieceRef;
  environment?: SnowGlobeEnvironment;
  snowDensity?: number;
  /** When set, plays a scripted camera intro before idle interaction. */
  intro?: SnowGlobeIntro;
};

export type MusicBoxFigurine = "ballerina" | "bird" | "star";

export type MusicBoxInstance = ExperienceInstanceBase & {
  kind: "music-box";
  figurine?: MusicBoxFigurine;
  engravedText?: string;
  notes?: string[];
  melodyId?: string;
};

export type FridgeItemKind = "magnet" | "postcard" | "ticket" | "note" | "reminder" | "drawing";

export type FridgeItem = {
  id: string;
  kind: FridgeItemKind;
  label: string;
  body?: string;
  color?: string;
  rotationDeg?: number;
  /** 0–100 placement within fridge face */
  x?: number;
  y?: number;
};

export type FridgeDoorInstance = ExperienceInstanceBase & {
  kind: "fridge-door";
  items: FridgeItem[];
};

export type ExperienceInstance =
  | SnowGlobeInstance
  | MusicBoxInstance
  | FridgeDoorInstance;

export type ExperienceCatalogEntry = {
  id: string;
  kind: ExperienceKind;
  title: string;
  subtitle?: string;
  blurb: string;
  /** Route slug under the showcase app */
  slug: string;
  emotion: string;
};
