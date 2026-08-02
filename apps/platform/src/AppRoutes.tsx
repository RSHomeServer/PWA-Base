import { Route, Routes } from "react-router-dom";
import { CataloguePage } from "./pages/CataloguePage";

/**
 * apps.songara.uk is catalogue-only — applications are independently hosted.
 * Chrome (sidebar + mega bar) wraps these routes via PlatformChrome in App.tsx.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CataloguePage />} />
      <Route path="*" element={<CataloguePage />} />
    </Routes>
  );
}
