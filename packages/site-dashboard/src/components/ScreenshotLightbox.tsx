import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { IconButton } from "@platform/ui";
import { formatTimestamp } from "../lib/format.js";
import styles from "../pages/pages.module.css";

export interface LightboxItem {
  id: string;
  src: string;
  alt: string;
  pageName: string;
  caption: string;
  capturedAt: string;
  downloadName?: string;
}

export interface ScreenshotLightboxProps {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 0.5;

/**
 * Fullscreen lightbox for run screenshots. Portals to document.body so it
 * escapes any scrolling/overflow containers in the dashboard layout.
 */
export function ScreenshotLightbox({ items, index, onClose, onNavigate }: ScreenshotLightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ dragging: boolean; startX: number; startY: number; panX: number; panY: number }>(
    { dragging: false, startX: 0, startY: 0, panX: 0, panY: 0 },
  );

  const total = items.length;
  const item = total > 0 ? items[Math.max(0, Math.min(index, total - 1))] ?? null : null;

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetView();
  }, [index, resetView]);

  const goPrev = useCallback(() => {
    if (total === 0) return;
    onNavigate((index - 1 + total) % total);
  }, [index, total, onNavigate]);

  const goNext = useCallback(() => {
    if (total === 0) return;
    onNavigate((index + 1) % total);
  }, [index, total, onNavigate]);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => {
      const next = Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2));
      if (next === MIN_SCALE) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  useEffect(() => {
    if (!item) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        ev.preventDefault();
        onClose();
      } else if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        goPrev();
      } else if (ev.key === "ArrowRight") {
        ev.preventDefault();
        goNext();
      } else if (ev.key === "+" || ev.key === "=") {
        ev.preventDefault();
        zoomIn();
      } else if (ev.key === "-" || ev.key === "_") {
        ev.preventDefault();
        zoomOut();
      } else if (ev.key === "Tab") {
        trapFocus(ev, dialogRef.current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [item, onClose, goPrev, goNext, zoomIn, zoomOut]);

  useEffect(() => {
    if (!item) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [item]);

  const onBackdropClick = useCallback(
    (ev: ReactMouseEvent<HTMLDivElement>) => {
      if (ev.target === ev.currentTarget) onClose();
    },
    [onClose],
  );

  const onWheel = useCallback(
    (ev: ReactWheelEvent<HTMLDivElement>) => {
      ev.preventDefault();
      if (ev.deltaY < 0) zoomIn();
      else zoomOut();
    },
    [zoomIn, zoomOut],
  );

  const onPointerDown = useCallback(
    (ev: ReactPointerEvent<HTMLImageElement>) => {
      if (scale <= 1) return;
      (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
      dragState.current = {
        dragging: true,
        startX: ev.clientX,
        startY: ev.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    },
    [scale, pan],
  );

  const onPointerMove = useCallback((ev: ReactPointerEvent<HTMLImageElement>) => {
    if (!dragState.current.dragging) return;
    const dx = ev.clientX - dragState.current.startX;
    const dy = ev.clientY - dragState.current.startY;
    setPan({ x: dragState.current.panX + dx, y: dragState.current.panY + dy });
  }, []);

  const onPointerUp = useCallback((ev: ReactPointerEvent<HTMLImageElement>) => {
    dragState.current.dragging = false;
    try {
      (ev.target as HTMLElement).releasePointerCapture(ev.pointerId);
    } catch {
      // ignore — pointer may already be released
    }
  }, []);

  const imageStyle = useMemo(
    () => ({
      transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
      cursor: scale > 1 ? ("grab" as const) : ("zoom-in" as const),
    }),
    [pan, scale],
  );

  if (!item) return null;

  return (
    <div className={styles.lightboxOverlay} onMouseDown={onBackdropClick} data-testid="screenshot-lightbox">
      <div
        ref={dialogRef}
        className={styles.lightboxDialog}
        role="dialog"
        aria-modal="true"
        aria-label={`${item.pageName} screenshot viewer`}
        tabIndex={-1}
      >
        <header className={styles.lightboxHeader}>
          <div className={styles.lightboxHeaderText}>
            <span className={styles.lightboxCounter}>
              {index + 1} / {total}
            </span>
            <h2 className={styles.lightboxTitle}>{item.pageName}</h2>
          </div>
          <div className={styles.lightboxHeaderActions}>
            <IconButton label="Zoom out" variant="outline" onClick={zoomOut} disabled={scale <= MIN_SCALE}>
              −
            </IconButton>
            <span className={styles.lightboxZoomLevel}>{Math.round(scale * 100)}%</span>
            <IconButton label="Zoom in" variant="outline" onClick={zoomIn} disabled={scale >= MAX_SCALE}>
              +
            </IconButton>
            <a
              className={styles.lightboxDownloadBtn}
              href={item.src}
              download={item.downloadName ?? `${item.pageName}.png`}
            >
              Download
            </a>
            <IconButton label="Close viewer" variant="outline" onClick={onClose}>
              ✕
            </IconButton>
          </div>
        </header>

        <div className={styles.lightboxBody}>
          {total > 1 ? (
            <IconButton
              label="Previous screenshot"
              variant="subtle"
              size="md"
              className={styles.lightboxNavPrev}
              onClick={goPrev}
            >
              ‹
            </IconButton>
          ) : null}

          <div className={styles.lightboxImageWrap} onWheel={onWheel}>
            <img
              src={item.src}
              alt={item.alt}
              className={styles.lightboxImage}
              style={imageStyle}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              draggable={false}
            />
          </div>

          {total > 1 ? (
            <IconButton
              label="Next screenshot"
              variant="subtle"
              size="md"
              className={styles.lightboxNavNext}
              onClick={goNext}
            >
              ›
            </IconButton>
          ) : null}
        </div>

        <footer className={styles.lightboxFooter}>
          <p className={styles.lightboxCaption}>{item.caption}</p>
          <time className={styles.lightboxTimestamp} dateTime={item.capturedAt}>
            Captured {formatTimestamp(item.capturedAt)}
          </time>
        </footer>
      </div>
    </div>
  );
}

function trapFocus(ev: KeyboardEvent, container: HTMLElement | null) {
  if (!container) return;
  const focusable = container.querySelectorAll<HTMLElement>(
    'button, a[href], [tabindex]:not([tabindex="-1"])',
  );
  if (focusable.length === 0) return;
  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;
  const active = document.activeElement;

  if (ev.shiftKey && active === first) {
    ev.preventDefault();
    last.focus();
  } else if (!ev.shiftKey && active === last) {
    ev.preventDefault();
    first.focus();
  }
}
