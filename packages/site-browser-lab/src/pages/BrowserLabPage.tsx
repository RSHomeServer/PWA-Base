import { useCallback, useEffect, useRef, useState } from "react";
import { PrimaryScope } from "../components/PrimaryScope.js";
import { SecondaryTelemetry } from "../components/SecondaryTelemetry.js";
import { AudioSection } from "../sections/audio/AudioSection.js";
import { DisplaySection } from "../sections/display/DisplaySection.js";
import { GraphicsSection } from "../sections/graphics/GraphicsSection.js";
import { InputSection } from "../sections/input/InputSection.js";
import { NetworkSection } from "../sections/network/NetworkSection.js";
import { PerformanceSection } from "../sections/performance/PerformanceSection.js";
import { StorageSection } from "../sections/storage/StorageSection.js";
import { SystemSection } from "../sections/system/SystemSection.js";
import "../site.css";
import styles from "./BrowserLabPage.module.css";

const SECTIONS = [
  { id: "performance", label: "Performance", bayClass: styles.bayPerformance },
  { id: "system", label: "System", bayClass: styles.baySystem },
  { id: "display", label: "Display", bayClass: styles.bayDisplay },
  { id: "network", label: "Network", bayClass: styles.bayNetwork },
  { id: "storage", label: "Storage", bayClass: styles.bayStorage },
  { id: "input", label: "Input", bayClass: styles.bayInput },
  { id: "audio", label: "Audio", bayClass: styles.bayAudio },
  { id: "graphics", label: "Graphics", bayClass: styles.bayGraphics },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function BrowserLabPage() {
  const [active, setActive] = useState<SectionId>("performance");
  const revealedRef = useRef(new Set<SectionId>(["performance"]));
  const [revealed, setRevealed] = useState<Set<SectionId>>(() => new Set(["performance"]));

  const scrollTo = useCallback((id: SectionId) => {
    setActive(id);
    document.getElementById(`lab-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    for (const section of SECTIONS) {
      const el = document.getElementById(`lab-${section.id}`);
      if (!el) continue;

      const activeObs = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) setActive(section.id);
        },
        { rootMargin: "-30% 0px -55% 0px", threshold: 0 },
      );
      activeObs.observe(el);
      observers.push(activeObs);

      const revealObs = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting || revealedRef.current.has(section.id)) return;
          revealedRef.current.add(section.id);
          setRevealed(new Set(revealedRef.current));
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
      );
      revealObs.observe(el);
      observers.push(revealObs);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div className={`lab-root ${styles.page}`}>
      <div className={styles.atmosphere} aria-hidden="true">
        <div className={styles.atmosphereGlow} />
        <div className={styles.atmosphereScanlines} />
        <div className={styles.atmosphereGrain} />
      </div>

      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <p className={styles.eyebrow}>Songara Studio · Research Laboratory</p>
        <h1 className={styles.title}>Browser Lab</h1>
        <p className={styles.lead}>
          Live browser instrumentation — frame-rate scope up front, stress experiments in the
          performance bay, and specialized bays for every subsystem this runtime exposes.
        </p>
        <PrimaryScope />
      </header>

      <nav className={styles.nav} aria-label="Lab bays">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`${styles.navBtn} ${active === section.id ? styles.navBtnActive : ""} ${section.id === "performance" ? styles.navBtnPrimary : ""}`}
            aria-current={active === section.id ? "true" : undefined}
            onClick={() => scrollTo(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <SecondaryTelemetry />

      <div className={styles.bays}>
        {SECTIONS.map((section) => (
          <div
            key={section.id}
            id={`lab-${section.id}`}
            className={`${styles.bay} ${section.bayClass} ${revealed.has(section.id) ? styles.bayRevealed : ""}`}
          >
            {section.id === "performance" ? <PerformanceSection /> : null}
            {section.id === "system" ? <SystemSection /> : null}
            {section.id === "display" ? <DisplaySection /> : null}
            {section.id === "network" ? <NetworkSection /> : null}
            {section.id === "storage" ? <StorageSection /> : null}
            {section.id === "input" ? <InputSection /> : null}
            {section.id === "audio" ? <AudioSection /> : null}
            {section.id === "graphics" ? <GraphicsSection /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
