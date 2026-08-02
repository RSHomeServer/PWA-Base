import type { ExperienceInstance } from "./types.js";
import { FridgeDoorExperience } from "./fridge-door/FridgeDoorExperience.js";
import { MusicBoxExperience } from "./music-box/MusicBoxExperience.js";
import { SnowGlobeExperience } from "./snow-globe/SnowGlobeExperience.js";

/** Mount the correct stage for a parsed instance. */
export function ExperienceStage({ instance }: { instance: ExperienceInstance }) {
  switch (instance.kind) {
    case "snow-globe":
      return <SnowGlobeExperience instance={instance} />;
    case "music-box":
      return <MusicBoxExperience instance={instance} />;
    case "fridge-door":
      return <FridgeDoorExperience instance={instance} />;
    default: {
      const _exhaustive: never = instance;
      return _exhaustive;
    }
  }
}
