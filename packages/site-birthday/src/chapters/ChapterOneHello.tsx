import { useCallback, useRef } from "react";
import type { CSSProperties } from "react";
import { FindUsMomentStage } from "../components/FindUsMomentStage.js";
import { useKeepsakeContent } from "../lib/KeepsakeContent.js";
import styles from "./ChapterOneHello.module.css";

interface ChapterOneHelloProps {
  onSignatureTripleClick?: () => void;
}

/**
 * Chapter I — Hello dedication, then a separate interactive constellation
 * stage (finished FindUsMoment). Text no longer overlays the sky.
 */
export function ChapterOneHello({ onSignatureTripleClick }: ChapterOneHelloProps) {
  const { chapters } = useKeepsakeContent();
  const CHAPTER_ONE = chapters.hello;
  const letters = CHAPTER_ONE.title.split("");
  const clickRef = useRef({ count: 0, last: 0 });

  const handleSignatureClick = useCallback(() => {
    const now = Date.now();
    const state = clickRef.current;
    state.count = now - state.last < 600 ? state.count + 1 : 1;
    state.last = now;
    if (state.count === 3) {
      state.count = 0;
      onSignatureTripleClick?.();
    }
  }, [onSignatureTripleClick]);

  return (
    <>
      <section className={styles.hero} aria-label="Chapter I — Hello.">
        <div className={styles.content}>
          <p className={styles.kicker}>{CHAPTER_ONE.kicker}</p>

          <h1 className={styles.title} aria-label={CHAPTER_ONE.title}>
            {letters.map((letter, i) => (
              <span
                key={i}
                className={styles.letter}
                style={{ "--i": i } as CSSProperties}
                aria-hidden="true"
              >
                {letter}
              </span>
            ))}
          </h1>

          <p className={styles.scriptLine} aria-hidden="true">
            <span className={styles.scriptWipe}>{CHAPTER_ONE.script}</span>
          </p>

          <p className={styles.invitation}>{CHAPTER_ONE.invitation}</p>

          <p className={styles.signature} onClick={handleSignatureClick}>
            {CHAPTER_ONE.signature}
          </p>

          <div className={styles.scrollCue} aria-hidden="true">
            <span className={styles.scrollLine} />
            <span className={styles.scrollLabel}>{CHAPTER_ONE.scrollCue}</span>
          </div>
        </div>
      </section>

      <section
        className={styles.constellationSection}
        aria-label="Constellation"
      >
        <FindUsMomentStage className={styles.constellationStage} />
      </section>
    </>
  );
}
