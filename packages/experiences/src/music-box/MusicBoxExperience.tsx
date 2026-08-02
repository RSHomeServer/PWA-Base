import { useCallback, useEffect, useRef, useState } from "react";
import type { MusicBoxInstance } from "../types.js";
import { ExperienceShell } from "../theme/ExperienceShell.js";
import styles from "./MusicBoxExperience.module.css";

function playLullaby(ctx: AudioContext) {
  const notes = [392, 440, 494, 440, 392, 349, 330, 349];
  const now = ctx.currentTime;
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(0.04, now + i * 0.48 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.48 + 0.42);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.48);
    osc.stop(now + i * 0.48 + 0.45);
  });
}

function Figurine({ kind }: { kind: string }) {
  if (kind === "bird") {
    return (
      <svg className={styles.figurineSvg} viewBox="0 0 64 48" aria-hidden>
        <ellipse cx="34" cy="28" rx="18" ry="12" fill="#d4b896" />
        <ellipse cx="42" cy="22" rx="10" ry="7" fill="#c4a888" transform="rotate(-18 42 22)" />
        <circle cx="18" cy="24" r="9" fill="#e8d4b8" />
        <circle cx="14" cy="22" r="1.4" fill="#3a281c" />
        <path d="M6 24 L14 21 L14 27 Z" fill="var(--mx-brass)" />
        <ellipse cx="48" cy="36" rx="5" ry="2" fill="#8a6a48" />
      </svg>
    );
  }
  if (kind === "star") {
    return (
      <svg className={styles.figurineSvg} viewBox="0 0 64 64" aria-hidden>
        <path
          d="M32 4 L38 24 L58 24 L42 36 L48 56 L32 44 L16 56 L22 36 L6 24 L26 24 Z"
          fill="url(#starGold)"
          stroke="#8a6a38"
          strokeWidth="1"
        />
        <defs>
          <linearGradient id="starGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f0dca0" />
            <stop offset="100%" stopColor="#b08948" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  return (
    <svg className={styles.figurineSvg} viewBox="0 0 80 120" aria-hidden>
      <defs>
        <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6ddd0" />
          <stop offset="100%" stopColor="#d4a890" />
        </linearGradient>
        <linearGradient id="skirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0c8d0" />
          <stop offset="45%" stopColor="var(--mx-accent)" />
          <stop offset="100%" stopColor="#6a3040" />
        </linearGradient>
      </defs>
      {/* arms */}
      <rect x="10" y="34" width="8" height="28" rx="4" fill="url(#skin)" transform="rotate(28 14 34)" />
      <rect x="62" y="34" width="8" height="28" rx="4" fill="url(#skin)" transform="rotate(-28 66 34)" />
      {/* torso */}
      <rect x="32" y="30" width="16" height="28" rx="5" fill="#f0e4d8" />
      {/* head + bun */}
      <circle cx="40" cy="18" r="11" fill="url(#skin)" />
      <circle cx="40" cy="8" r="5" fill="#3a281c" />
      <ellipse cx="40" cy="16" rx="10" ry="6" fill="#3a281c" opacity="0.35" />
      {/* skirt */}
      <path d="M28 52 L52 52 L72 92 L8 92 Z" fill="url(#skirt)" />
      <ellipse cx="40" cy="92" rx="32" ry="6" fill="#5a2838" opacity="0.35" />
      {/* legs + shoes */}
      <rect x="32" y="90" width="6" height="22" rx="3" fill="url(#skin)" />
      <rect x="42" y="90" width="6" height="22" rx="3" fill="url(#skin)" />
      <ellipse cx="35" cy="114" rx="6" ry="3" fill="#8a3048" />
      <ellipse cx="45" cy="114" rx="6" ry="3" fill="#8a3048" />
    </svg>
  );
}

export function MusicBoxExperience({ instance }: { instance: MusicBoxInstance }) {
  const [open, setOpen] = useState(true);
  const [turning, setTurning] = useState(false);
  const [winding, setWinding] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      void audioRef.current?.close();
    };
  }, []);

  const wind = useCallback(() => {
    setWinding(true);
    window.setTimeout(() => setWinding(false), 700);
    setOpen(true);
    setTurning(true);
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioRef.current ??= new Ctx();
      void audioRef.current.resume();
      playLullaby(audioRef.current);
    }
    window.setTimeout(() => setTurning(false), reduced ? 200 : 3800);
  }, []);

  return (
    <ExperienceShell
      instance={instance}
      actions={
        <button type="button" className={styles.action} onClick={wind}>
          {open ? "Wind again" : "Wind the key"}
        </button>
      }
    >
      <div
        className={styles.stage}
        data-open={open ? "true" : "false"}
        data-winding={winding ? "true" : "false"}
      >
        <div className={styles.spotlight} aria-hidden />
        <div className={styles.tableGlow} aria-hidden />
        <div className={styles.box}>
          <div className={styles.key} data-winding={winding ? "true" : "false"} aria-hidden>
            <span className={styles.keyStem} />
            <span className={styles.keyBow} />
            <span className={styles.keyBit} />
          </div>

          <div className={styles.lid}>
            <div className={styles.lidInner}>
              <span className={styles.hingeLeft} />
              <span className={styles.hingeRight} />
              <span className={styles.plaque}>{instance.engravedText ?? "Memory"}</span>
              <span className={styles.lidInlay} />
            </div>
            <div className={styles.lidLining} aria-hidden />
          </div>

          <div className={styles.body}>
            <div className={styles.velvet}>
              <div className={styles.platformRing} aria-hidden />
              <div className={styles.platform} data-turning={turning ? "true" : "false"}>
                <div className={styles.platformTop} aria-hidden />
                <div className={styles.figurineWrap} data-turning={turning ? "true" : "false"}>
                  <Figurine kind={instance.figurine ?? "ballerina"} />
                </div>
              </div>
              <div className={styles.mechanism} aria-hidden>
                <span className={styles.gear} data-spin={turning ? "true" : "false"} />
                <span className={styles.gear} data-small="true" data-spin={turning ? "true" : "false"} />
                <span className={styles.cylinder} data-spin={turning ? "true" : "false"} />
              </div>
            </div>
            {(instance.notes?.length ?? 0) > 0 ? (
              <ul className={styles.notes}>
                {(instance.notes ?? []).slice(0, 2).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className={styles.baseRail} />
          <div className={styles.feet} aria-hidden>
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </ExperienceShell>
  );
}
