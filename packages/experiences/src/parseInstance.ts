import type {
  ExperienceInstance,
  ExperienceKind,
  FridgeDoorInstance,
  FridgeItem,
  MusicBoxInstance,
  SnowGlobeInstance,
} from "./types.js";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseFridgeItems(raw: unknown): FridgeItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isObject)
    .map((item, index) => ({
      id: asString(item.id, `item-${index}`),
      kind: (asString(item.kind, "note") as FridgeItem["kind"]) || "note",
      label: asString(item.label, "Note"),
      body: typeof item.body === "string" ? item.body : undefined,
      color: typeof item.color === "string" ? item.color : undefined,
      rotationDeg: typeof item.rotationDeg === "number" ? item.rotationDeg : undefined,
      x: typeof item.x === "number" ? item.x : undefined,
      y: typeof item.y === "number" ? item.y : undefined,
    }));
}

/**
 * Normalise a raw JSON instance into a typed ExperienceInstance.
 * Throws on missing required fields so authors fail loudly.
 */
export function parseExperienceInstance(raw: unknown): ExperienceInstance {
  if (!isObject(raw)) throw new Error("Experience instance must be an object");
  const kind = asString(raw.kind) as ExperienceKind;
  const id = asString(raw.id);
  const title = asString(raw.title);
  if (!id || !title || !kind) {
    throw new Error("Experience instance requires id, title, and kind");
  }

  const base = {
    schemaVersion: 1 as const,
    id,
    title,
    subtitle: typeof raw.subtitle === "string" ? raw.subtitle : undefined,
    description: typeof raw.description === "string" ? raw.description : undefined,
    palette: isObject(raw.palette) ? (raw.palette as ExperienceInstance["palette"]) : undefined,
    lighting: isObject(raw.lighting) ? (raw.lighting as ExperienceInstance["lighting"]) : undefined,
    photographs: Array.isArray(raw.photographs)
      ? (raw.photographs as ExperienceInstance["photographs"])
      : undefined,
    music: isObject(raw.music) ? (raw.music as ExperienceInstance["music"]) : undefined,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === "string") : undefined,
  };

  if (kind === "snow-globe") {
    if (!isObject(raw.centrepiece)) {
      throw new Error("snow-globe requires centrepiece");
    }
    const introRaw = asString(raw.intro, "none");
    const instance: SnowGlobeInstance = {
      ...base,
      kind: "snow-globe",
      centrepiece: raw.centrepiece as SnowGlobeInstance["centrepiece"],
      environment: asString(raw.environment, "winter-park") as SnowGlobeInstance["environment"],
      snowDensity: asNumber(raw.snowDensity, 0.45),
      intro:
        introRaw === "constellation-reveal"
          ? "constellation-reveal"
          : "none",
    };
    return instance;
  }

  if (kind === "music-box") {
    const instance: MusicBoxInstance = {
      ...base,
      kind: "music-box",
      figurine: (asString(raw.figurine, "ballerina") as MusicBoxInstance["figurine"]),
      engravedText: typeof raw.engravedText === "string" ? raw.engravedText : undefined,
      notes: Array.isArray(raw.notes)
        ? raw.notes.filter((n): n is string => typeof n === "string")
        : undefined,
      melodyId: typeof raw.melodyId === "string" ? raw.melodyId : "lullaby",
    };
    return instance;
  }

  if (kind === "fridge-door") {
    const instance: FridgeDoorInstance = {
      ...base,
      kind: "fridge-door",
      items: parseFridgeItems(raw.items),
    };
    return instance;
  }

  throw new Error(`Unknown experience kind: ${String(kind)}`);
}
