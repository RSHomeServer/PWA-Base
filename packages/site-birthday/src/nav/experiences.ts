export type BirthdayExperience = {
  id: string;
  path: string;
  title: string;
  description: string;
  cardLabel: string;
  cardEmoji: string;
  showOnLanding: boolean;
  inNavCycle: boolean;
};

export const BIRTHDAY_EXPERIENCES: readonly BirthdayExperience[] = [
  {
    id: "constellation",
    path: "/constellation",
    title: "Constellation",
    description: "Find me among the stars.",
    cardLabel: "Constellation",
    cardEmoji: "⭐",
    showOnLanding: true,
    inNavCycle: true,
  },
  {
    id: "lanterns",
    path: "/lanterns",
    title: "Lantern Wishes",
    description: "Send a wish into the night sky.",
    cardLabel: "Lantern Wishes",
    cardEmoji: "🏮",
    showOnLanding: true,
    inNavCycle: true,
  },
  {
    id: "voice",
    path: "/voice",
    title: "Voice Notes",
    description: "Place a record and listen.",
    cardLabel: "Voice Notes",
    cardEmoji: "🎙",
    showOnLanding: true,
    inNavCycle: true,
  },
  {
    id: "photos",
    path: "/photos",
    title: "Photos",
    description: "Turn the pages of an album.",
    cardLabel: "Photos",
    cardEmoji: "📸",
    showOnLanding: true,
    inNavCycle: true,
  },
  {
    id: "videos",
    path: "/videos",
    title: "Videos",
    description: "Open the curtain and project a reel.",
    cardLabel: "Videos",
    cardEmoji: "🎥",
    showOnLanding: true,
    inNavCycle: true,
  },
  {
    id: "messages",
    path: "/messages",
    title: "Messages",
    description: "Messages will live here.",
    cardLabel: "Messages",
    cardEmoji: "💌",
    showOnLanding: true,
    inNavCycle: true,
  },
  {
    id: "settings",
    path: "/settings",
    title: "Settings",
    description: "Tune the room and your keepsakes.",
    cardLabel: "Settings",
    cardEmoji: "⚙",
    showOnLanding: false,
    inNavCycle: false,
  },
  {
    id: "keepsake",
    path: "/keepsake",
    title: "Website",
    description: "The full birthday keepsake chapters.",
    cardLabel: "Website",
    cardEmoji: "📖",
    showOnLanding: false,
    inNavCycle: false,
  },
] as const;

export const LANDING_EXPERIENCES = BIRTHDAY_EXPERIENCES.filter(
  (experience) => experience.showOnLanding,
);

export const NAV_CYCLE_EXPERIENCES = BIRTHDAY_EXPERIENCES.filter(
  (experience) => experience.inNavCycle,
);

export function getExperienceByPath(
  path: string,
): BirthdayExperience | undefined {
  return BIRTHDAY_EXPERIENCES.find((experience) => experience.path === path);
}
