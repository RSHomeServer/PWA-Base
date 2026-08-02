import { defineSite } from "@platform/site-registry/contract";
import { BadgePage } from "./pages/BadgePage.js";
import { ButtonPage } from "./pages/ButtonPage.js";
import { EmptyStatePage } from "./pages/EmptyStatePage.js";
import { FormControlsPage } from "./pages/FormControlsPage.js";
import { HomePage } from "./pages/HomePage.js";
import { IconButtonPage } from "./pages/IconButtonPage.js";
import { KbdPage } from "./pages/KbdPage.js";
import { LoadingPage } from "./pages/LoadingPage.js";
import { ParameterPanelPage } from "./pages/ParameterPanelPage.js";
import { StackPage } from "./pages/StackPage.js";
import { SurfacePanelPage } from "./pages/SurfacePanelPage.js";
import { ThemeTogglePage } from "./pages/ThemeTogglePage.js";

export const componentsSite = defineSite({
  id: "components",
  basePath: "/",
  title: "Components",
  routes: [
    { path: "", component: HomePage },
    { path: "/button", component: ButtonPage },
    { path: "/icon-button", component: IconButtonPage },
    { path: "/form-controls", component: FormControlsPage },
    { path: "/badge", component: BadgePage },
    { path: "/surface-panel", component: SurfacePanelPage },
    { path: "/theme-toggle", component: ThemeTogglePage },
    { path: "/empty-state", component: EmptyStatePage },
    { path: "/loading", component: LoadingPage },
    { path: "/kbd", component: KbdPage },
    { path: "/stack", component: StackPage },
    { path: "/parameter-panel", component: ParameterPanelPage },
  ],
});

export { components } from "./catalog.js";
