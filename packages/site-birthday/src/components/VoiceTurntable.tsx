import { useEffect, useRef, useState } from "react";
import type { VoiceNoteItem } from "../media/index.js";
import styles from "./VoiceTurntable.module.css";

type Props = {
  notes: readonly VoiceNoteItem[];
};

/**
 * Record-player metaphor: choose a sleeve, place it on the platter, lift the arm.
 */
export function VoiceTurntable({ notes }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(notes[0]?.id ?? null);
  const [playing, setPlaying] = useState(false);
  const [armDown, setArmDown] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selected = notes.find((n) => n.id === selectedId) ?? notes[0] ?? null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selected) return;
    audio.pause();
    audio.src = selected.src;
    audio.load();
    setPlaying(false);
    setArmDown(false);
  }, [selected]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      setPlaying(false);
      setArmDown(false);
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  async function play() {
    const audio = audioRef.current;
    if (!audio || !selected) return;
    setArmDown(true);
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setArmDown(false);
    }
  }

  function pause() {
    audioRef.current?.pause();
    setPlaying(false);
    setArmDown(false);
  }

  return (
    <div className={styles.root}>
      <div className={styles.sleeves} role="list" aria-label="Voice notes">
        {notes.map((note) => (
          <button
            key={note.id}
            type="button"
            role="listitem"
            className={[
              styles.sleeve,
              selected?.id === note.id ? styles.sleeveSelected : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setSelectedId(note.id)}
            aria-pressed={selected?.id === note.id}
          >
            <span className={styles.sleeveSpine} aria-hidden="true" />
            <span className={styles.sleeveBody}>
              <span className={styles.sleeveTitle}>{note.title}</span>
              <span className={styles.sleeveFormat}>{note.format.toUpperCase()}</span>
            </span>
          </button>
        ))}
      </div>

      <div className={styles.deck}>
        <div className={styles.platterWrap}>
          <div
            className={[styles.platter, playing ? styles.platterSpin : ""].filter(Boolean).join(" ")}
            aria-hidden="true"
          >
            <div className={styles.vinyl}>
              <div className={styles.label}>{selected?.title ?? "—"}</div>
            </div>
          </div>
          <div
            className={[styles.arm, armDown ? styles.armDown : ""].filter(Boolean).join(" ")}
            aria-hidden="true"
          />
        </div>

        <div className={styles.meta}>
          <h2 className={styles.title}>{selected?.title ?? "Choose a record"}</h2>
          <p className={styles.description}>
            {selected?.description ?? "Select a sleeve, then lower the arm."}
          </p>
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.control}
              onClick={() => (playing ? pause() : void play())}
              disabled={!selected}
            >
              {playing ? "Lift the arm" : "Lower the arm"}
            </button>
          </div>
          {selected?.attribution ? (
            <p className={styles.attribution}>{selected.attribution}</p>
          ) : null}
        </div>
      </div>

      <audio ref={audioRef} preload="metadata" />
    </div>
  );
}
