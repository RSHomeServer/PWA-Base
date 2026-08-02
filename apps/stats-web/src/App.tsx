import { statsSite } from "@platform/site-stats";
import { SoloSiteApp } from "@platform/runtime";
import { ThemeProvider } from "@platform/ui";
import { BrowserRouter } from "react-router-dom";

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SoloSiteApp site={statsSite} />
      </BrowserRouter>
    </ThemeProvider>
  );
}
