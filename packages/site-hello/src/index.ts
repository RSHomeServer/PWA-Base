import { defineSite, SITE_CAPABILITY } from "@platform/site-registry/contract";
import { HomePage } from "./pages/HomePage.js";

export const helloSite = defineSite({
  id: "hello",
  basePath: "/",
  title: "Hello",
  requiredPackIds: ["hello-base"],
  capabilities: [SITE_CAPABILITY.offline],
  routes: [{ path: "", component: HomePage }],
});
