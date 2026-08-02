import { useCallback, useMemo, useState, type MouseEvent } from "react";
import { Link } from "@platform/ui";
import { demoHref, type DemoEntry } from "../demos/catalog.js";
import { resolvePreviewSource } from "./previewResolver.js";
import { PreviewCanvas } from "./PreviewCanvas.js";
import { isFavourite, toggleFavourite } from "./storage.js";

export interface DemoCardProps {
  demo: DemoEntry;
  variant?: "standard" | "featured";
  onFavouriteChange?: (ids: string[]) => void;
}

export function DemoCard({ demo, variant = "standard", onFavouriteChange }: DemoCardProps) {
  const [favourited, setFavourited] = useState(() => isFavourite(demo.id));
  const preview = useMemo(() => resolvePreviewSource(demo.id, demo.path), [demo.id, demo.path]);

  const handleFavouriteClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const next = toggleFavourite(demo.id);
      setFavourited(next.includes(demo.id));
      onFavouriteChange?.(next);
    },
    [demo.id, onFavouriteChange],
  );

  const cardClass =
    variant === "featured" ? "viz-gallery-card viz-gallery-card--featured" : "viz-gallery-card";

  return (
    <article className={cardClass}>
      <Link
        href={demoHref(demo.path)}
        className="viz-gallery-card-link"
        aria-label={`Open ${demo.title}`}
      >
        <div className="viz-gallery-card-preview">
          {preview ? (
            <PreviewCanvas
              source={preview}
              label={demo.title}
              width={variant === "featured" ? 480 : 320}
              height={variant === "featured" ? 270 : 180}
              className="viz-gallery-card-canvas"
            />
          ) : (
            <div className="viz-gallery-card-fallback" aria-hidden="true" />
          )}
          <span className="viz-gallery-card-shimmer" aria-hidden="true" />
        </div>
        <div className="viz-gallery-card-body">
          <span className="viz-gallery-card-tag">{demo.category ?? "Gallery"}</span>
          <h3 className="viz-gallery-card-title">{demo.title}</h3>
          <p className="viz-gallery-card-summary">{demo.summary}</p>
          <span className="viz-gallery-card-cta">Enter experience</span>
        </div>
      </Link>
      <button
        type="button"
        className={`viz-gallery-favourite${favourited ? " viz-gallery-favourite--active" : ""}`}
        aria-pressed={favourited}
        aria-label={
          favourited ? `Remove ${demo.title} from favourites` : `Add ${demo.title} to favourites`
        }
        onClick={handleFavouriteClick}
      >
        {favourited ? "★" : "☆"}
      </button>
    </article>
  );
}
