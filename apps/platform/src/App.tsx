import { PlatformChrome } from "@platform/runtime";
import { ThemeProvider } from "@platform/ui";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./AppRoutes";
import { CATALOGUE_NAV } from "./nav/catalogueNav";
import { CommandPaletteHost } from "./shell/CommandPaletteHost";

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <CommandPaletteHost>
          <PlatformChrome nav={CATALOGUE_NAV}>
            <AppRoutes />
          </PlatformChrome>
        </CommandPaletteHost>
      </BrowserRouter>
    </ThemeProvider>
  );
}
