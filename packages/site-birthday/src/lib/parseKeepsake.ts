import {
  KEEPSAKE_SCHEMA_VERSION,
  type KeepsakeDocument,
  type KeepsakeLetter,
  type KeepsakeMoment,
} from "./keepsakeTypes.js";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.map((v) => asString(v)).filter(Boolean);
}

function mergeMoment(raw: unknown, fallback: KeepsakeMoment): KeepsakeMoment {
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  return {
    number: typeof o.number === "number" ? o.number : fallback.number,
    caption: asString(o.caption, fallback.caption),
    src: asString(o.src, fallback.src),
    noteUnder:
      o.noteUnder === undefined ? fallback.noteUnder : asString(o.noteUnder) || undefined,
  };
}

function mergeLetter(raw: unknown, fallback: KeepsakeLetter): KeepsakeLetter {
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  return {
    id: asString(o.id, fallback.id),
    seal: asString(o.seal, fallback.seal),
    title: asString(o.title, fallback.title),
    body: asStringArray(o.body, fallback.body),
  };
}

/**
 * Deep-merge a partial pack document over defaults.
 * Unknown / missing fields fall back so authoring can be incremental.
 */
export function mergeKeepsakeDocument(
  partial: unknown,
  defaults: KeepsakeDocument,
): KeepsakeDocument {
  if (!partial || typeof partial !== "object") return defaults;
  const p = partial as Record<string, unknown>;
  const chapters = (p.chapters ?? {}) as Record<string, unknown>;
  const dCh = defaults.chapters;

  const momentsRaw = (chapters.moments ?? {}) as Record<string, unknown>;
  const momentsList = Array.isArray(momentsRaw.moments)
    ? momentsRaw.moments.map((m, i) =>
        mergeMoment(m, dCh.moments.moments[i] ?? dCh.moments.moments[0]!),
      )
    : dCh.moments.moments;

  const lettersRaw = (chapters.letters ?? {}) as Record<string, unknown>;
  const lettersList = Array.isArray(lettersRaw.letters)
    ? lettersRaw.letters.map((l, i) =>
        mergeLetter(l, dCh.letters.letters[i] ?? dCh.letters.letters[0]!),
      )
    : dCh.letters.letters;

  const storyRaw = (chapters.story ?? {}) as Record<string, unknown>;
  const loveRaw = (chapters.love ?? {}) as Record<string, unknown>;
  const futureRaw = (chapters.future ?? {}) as Record<string, unknown>;
  const untilRaw = (chapters.until ?? {}) as Record<string, unknown>;
  const helloRaw = (chapters.hello ?? {}) as Record<string, unknown>;
  const untilLetter = (untilRaw.letter ?? {}) as Record<string, unknown>;
  const constellation = (p.constellation ?? {}) as Record<string, unknown>;
  const eggs = (p.easterEggs ?? {}) as Record<string, unknown>;
  const design = (p.design ?? {}) as Record<string, unknown>;

  return {
    schemaVersion:
      typeof p.schemaVersion === "number" ? p.schemaVersion : KEEPSAKE_SCHEMA_VERSION,
    recipientName: asString(p.recipientName, defaults.recipientName),
    gifterName: asString(p.gifterName, defaults.gifterName),
    storyBegan: asString(p.storyBegan, defaults.storyBegan),
    occasionDate: asString(p.occasionDate, defaults.occasionDate),
    design: {
      entryRitual:
        design.entryRitual === "none" ||
        design.entryRitual === "cinematic" ||
        design.entryRitual === "wax-seal"
          ? design.entryRitual === "wax-seal"
            ? "cinematic"
            : design.entryRitual
          : defaults.design?.entryRitual ?? "cinematic",
    },
    chapters: {
      hello: {
        kicker: asString(helloRaw.kicker, dCh.hello.kicker),
        title: asString(helloRaw.title, dCh.hello.title),
        script: asString(helloRaw.script, dCh.hello.script),
        signature: asString(helloRaw.signature, dCh.hello.signature),
        invitation: asString(helloRaw.invitation, dCh.hello.invitation),
        scrollCue: asString(helloRaw.scrollCue, dCh.hello.scrollCue),
      },
      story: {
        eyebrow: asString(storyRaw.eyebrow, dCh.story.eyebrow),
        title: asString(storyRaw.title, dCh.story.title),
        letterHeading: asString(storyRaw.letterHeading, dCh.story.letterHeading),
        paragraphs: asStringArray(storyRaw.paragraphs, [...dCh.story.paragraphs]),
        waypoints: Array.isArray(storyRaw.waypoints)
          ? storyRaw.waypoints.map((w, i) => {
              const fb = dCh.story.waypoints[i] ?? dCh.story.waypoints[0]!;
              if (!w || typeof w !== "object") return fb;
              const o = w as Record<string, unknown>;
              return {
                year: asString(o.year, fb.year),
                label: asString(o.label, fb.label),
                note: asString(o.note, fb.note),
              };
            })
          : dCh.story.waypoints,
      },
      moments: {
        eyebrow: asString(momentsRaw.eyebrow, dCh.moments.eyebrow),
        title: asString(momentsRaw.title, dCh.moments.title),
        moments: momentsList,
      },
      letters: {
        eyebrow: asString(lettersRaw.eyebrow, dCh.letters.eyebrow),
        title: asString(lettersRaw.title, dCh.letters.title),
        letters: lettersList,
      },
      love: {
        eyebrow: asString(loveRaw.eyebrow, dCh.love.eyebrow),
        title: asString(loveRaw.title, dCh.love.title),
        reasons: asStringArray(loveRaw.reasons, [...dCh.love.reasons]),
        favouriteSongs: Array.isArray(loveRaw.favouriteSongs)
          ? loveRaw.favouriteSongs.map((s, i) => {
              const fb = dCh.love.favouriteSongs[i] ?? dCh.love.favouriteSongs[0]!;
              if (!s || typeof s !== "object") return fb;
              const o = s as Record<string, unknown>;
              return {
                title: asString(o.title, fb.title),
                artist: asString(o.artist, fb.artist),
              };
            })
          : dCh.love.favouriteSongs,
        favouritePlaces: asStringArray(loveRaw.favouritePlaces, [
          ...dCh.love.favouritePlaces,
        ]),
      },
      future: {
        eyebrow: asString(futureRaw.eyebrow, dCh.future.eyebrow),
        title: asString(futureRaw.title, dCh.future.title),
        promises: Array.isArray(futureRaw.promises)
          ? futureRaw.promises.map((pr, i) => {
              const fb = dCh.future.promises[i] ?? dCh.future.promises[0]!;
              if (!pr || typeof pr !== "object") return fb;
              const o = pr as Record<string, unknown>;
              return {
                title: asString(o.title, fb.title),
                note: asString(o.note, fb.note),
              };
            })
          : dCh.future.promises,
        lanternWishes: asStringArray(futureRaw.lanternWishes, [
          ...dCh.future.lanternWishes,
        ]),
      },
      until: {
        eyebrow: asString(untilRaw.eyebrow, dCh.until.eyebrow),
        title: asString(untilRaw.title, dCh.until.title),
        videoTitle: asString(untilRaw.videoTitle, dCh.until.videoTitle),
        videoNote: asString(untilRaw.videoNote, dCh.until.videoNote),
        videoSrc: asString(untilRaw.videoSrc, dCh.until.videoSrc),
        letter: {
          salutation: asString(untilLetter.salutation, dCh.until.letter.salutation),
          paragraphs: asStringArray(untilLetter.paragraphs, [
            ...dCh.until.letter.paragraphs,
          ]),
          signoff: asString(untilLetter.signoff, dCh.until.letter.signoff),
          signature: asString(untilLetter.signature, dCh.until.letter.signature),
        },
        closing: asString(untilRaw.closing, dCh.until.closing),
      },
    },
    constellation: {
      name: asString(constellation.name, defaults.constellation.name),
      meaning: asString(constellation.meaning, defaults.constellation.meaning),
      stars: Array.isArray(constellation.stars)
        ? constellation.stars.map((s, i) => {
            const fb = defaults.constellation.stars[i] ?? defaults.constellation.stars[0]!;
            if (!s || typeof s !== "object") return fb;
            const o = s as Record<string, unknown>;
            return {
              id: asString(o.id, fb.id),
              x: typeof o.x === "number" ? o.x : fb.x,
              y: typeof o.y === "number" ? o.y : fb.y,
            };
          })
        : defaults.constellation.stars,
      order: asStringArray(constellation.order, [...defaults.constellation.order]),
    },
    easterEggs: {
      konami: asString(eggs.konami, defaults.easterEggs.konami),
      tripleClickSignature: asString(
        eggs.tripleClickSignature,
        defaults.easterEggs.tripleClickSignature,
      ),
      hiddenWord: asString(eggs.hiddenWord, defaults.easterEggs.hiddenWord),
      allLanternsReleased: asString(
        eggs.allLanternsReleased,
        defaults.easterEggs.allLanternsReleased,
      ),
    },
    hiddenWord: asString(p.hiddenWord, defaults.hiddenWord),
  };
}

export function parseKeepsakeJson(text: string, defaults: KeepsakeDocument): KeepsakeDocument {
  try {
    return mergeKeepsakeDocument(JSON.parse(text) as unknown, defaults);
  } catch {
    return defaults;
  }
}
