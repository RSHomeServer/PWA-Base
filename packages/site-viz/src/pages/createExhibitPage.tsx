import type { ReactElement } from "react";
import type { Exhibit } from "../exhibits/types.js";
import { ExhibitPage } from "./ExhibitPage.js";

export function createExhibitPage(exhibit: Exhibit): () => ReactElement {
  return function ExhibitRoutePage() {
    return <ExhibitPage exhibit={exhibit} />;
  };
}
