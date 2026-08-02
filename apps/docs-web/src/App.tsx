import { docsSite } from "@platform/site-docs";
import { SoloSiteApp } from "@platform/runtime";
import { ThemeProvider } from "@platform/ui";
import { BrowserRouter } from "react-router-dom";

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SoloSiteApp site={docsSite} />
      </BrowserRouter>
    </ThemeProvider>
  );
}
