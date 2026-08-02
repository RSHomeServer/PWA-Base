import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { createWorld } from "@platform/physics";
import { Button, Label, Select } from "@platform/ui";
import { downloadCanvasPng } from "@platform/export";
import {
  FLAGSHIP_CANVAS_HEIGHT,
  FLAGSHIP_CANVAS_WIDTH,
  FLAGSHIP_IMMERSIVE_MAX_DPR,
  FLAGSHIP_MAX_DPR,
  prepareCanvas,
} from "../../canvas/setup.js";
import { LabShell } from "../../lab/index.js";
import type { LabMode, LabShortcut } from "../../lab/index.js";
import { useAnimationFrame } from "../shared/useAnimationFrame.js";
import { toCanvasPoint } from "../shared/pointer.js";
import {
  CHLADNI_PRESETS,
  CYMATICS_PALETTES,
  EDUCATION_COPY,
  FREQUENCY_MAX_HZ,
  FREQUENCY_MIN_HZ,
  FREQUENCY_SCALE,
  VISUAL_MODES,
  type CymaticsVisualMode,
} from "./education.js";
import { CymaticsRenderer, screenToPlate } from "./render/CymaticsRenderer.js";
import { ChladniField, type PlateShape } from "./sim/ChladniField.js";
import { CymaticsSystem } from "./sim/CymaticsSystem.js";
import styles from "./CymaticsPage.module.css";

const W = FLAGSHIP_CANVAS_WIDTH;
const H = FLAGSHIP_CANVAS_HEIGHT;
const SPEED_OPTIONS = [0.5, 1, 2];
const CAPACITY = 100_000;
const DEFAULT_COUNT = 28_000;
const MIN_COUNT = 10_000;
const MAX_COUNT = 100_000;

const DEFAULT_PRESET = CHLADNI_PRESETS.find((p) => p.id === "rect-3-5") ?? CHLADNI_PRESETS[0]!;

function hzForMode(field: ChladniField, n: number, m: number): number {
  return Math.sqrt(Math.max(field.eigenvalue({ n, m }), 1e-9)) * FREQUENCY_SCALE;
}

function resonanceAt(field: ChladniField, n: number, m: number, freqHz: number): number {
  const target = hzForMode(field, n, m);
  const ratio = freqHz / Math.max(target, 1);
  const detune = Math.abs(Math.log2(Math.max(ratio, 1e-6)));
  return Math.max(0.08, Math.exp(-detune * 4.2));
}

interface LabState {
  field: ChladniField;
  system: CymaticsSystem;
  world: ReturnType<typeof createWorld>;
  renderer: CymaticsRenderer;
  n: number;
  m: number;
  shape: PlateShape;
  length: number;
  width: number;
  radius: number;
  freqHz: number;
  particleCount: number;
  particleSize: number;
  damping: number;
  gravity: number;
  lifetime: number;
  forceGain: number;
  jitter: number;
  paletteId: string;
  visualMode: CymaticsVisualMode;
}

function buildLab(seed: number, initialCount: number): LabState {
  const field = new ChladniField(128);
  field.setPlate(DEFAULT_PRESET.shape, 12, 12, 6);
  field.setPrimaryMode({ n: DEFAULT_PRESET.n, m: DEFAULT_PRESET.m });
  field.setSources([{ x: 0, y: 0 }]);
  const system = new CymaticsSystem(`cymatics-${seed}`, field, CAPACITY, seed);
  system.scatterAll(initialCount);
  const world = createWorld({ fixedDt: 1 / 60, maxSubsteps: 4 });
  world.addSystem(system);
  const freqHz = hzForMode(field, DEFAULT_PRESET.n, DEFAULT_PRESET.m);
  world.setParams({
    cymForceGain: 1,
    cymJitter: 1,
    cymDamping: 2.2,
    cymGravity: 0,
    cymLifetime: 0,
    cymResonance: 1,
  });
  return {
    field,
    system,
    world,
    renderer: new CymaticsRenderer(),
    n: DEFAULT_PRESET.n,
    m: DEFAULT_PRESET.m,
    shape: DEFAULT_PRESET.shape,
    length: 12,
    width: 12,
    radius: 6,
    freqHz,
    particleCount: initialCount,
    particleSize: 1.2,
    damping: 2.2,
    gravity: 0,
    lifetime: 0,
    forceGain: 1,
    jitter: 1,
    paletteId: "sand",
    visualMode: "sand",
  };
}

function syncWorldParams(lab: LabState): void {
  const resonance = resonanceAt(lab.field, lab.n, lab.m, lab.freqHz);
  lab.world.setParams({
    cymForceGain: lab.forceGain,
    cymJitter: lab.jitter,
    cymDamping: lab.damping,
    cymGravity: lab.gravity,
    cymLifetime: lab.lifetime,
    cymResonance: resonance,
  });
}

function applyPlate(lab: LabState): void {
  lab.field.setPlate(lab.shape, lab.length, lab.width, lab.radius);
  lab.field.setPrimaryMode({ n: lab.n, m: lab.m });
  syncWorldParams(lab);
}

export function CymaticsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const immersiveRef = useRef(false);
  const compareRef = useRef(false);
  const fpsSamples = useRef<number[]>([]);
  const lastAdapt = useRef(0);

  const labA = useRef<LabState | null>(null);
  const labB = useRef<LabState | null>(null);

  if (!labA.current) {
    labA.current = buildLab(42, DEFAULT_COUNT);
  }

  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [compare, setCompare] = useState(false);
  const [visualMode, setVisualMode] = useState<CymaticsVisualMode>("sand");
  const [paletteId, setPaletteId] = useState("sand");
  const [presetId, setPresetId] = useState(DEFAULT_PRESET.id);
  const [shape, setShape] = useState<PlateShape>(DEFAULT_PRESET.shape);
  const [n, setN] = useState(DEFAULT_PRESET.n);
  const [m, setM] = useState(DEFAULT_PRESET.m);
  const [freqHz, setFreqHz] = useState(() =>
    hzForMode(labA.current!.field, DEFAULT_PRESET.n, DEFAULT_PRESET.m),
  );
  const [length, setLength] = useState(12);
  const [width, setWidth] = useState(12);
  const [radius, setRadius] = useState(6);
  const [particleCount, setParticleCount] = useState(DEFAULT_COUNT);
  const [particleSize, setParticleSize] = useState(1.2);
  const [damping, setDamping] = useState(2.2);
  const [gravity, setGravity] = useState(0);
  const [lifetime, setLifetime] = useState(0);
  const [forceGain, setForceGain] = useState(1);
  const [jitter, setJitter] = useState(1);

  compareRef.current = compare;

  // Keep lab A params in sync with React state.
  useEffect(() => {
    const lab = labA.current;
    if (!lab) return;
    lab.n = n;
    lab.m = m;
    lab.shape = shape;
    lab.length = length;
    lab.width = width;
    lab.radius = radius;
    lab.freqHz = freqHz;
    lab.particleSize = particleSize;
    lab.damping = damping;
    lab.gravity = gravity;
    lab.lifetime = lifetime;
    lab.forceGain = forceGain;
    lab.jitter = jitter;
    lab.paletteId = paletteId;
    lab.visualMode = visualMode;
    applyPlate(lab);
    if (lab.particleCount !== particleCount) {
      lab.particleCount = particleCount;
      lab.system.setActiveCount(particleCount);
    }
  }, [
    n,
    m,
    shape,
    length,
    width,
    radius,
    freqHz,
    particleCount,
    particleSize,
    damping,
    gravity,
    lifetime,
    forceGain,
    jitter,
    paletteId,
    visualMode,
  ]);

  useEffect(() => {
    const lab = labA.current;
    if (!lab) return;
    lab.world.timeScale = speed;
  }, [speed]);

  useEffect(() => {
    const lab = labA.current;
    if (!lab) return;
    if (playing) lab.world.resume();
    else lab.world.pause();
  }, [playing]);

  useEffect(() => {
    if (!compare) {
      labB.current = null;
      return;
    }
    if (!labB.current) {
      const b = buildLab(99, Math.min(particleCount, 24_000));
      // Different mode for side-by-side interest
      const alt = CHLADNI_PRESETS.find((p) => p.id === "circle-2-1") ?? CHLADNI_PRESETS[0]!;
      b.n = alt.n;
      b.m = alt.m;
      b.shape = alt.shape;
      b.freqHz = hzForMode(b.field, alt.n, alt.m);
      b.visualMode = visualMode;
      b.paletteId = paletteId;
      applyPlate(b);
      labB.current = b;
    }
  }, [compare, particleCount, visualMode, paletteId]);

  const applyPreset = useCallback((id: string) => {
    const preset = CHLADNI_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setPresetId(id);
    setShape(preset.shape);
    setN(preset.n);
    setM(preset.m);
    const lab = labA.current;
    if (lab) {
      const hz = hzForMode(lab.field, preset.n, preset.m);
      setFreqHz(hz);
    }
  }, []);

  const handleReset = useCallback(() => {
    const lab = labA.current;
    if (!lab) return;
    lab.system.reset();
    lab.system.scatterAll(lab.particleCount);
    lab.world.reset();
    lab.field.setSources([{ x: 0, y: 0 }]);
    syncWorldParams(lab);
    if (labB.current) {
      labB.current.system.reset();
      labB.current.system.scatterAll(labB.current.particleCount);
      labB.current.world.reset();
      syncWorldParams(labB.current);
    }
  }, []);

  const handleStep = useCallback(() => {
    labA.current?.world.stepOnce();
    labB.current?.world.stepOnce();
  }, []);

  const handleExport = useCallback(() => {
    const c = canvasRef.current;
    if (c) downloadCanvasPng("cymatics-lab.png", c);
  }, []);

  const handlePointer = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.type !== "pointerdown") return;
    const canvas = canvasRef.current;
    const lab = labA.current;
    if (!canvas || !lab) return;
    const p = toCanvasPoint(canvas, e.clientX, e.clientY, W, H);
    const plate = screenToPlate(lab.field, W, H, p.x, p.y);
    if (!plate) return;
    const sources = lab.field.getSources();
    if (sources.length >= 6) sources.shift();
    sources.push({ x: plate.x, y: plate.y });
    lab.field.setSources(sources);
  }, []);

  useAnimationFrame((dt) => {
    const lab = labA.current;
    const canvas = canvasRef.current;
    if (!lab || !canvas) return;

    if (playing) {
      lab.world.tick(dt);
      if (compareRef.current && labB.current) {
        labB.current.world.timeScale = speed;
        labB.current.world.tick(dt);
      }
    }

    // Adaptive particle count
    if (dt > 0) {
      const fps = 1 / dt;
      fpsSamples.current.push(fps);
      if (fpsSamples.current.length > 30) fpsSamples.current.shift();
      lastAdapt.current += dt;
      if (lastAdapt.current > 1.2 && fpsSamples.current.length >= 15) {
        lastAdapt.current = 0;
        const avg = fpsSamples.current.reduce((a, b) => a + b, 0) / fpsSamples.current.length;
        let next = lab.particleCount;
        if (avg < 28 && next > MIN_COUNT) next = Math.max(MIN_COUNT, Math.floor(next * 0.82));
        else if (avg > 52 && next < MAX_COUNT) next = Math.min(MAX_COUNT, Math.floor(next * 1.12));
        if (next !== lab.particleCount) {
          lab.particleCount = next;
          lab.system.setActiveCount(next);
          setParticleCount(next);
        }
      }
    }

    const maxDpr = immersiveRef.current ? FLAGSHIP_IMMERSIVE_MAX_DPR : FLAGSHIP_MAX_DPR;
    const palette = CYMATICS_PALETTES.find((p) => p.id === lab.paletteId) ?? CYMATICS_PALETTES[0]!;
    const elapsed = lab.world.time;

    if (compareRef.current && labB.current && canvasBRef.current) {
      const ctxA = prepareCanvas(canvas, W, H, { maxDpr });
      lab.renderer.render(ctxA, W, H, lab.field, lab.system, {
        palette,
        visualMode: lab.visualMode,
        particleSize: lab.particleSize,
        elapsed,
      });
      const b = labB.current;
      b.visualMode = lab.visualMode;
      b.paletteId = lab.paletteId;
      const ctxB = prepareCanvas(canvasBRef.current, W, H, { maxDpr });
      const paletteB = CYMATICS_PALETTES.find((p) => p.id === b.paletteId) ?? palette;
      b.renderer.render(ctxB, W, H, b.field, b.system, {
        palette: paletteB,
        visualMode: b.visualMode,
        particleSize: b.particleSize,
        elapsed: b.world.time,
      });
    } else {
      const ctx = prepareCanvas(canvas, W, H, { maxDpr });
      lab.renderer.render(ctx, W, H, lab.field, lab.system, {
        palette,
        visualMode: lab.visualMode,
        particleSize: lab.particleSize,
        elapsed,
      });
    }

    if (hudRef.current) {
      const res = resonanceAt(lab.field, lab.n, lab.m, lab.freqHz);
      const fps =
        fpsSamples.current.length > 0
          ? Math.round(fpsSamples.current.reduce((a, b) => a + b, 0) / fpsSamples.current.length)
          : 0;
      hudRef.current.textContent = [
        `${lab.system.particles.count.toLocaleString()} grains`,
        `mode (${lab.n},${lab.m})`,
        `${Math.round(lab.freqHz)} Hz`,
        `resonance ${(res * 100).toFixed(0)}%`,
        lab.shape,
        `${fps || "—"} fps`,
        playing ? `${speed}×` : "paused",
      ].join("  ·  ");
    }
  });

  const modes: LabMode[] = useMemo(
    () =>
      VISUAL_MODES.map((m) => ({
        id: m.id,
        label: m.label,
        description: m.description,
      })),
    [],
  );

  const shortcuts: LabShortcut[] = useMemo(
    () => [
      { keys: "Space", label: "Pause / resume", category: "Transport" },
      { keys: ".", label: "Step one frame", category: "Transport" },
      { keys: "R", label: "Reset sand", category: "Transport" },
      { keys: "Click", label: "Add excitation point", category: "Plate" },
      { keys: "C", label: "Toggle compare", category: "View" },
      { keys: "F", label: "Fullscreen", category: "View" },
    ],
    [],
  );

  const params = (
    <div className={styles.section}>
      <div className={styles.field}>
        <span className={styles.sectionTitle}>Chladni presets</span>
        <div className={styles.chipRow}>
          {CHLADNI_PRESETS.slice(0, 9).map((p) => (
            <button
              key={p.id}
              type="button"
              className={[styles.chip, presetId === p.id ? styles.chipActive : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() => applyPreset(p.id)}
              title={p.description}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className={styles.chipRow}>
          {CHLADNI_PRESETS.slice(9).map((p) => (
            <button
              key={p.id}
              type="button"
              className={[styles.chip, presetId === p.id ? styles.chipActive : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() => applyPreset(p.id)}
              title={p.description}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <Label htmlFor="cym-freq">Frequency</Label>
        <div className={styles.sliderRow}>
          <input
            id="cym-freq"
            type="range"
            min={FREQUENCY_MIN_HZ}
            max={FREQUENCY_MAX_HZ}
            step={1}
            value={Math.round(freqHz)}
            onChange={(e) => setFreqHz(Number(e.target.value))}
          />
          <span className={styles.sliderValue}>{Math.round(freqHz)} Hz</span>
        </div>
      </div>

      <div className={styles.field}>
        <Label htmlFor="cym-shape">Plate shape</Label>
        <Select
          id="cym-shape"
          value={shape}
          onChange={(e) => setShape(e.target.value as PlateShape)}
        >
          <option value="rect">Rectangle</option>
          <option value="circle">Circle</option>
        </Select>
      </div>

      <div className={styles.field}>
        <Label htmlFor="cym-n">Mode n</Label>
        <div className={styles.sliderRow}>
          <input
            id="cym-n"
            type="range"
            min={0}
            max={8}
            step={1}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
          />
          <span className={styles.sliderValue}>{n}</span>
        </div>
      </div>

      <div className={styles.field}>
        <Label htmlFor="cym-m">Mode m</Label>
        <div className={styles.sliderRow}>
          <input
            id="cym-m"
            type="range"
            min={1}
            max={8}
            step={1}
            value={m}
            onChange={(e) => setM(Number(e.target.value))}
          />
          <span className={styles.sliderValue}>{m}</span>
        </div>
      </div>

      {shape === "rect" ? (
        <>
          <div className={styles.field}>
            <Label htmlFor="cym-L">Length L</Label>
            <div className={styles.sliderRow}>
              <input
                id="cym-L"
                type="range"
                min={6}
                max={18}
                step={0.5}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
              />
              <span className={styles.sliderValue}>{length.toFixed(1)}</span>
            </div>
          </div>
          <div className={styles.field}>
            <Label htmlFor="cym-W">Width W</Label>
            <div className={styles.sliderRow}>
              <input
                id="cym-W"
                type="range"
                min={6}
                max={18}
                step={0.5}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
              <span className={styles.sliderValue}>{width.toFixed(1)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.field}>
          <Label htmlFor="cym-R">Radius</Label>
          <div className={styles.sliderRow}>
            <input
              id="cym-R"
              type="range"
              min={3}
              max={10}
              step={0.25}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
            <span className={styles.sliderValue}>{radius.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className={styles.field}>
        <Label htmlFor="cym-count">Particles</Label>
        <div className={styles.sliderRow}>
          <input
            id="cym-count"
            type="range"
            min={MIN_COUNT}
            max={MAX_COUNT}
            step={1000}
            value={particleCount}
            onChange={(e) => setParticleCount(Number(e.target.value))}
          />
          <span className={styles.sliderValue}>{(particleCount / 1000).toFixed(0)}k</span>
        </div>
        <p className={styles.hint}>
          Auto-scales with FPS ({MIN_COUNT / 1000}k–{MAX_COUNT / 1000}k).
        </p>
      </div>

      <div className={styles.field}>
        <Label htmlFor="cym-size">Particle size</Label>
        <div className={styles.sliderRow}>
          <input
            id="cym-size"
            type="range"
            min={0.6}
            max={2.4}
            step={0.1}
            value={particleSize}
            onChange={(e) => setParticleSize(Number(e.target.value))}
          />
          <span className={styles.sliderValue}>{particleSize.toFixed(1)}</span>
        </div>
      </div>

      <div className={styles.field}>
        <Label htmlFor="cym-palette">Material / colour</Label>
        <Select id="cym-palette" value={paletteId} onChange={(e) => setPaletteId(e.target.value)}>
          {CYMATICS_PALETTES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>

      <div className={styles.field}>
        <Label htmlFor="cym-damp">Damping</Label>
        <div className={styles.sliderRow}>
          <input
            id="cym-damp"
            type="range"
            min={0.4}
            max={5}
            step={0.1}
            value={damping}
            onChange={(e) => setDamping(Number(e.target.value))}
          />
          <span className={styles.sliderValue}>{damping.toFixed(1)}</span>
        </div>
      </div>

      <div className={styles.field}>
        <Label htmlFor="cym-grav">Gravity</Label>
        <div className={styles.sliderRow}>
          <input
            id="cym-grav"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={gravity}
            onChange={(e) => setGravity(Number(e.target.value))}
          />
          <span className={styles.sliderValue}>{gravity.toFixed(2)}</span>
        </div>
      </div>

      <div className={styles.field}>
        <Label htmlFor="cym-life">Lifetime (s)</Label>
        <div className={styles.sliderRow}>
          <input
            id="cym-life"
            type="range"
            min={0}
            max={20}
            step={0.5}
            value={lifetime}
            onChange={(e) => setLifetime(Number(e.target.value))}
          />
          <span className={styles.sliderValue}>{lifetime <= 0 ? "∞" : lifetime.toFixed(1)}</span>
        </div>
      </div>

      <div className={styles.field}>
        <Label htmlFor="cym-force">Force gain</Label>
        <div className={styles.sliderRow}>
          <input
            id="cym-force"
            type="range"
            min={0.2}
            max={2.5}
            step={0.05}
            value={forceGain}
            onChange={(e) => setForceGain(Number(e.target.value))}
          />
          <span className={styles.sliderValue}>{forceGain.toFixed(2)}</span>
        </div>
      </div>

      <div className={styles.field}>
        <Label htmlFor="cym-jitter">Jitter</Label>
        <div className={styles.sliderRow}>
          <input
            id="cym-jitter"
            type="range"
            min={0.2}
            max={2.5}
            step={0.05}
            value={jitter}
            onChange={(e) => setJitter(Number(e.target.value))}
          />
          <span className={styles.sliderValue}>{jitter.toFixed(2)}</span>
        </div>
      </div>

      <p className={styles.hint}>Click the plate to add excitation points (up to 6).</p>
    </div>
  );

  return (
    <LabShell
      title="Cymatics Laboratory"
      tagline="Sand finds the silence — Chladni figures emerge as grains migrate to nodal lines of a vibrating plate."
      demoPath="/cymatics"
      badge="Flagship"
      badgeVariant="accent"
      modes={modes}
      activeMode={visualMode}
      onModeChange={(id) => setVisualMode(id as CymaticsVisualMode)}
      params={params}
      paramPanelTitle="Plate & sand"
      playing={playing}
      speed={speed}
      speedOptions={SPEED_OPTIONS}
      transport={{
        onToggle: () => setPlaying((v) => !v),
        onStep: handleStep,
        onReset: handleReset,
        onSpeedChange: setSpeed,
      }}
      onReset={handleReset}
      onExport={handleExport}
      onImmersiveChange={(v) => {
        immersiveRef.current = v;
      }}
      shortcuts={shortcuts}
      statusBar={<div ref={hudRef} className={styles.hud} />}
      toolbarExtra={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setCompare((v) => !v)}
          aria-pressed={compare}
        >
          {compare ? "Single plate" : "Compare"}
        </Button>
      }
      frameAspectRatio="16 / 10"
      frameMaxWidth={1600}
      about={
        <>
          <h3>Standing waves</h3>
          <p>{EDUCATION_COPY.standingWaves}</p>
          <h3>Nodes &amp; antinodes</h3>
          <p>{EDUCATION_COPY.nodesAntinodes}</p>
          <h3>Harmonics</h3>
          <p>{EDUCATION_COPY.harmonics}</p>
          <h3>Resonance</h3>
          <p>{EDUCATION_COPY.resonance}</p>
          <p>
            This lab approximates a thin plate with rectangular free-plate modes{" "}
            <code>cos(nπx/L)cos(mπy/W) − cos(mπx/L)cos(nπy/W)</code> and circular Bessel drum modes.
            Particles are integrated with a fixed-timestep World from <code>@platform/physics</code>
            , sliding down the gradient of vibration energy toward nodal lines.
          </p>
        </>
      }
    >
      {compare ? (
        <div className={styles.compareRow}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            width={W}
            height={H}
            aria-label="Cymatics plate A"
            onPointerDown={handlePointer}
          />
          <canvas
            ref={canvasBRef}
            className={styles.canvas}
            width={W}
            height={H}
            aria-label="Cymatics plate B"
          />
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={W}
          height={H}
          style={{ aspectRatio: `${W}/${H}`, maxWidth: "100%", maxHeight: "100%" }}
          aria-label="Cymatics Chladni plate"
          onPointerDown={handlePointer}
        />
      )}
    </LabShell>
  );
}
