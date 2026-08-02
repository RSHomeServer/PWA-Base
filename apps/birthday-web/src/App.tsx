import { birthdaySite, ExperienceRuntimeProvider, EnterTransitionHost } from "@platform/site-birthday";
import { SoloSiteApp } from "@platform/runtime";
import { ThemeProvider } from "@platform/ui";
import { BrowserRouter } from "react-router-dom";

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ExperienceRuntimeProvider>
          <SoloSiteApp site={birthdaySite} />
          <EnterTransitionHost />
        </ExperienceRuntimeProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
