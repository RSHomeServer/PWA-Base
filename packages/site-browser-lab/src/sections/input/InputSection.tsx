import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, Kbd } from "@platform/ui";
import { SectionHeader } from "../../components/SectionHeader.js";
import { StatGrid, type StatItem } from "../../components/StatGrid.js";
import { formatMs, formatNumber } from "../../lib/format.js";
import { verdictBadgeVariant, verdictFromThresholds } from "../../lib/verdict.js";
import styles from "./InputSection.module.css";

interface TrailPoint {
  x: number;
  y: number;
  life: number;
}

export function InputSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [keyLatency, setKeyLatency] = useState<number | null>(null);
  const [keySamples, setKeySamples] = useState(0);
  const [phase, setPhase] = useState<"idle" | "waiting" | "flash">("idle");
  const flashAtRef = useRef(0);
  const [pointerType, setPointerType] = useState("none");
  const [pointerCount, setPointerCount] = useState(0);
  const [gamepads, setGamepads] = useState<string[]>([]);
  const [maxHz, setMaxHz] = useState(0);
  const lastPointerRef = useRef(0);
  const hzWindowRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const trail: TrailPoint[] = [];
    const resize = () => {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * devicePixelRatio;
      const y = (event.clientY - rect.top) * devicePixelRatio;
      trail.push({ x, y, life: 1 });
      if (trail.length > 120) trail.shift();

      setPointerType(event.pointerType);
      setPointerCount(event.isPrimary ? 1 : 2);

      const now = performance.now();
      if (lastPointerRef.current > 0) {
        const dt = now - lastPointerRef.current;
        if (dt > 0 && dt < 200) {
          const hz = 1000 / dt;
          hzWindowRef.current.push(hz);
          if (hzWindowRef.current.length > 30) hzWindowRef.current.shift();
          const avg = hzWindowRef.current.reduce((a, b) => a + b, 0) / hzWindowRef.current.length;
          setMaxHz((prev) => Math.max(prev, avg));
        }
      }
      lastPointerRef.current = now;
    };

    canvas.addEventListener("pointermove", onPointer);
    canvas.addEventListener("pointerdown", onPointer);

    const draw = () => {
      ctx.fillStyle = "rgba(6, 10, 12, 0.28)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const point of trail) {
        point.life -= 0.018;
        if (point.life <= 0) continue;
        ctx.beginPath();
        ctx.fillStyle = `rgba(45, 212, 191, ${point.life})`;
        ctx.arc(point.x, point.y, 3 + (1 - point.life) * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      while (trail.length && trail[0]!.life <= 0) trail.shift();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  useEffect(() => {
    const poll = () => {
      const pads = navigator.getGamepads?.() ?? [];
      const names = Array.from(pads)
        .filter((pad): pad is Gamepad => pad !== null)
        .map((pad) => pad.id);
      setGamepads(names);
    };
    poll();
    window.addEventListener("gamepadconnected", poll);
    window.addEventListener("gamepaddisconnected", poll);
    const id = window.setInterval(poll, 1000);
    return () => {
      window.removeEventListener("gamepadconnected", poll);
      window.removeEventListener("gamepaddisconnected", poll);
      window.clearInterval(id);
    };
  }, []);

  const startKeyTest = useCallback(() => {
    setPhase("waiting");
    const delay = 400 + Math.random() * 800;
    flashAtRef.current = performance.now() + delay;

    const flashTimer = window.setTimeout(() => {
      setPhase("flash");
    }, delay);

    const onKey = (event: KeyboardEvent) => {
      if (performance.now() < flashAtRef.current) return;
      event.preventDefault();
      const latency = performance.now() - flashAtRef.current;
      setKeyLatency(latency);
      setKeySamples((n) => n + 1);
      setPhase("idle");
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(flashTimer);
    };
    window.addEventListener("keydown", onKey);
  }, []);

  const keyVerdict =
    keyLatency === null ? "info" : verdictFromThresholds(200 - keyLatency, 80, 140);

  const items: StatItem[] = [
    { key: "pointer", label: "Last pointer type", value: pointerType },
    { key: "pointers", label: "Active pointers", value: String(pointerCount) },
    {
      key: "hz",
      label: "Peak pointer rate",
      value: maxHz > 0 ? `${formatNumber(maxHz, 0)} Hz` : "Move pointer…",
    },
    {
      key: "touch",
      label: "Touch support",
      value: navigator.maxTouchPoints > 0 ? `Yes (${navigator.maxTouchPoints} pts)` : "No",
    },
    {
      key: "gamepad",
      label: "Gamepads",
      value: gamepads.length ? gamepads.join(", ") : "None connected",
    },
  ];

  return (
    <section aria-labelledby="lab-input-title">
      <SectionHeader
        eyebrow="Interface Bay"
        title="Input"
        description="Keyboard latency, pointer trail polling visualiser, touch/pen detection, and gamepad presence — the human interface side of the control room."
      />

      <div className={styles.layout}>
        <div className={styles.trailPanel}>
          <canvas
            ref={canvasRef}
            className={styles.trail}
            aria-label="Pointer trail canvas — move mouse, pen, or touch here"
          />
          <p className={styles.hint}>Move pointer / pen / touch across the canvas</p>
        </div>

        <div className={styles.side}>
          <div className={styles.keyTest}>
            <p className={styles.keyLabel}>Keyboard latency</p>
            <p className={styles.keyInstr}>
              Press <Kbd>any key</Kbd> the instant the panel flashes teal.
            </p>
            <div
              className={`${styles.flash} ${phase === "flash" ? styles.flashOn : ""}`}
              aria-live="polite"
            >
              {phase === "waiting"
                ? "Wait…"
                : phase === "flash"
                  ? "NOW"
                  : keyLatency !== null
                    ? formatMs(keyLatency)
                    : "Ready"}
            </div>
            <Button type="button" size="sm" onClick={startKeyTest} disabled={phase !== "idle"}>
              {phase !== "idle" ? "Waiting for key…" : "Start latency test"}
            </Button>
            {keyLatency !== null ? (
              <Badge variant={verdictBadgeVariant(keyVerdict)}>
                Sample {keySamples}: {formatMs(keyLatency)}
              </Badge>
            ) : null}
          </div>

          <StatGrid items={items} />
        </div>
      </div>
    </section>
  );
}
