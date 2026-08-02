/**
 * Declarative constellation model — Definition vs Instance.
 * The renderer must not special-case constellation identities (Leo, Sagittarius, …).
 */

export type Vec2 = { x: number; y: number };

/** Supported special effects (renderer may no-op until implemented). */
export type StarSpecialEffect =
  | "brighterGlow"
  | "diamondStar"
  | "pulse"
  | "sparkle"
  | "largerRadius"
  | "colourOverride";

export type ConstellationPalette = {
  glow: string;
  glowSoft: string;
  line: string;
  starIdle: string;
  label: string;
};

/**
 * Instance placement on the stage.
 * Moves / rotates / scales the entire constellation (vertices, artwork, labels, overlays).
 */
export type ConstellationTransform = {
  /** Where the definition origin is placed (stage coordinates 0–100). */
  centre: Vec2;
  rotationDeg: number;
  scale: number;
};

export type ConstellationVertex = {
  uid: string;
  name: string;
  subtitle: string;
  /** Definition-local coords — identity instance (centre = origin, scale 1, rot 0) leaves these as world. */
  xPosition: number;
  yPosition: number;
  specialEffects: StarSpecialEffect[];
};

export type ConstellationArtwork = {
  image: string;
  /** Definition-local artwork centre. */
  centre: Vec2;
  rotationDeg: number;
  scale: number;
  opacity: number;
  /** Native size at scale 1 (stage units), from prior bbox width/height. */
  baseWidth: number;
  baseHeight: number;
  fit: "fill" | "meet";
  attribution?: string;
};

/**
 * Constellation Definition — reusable geometry, artwork defaults, colours, names.
 * Does not place the constellation on the stage.
 */
export type ConstellationDefinition = {
  id: string;
  displayName: string;
  palette: ConstellationPalette;
  /**
   * Local pivot in definition space.
   * Instance transform places this point at `transform.centre`.
   */
  origin: Vec2;
  vertices: ConstellationVertex[];
  /** Permanent connectivity as uid pairs. */
  graphEdges: [string, string][];
  /**
   * Pencil path as sequential vertex UIDs (may revisit for closing strokes).
   * Activation order = first occurrence of each uid.
   * Drawn segments = consecutive pairs (drawOrder[i], drawOrder[i+1]).
   */
  drawOrder: string[];
  artwork: ConstellationArtwork | null;
  /** Sentence fragments appended on each activation (Moment UX; not geometry). */
  fragments: string[];
};

/**
 * Constellation Instance — a placed copy of a definition.
 * Multiple instances may share the same definition id (e.g. two Leos).
 */
export type ConstellationInstance = {
  definitionId: string;
  transform: ConstellationTransform;
};

/** @deprecated Prefer ConstellationDefinition — kept as alias for existing imports. */
export type ConstellationObject = ConstellationDefinition;

export type ResolvedVertex = ConstellationVertex & {
  /** World position after instance transform. */
  x: number;
  y: number;
};

export type ResolvedArtwork = {
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotationDeg: number;
  opacity: number;
  fit: "fill" | "meet";
  attribution?: string;
};

export type ResolvedConstellation = {
  id: string;
  displayName: string;
  palette: ConstellationPalette;
  vertices: ResolvedVertex[];
  graphEdges: [string, string][];
  /** Consecutive pencil segments derived from drawOrder. */
  drawSegments: [string, string][];
  /** First-occurrence activation sequence. */
  activationOrder: string[];
  artwork: ResolvedArtwork | null;
  fragments: string[];
  /** World position of the definition origin after instance placement. */
  instanceCentre: Vec2;
};
