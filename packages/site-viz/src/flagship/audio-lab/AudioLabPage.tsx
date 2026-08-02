import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@platform/ui";
import { downloadText } from "@platform/export";
import { LabShell, type LabMode, type LabShortcut } from "../../lab/index.js";
import { AudioEngineProvider } from "./engine/AudioEngineContext.js";
import { useAudioEngine } from "./engine/useAudioEngine.js";
import { ScreenshotProvider } from "./shared/ScreenshotContext.js";
import { useScreenshotApi } from "./shared/useScreenshot.js";
import { exportFullSession, importFullSession } from "./session.js";
import {
  DRUM_SHORTCUTS,
  PIANO_ROLL_SHORTCUTS,
  STEM_EXPLORER_SHORTCUTS,
  SYNTH_SHORTCUTS,
  VISUALISER_SHORTCUTS,
} from "./labShortcuts.js";
import { VisualiserMode } from "./visualiser/VisualiserMode.js";
import { StemExplorerMode } from "./stems/StemExplorerMode.js";
import { DrumMachineMode } from "./drums/DrumMachineMode.js";
import { PianoRollMode } from "./pianoRoll/PianoRollMode.js";
import { SynthMode } from "./synth/SynthMode.js";
import styles from "./AudioLabPage.module.css";

const MODES: LabMode[] = [
  { id: "visualiser", label: "Audio Visualiser", description: "Waveform · spectrum · meters" },
  { id: "stems", label: "Stem Explorer", description: "Slots · solo / mute · mix bus" },
  { id: "drums", label: "Drum Machine", description: "16-step sequencer · swing" },
  { id: "piano-roll", label: "Piano Roll", description: "Notes · MIDI in/out" },
  { id: "synth", label: "Live Synthesis", description: "ADSR · LFO · FX · MIDI" },
];

const SHORTCUTS: LabShortcut[] = [
  { keys: "?", label: "Toggle this help overlay", category: "Lab" },
  { keys: "Space", label: "Play / pause (mode-dependent)", category: "Lab" },
  { keys: "R", label: "Reset current mode defaults", category: "Lab" },
  { keys: "F", label: "Fullscreen stage", category: "Lab" },
  ...VISUALISER_SHORTCUTS,
  ...STEM_EXPLORER_SHORTCUTS,
  ...DRUM_SHORTCUTS,
  ...PIANO_ROLL_SHORTCUTS,
  ...SYNTH_SHORTCUTS,
];

function AudioLabInner() {
  const [mode, setMode] = useState("visualiser");
  const [resetNonce, setResetNonce] = useState(0);
  const { masterVolume, setMasterVolume, resume, contextState } = useAudioEngine();
  const screenshotApi = useScreenshotApi();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = useCallback(() => {
    setResetNonce((n) => n + 1);
  }, []);

  const handleExport = useCallback(() => {
    screenshotApi?.capture(`audio-lab-${mode}.png`);
  }, [mode, screenshotApi]);

  const handleSaveSession = useCallback(() => {
    downloadText("audio-lab-session.json", exportFullSession(), "application/json");
  }, []);

  const handleLoadSession = useCallback(async (file: File) => {
    const text = await file.text();
    if (importFullSession(text)) {
      setResetNonce((n) => n + 1);
    }
  }, []);

  const params = useMemo(
    () => (
      <div className={styles.params}>
        <label className={styles.paramRow}>
          <span>Master</span>
          <input
            type="range"
            min={0}
            max={1.2}
            step={0.01}
            value={masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
          />
          <span className={styles.paramValue}>{Math.round(masterVolume * 100)}%</span>
        </label>
        <Button variant="secondary" size="sm" onClick={() => void resume()}>
          {contextState === "running" ? "Audio ready" : "Enable audio"}
        </Button>
        <Button variant="secondary" size="sm" onClick={handleSaveSession}>
          Save session
        </Button>
        <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
          Load session
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className={styles.hidden}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleLoadSession(f);
            e.target.value = "";
          }}
        />
        <p className={styles.hint}>
          Dark / light follows the site theme (CSS variables). Session JSON stores patterns, notes,
          and synth patches in localStorage.
        </p>
      </div>
    ),
    [contextState, handleLoadSession, handleSaveSession, masterVolume, resume, setMasterVolume],
  );

  const statusBar = (
    <div className={styles.status}>
      <span>
        Mode <strong>{MODES.find((m) => m.id === mode)?.label ?? mode}</strong>
      </span>
      <span>
        Context <strong>{contextState}</strong>
      </span>
      <span>
        Engine <strong>Web Audio</strong>
      </span>
    </div>
  );

  return (
    <LabShell
      title="Audio Laboratory"
      tagline="A DAW-density playground — visualise, separate, sequence, score, and synthesise in the browser."
      demoPath="/audio-lab"
      badge="Songara Studio"
      badgeVariant="accent"
      modes={MODES}
      activeMode={mode}
      onModeChange={setMode}
      params={params}
      paramPanelTitle="Studio"
      shortcuts={SHORTCUTS}
      onReset={handleReset}
      onExport={handleExport}
      statusBar={statusBar}
      frameMaxWidth={1680}
      frameAspectRatio="16 / 10"
      about={
        <>
          <p>
            Audio Laboratory is a five-mode creative studio built entirely on the Web Audio API.
            Modes share one master bus (gain → compressor → analyser → speakers) so meters and
            levels stay coherent as you switch tabs.
          </p>
          <h3>Modes</h3>
          <p>
            <strong>Visualiser</strong> — load a file and inspect waveform, FFT spectrum, scrolling
            spectrogram, stereo image, phase correlation, RMS, and a simplified LUFS-style readout.
          </p>
          <p>
            <strong>Stem Explorer</strong> — five StemSlot channels (drums / bass / vocals / melody
            / other). Load files or generate procedural demos; real ML separation is a documented
            future hook, not required for this architecture.
          </p>
          <p>
            <strong>Drum Machine</strong> — variable-length step sequencer with swing, mute/solo,
            copy/paste, and undo/redo. Hits are synthesised one-shots (kick pitch-drop, noise hats).
          </p>
          <p>
            <strong>Piano Roll</strong> — paint notes across four synth tracks, quantize, loop, and
            export/import a minimal Type-0 MIDI file.
          </p>
          <p>
            <strong>Live Synthesis</strong> — polyphonic voices with ADSR, filter + LFO, delay, and
            waveshaper distortion, playable from the computer keyboard or Web MIDI.
          </p>
        </>
      }
    >
      <div className={styles.stage} key={`${mode}-${resetNonce}`}>
        {mode === "visualiser" ? <VisualiserMode /> : null}
        {mode === "stems" ? <StemExplorerMode /> : null}
        {mode === "drums" ? <DrumMachineMode /> : null}
        {mode === "piano-roll" ? <PianoRollMode /> : null}
        {mode === "synth" ? <SynthMode /> : null}
      </div>
    </LabShell>
  );
}

export function AudioLabPage() {
  return (
    <AudioEngineProvider>
      <ScreenshotProvider>
        <AudioLabInner />
      </ScreenshotProvider>
    </AudioEngineProvider>
  );
}
