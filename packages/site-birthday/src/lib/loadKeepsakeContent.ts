import { getPackEntryText, getPackEntryUrl } from "@platform/runtime";
import { DEFAULT_KEEPSAKE } from "./constants.js";
import { parseKeepsakeJson } from "./parseKeepsake.js";
import type { KeepsakeDocument, ResolvedKeepsake } from "./keepsakeTypes.js";

const APP_ID = "birthday";
const PACK_ID = "birthday-base";
const KEEPSAKE_PATH = "content/keepsake.json";

async function resolvePackPath(path: string): Promise<string> {
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (/^(https?:|data:|blob:)/i.test(trimmed) || trimmed.startsWith("/")) {
    return trimmed;
  }
  return (await getPackEntryUrl(APP_ID, PACK_ID, trimmed)) ?? trimmed;
}

async function resolveMediaUrls(doc: KeepsakeDocument): Promise<ResolvedKeepsake> {
  const moments = await Promise.all(
    doc.chapters.moments.moments.map(async (m) => ({
      ...m,
      src: await resolvePackPath(m.src),
    })),
  );
  const videoSrc = await resolvePackPath(doc.chapters.until.videoSrc);
  return {
    ...doc,
    chapters: {
      ...doc.chapters,
      moments: { ...doc.chapters.moments, moments },
      until: { ...doc.chapters.until, videoSrc },
    },
  };
}

/**
 * Load keepsake.json from the active birthday-base pack, merge over defaults,
 * and resolve media paths to pack URLs.
 */
export async function loadKeepsakeContent(): Promise<ResolvedKeepsake> {
  const text = await getPackEntryText(APP_ID, PACK_ID, KEEPSAKE_PATH);
  const merged = text
    ? parseKeepsakeJson(text, DEFAULT_KEEPSAKE)
    : structuredClone(DEFAULT_KEEPSAKE);
  return resolveMediaUrls(merged);
}
