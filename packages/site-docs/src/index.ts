import { defineSite } from "@platform/site-registry/contract";
import { DocumentExplorerPage } from "./DocumentExplorerPage.js";

export const docsSite = defineSite({
  id: "docs",
  basePath: "/",
  title: "Documents",
  routes: [
    { path: "", component: DocumentExplorerPage },
    { path: ":rootId", component: DocumentExplorerPage },
  ],
});
