import { useCallback, useState, type CSSProperties, type SyntheticEvent } from "react";
import {
  extractDominantColor,
  platformNavLogoAccent,
} from "./logoAccent.js";
import {
  platformNavLogoCandidates,
  type PlatformNavLink,
} from "./nav.js";
import { usePlatformNavConfig } from "./PlatformNavContext.js";
import styles from "./NavLogoChip.module.css";

export type NavLogoChipProps = {
  link: PlatformNavLink;
  /** Visual size of the chip (px). Default 28. */
  size?: number;
  className?: string;
};

/**
 * Icon chip with a tinted background/outline from the logo’s dominant colour.
 */
export function NavLogoChip({ link, size = 28, className }: NavLogoChipProps) {
  const nav = usePlatformNavConfig();
  const candidates = platformNavLogoCandidates(link, nav);
  const [index, setIndex] = useState(0);
  const [accent, setAccent] = useState(() =>
    platformNavLogoAccent(link.id, nav?.logoAccents),
  );
  const initial = link.label.trim().charAt(0).toUpperCase() || "?";
  const crossOrigin =
    candidates[0]?.startsWith("https://") &&
    typeof window !== "undefined" &&
    !candidates[0].startsWith(window.location.origin)
      ? "anonymous"
      : undefined;

  const onLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const sampled = extractDominantColor(event.currentTarget);
    if (sampled) setAccent(sampled);
  }, []);

  const style = {
    "--logo-accent": accent,
    width: size,
    height: size,
  } as CSSProperties;

  if (index >= candidates.length) {
    return (
      <span
        className={[styles.chip, styles.fallback, className].filter(Boolean).join(" ")}
        style={style}
        aria-hidden="true"
      >
        {initial}
      </span>
    );
  }

  return (
    <span
      className={[styles.chip, className].filter(Boolean).join(" ")}
      style={style}
      aria-hidden="true"
    >
      <img
        className={styles.img}
        src={candidates[index]}
        alt=""
        width={Math.round(size * 0.62)}
        height={Math.round(size * 0.62)}
        loading="lazy"
        decoding="async"
        crossOrigin={crossOrigin}
        onLoad={onLoad}
        onError={() => setIndex((i) => i + 1)}
      />
    </span>
  );
}
