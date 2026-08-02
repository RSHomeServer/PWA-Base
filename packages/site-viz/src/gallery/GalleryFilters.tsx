export interface GalleryFiltersProps {
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  showFavouritesOnly: boolean;
  onFavouritesOnlyChange: (value: boolean) => void;
}

export function GalleryFilters({
  categories,
  activeCategory,
  onCategoryChange,
  showFavouritesOnly,
  onFavouritesOnlyChange,
}: GalleryFiltersProps) {
  return (
    <div className="viz-gallery-filters" role="group" aria-label="Filter experiences">
      <button
        type="button"
        className={`viz-gallery-filter-chip${activeCategory === null ? " viz-gallery-filter-chip--active" : ""}`}
        aria-pressed={activeCategory === null}
        onClick={() => onCategoryChange(null)}
      >
        All wings
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={`viz-gallery-filter-chip${activeCategory === category ? " viz-gallery-filter-chip--active" : ""}`}
          aria-pressed={activeCategory === category}
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </button>
      ))}
      <button
        type="button"
        className={`viz-gallery-filter-chip viz-gallery-filter-chip--favourites${showFavouritesOnly ? " viz-gallery-filter-chip--active" : ""}`}
        aria-pressed={showFavouritesOnly}
        onClick={() => onFavouritesOnlyChange(!showFavouritesOnly)}
      >
        ★ Favourites
      </button>
    </div>
  );
}
