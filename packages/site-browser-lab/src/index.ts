import { defineSite, SITE_CAPABILITY } from "@platform/site-registry/contract";
import { BrowserLabPage } from "./pages/BrowserLabPage.js";

export const browserLabSite = defineSite({
  id: "browser-lab",
  basePath: "/",
  title: "Browser Lab",
  capabilities: [SITE_CAPABILITY.fullBleed],
  routes: [{ path: "", component: BrowserLabPage }],
});
