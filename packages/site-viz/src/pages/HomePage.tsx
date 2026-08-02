import { useCallback, useMemo, useState } from "react";
import { archiveDemos, featuredDemos, standardDemos, visibleDemos } from "../demos/catalog.js";
import {
  ContinueExploring,
  DemoCard,
  FeaturedCarousel,
  GalleryFilters,
  GallerySearch,
  HeroCanvas,
  filterDemos,
  getFavourites,
  usePersistedDemoLists,
} from "../gallery/index.js";
import "../site.css";
import styles from "./HomePage.module.css";

export function HomePage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [favouriteIds, setFavouriteIds] = useState<string[]>(() => getFavourites());

  const inventory = useMemo(() => visibleDemos(), []);

  const categories = useMemo(
    () => [...new Set(inventory.map((demo) => demo.category ?? "Gallery"))].sort(),
    [inventory],
  );

  const { recentlyViewed } = usePersistedDemoLists(inventory);
  const favouriteDemos = useMemo(
    () =>
      favouriteIds
        .map((id) => inventory.find((demo) => demo.id === id))
        .filter(Boolean) as typeof inventory,
    [favouriteIds, inventory],
  );

  const handleFavouriteChange = useCallback((ids: string[]) => {
    setFavouriteIds(ids);
  }, []);

  const filterOptions = useMemo(
    () => ({ query, category: activeCategory, favouritesOnly, favouriteIds }),
    [query, activeCategory, favouritesOnly, favouriteIds],
  );

  const showingDefaultWing = !query && !activeCategory && !favouritesOnly;

  const collectionPool = useMemo(() => {
    const pool = showingDefaultWing ? standardDemos() : inventory;
    return filterDemos(pool, filterOptions);
  }, [showingDefaultWing, filterOptions, inventory]);

  const filteredArchive = useMemo(
    () => filterDemos(archiveDemos(), filterOptions),
    [filterOptions],
  );
  const visibleCount = collectionPool.length + filteredArchive.length;

  const collectionByCategory = useMemo(() => {
    const map = new Map<string, typeof inventory>();
    for (const demo of collectionPool) {
      const category = demo.category ?? "Gallery";
      const list = map.get(category) ?? [];
      list.push(demo);
      map.set(category, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [collectionPool]);

  return (
    <main className={`viz-page viz-gallery-museum ${styles.museum}`}>
      <section className={`viz-gallery-hero ${styles.hero}`} aria-labelledby="viz-gallery-title">
        <HeroCanvas className={styles.heroCanvas} />
        <div className={styles.heroContent}>
          <p className="viz-gallery-eyebrow">Songara Studio · Visual Computing</p>
          <h1 id="viz-gallery-title" className={styles.heroTitle}>
            Visual Computing Museum
          </h1>
          <p className={styles.heroLead}>
            Eight halls of living installation — gravity that answers your hand, plasma that
            remembers a gesture, curtains of electric light. Stay as long as you like.
          </p>
          <p className={styles.heroStats} aria-label="Collection invitation">
            Now open · 8 flagship halls · wander freely
          </p>
        </div>
      </section>

      <div className={`viz-gallery-toolbar ${styles.toolbar}`}>
        <GallerySearch query={query} onQueryChange={setQuery} resultCount={visibleCount} />
        <GalleryFilters
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          showFavouritesOnly={favouritesOnly}
          onFavouritesOnlyChange={setFavouritesOnly}
        />
      </div>

      {showingDefaultWing ? <FeaturedCarousel demos={featuredDemos()} /> : null}

      {favouriteDemos.length > 0 && !favouritesOnly ? (
        <section
          className="viz-gallery-favourites"
          aria-labelledby="viz-gallery-favourites-heading"
        >
          <h2 id="viz-gallery-favourites-heading" className="viz-gallery-section-title">
            Your favourites
          </h2>
          <ul className="viz-gallery-grid">
            {favouriteDemos.map((demo) => (
              <li key={demo.id}>
                <DemoCard demo={demo} onFavouriteChange={handleFavouriteChange} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showingDefaultWing ? <ContinueExploring demos={recentlyViewed} /> : null}

      {collectionByCategory.map(([category, categoryDemos]) => (
        <section
          key={category}
          className="viz-gallery-wing"
          aria-labelledby={`viz-wing-${category.replace(/\s+/g, "-").toLowerCase()}`}
        >
          <h2
            id={`viz-wing-${category.replace(/\s+/g, "-").toLowerCase()}`}
            className="viz-gallery-section-title"
          >
            {category}
          </h2>
          <ul className="viz-gallery-grid">
            {categoryDemos.map((demo) => (
              <li key={demo.id}>
                <DemoCard demo={demo} onFavouriteChange={handleFavouriteChange} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {filteredArchive.length > 0 ? (
        <section className="viz-gallery-archive" aria-labelledby="viz-gallery-archive-heading">
          <h2 id="viz-gallery-archive-heading" className="viz-gallery-section-title">
            Archive
          </h2>
          <p className="viz-gallery-section-lead">
            Quieter corners of the collection — still fully interactive.
          </p>
          <ul className="viz-gallery-grid viz-gallery-grid--compact">
            {filteredArchive.map((demo) => (
              <li key={demo.id}>
                <DemoCard demo={demo} onFavouriteChange={handleFavouriteChange} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {visibleCount === 0 ? (
        <p className="viz-gallery-empty" role="status">
          No experiences match your search. Try another wing or clear the filters.
        </p>
      ) : null}
    </main>
  );
}
