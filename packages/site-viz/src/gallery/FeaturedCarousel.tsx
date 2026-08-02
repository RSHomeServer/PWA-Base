import { useCallback, useEffect, useRef, useState } from "react";
import type { DemoEntry } from "../demos/catalog.js";
import { DemoCard } from "./DemoCard.js";

export interface FeaturedCarouselProps {
  demos: DemoEntry[];
}

export function FeaturedCarousel({ demos }: FeaturedCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scrollToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) {
        return;
      }
      const cards = track.querySelectorAll<HTMLElement>("[data-carousel-card]");
      const card = cards[index];
      if (card) {
        card.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          inline: "start",
          block: "nearest",
        });
        setActiveIndex(index);
      }
    },
    [reducedMotion],
  );

  useEffect(() => {
    if (demos.length <= 1 || reducedMotion || paused) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % demos.length;
        scrollToIndex(next);
        return next;
      });
    }, 7000);
    return () => window.clearInterval(timer);
  }, [demos.length, reducedMotion, paused, scrollToIndex]);

  if (demos.length === 0) {
    return null;
  }

  return (
    <section
      className="viz-gallery-carousel"
      aria-labelledby="viz-gallery-featured-heading"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className="viz-gallery-carousel-header">
        <div>
          <p className="viz-gallery-eyebrow">Now showing</p>
          <h2 id="viz-gallery-featured-heading" className="viz-gallery-section-title">
            Flagship installations
          </h2>
          <p className="viz-gallery-section-lead">
            Each card is already alive — hover to linger, then step inside the hall.
          </p>
        </div>
        <div className="viz-gallery-carousel-controls" aria-label="Carousel navigation">
          <button
            type="button"
            className="viz-gallery-carousel-btn"
            aria-label="Previous featured experience"
            onClick={() => scrollToIndex((activeIndex - 1 + demos.length) % demos.length)}
          >
            ‹
          </button>
          <span className="viz-gallery-carousel-indicator" aria-live="polite">
            {activeIndex + 1} / {demos.length}
          </span>
          <button
            type="button"
            className="viz-gallery-carousel-btn"
            aria-label="Next featured experience"
            onClick={() => scrollToIndex((activeIndex + 1) % demos.length)}
          >
            ›
          </button>
        </div>
      </div>
      <div ref={trackRef} className="viz-gallery-carousel-track" role="list">
        {demos.map((demo) => (
          <div
            key={demo.id}
            data-carousel-card
            role="listitem"
            className="viz-gallery-carousel-slide"
          >
            <DemoCard demo={demo} variant="featured" />
          </div>
        ))}
      </div>
    </section>
  );
}
