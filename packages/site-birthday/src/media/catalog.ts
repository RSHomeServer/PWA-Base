import type { MediaCatalog } from "./types.js";

/**
 * Default placeholder catalog. Replace entries (or swap the fetched JSON)
 * to personalise without changing React experience code.
 *
 * Live source of truth at runtime: `/media/catalog.json`
 * This module is the typed fallback used when fetch fails (offline/dev).
 */
export const FALLBACK_MEDIA_CATALOG: MediaCatalog = {
  version: 1,
  voiceNotes: [
    {
      id: "voice-soft-piano",
      title: "A quiet evening",
      description: "Placeholder tone — swap for a real voice note.",
      src: "/media/voice/soft-piano.mp3",
      format: "mp3",
      durationSec: 3,
      attribution: "MDN CC0 audio sample (t-rex-roar.mp3)",
    },
    {
      id: "voice-breeze",
      title: "Through the window",
      description: "OGG sample for format coverage.",
      src: "/media/voice/breeze.ogg",
      format: "ogg",
      attribution: "Wikimedia Commons sample audio",
    },
    {
      id: "voice-letter",
      title: "Something I meant to say",
      description: "WAV sample for format coverage.",
      src: "/media/voice/letter.wav",
      format: "wav",
      durationSec: 3,
      attribution: "Generated soft tone (local PoC sample)",
    },
    {
      id: "voice-sleeve",
      title: "Side B",
      description: "M4A/AAC sample when available.",
      src: "/media/voice/sleeve.m4a",
      format: "m4a",
      attribution: "Transcoded from MDN CC0 sample when ffmpeg available",
    },
  ],
  photos: [
    {
      id: "photo-morning",
      title: "Morning light",
      caption: "The kind of quiet that stays with you.",
      src: "/media/photos/morning-light.jpg",
      format: "jpg",
      date: "2024-06-12",
      attribution: "Lorem Picsum placeholder photograph",
    },
    {
      id: "photo-street",
      title: "Quiet street",
      caption: "We walked here once, without hurrying.",
      src: "/media/photos/quiet-street.jpeg",
      format: "jpeg",
      date: "2023-11-02",
      attribution: "Lorem Picsum placeholder photograph",
    },
    {
      id: "photo-garden",
      title: "In the garden",
      caption: "PNG format demonstration.",
      src: "/media/photos/garden.png",
      format: "png",
      date: "2025-04-18",
      attribution: "Lorem Picsum photograph converted to PNG for format coverage",
    },
    {
      id: "photo-golden",
      title: "Golden hour",
      caption: "WebP format demonstration.",
      src: "/media/photos/golden-hour.webp",
      format: "webp",
      date: "2024-09-01",
      attribution: "Google WebP gallery sample",
    },
  ],
  videos: [
    {
      id: "video-flower-mp4",
      title: "Reel one — Flower",
      description: "MP4 sample for the projector.",
      src: "/media/videos/flower.mp4",
      format: "mp4",
      playable: true,
      attribution: "MDN CC0 video sample (flower.mp4)",
    },
    {
      id: "video-flower-webm",
      title: "Reel two — Flower (WebM)",
      description: "WebM sample for format coverage.",
      src: "/media/videos/flower.webm",
      format: "webm",
      playable: true,
      attribution: "MDN CC0 video sample (flower.webm)",
    },
    {
      id: "video-archive-mkv",
      title: "Archive reel",
      description: "MKV is listed to show graceful unsupported handling.",
      src: "/media/videos/archive.mkv",
      format: "mkv",
      playable: false,
      attribution: "Intentional unsupported-format placeholder",
    },
  ],
};

const CATALOG_URL = "/media/catalog.json";

let cached: MediaCatalog | null = null;

/** Load the media catalog (JSON first, typed fallback second). */
export async function loadMediaCatalog(): Promise<MediaCatalog> {
  if (cached) return cached;
  try {
    const response = await fetch(CATALOG_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`catalog ${response.status}`);
    const data = (await response.json()) as MediaCatalog;
    if (!data?.voiceNotes || !data?.photos || !data?.videos) {
      throw new Error("catalog shape invalid");
    }
    cached = data;
    return data;
  } catch {
    cached = FALLBACK_MEDIA_CATALOG;
    return cached;
  }
}

export function resetMediaCatalogCache(): void {
  cached = null;
}
