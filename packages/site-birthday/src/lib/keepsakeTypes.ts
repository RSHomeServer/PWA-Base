/**
 * Birthday keepsake content schema (pack-backed).
 * Authoring: packages/site-birthday/content/birthday-base/<ver>/content/keepsake.json
 */

export const KEEPSAKE_SCHEMA_VERSION = 1 as const;

export type KeepsakeMoment = {
  number: number;
  caption: string;
  /** Pack-relative path, absolute URL, or empty for an intentional empty frame. */
  src: string;
  /** Optional handwritten note revealed by lifting the photo. */
  noteUnder?: string;
};

export type KeepsakeLetter = {
  id: string;
  seal: string;
  title: string;
  body: string[];
};

export type KeepsakeWaypoint = {
  year: string;
  label: string;
  note: string;
};

export type KeepsakeSong = { title: string; artist: string };
export type KeepsakePromise = { title: string; note: string };

export type KeepsakeConstellationStar = {
  id: string;
  x: number;
  y: number;
};

export type KeepsakeDocument = {
  schemaVersion: typeof KEEPSAKE_SCHEMA_VERSION | number;
  recipientName: string;
  gifterName: string;
  /** ISO date YYYY-MM-DD */
  storyBegan: string;
  occasionDate: string;
  design?: {
    /**
     * Opening sequence.
     * - `cinematic` — night sky → constellation → pullback (default)
     * - `none` — skip camera prologue
     * - `wax-seal` — deprecated; treated as cinematic (wax remains on letters)
     */
    entryRitual?: "cinematic" | "none" | "wax-seal";
  };
  chapters: {
    hello: {
      kicker: string;
      title: string;
      script: string;
      signature: string;
      invitation: string;
      scrollCue: string;
    };
    story: {
      eyebrow: string;
      title: string;
      letterHeading: string;
      paragraphs: string[];
      waypoints: KeepsakeWaypoint[];
    };
    moments: {
      eyebrow: string;
      title: string;
      moments: KeepsakeMoment[];
    };
    letters: {
      eyebrow: string;
      title: string;
      letters: KeepsakeLetter[];
    };
    love: {
      eyebrow: string;
      title: string;
      reasons: string[];
      favouriteSongs: KeepsakeSong[];
      favouritePlaces: string[];
    };
    future: {
      eyebrow: string;
      title: string;
      promises: KeepsakePromise[];
      lanternWishes: string[];
    };
    until: {
      eyebrow: string;
      title: string;
      videoTitle: string;
      videoNote: string;
      videoSrc: string;
      letter: {
        salutation: string;
        paragraphs: string[];
        signoff: string;
        signature: string;
      };
      closing: string;
    };
  };
  constellation: {
    name: string;
    meaning: string;
    stars: KeepsakeConstellationStar[];
    order: string[];
  };
  easterEggs: {
    konami: string;
    tripleClickSignature: string;
    hiddenWord: string;
    allLanternsReleased: string;
  };
  hiddenWord: string;
};

/** Resolved document with media paths turned into fetchable URLs where possible. */
export type ResolvedKeepsake = KeepsakeDocument;
