import { defineSite, SITE_CAPABILITY } from "@platform/site-registry/contract";
import { BirthdayPage } from "./pages/BirthdayPage.js";
import { ConstellationPage } from "./pages/ConstellationPage.js";
import { ExperiencesPage } from "./pages/ExperiencesPage.js";
import { HomePage } from "./pages/HomePage.js";
import { LandingPage } from "./pages/LandingPage.js";
import { LanternsPage } from "./pages/LanternsPage.js";
import { PhotosPage } from "./pages/PhotosPage.js";
import { PortalsPage } from "./pages/PortalsPage.js";
import { PlaceholderExperiencePage } from "./pages/PlaceholderExperiencePage.js";
import { VideosPage } from "./pages/VideosPage.js";
import { VoicePage } from "./pages/VoicePage.js";

export { BirthdayPage };
export { ExperiencesPage };
export { HomePage };
export { LandingPage };
export { LanternsPage };
export { PhotosPage };
export { PortalsPage };
export { ConstellationPage };
export { VideosPage };
export { VoicePage };
export {
  ExperienceRuntimeProvider,
  EnterTransitionHost,
} from "./experiences/runtimePublic.js";

export const birthdaySite = defineSite({
  id: "birthday",
  basePath: "/",
  title: "Birthday",
  requiredPackIds: ["birthday-base"],
  capabilities: [
    SITE_CAPABILITY.offline,
    SITE_CAPABILITY.media,
    SITE_CAPABILITY.fullBleed,
    SITE_CAPABILITY.defaultTopbarCollapsed,
  ],
  routes: [
    { path: "", component: BirthdayPage },
    { path: "/bedroom", component: HomePage },
    { path: "/experiences", component: ExperiencesPage },
    { path: "/portals", component: PortalsPage },
    { path: "/constellation", component: ConstellationPage },
    { path: "/lanterns", component: LanternsPage },
    { path: "/lantern", component: LanternsPage },
    { path: "/voice", component: VoicePage },
    { path: "/photos", component: PhotosPage },
    { path: "/videos", component: VideosPage },
    { path: "/messages", component: PlaceholderExperiencePage },
    { path: "/settings", component: PlaceholderExperiencePage },
    /** Legacy path — same Birthday website as `/`. */
    { path: "/keepsake", component: BirthdayPage },
  ],
});
