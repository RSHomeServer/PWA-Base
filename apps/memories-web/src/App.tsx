import { memoriesSite } from "@platform/site-memories";
import { SoloSiteApp } from "@platform/runtime";
import { ThemeProvider } from "@platform/ui";
import { BrowserRouter } from "react-router-dom";

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SoloSiteApp site={memoriesSite} />
      </BrowserRouter>
    </ThemeProvider>
  );
}
