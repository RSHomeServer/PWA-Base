import { defineSite } from "@platform/site-registry/contract";
import { CataloguePage } from "./pages/CataloguePage.js";
import { ExperiencePage } from "./pages/ExperiencePage.js";
import { MomentPage } from "./pages/MomentPage.js";

export { FindUsMoment } from "./moments/FindUsMoment.js";
export type { StarMemoryRequestPayload } from "./moments/FindUsMoment.js";

export const memoriesSite = defineSite({
  id: "memories",
  basePath: "/",
  title: "Memories",
  routes: [
    { path: "", component: CataloguePage },
    { path: "/moment", component: MomentPage },
    { path: "/:kind/:id", component: ExperiencePage },
  ],
});
