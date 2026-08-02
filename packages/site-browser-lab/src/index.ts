import { defineSite } from "@platform/site-registry/contract";
import { BrowserLabPage } from "./pages/BrowserLabPage.js";

export const browserLabSite = defineSite({
  id: "browser-lab",
  basePath: "/",
  title: "Browser Lab",
  routes: [{ path: "", component: BrowserLabPage }],
});
