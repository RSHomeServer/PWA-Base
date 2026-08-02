import { createContext } from "react";

export interface TocEntry {
  id: string;
  title: string;
}

export interface ShowcaseTocContextValue {
  entries: TocEntry[];
  register: (entry: TocEntry) => () => void;
}

export const ShowcaseTocContext = createContext<ShowcaseTocContextValue | null>(null);
