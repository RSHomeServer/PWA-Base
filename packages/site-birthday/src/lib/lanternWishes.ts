export type LanternWishToneName =
  | "warmIvory"
  | "candleWhite"
  | "softAmber"
  | "goldenYellow"
  | "peach"
  | "warmOrange"
  | "blushPink"
  | "roseGold"
  | "paleCoral"
  | "softRed";

export type LanternWishDef = {
  text: string;
  tone: LanternWishToneName;
  /** Darker companion colour for readable wish text. */
  textColor: string;
};

/**
 * Curated wish pool (~20). Each entry pairs a message with a warm lantern tone.
 */
export const LANTERN_WISH_POOL: readonly LanternWishDef[] = [
  {
    text: "I hope today was gentle with you.",
    tone: "warmIvory",
    textColor: "#c4a574",
  },
  {
    text: "I hope you always know how loved you are.",
    tone: "roseGold",
    textColor: "#a86a58",
  },
  {
    text: "I hope this made you smile, even just a little.",
    tone: "peach",
    textColor: "#c47a52",
  },
  {
    text: "I hope you never stop believing in yourself.",
    tone: "goldenYellow",
    textColor: "#b88820",
  },
  {
    text: "I hope your patients know how lucky they are to have you.",
    tone: "candleWhite",
    textColor: "#b89868",
  },
  {
    text: "I hope you always dance like nobody's watching.",
    tone: "blushPink",
    textColor: "#b07070",
  },
  {
    text: "I hope you keep making the world kinder.",
    tone: "softAmber",
    textColor: "#c07828",
  },
  {
    text: "I hope your bed is always warm and your heart even warmer.",
    tone: "warmOrange",
    textColor: "#b85a30",
  },
  {
    text: "I hope every birthday feels this special.",
    tone: "roseGold",
    textColor: "#8a4050",
  },
  {
    text: "I hope one day we'll watch these lanterns together.",
    tone: "goldenYellow",
    textColor: "#a07828",
  },
  {
    text: "I hope you never forget how proud I am of you.",
    tone: "warmIvory",
    textColor: "#a88868",
  },
  {
    text: "I hope every difficult day ends with a little peace.",
    tone: "candleWhite",
    textColor: "#9a8a78",
  },
  {
    text: "I hope your dreams stay bigger than your fears.",
    tone: "paleCoral",
    textColor: "#c06058",
  },
  {
    text: "I hope you always make time to laugh.",
    tone: "peach",
    textColor: "#b07048",
  },
  {
    text: "I hope you always have a reason to look up at the stars.",
    tone: "softAmber",
    textColor: "#b08028",
  },
  {
    text: "I hope we keep collecting little memories together.",
    tone: "warmOrange",
    textColor: "#a85828",
  },
  {
    text: "I hope this reminds you that I'm always cheering you on.",
    tone: "blushPink",
    textColor: "#a05060",
  },
  {
    text: "Home is wherever we're together.",
    tone: "goldenYellow",
    textColor: "#907018",
  },
  {
    text: "I hope you always feel safe, seen and loved.",
    tone: "roseGold",
    textColor: "#7a4050",
  },
  {
    text: "This lantern carries a little piece of my heart to you.",
    tone: "softRed",
    textColor: "#8a3030",
  },
];

export const LANTERN_WISH_TEXTS = LANTERN_WISH_POOL.map((w) => w.text);
