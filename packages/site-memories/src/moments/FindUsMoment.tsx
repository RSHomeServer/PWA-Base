import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ConstellationRenderer,
  starBodyColor,
  starInkColor,
  undirectedEdgeKey,
  type DrawnEdge,
  type StarPressPayload,
} from "./constellation/index.js";
import { resolvePlacedInstances } from "./constellations/index.js";
import { findUsConfig, type MomentConfig } from "./types.js";
import styles from "./FindUsMoment.module.css";

type Phase = "boot" | "opening" | "constellation" | "complete";

type MessageEntry = {
  uid: string;
  text: string;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  color: string;
  ink: string;
};

type TooltipState = {
  id: string;
  name: string;
  subtitle: string;
  x: number;
  y: number;
};

/** Dedication uses bottom: 12% — align message band to that edge. */
const KICKER_BOTTOM_PCT = 0.88;

export type StarMemoryRequestPayload = {
  constellationId: string;
  starUid: string;
  starName: string;
  subtitle: string;
};

type Props = {
  config?: MomentConfig;
  /** Placeholder hook for future per-star memory panel interaction. */
  onStarMemoryRequest?: (payload: StarMemoryRequestPayload) => void;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

function BackgroundStars({
  count,
  timings,
  colors,
}: {
  count: number;
  timings: MomentConfig["timings"];
  colors: MomentConfig["colors"];
}) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const twinkleMs =
          timings.twinkleMinMs +
          ((i * 173) % Math.max(1, timings.twinkleMaxMs - timings.twinkleMinMs));
        const pulseMs = 9000 + ((i * 211) % 6500);
        return {
          id: i,
          left: (i * 61.803) % 100,
          top: (i * 37.177) % 92,
          size: 0.55 + (i % 3) * 0.18,
          delay: -((i * 97) % 14000),
          twinkleMs,
          pulseMs,
          opacityMin: 0.09 + ((i * 7) % 9) / 100,
          opacityMax: 0.24 + ((i * 17) % 12) / 100,
        };
      }),
    [count, timings.twinkleMaxMs, timings.twinkleMinMs],
  );

  return (
    <div className={styles.bgStars} aria-hidden>
      {stars.map((s) => (
        <span
          key={s.id}
          className={styles.bgStar}
          style={
            {
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              color: colors.star,
              ["--bg-twinkle-ms" as string]: `${s.twinkleMs}ms`,
              ["--bg-pulse-ms" as string]: `${s.pulseMs}ms`,
              ["--bg-delay" as string]: `${s.delay}ms`,
              ["--bg-op-min" as string]: String(s.opacityMin),
              ["--bg-op-max" as string]: String(s.opacityMax),
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function edgesToDraw(
  graphEdges: [string, string][],
  latestUid: string,
  activated: Set<string>,
  already: Set<string>,
): DrawnEdge[] {
  const added: DrawnEdge[] = [];
  for (const [a, b] of graphEdges) {
    const key = undirectedEdgeKey(a, b);
    if (already.has(key) || added.some((e) => e.key === key)) continue;
    const touchesLatest =
      (a === latestUid && activated.has(b)) ||
      (b === latestUid && activated.has(a));
    if (!touchesLatest) continue;
    added.push({ fromUid: a, toUid: b, key });
    already.add(key);
  }
  return added;
}

export function FindUsMoment({
  config = findUsConfig,
  onStarMemoryRequest,
}: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const { colors, timings } = config;
  const viewBox = {
    w: config.stage.viewBoxWidth,
    h: config.stage.viewBoxHeight,
  };

  const [constellation] = useMemo(
    () => resolvePlacedInstances(config.constellationInstances),
    [config.constellationInstances],
  );

  // Start in opening with Leo already on-screen so Home→route transitions
  // land on the same first frame (stars visible + twinkling under the text).
  const [phase, setPhase] = useState<Phase>("opening");
  // Opaque from frame one so Home→route zoom does not flash black at handoff.
  const skyReady = true;
  const [showOpening, setShowOpening] = useState(false);
  const [openingLeaving, setOpeningLeaving] = useState(false);
  const [constellationVisible, setConstellationVisible] = useState(true);
  const [activatedUids, setActivatedUids] = useState<Set<string>>(() => new Set());
  const [discoveryPos, setDiscoveryPos] = useState(0);
  const [drawnEdges, setDrawnEdges] = useState<DrawnEdge[]>([]);
  const [showArtwork, setShowArtwork] = useState(false);
  const [showConstellationLabel, setShowConstellationLabel] = useState(false);
  const [brighten, setBrighten] = useState(false);
  const [hover, setHover] = useState<TooltipState | null>(null);
  const [pinned, setPinned] = useState<TooltipState | null>(null);
  const [messageBand, setMessageBand] = useState({ top: 0, height: 0 });

  const timers = useRef<number[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLElement>(null);
  const activationOrder = constellation.activationOrder;

  /** All love-line slots up front so final spacing applies from the first reveal. */
  const messageSlots = useMemo(() => {
    const slots: MessageEntry[] = [];
    for (let i = 0; i < activationOrder.length; i++) {
      const uid = activationOrder[i]!;
      const raw = constellation.fragments[i] ?? "";
      const text = raw.replace(/\.+$/, "").trim();
      if (!text) continue;
      const star = constellation.vertices.find((v) => v.uid === uid);
      if (!star) continue;
      slots.push({
        uid: star.uid,
        text,
        name: star.name,
        subtitle: star.subtitle,
        x: star.x,
        y: star.y,
        color: starBodyColor(star.name, constellation.palette.glow),
        ink: starInkColor(star.name),
      });
    }
    return slots;
  }, [
    activationOrder,
    constellation.fragments,
    constellation.palette.glow,
    constellation.vertices,
  ]);

  const revealedMessageCount = messageSlots.filter((s) =>
    activatedUids.has(s.uid),
  ).length;

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const later = useCallback(
    (ms: number, fn: () => void) => {
      const id = window.setTimeout(fn, reducedMotion ? Math.min(ms, 160) : ms);
      timers.current.push(id);
    },
    [reducedMotion],
  );

  useEffect(() => {
    document.documentElement.classList.add("moment-immersive");
    return () => {
      document.documentElement.classList.remove("moment-immersive");
      clearTimers();
    };
  }, [clearTimers]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const panel = messagesRef.current;
    if (!stage || !panel) return;

    const sync = () => {
      const stageRect = stage.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      if (stageRect.height < 8 || panelRect.height < 8) return;

      const lionTopPct = (constellation.artwork?.y ?? 18) / 100;
      const bandTop =
        stageRect.top + stageRect.height * lionTopPct - panelRect.top;
      const bandBottom =
        stageRect.top +
        stageRect.height * KICKER_BOTTOM_PCT -
        panelRect.top;

      setMessageBand({
        top: Math.max(0, bandTop),
        height: Math.max(48, bandBottom - Math.max(0, bandTop)),
      });
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(stage);
    ro.observe(panel);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [constellation.artwork?.y, skyReady, phase]);

  useEffect(() => {
    const openingHoldMs = 1000;
    const textOutMs = reducedMotion ? 160 : 1400;
    // Constellation is already visible; opening copy appears over it, then leaves.
    later(timings.openingTextDelayMs, () => setShowOpening(true));
    later(
      timings.openingTextDelayMs + timings.openingTextFadeMs + openingHoldMs,
      () => {
        setOpeningLeaving(true);
        setPhase("constellation");
        later(textOutMs, () => setShowOpening(false));
      },
    );
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const settleCompletedLeo = useCallback(() => {
    setPhase("complete");
    setBrighten(true);
    later(timings.completePauseMs, () => {
      setShowArtwork(true);
      setShowConstellationLabel(true);
      later(timings.illustrationFadeInMs + 400, () => {
        setBrighten(false);
      });
    });
  }, [later, timings.completePauseMs, timings.illustrationFadeInMs]);

  const onActivate = useCallback(
    (uid: string) => {
      if (phase !== "constellation") return;
      const expected = activationOrder[discoveryPos];
      if (expected !== uid) return;
      if (activatedUids.has(uid)) return;

      const star = constellation.vertices.find((v) => v.uid === uid);
      if (star) {
        setPinned({
          id: star.uid,
          name: star.name,
          subtitle: star.subtitle,
          x: star.x,
          y: star.y,
        });
        setHover(null);
      } else {
        setHover(null);
        setPinned(null);
      }
      const next = new Set(activatedUids);
      next.add(uid);
      setActivatedUids(next);

      setDrawnEdges((edges) => {
        const known = new Set(edges.map((e) => e.key));
        return [...edges, ...edgesToDraw(constellation.graphEdges, uid, next, known)];
      });

      const nextPos = discoveryPos + 1;
      setDiscoveryPos(nextPos);
      if (nextPos >= activationOrder.length) {
        later(500, settleCompletedLeo);
      }
    },
    [
      activatedUids,
      activationOrder,
      constellation.graphEdges,
      constellation.vertices,
      discoveryPos,
      later,
      phase,
      settleCompletedLeo,
    ],
  );

  const onStarPress = useCallback(
    (payload: StarPressPayload) => {
      const star = constellation.vertices.find((v) => v.uid === payload.uid);
      if (star) {
        setPinned({
          id: star.uid,
          name: star.name,
          subtitle: star.subtitle,
          x: star.x,
          y: star.y,
        });
        setHover(null);
      }
      onStarMemoryRequest?.({
        constellationId: payload.constellationId,
        starUid: payload.uid,
        starName: payload.name,
        subtitle: payload.subtitle,
      });
    },
    [constellation.vertices, onStarMemoryRequest],
  );

  const showHoverTooltip = useCallback(
    (id: string, name: string, subtitle: string, x: number, y: number) => {
      setHover({ id, name, subtitle, x, y });
    },
    [],
  );

  const clearHoverTooltip = useCallback(() => {
    setHover(null);
  }, []);

  const clearTooltip = useCallback(() => {
    setHover(null);
    setPinned(null);
  }, []);

  const tooltip = hover ?? pinned;

  const resetMoment = useCallback(() => {
    clearTimers();
    setPhase("constellation");
    setShowOpening(false);
    setOpeningLeaving(false);
    setConstellationVisible(true);
    setActivatedUids(new Set());
    setDiscoveryPos(0);
    setDrawnEdges([]);
    setShowArtwork(false);
    setShowConstellationLabel(false);
    setBrighten(false);
    clearTooltip();
  }, [clearTimers, clearTooltip]);

  const nextUid =
    phase === "constellation" ? (activationOrder[discoveryPos] ?? null) : null;

  return (
    <div
      className={[
        styles.root,
        skyReady ? styles.skyReady : "",
        brighten ? styles.brighten : "",
        phase === "complete" ? styles.restState : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          ["--sky-top"]: colors.skyTop,
          ["--sky-mid"]: colors.skyMid,
          ["--sky-bottom"]: colors.skyBottom,
          ["--text"]: colors.text,
          ["--text-muted"]: colors.textMuted,
          ["--label"]: colors.label,
          ["--fade-in"]: `${timings.fadeInMs}ms`,
          ["--opening-fade"]: `${timings.openingTextFadeMs}ms`,
          ["--opening-out"]: reducedMotion ? "160ms" : "1400ms",
          ["--constellation-in"]: reducedMotion ? "160ms" : "1600ms",
          ["--fragment-fade"]: `${timings.fragmentFadeMs}ms`,
          ["--pulse-ms"]: `${timings.pulseMs}ms`,
          ["--stage-aspect"]: config.stage.aspectRatio,
        } as CSSProperties
      }
      role="application"
      aria-label="Constellation moment"
    >
      <div className={styles.sky} />
      <div
        className={styles.layout}
        onClick={(e) => {
          if (e.target === e.currentTarget) clearTooltip();
        }}
      >
        <div className={styles.stageColumn}>
          <div
            ref={stageRef}
            className={styles.stage}
            data-constellation-stage=""
            onClick={(e) => {
              if (e.target === e.currentTarget) clearTooltip();
            }}
          >
            <BackgroundStars
              count={config.backgroundStarCount}
              timings={timings}
              colors={colors}
            />

            {(phase === "opening" ||
              phase === "constellation" ||
              phase === "complete") && (
              <ConstellationRenderer
                constellation={constellation}
                activatedUids={activatedUids}
                nextUid={nextUid}
                drawnEdges={drawnEdges}
                showArtwork={showArtwork}
                showLabel={showConstellationLabel}
                interactive={phase === "constellation"}
                hideStars={false}
                visible={constellationVisible || phase === "complete"}
                onHover={showHoverTooltip}
                onLeave={clearHoverTooltip}
                onActivate={onActivate}
                onStarPress={onStarPress}
                reducedMotion={reducedMotion}
                lineDrawMs={timings.lineDrawMs}
                lineWidth={config.glow.lineWidth}
                viewBox={viewBox}
              />
            )}

            {tooltip ? (
              <div
                className={styles.starName}
                style={
                  {
                    left: `${tooltip.x}%`,
                    top: `${tooltip.y}%`,
                    ["--tooltip-ink"]: starInkColor(tooltip.name),
                    ["--tooltip-body"]: starBodyColor(tooltip.name),
                  } as CSSProperties
                }
              >
                <strong>{tooltip.name}</strong>
                {tooltip.subtitle ? (
                  <span className={styles.starSubtitle}>{tooltip.subtitle}</span>
                ) : null}
              </div>
            ) : null}

            {showOpening ? (
              <p
                className={[
                  styles.opening,
                  openingLeaving ? styles.openingLeaving : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {config.openingText}
              </p>
            ) : null}

            {phase === "complete" && showArtwork ? (
              <p className={styles.dedication}>
                Every star reminds me of something I love about you.
              </p>
            ) : null}
          </div>
        </div>

        <aside
          ref={messagesRef}
          className={[
            styles.messages,
            revealedMessageCount === 0 ? styles.messagesEmpty : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-live="polite"
          aria-hidden={revealedMessageCount === 0}
        >
          <div
            className={[styles.messagesBand, styles.messagesBandFilled]
              .filter(Boolean)
              .join(" ")}
            style={
              messageBand.height > 0
                ? {
                    marginTop: messageBand.top,
                    height: messageBand.height,
                  }
                : undefined
            }
          >
            {messageSlots.map((entry) => {
              const revealed = activatedUids.has(entry.uid);
              const selectStar = () =>
                onStarPress({
                  uid: entry.uid,
                  name: entry.name,
                  subtitle: entry.subtitle,
                  constellationId: constellation.id,
                });
              const showTip = () =>
                showHoverTooltip(
                  entry.uid,
                  entry.name,
                  entry.subtitle,
                  entry.x,
                  entry.y,
                );
              return (
                <div
                  key={entry.uid}
                  className={[
                    styles.messageRow,
                    revealed ? styles.messageRowRevealed : styles.messageRowPending,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={
                    {
                      ["--star-bullet"]: entry.color,
                      ["--star-ink"]: entry.ink,
                    } as CSSProperties
                  }
                  role={revealed ? "button" : undefined}
                  tabIndex={revealed ? 0 : -1}
                  aria-hidden={!revealed}
                  aria-label={
                    revealed
                      ? entry.subtitle
                        ? `${entry.name}, ${entry.subtitle}`
                        : entry.name
                      : undefined
                  }
                  onMouseEnter={revealed ? showTip : undefined}
                  onFocus={revealed ? showTip : undefined}
                  onMouseLeave={revealed ? clearHoverTooltip : undefined}
                  onBlur={revealed ? clearHoverTooltip : undefined}
                  onClick={revealed ? selectStar : undefined}
                  onKeyDown={
                    revealed
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectStar();
                          }
                        }
                      : undefined
                  }
                >
                  <span className={styles.messageStar} aria-hidden>
                    <svg
                      className={styles.messageStarSvg}
                      viewBox="0 0 16 16"
                    >
                      <line x1="8" y1="1.2" x2="8" y2="14.8" />
                      <line x1="1.2" y1="8" x2="14.8" y2="8" />
                      <line x1="3.2" y1="3.2" x2="12.8" y2="12.8" />
                      <line x1="12.8" y1="3.2" x2="3.2" y2="12.8" />
                      <circle cx="8" cy="8" r="2.35" />
                    </svg>
                  </span>
                  <p className={styles.message}>{entry.text}</p>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {(phase === "constellation" || phase === "complete") && (
        <button
          type="button"
          className={styles.resetBtn}
          onClick={resetMoment}
        >
          Reset
        </button>
      )}

      <span className={styles.srOnly}>
        {phase === "constellation"
          ? `Gently follow ${constellation.displayName} in order.`
          : phase === "complete"
            ? `${constellation.displayName} is complete and resting.`
            : ""}
      </span>
    </div>
  );
}
