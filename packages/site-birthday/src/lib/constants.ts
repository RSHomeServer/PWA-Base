/**
 * Built-in keepsake defaults — used when the Content Pack is missing fields.
 * Prefer editing `content/birthday-base/<ver>/content/keepsake.json` for real gifts.
 */

import type { KeepsakeDocument } from "./keepsakeTypes.js";
import { KEEPSAKE_SCHEMA_VERSION } from "./keepsakeTypes.js";

const RECIPIENT = "[Name]";
const GIFTER = "[Your name]";

const DEFAULT_MOMENTS = Array.from({ length: 21 }, (_, i) => ({
  number: i + 1,
  caption: "Replace with a memory, a joke, or a single sentence that captures this year.",
  src: "",
}));

export const DEFAULT_KEEPSAKE: KeepsakeDocument = {
  schemaVersion: KEEPSAKE_SCHEMA_VERSION,
  recipientName: RECIPIENT,
  gifterName: GIFTER,
  storyBegan: "2005-06-21",
  occasionDate: "2026-06-21",
  design: { entryRitual: "cinematic" },
  chapters: {
    hello: {
      kicker: "For",
      title: RECIPIENT,
      script: "with love,",
      signature: GIFTER,
      invitation:
        "Before you scroll — sit with this a moment. Let your eyes adjust to the dark. There are stars here, and they've been waiting for you.",
      scrollCue: "Begin",
    },
    story: {
      eyebrow: "Chapter II",
      title: "The Story So Far",
      letterHeading: "How it began",
      paragraphs: [
        "Replace this with how your story began — a first meeting, a memory of them as a child, the moment you knew they mattered.",
        "Add a second paragraph here: a texture of a season together, an ordinary Tuesday that became extraordinary in hindsight.",
        "Close with what they mean to you now, in this chapter — write it the way you'd say it out loud, quietly, at 2am.",
      ],
      waypoints: [
        { year: "Year 1", label: "First light", note: "A tiny footprint, a world unfolding." },
        {
          year: "Year 7",
          label: "Wonder years",
          note: "Questions without end, laughter in every room.",
        },
        {
          year: "Year 13",
          label: "Becoming",
          note: "Quiet courage, loud dreams, a voice finding its shape.",
        },
        {
          year: "Year 18",
          label: "Threshold",
          note: "Standing at the edge of everything, ready.",
        },
        { year: "Now", label: "This chapter", note: "Not an ending — a luminous beginning." },
      ],
    },
    moments: {
      eyebrow: "Chapter III",
      title: "Twenty-One Moments",
      moments: DEFAULT_MOMENTS,
    },
    letters: {
      eyebrow: "Chapter IV",
      title: "Letters Never Sent",
      letters: [
        {
          id: "open-now",
          seal: "Open now",
          title: "For the day you read this",
          body: [
            `Dearest ${RECIPIENT},`,
            "Replace this paragraph with what you want them to read the moment they open this. Be specific, be tender, be exactly yourself.",
            `With all my love,\n${GIFTER}`,
          ],
        },
        {
          id: "hard-day",
          seal: "Open on a hard day",
          title: "For when things feel heavy",
          body: [
            "Hey, it's me.",
            "Replace this with words of comfort for a rough day — a reminder of their strength, or a memory that always makes them smile.",
            `Always in your corner,\n${GIFTER}`,
          ],
        },
        {
          id: "proud",
          seal: "Open when you're proud of yourself",
          title: "For a win, big or small",
          body: [
            "Look at you.",
            "Replace this with a celebration of who they're becoming — proof that you've been paying attention all along.",
            `So proud of you,\n${GIFTER}`,
          ],
        },
        {
          id: "someday",
          seal: "Open somewhere new",
          title: "For the next adventure",
          body: [
            "Wherever you're reading this—",
            "Replace this with a note for a future trip, a new city, a leap you hope they take.",
            `Wishing I were there with you,\n${GIFTER}`,
          ],
        },
      ],
    },
    love: {
      eyebrow: "Chapter V",
      title: "Everything I Love About You",
      reasons: [
        "Replace with reason one — something specific, not generic.",
        "Replace with reason two.",
        "Replace with reason three.",
        "Replace with reason four.",
        "Replace with reason five.",
        "Replace with reason six.",
        "Replace with reason seven.",
      ],
      favouriteSongs: [
        { title: "Replace with song title", artist: "Replace with artist" },
        { title: "Replace with song title", artist: "Replace with artist" },
        { title: "Replace with song title", artist: "Replace with artist" },
      ],
      favouritePlaces: [
        "Replace with a favourite place",
        "Replace with a favourite place",
        "Replace with a favourite place",
      ],
    },
    future: {
      eyebrow: "Chapter VI",
      title: "Our Future",
      promises: [
        { title: "Somewhere new", note: "Replace with a trip you want to take together." },
        {
          title: "Something brave",
          note: "Replace with a promise — a leap you want to see them take.",
        },
        {
          title: "Something quiet",
          note: "Replace with a small, ordinary future you're looking forward to.",
        },
        { title: "Something big", note: "Replace with a dream you have for their next year." },
      ],
      lanternWishes: [
        "I hope today was gentle with you.",
        "I hope you always know how loved you are.",
        "I hope this made you smile, even just a little.",
        "I hope you never stop believing in yourself.",
        "I hope your patients know how lucky they are to have you.",
        "I hope you always dance like nobody's watching.",
        "I hope you keep making the world kinder.",
        "I hope your bed is always warm and your heart even warmer.",
        "I hope every birthday feels this special.",
        "I hope one day we'll watch these lanterns together.",
        "I hope you never forget how proud I am of you.",
        "I hope every difficult day ends with a little peace.",
        "I hope your dreams stay bigger than your fears.",
        "I hope you always make time to laugh.",
        "I hope you always have a reason to look up at the stars.",
        "I hope we keep collecting little memories together.",
        "I hope this reminds you that I'm always cheering you on.",
        "Home is wherever we're together.",
        "I hope you always feel safe, seen and loved.",
        "This lantern carries a little piece of my heart to you.",
      ],
    },
    until: {
      eyebrow: "Chapter VII",
      title: "Until The Next Adventure",
      videoTitle: "A message for you",
      videoNote: "Replace with a video — recorded just for them, saved for last.",
      videoSrc: "",
      letter: {
        salutation: `Dearest ${RECIPIENT},`,
        paragraphs: [
          "This is the part I kept for last — replace it with whatever you most want them to carry with them after they close this page.",
          "Add a second paragraph: gratitude, a wish, a truth you've never quite said out loud.",
          "However you end it, let it sound like you.",
        ],
        signoff: "With everything,",
        signature: GIFTER,
      },
      closing: "The stars will keep. Come back whenever you need to remember.",
    },
  },
  constellation: {
    name: "The one who stayed",
    meaning: "Replace with a memory this shape brings to mind.",
    stars: [
      { id: "star-1", x: 32, y: 26 },
      { id: "star-2", x: 44, y: 16 },
      { id: "star-3", x: 58, y: 24 },
      { id: "star-4", x: 50, y: 40 },
      { id: "star-5", x: 34, y: 48 },
      { id: "star-6", x: 22, y: 36 },
    ],
    order: ["star-2", "star-1", "star-6", "star-5", "star-4", "star-3", "star-2"],
  },
  easterEggs: {
    konami: "You found the golden sequence — some things are worth the long way round.",
    tripleClickSignature:
      "Hidden wish: may this next year shimmer with grace you haven't yet imagined.",
    hiddenWord: "You read closely. That's rare, and it's one of the things worth loving.",
    allLanternsReleased: "Every wish is on its way. Look up, every now and then.",
  },
  hiddenWord: "always",
};

/** @deprecated Prefer useKeepsakeContent() — retained for gradual migration. */
export const RECIPIENT_NAME = DEFAULT_KEEPSAKE.recipientName;
/** @deprecated Prefer useKeepsakeContent() */
export const GIFTER_NAME = DEFAULT_KEEPSAKE.gifterName;
/** @deprecated Prefer useKeepsakeContent() */
export const STORY_BEGAN = new Date(`${DEFAULT_KEEPSAKE.storyBegan}T00:00:00`);
/** @deprecated Prefer useKeepsakeContent() */
export const OCCASION_DATE = new Date(`${DEFAULT_KEEPSAKE.occasionDate}T00:00:00`);
/** @deprecated Prefer useKeepsakeContent() */
export const CHAPTER_ONE = DEFAULT_KEEPSAKE.chapters.hello;
/** @deprecated Prefer useKeepsakeContent() */
export const CHAPTER_TWO = DEFAULT_KEEPSAKE.chapters.story;
/** @deprecated Prefer useKeepsakeContent() */
export const STORY_WAYPOINTS = DEFAULT_KEEPSAKE.chapters.story.waypoints;
/** @deprecated Prefer useKeepsakeContent() */
export const MOMENTS = DEFAULT_KEEPSAKE.chapters.moments.moments;
/** @deprecated Prefer useKeepsakeContent() */
export const LETTERS = DEFAULT_KEEPSAKE.chapters.letters.letters;
/** @deprecated Prefer useKeepsakeContent() */
export const REASONS = DEFAULT_KEEPSAKE.chapters.love.reasons;
/** @deprecated Prefer useKeepsakeContent() */
export const FAVOURITE_SONGS = DEFAULT_KEEPSAKE.chapters.love.favouriteSongs;
/** @deprecated Prefer useKeepsakeContent() */
export const FAVOURITE_PLACES = DEFAULT_KEEPSAKE.chapters.love.favouritePlaces;
/** @deprecated Prefer useKeepsakeContent() */
export const FUTURE_PROMISES = DEFAULT_KEEPSAKE.chapters.future.promises;
/** @deprecated Prefer useKeepsakeContent() */
export const LANTERN_WISHES = DEFAULT_KEEPSAKE.chapters.future.lanternWishes;
/** @deprecated Prefer useKeepsakeContent() */
export const CHAPTER_SEVEN = DEFAULT_KEEPSAKE.chapters.until;
/** @deprecated Prefer useKeepsakeContent() */
export const OPENING_CONSTELLATION = DEFAULT_KEEPSAKE.constellation;
/** @deprecated Prefer useKeepsakeContent() */
export const EASTER_EGGS = DEFAULT_KEEPSAKE.easterEggs;
/** @deprecated Prefer useKeepsakeContent() */
export const HIDDEN_WORD = DEFAULT_KEEPSAKE.hiddenWord;

export type { KeepsakeConstellationStar as ConstellationStar } from "./keepsakeTypes.js";

export interface TimeElapsed {
  years: number;
  days: number;
}

export function getTimeElapsed(since: Date, now = new Date()): TimeElapsed {
  const ms = Math.max(0, now.getTime() - since.getTime());
  const totalDays = Math.floor(ms / (1000 * 60 * 60 * 24));
  return { years: Math.floor(totalDays / 365.25), days: totalDays % 365 };
}
