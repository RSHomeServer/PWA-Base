import { defineSite } from "@platform/site-registry/contract";
import "./site.css";
import { HistoryPage } from "./pages/HistoryPage.js";
import { RedirectToRuns } from "./pages/RedirectToRuns.js";
import { OperationsPage } from "./pages/OperationsPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";
import { NotificationsPage } from "./pages/NotificationsPage.js";

export const dashboardSite = defineSite({
  id: "dashboard",
  basePath: "/",
  title: "AI Development Dashboard",
  routes: [
    { path: "", component: HistoryPage },
    { path: "/history", component: RedirectToRuns },
    { path: "/prompts", component: RedirectToRuns },
    { path: "/prompts/:promptId", component: RedirectToRuns },
    { path: "/notifications", component: NotificationsPage },
    { path: "/ops", component: OperationsPage },
    { path: "/settings", component: SettingsPage },
  ],
});
