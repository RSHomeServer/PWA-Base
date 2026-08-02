import { vizSite } from "@platform/site-viz";
import { SoloSiteApp } from "@platform/runtime";
import { ThemeProvider } from "@platform/ui";
import { BrowserRouter } from "react-router-dom";

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SoloSiteApp site={vizSite} />
      </BrowserRouter>
    </ThemeProvider>
  );
}
