import { useMemo } from "react";
import type { DemoEntry } from "../demos/catalog.js";
import { getFavourites, getRecentlyViewed } from "./storage.js";

export function usePersistedDemoLists(allDemos: DemoEntry[]) {
  const favourites = useMemo(() => {
    const ids = getFavourites();
    return ids
      .map((id) => allDemos.find((demo) => demo.id === id))
      .filter((demo): demo is DemoEntry => demo !== undefined);
  }, [allDemos]);

  const recentlyViewed = useMemo(() => {
    const ids = getRecentlyViewed();
    return ids
      .map((id) => allDemos.find((demo) => demo.id === id))
      .filter((demo): demo is DemoEntry => demo !== undefined);
  }, [allDemos]);

  return { favourites, recentlyViewed };
}

export function filterDemos(
  demos: DemoEntry[],
  options: {
    query: string;
    category: string | null;
    favouritesOnly: boolean;
    favouriteIds: string[];
  },
): DemoEntry[] {
  const normalizedQuery = options.query.trim().toLowerCase();

  return demos.filter((demo) => {
    if (options.favouritesOnly && !options.favouriteIds.includes(demo.id)) {
      return false;
    }
    if (options.category && (demo.category ?? "Gallery") !== options.category) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }

    const haystack = [demo.title, demo.summary, demo.category ?? "", ...(demo.tags ?? [])]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
