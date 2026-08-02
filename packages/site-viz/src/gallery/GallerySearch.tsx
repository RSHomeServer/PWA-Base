export interface GallerySearchProps {
  query: string;
  onQueryChange: (value: string) => void;
  resultCount: number;
}

export function GallerySearch({ query, onQueryChange, resultCount }: GallerySearchProps) {
  return (
    <div className="viz-gallery-search">
      <label className="viz-gallery-search-label" htmlFor="viz-gallery-search-input">
        Search the collection
      </label>
      <input
        id="viz-gallery-search-input"
        type="search"
        className="viz-gallery-search-input"
        placeholder="Fractals, boids, pendulum…"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      <p className="viz-gallery-search-meta" aria-live="polite">
        {resultCount} {resultCount === 1 ? "experience" : "experiences"} visible
      </p>
    </div>
  );
}
