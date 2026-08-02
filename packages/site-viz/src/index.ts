import { defineSite } from "@platform/site-registry/contract";
import { exhibits } from "./exhibits/registry.js";
import { CafeWallPage } from "./pages/CafeWallPage.js";
import { createExhibitPage } from "./pages/createExhibitPage.js";
import { HomePage } from "./pages/HomePage.js";
import { LissajousPage } from "./pages/LissajousPage.js";
import { MandelbrotPage } from "./pages/MandelbrotPage.js";
import { SierpinskiPage } from "./pages/SierpinskiPage.js";
import { MandelbrotExplorerPage } from "./flagship/mandelbrot-explorer/MandelbrotExplorerPage.js";
import { JuliaExplorerPage } from "./flagship/julia-explorer/JuliaExplorerPage.js";
import { DoublePendulumProPage } from "./flagship/double-pendulum-pro/DoublePendulumProPage.js";
import { BoidsLabPage } from "./flagship/boids-lab/BoidsLabPage.js";
import { LifeLabPage } from "./flagship/life-lab/LifeLabPage.js";
import { ReactionPaintPage } from "./flagship/reaction-paint/ReactionPaintPage.js";
import { FluidLabPage } from "./flagship/fluid-lab/FluidLabPage.js";
import { AuroraSkyPage } from "./flagship/aurora-sky/AuroraSkyPage.js";
import { EventHorizonPage } from "./flagship/event-horizon/EventHorizonPage.js";
import { LivingTreePage } from "./flagship/living-tree/LivingTreePage.js";
import { CymaticsPage } from "./flagship/cymatics/CymaticsPage.js";
import { AudioLabPage } from "./flagship/audio-lab/AudioLabPage.js";

const exhibitRoutes = exhibits.map((exhibit) => ({
  path: exhibit.path,
  component: createExhibitPage(exhibit),
}));

export const vizSite = defineSite({
  id: "viz",
  basePath: "/",
  title: "Visual Computing",
  routes: [
    { path: "", component: HomePage },
    { path: "/cafe-wall", component: CafeWallPage },
    { path: "/mandelbrot", component: MandelbrotPage },
    { path: "/sierpinski", component: SierpinskiPage },
    { path: "/lissajous", component: LissajousPage },
    { path: "/mandelbrot-explorer", component: MandelbrotExplorerPage },
    { path: "/julia-explorer", component: JuliaExplorerPage },
    { path: "/double-pendulum-pro", component: DoublePendulumProPage },
    { path: "/boids-lab", component: BoidsLabPage },
    { path: "/life-lab", component: LifeLabPage },
    { path: "/reaction-paint", component: ReactionPaintPage },
    { path: "/fluid-lab", component: FluidLabPage },
    { path: "/aurora-sky", component: AuroraSkyPage },
    { path: "/event-horizon", component: EventHorizonPage },
    { path: "/living-tree", component: LivingTreePage },
    { path: "/cymatics", component: CymaticsPage },
    { path: "/audio-lab", component: AudioLabPage },
    ...exhibitRoutes,
  ],
});
