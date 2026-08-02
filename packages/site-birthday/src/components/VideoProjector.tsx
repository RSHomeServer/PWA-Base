import { useEffect, useRef, useState } from "react";
import type { VideoItem } from "../media/index.js";
import styles from "./VideoProjector.module.css";

type Props = {
  videos: readonly VideoItem[];
};

type Phase = "curtain" | "ready" | "playing";

/**
 * Small cinema: choose a reel, part the curtain, then project.
 */
export function VideoProjector({ videos }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(videos[0]?.id ?? null);
  const [phase, setPhase] = useState<Phase>("curtain");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const selected = videos.find((v) => v.id === selectedId) ?? videos[0] ?? null;
  const unsupported = selected?.playable === false;

  useEffect(() => {
    setPhase("curtain");
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.removeAttribute("src");
    video.load();
  }, [selected?.id]);

  async function openCurtain() {
    if (!selected || unsupported) {
      setPhase("ready");
      return;
    }
    setPhase("ready");
    const video = videoRef.current;
    if (!video) return;
    video.src = selected.src;
    video.load();
  }

  async function play() {
    const video = videoRef.current;
    if (!video || unsupported) return;
    try {
      await video.play();
      setPhase("playing");
    } catch {
      setPhase("ready");
    }
  }

  function stop() {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setPhase("ready");
  }

  return (
    <div className={styles.root}>
      <div className={styles.reels} role="list" aria-label="Film reels">
        {videos.map((item) => (
          <button
            key={item.id}
            type="button"
            role="listitem"
            className={[
              styles.reel,
              selected?.id === item.id ? styles.reelSelected : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setSelectedId(item.id)}
            aria-pressed={selected?.id === item.id}
          >
            <span className={styles.reelDisc} aria-hidden="true" />
            <span className={styles.reelMeta}>
              <span className={styles.reelTitle}>{item.title}</span>
              <span className={styles.reelFormat}>{item.format.toUpperCase()}</span>
            </span>
          </button>
        ))}
      </div>

      <div className={styles.cinema}>
        <div className={styles.screen}>
          <div
            className={[
              styles.curtain,
              phase !== "curtain" ? styles.curtainOpen : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden="true"
          />
          {unsupported ? (
            <p className={styles.unsupported}>
              This reel uses a format this browser cannot project ({selected?.format}).
              The catalog still lists it so you can see graceful handling.
            </p>
          ) : (
            <video
              ref={videoRef}
              className={styles.video}
              playsInline
              controls={phase === "playing"}
              onEnded={() => setPhase("ready")}
            />
          )}
        </div>

        <div className={styles.meta}>
          <h2 className={styles.title}>{selected?.title ?? "Choose a reel"}</h2>
          <p className={styles.description}>
            {selected?.description ?? "Select a reel, then open the curtain."}
          </p>
          <div className={styles.controls}>
            {phase === "curtain" ? (
              <button type="button" className={styles.control} onClick={() => void openCurtain()}>
                Open the curtain
              </button>
            ) : unsupported ? null : phase === "playing" ? (
              <button type="button" className={styles.control} onClick={stop}>
                Stop projector
              </button>
            ) : (
              <button type="button" className={styles.control} onClick={() => void play()}>
                Start projector
              </button>
            )}
          </div>
          {selected?.attribution ? (
            <p className={styles.attribution}>{selected.attribution}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
