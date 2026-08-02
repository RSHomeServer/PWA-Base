import { helloSite } from "@platform/site-hello";
import { SoloSiteApp } from "@platform/runtime";
import { ThemeProvider } from "@platform/ui";
import { BrowserRouter } from "react-router-dom";

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SoloSiteApp site={helloSite} />
      </BrowserRouter>
    </ThemeProvider>
  );
}
