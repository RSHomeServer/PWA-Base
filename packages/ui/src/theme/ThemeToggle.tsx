import type { ButtonHTMLAttributes } from "react";
import { useTheme } from "./useTheme.js";
import type { ThemePreference } from "./types.js";
import styles from "./ThemeToggle.module.css";

export interface ThemeToggleProps extends Omit<ButtonHTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Show text labels alongside icons (default: icons only). */
  showLabels?: boolean;
}

const OPTIONS: { value: ThemePreference; label: string; icon: "sun" | "moon" | "system" }[] = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "system", label: "System", icon: "system" },
];

function ThemeIcon({ icon }: { icon: "sun" | "moon" | "system" }) {
  if (icon === "sun") {
    return (
      <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 1.5v1.25M8 13.25V14.5M14.5 8h-1.25M2.75 8H1.5M12.4 3.6l-.88.88M4.48 11.52l-.88.88M12.4 12.4l-.88-.88M4.48 4.48l-.88-.88"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === "moon") {
    return (
      <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M12.2 9.4a5.1 5.1 0 0 1-6.6-6.6 5.6 5.6 0 1 0 6.6 6.6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
      <rect
        x="2.5"
        y="3.5"
        width="11"
        height="8"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M5.5 13.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ThemeToggle({ showLabels = false, className, ...props }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const classes = [styles.toggle, className].filter(Boolean).join(" ");

  return (
    <div className={classes} role="group" aria-label="Theme" {...props}>
      {OPTIONS.map((option) => {
        const isActive = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            className={[styles.option, isActive ? styles.optionActive : null]
              .filter(Boolean)
              .join(" ")}
            aria-pressed={isActive}
            onClick={() => setTheme(option.value)}
          >
            <ThemeIcon icon={option.icon} />
            {showLabels ? option.label : <span className={styles.srOnly}>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
