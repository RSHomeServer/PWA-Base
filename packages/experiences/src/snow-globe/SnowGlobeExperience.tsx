import { Component, type ReactNode, useEffect, useState } from "react";
import type { SnowGlobeInstance } from "../types.js";
import { ExperienceShell } from "../theme/ExperienceShell.js";
import { SnowGlobeScene } from "./SnowGlobeScene.js";
import { SnowGlobeFallback } from "./SnowGlobeFallback.js";
import { probeThreeWebGL } from "./probeWebGL.js";
import styles from "./SnowGlobeExperience.module.css";

class WebGLGate extends Component<
  { children: ReactNode; fallback: ReactNode; onFail?: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[SnowGlobe] Canvas error boundary tripped", error);
    this.props.onFail?.();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

type RenderMode = "probing" | "webgl" | "fallback";

/**
 * Definitive Snow Globe — R3F primary when Three can create a context.
 * CSS craft fallback when WebGL is unavailable or throws (Cursor/Mesa/etc.).
 */
export function SnowGlobeExperience({ instance }: { instance: SnowGlobeInstance }) {
  const [shake, setShake] = useState(0);
  const [introNonce, setIntroNonce] = useState(0);
  const [mode, setMode] = useState<RenderMode>("probing");
  const isIntro = instance.intro === "constellation-reveal";

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    if (params.get("craft") === "1" || params.get("webgl") === "0") {
      setMode("fallback");
      return;
    }
    void probeThreeWebGL().then((ok) => {
      if (!cancelled) setMode(ok ? "webgl" : "fallback");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const craftFallback = (
    <SnowGlobeFallback
      centrepiece={instance.centrepiece}
      density={instance.snowDensity}
      lightingMood={instance.lighting?.mood ?? "warm"}
    />
  );

  return (
    <ExperienceShell
      instance={instance}
      actions={
        <>
          <button
            type="button"
            className={styles.action}
            onClick={() => setShake((n) => n + 1)}
          >
            Give a gentle shake
          </button>
          {isIntro && mode === "webgl" ? (
            <button
              type="button"
              className={styles.action}
              onClick={() => setIntroNonce((n) => n + 1)}
            >
              Replay introduction
            </button>
          ) : null}
        </>
      }
    >
      <div
        className={styles.viewport}
        data-shake={String(shake % 2)}
        data-intro={isIntro ? "true" : "false"}
        data-render={mode}
      >
        {mode === "probing" ? (
          <div className={styles.probing} aria-busy="true">
            Preparing the miniature…
          </div>
        ) : null}
        {mode === "fallback" ? craftFallback : null}
        {mode === "webgl" ? (
          <WebGLGate fallback={craftFallback} onFail={() => setMode("fallback")}>
            <SnowGlobeScene instance={instance} shake={shake} introNonce={introNonce} />
          </WebGLGate>
        ) : null}
      </div>
      {instance.centrepiece.kind === "gltf" && instance.centrepiece.attribution ? (
        <p className={styles.attribution}>{instance.centrepiece.attribution}</p>
      ) : null}
      {mode === "fallback" ? (
        <p className={styles.attribution}>
          Showing the crafted miniature view — WebGL is unavailable in this browser.
        </p>
      ) : null}
    </ExperienceShell>
  );
}
