import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./MusicToggle.module.css";

interface PadHandles {
  ctx: AudioContext;
  masterGain: GainNode;
  oscillators: OscillatorNode[];
}

/**
 * Muted-by-default ambient toggle. On, it plays a very soft synthesized
 * pad (Web Audio, no external files) — never autoplays, always starts
 * from an explicit user click, and can be switched off at any time.
 */
export function MusicToggle() {
  const [playing, setPlaying] = useState(false);
  const padRef = useRef<PadHandles | null>(null);

  const stopPad = useCallback(() => {
    const pad = padRef.current;
    if (!pad) return;
    const { ctx, masterGain, oscillators } = pad;
    const now = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.linearRampToValueAtTime(0, now + 0.6);
    window.setTimeout(() => {
      oscillators.forEach((osc) => osc.stop());
      ctx.close();
    }, 700);
    padRef.current = null;
  }, []);

  const startPad = useCallback(() => {
    if (padRef.current) return;
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);

    const notes = [130.81, 164.81, 196.0];
    const oscillators = notes.map((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.06 + i * 0.02;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 3;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      const voiceGain = ctx.createGain();
      voiceGain.gain.value = 0.33;
      osc.connect(voiceGain);
      voiceGain.connect(masterGain);
      osc.start();
      return osc;
    });

    const now = ctx.currentTime;
    masterGain.gain.linearRampToValueAtTime(0.05, now + 1.6);

    padRef.current = { ctx, masterGain, oscillators };
  }, []);

  const toggle = useCallback(() => {
    setPlaying((prev) => {
      const next = !prev;
      if (next) startPad();
      else stopPad();
      return next;
    });
  }, [startPad, stopPad]);

  useEffect(() => () => stopPad(), [stopPad]);

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? "Turn off ambient sound" : "Turn on soft ambient sound"}
      data-no-bloom
    >
      <span className={`${styles.bars} ${playing ? styles.barsActive : ""}`} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className={styles.label}>{playing ? "Sound on" : "Sound off"}</span>
    </button>
  );
}
