import { defineSite } from "@platform/site-registry/contract";
import { HomePage } from "./pages/HomePage.js";

export const statsSite = defineSite({
  id: "stats",
  basePath: "/",
  title: "Statistical Analysis",
  routes: [{ path: "", component: HomePage }],
});
