interface PressedFlowerProps {
  variant?: "sprig" | "blossom" | "fern";
  className?: string;
}

/**
 * A small, flat botanical line-drawing — styled like a flower pressed
 * between the pages of an old book. Purely decorative.
 */
export function PressedFlower({ variant = "sprig", className }: PressedFlowerProps) {
  if (variant === "blossom") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
        <g stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.75">
          <path d="M32 14 C32 22, 32 34, 32 50" />
          <path d="M32 24 C26 20, 20 22, 17 28" />
          <path d="M32 30 C38 26, 45 27, 48 33" />
          <path d="M32 38 C25 37, 19 41, 18 47" />
          <circle cx="32" cy="16" r="4.2" />
          <circle cx="25" cy="19" r="3.4" />
          <circle cx="39" cy="19" r="3.4" />
          <circle cx="24" cy="12" r="3" />
          <circle cx="40" cy="12" r="3" />
        </g>
      </svg>
    );
  }

  if (variant === "fern") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
        <g stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.7">
          <path d="M32 8 C31 22, 30 38, 28 56" />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const y = 14 + i * 7;
            const len = 12 - i * 1.2;
            return (
              <g key={i}>
                <path d={`M${31 - i * 0.4} ${y} q -${len} -2 -${len + 4} ${6 + i}`} />
                <path d={`M${31 - i * 0.4} ${y + 2} q ${len} -2 ${len + 4} ${6 + i}`} />
              </g>
            );
          })}
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
      <g stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.72">
        <path d="M14 50 C22 40, 26 30, 34 14" />
        <path d="M22 40 q -6 -2 -9 -8" />
        <path d="M27 32 q 7 -1 10 -7" />
        <path d="M31 24 q -6 -1 -8 -7" />
        <ellipse cx="34" cy="13" rx="2.6" ry="4" transform="rotate(20 34 13)" />
        <ellipse cx="38" cy="16" rx="2.2" ry="3.4" transform="rotate(55 38 16)" />
        <ellipse cx="30" cy="18" rx="2.2" ry="3.4" transform="rotate(-20 30 18)" />
      </g>
    </svg>
  );
}
