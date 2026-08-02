import { useCallback, useEffect, useRef, useState } from "react";
import "@platform/ui/tokens.css";
import "../site.css";
import { ChapterFiveLove } from "../chapters/ChapterFiveLove.js";
import { ChapterFourLetters } from "../chapters/ChapterFourLetters.js";
import { ChapterOneHello } from "../chapters/ChapterOneHello.js";
import { ChapterSevenUntil } from "../chapters/ChapterSevenUntil.js";
import { ChapterSixFuture } from "../chapters/ChapterSixFuture.js";
import { ChapterThreeMoments } from "../chapters/ChapterThreeMoments.js";
import { ChapterTwoStory } from "../chapters/ChapterTwoStory.js";
import { BirthdayReadyGate } from "../components/BirthdayReadyGate.js";
import { GrainOverlay } from "../components/GrainOverlay.js";
import { MusicToggle } from "../components/MusicToggle.js";
import { NightSky } from "../components/NightSky.js";
import { SecretToast } from "../components/SecretToast.js";
import { SiteNav } from "../components/SiteNav.js";
import { KeepsakeContentProvider, useKeepsakeContent } from "../lib/KeepsakeContent.js";
import { useKonamiCode } from "../hooks/useKonamiCode.js";
import { useTypedWord } from "../hooks/useTypedWord.js";
import styles from "./BirthdayPage.module.css";

function BirthdayExperience() {
  const keepsake = useKeepsakeContent();
  const [toast, setToast] = useState<string | null>(null);
  const [burst, setBurst] = useState(false);
  const [chromeReady, setChromeReady] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const onKonami = useCallback(() => {
    setBurst(true);
    setToast(keepsake.easterEggs.konami);
    window.setTimeout(() => setBurst(false), 4000);
  }, [keepsake.easterEggs.konami]);
  useKonamiCode(onKonami);

  const onHiddenWord = useCallback(
    () => setToast(keepsake.easterEggs.hiddenWord),
    [keepsake.easterEggs.hiddenWord],
  );
  useTypedWord(keepsake.hiddenWord, onHiddenWord);

  const onSignatureTripleClick = useCallback(() => {
    setToast(keepsake.easterEggs.tripleClickSignature);
  }, [keepsake.easterEggs.tripleClickSignature]);

  const onAllLanternsReleased = useCallback(() => {
    setToast(keepsake.easterEggs.allLanternsReleased);
  }, [keepsake.easterEggs.allLanternsReleased]);

  useEffect(() => {
    const timer = window.setTimeout(() => setChromeReady(true), 400);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
        progressRef.current?.style.setProperty("--progress", `${pct}%`);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        glowRef.current?.style.setProperty("--cursor-x", `${event.clientX}px`);
        glowRef.current?.style.setProperty("--cursor-y", `${event.clientY}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (chromeReady) glowRef.current?.classList.add("is-awake");
  }, [chromeReady]);

  return (
    <div className={styles.page}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>
      <div
        ref={progressRef}
        className={`${styles.progressRail} ${chromeReady ? styles.chromeVisible : ""}`}
        aria-hidden="true"
      >
        <div className={styles.progressFill} />
      </div>
      <NightSky burst={burst} />
      <div ref={glowRef} className="bd-cursor-glow" aria-hidden="true" />
      <GrainOverlay />
      <div className={styles.toolbar}>
        <SiteNav variant="overlay" className={styles.siteNav} />
        <MusicToggle />
      </div>
      <main id="main-content" className={styles.main}>
        <ChapterOneHello onSignatureTripleClick={onSignatureTripleClick} />
        <ChapterTwoStory />
        <ChapterThreeMoments />
        <ChapterFourLetters />
        <ChapterFiveLove />
        <ChapterSixFuture onAllLanternsReleased={onAllLanternsReleased} />
        <ChapterSevenUntil />
      </main>
      <SecretToast message={toast} onDismiss={dismissToast} />
    </div>
  );
}

export function BirthdayPage() {
  return (
    <BirthdayReadyGate>
      <KeepsakeContentProvider>
        <BirthdayExperience />
      </KeepsakeContentProvider>
    </BirthdayReadyGate>
  );
}
