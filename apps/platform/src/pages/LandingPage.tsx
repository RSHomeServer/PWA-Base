import type { ReactNode } from "react";
import { useRef } from "react";
import { ThemeToggle } from "@platform/ui";
import type { SiteDefinition } from "@platform/site-registry";
import { Link } from "react-router-dom";
import { useHeroParticles } from "../hooks/useHeroParticles";
import { useSectionReveal } from "../hooks/useSectionReveal";
import styles from "./LandingPage.module.css";

interface LandingPageProps {
  sites: readonly SiteDefinition[];
}

const HERO_ENTRIES = [
  {
    id: "hello",
    kicker: "Reference app",
    title: "Hello",
    line: "Minimal SoloSiteApp scaffold — ThemeProvider, packs, and injectable chrome.",
  },
] as const;

const FEATURE_BEATS = [
  {
    product: "Hello",
    siteId: "hello",
    title: "The foundation reference",
    description:
      "One minimal PWA that demonstrates site registration, content packs, and solo packaging.",
  },
] as const;

const GALLERY_IDENTITY: Record<string, { kicker: string; atmosphere: string; tagline: string }> = {
  stats: {
    kicker: "Analysis",
    atmosphere: styles.galleryStats,
    tagline: "Hypothesis testing, distributions, and statistical workflows.",
  },
  hello: {
    kicker: "Reference",
    atmosphere: styles.galleryDefault,
    tagline: "Scaffolded SoloSiteApp for future PWAs.",
  },
};
function getGalleryIdentity(site: SiteDefinition) {
  return (
    GALLERY_IDENTITY[site.id] ?? {
      kicker: "Application",
      atmosphere: styles.galleryDefault,
      tagline: "Registered experience in the Songara workspace.",
    }
  );
}

function findSite(sites: readonly SiteDefinition[], id: string): SiteDefinition | undefined {
  return sites.find((site) => site.id === id);
}

function RevealSection({
  id,
  className,
  children,
  "aria-labelledby": ariaLabelledBy,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  "aria-labelledby"?: string;
}) {
  const { ref, visible } = useSectionReveal<HTMLElement>();

  return (
    <section
      id={id}
      ref={ref}
      className={[className, styles.reveal, visible ? styles.revealVisible : null]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={ariaLabelledBy}
    >
      {children}
    </section>
  );
}

export function LandingPage({ sites }: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useHeroParticles(canvasRef);

  const apps = sites.filter((site) => site.id !== "components");
  const heroSites = HERO_ENTRIES.map((entry) => ({
    entry,
    site: findSite(sites, entry.id),
  })).filter((item): item is { entry: (typeof HERO_ENTRIES)[number]; site: SiteDefinition } =>
    Boolean(item.site),
  );

  return (
    <div className={styles.page}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className={styles.topNav}>
        <div className={styles.topNavInner}>
          <Link to="/" className={styles.topNavBrand}>
            Songara Studio
          </Link>
          <nav className={styles.topNavLinks} aria-label="Landing navigation">
            <a href="#studio" className={styles.topNavLink}>
              Studio
            </a>
            <a href="#features" className={styles.topNavLink}>
              Craft
            </a>
            <a href="#applications" className={styles.topNavLink}>
              Experiences
            </a>
            <Link to="/components" className={styles.topNavLink}>
              Components
            </Link>
          </nav>
          <div className={styles.topNavActions}>
            <ThemeToggle className={styles.themeToggle} />
          </div>
        </div>
      </header>

      <section className={styles.hero} aria-labelledby="hero-heading">
        <div className={styles.heroAtmosphere} aria-hidden="true">
          <div className={styles.heroGradient} />
          <div className={styles.heroGradientShift} />
          <canvas ref={canvasRef} className={styles.heroCanvas} />
          <div className={styles.heroVeil} />
        </div>

        <div className={styles.heroLayout}>
          <div className={styles.heroInner}>
            <p className={styles.heroEyebrow}>Songara Studio · Platform Host</p>
            <h1 id="hero-heading" className={styles.heroBrand}>
              <span className={styles.heroBrandPrimary}>Songara</span>
              <span className={styles.heroBrandSecondary}>Studio</span>
            </h1>
            <p className={styles.heroHeadline}>
              A portfolio host for statistical analysis, visual computing, and bespoke experiences —
              mounted on demand, navigated with intent.
            </p>
          </div>

          {heroSites.length > 0 ? (
            <nav className={styles.heroEntries} aria-label="Featured experiences">
              {heroSites.map(({ entry, site }, index) => (
                <Link
                  key={entry.id}
                  to={site.basePath}
                  className={[
                    styles.heroEntry,
                    styles[`heroEntry${index + 1}` as keyof typeof styles],
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label={`Enter ${site.title}`}
                >
                  <span className={styles.heroEntryGlow} aria-hidden="true" />
                  <span className={styles.heroEntryKicker}>{entry.kicker}</span>
                  <span className={styles.heroEntryTitle}>{entry.title}</span>
                  <span className={styles.heroEntryLine}>{entry.line}</span>
                  <span className={styles.heroEntryAction} aria-hidden="true">
                    Enter
                    <span className={styles.heroEntryArrow} />
                  </span>
                </Link>
              ))}
            </nav>
          ) : null}
        </div>

        <div className={styles.heroScroll} aria-hidden="true">
          <span className={styles.heroScrollLine} />
          <span className={styles.heroScrollLabel}>Scroll</span>
        </div>
      </section>

      <main id="main-content">
        <RevealSection id="studio" className={styles.section} aria-labelledby="studio-heading">
          <div className={styles.sectionInner}>
            <div className={styles.studioStatement}>
              <p className={styles.studioEyebrow}>The host</p>
              <h2 id="studio-heading">One front door. Many worlds inside.</h2>
              <p>
                Songara Studio is the landing and workspace chrome for every registered site
                package. The story stays full-bleed here; once you enter an experience, a quieter
                shell takes over — sidebar navigation, breadcrumbs, command palette, and theme
                controls tuned for large displays.
              </p>
            </div>
          </div>
        </RevealSection>

        <RevealSection id="features" className={styles.section} aria-labelledby="features-heading">
          <div className={styles.sectionInner}>
            <div className={styles.sectionIntro}>
              <h2 id="features-heading">Craft you can feel</h2>
              <p>
                Three product lines that set the tone for the workspace — motion, emotion, and
                technical theatre done with intent.
              </p>
            </div>
            <div className={styles.beatRail}>
              {FEATURE_BEATS.map((beat, index) => {
                const site = findSite(sites, beat.siteId);
                const content = (
                  <>
                    <span className={styles.beatIndex} aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={styles.beatProduct}>{beat.product}</span>
                    <h3>{beat.title}</h3>
                    <p>{beat.description}</p>
                  </>
                );

                if (!site) {
                  return (
                    <article key={beat.siteId} className={styles.beat}>
                      {content}
                    </article>
                  );
                }

                return (
                  <Link
                    key={beat.siteId}
                    to={site.basePath}
                    className={styles.beatLink}
                    aria-label={`Open ${beat.product}`}
                  >
                    <article className={styles.beat}>{content}</article>
                  </Link>
                );
              })}
            </div>
          </div>
        </RevealSection>

        <RevealSection id="applications" className={styles.section} aria-labelledby="apps-heading">
          <div className={styles.sectionInner}>
            <div className={styles.sectionIntro}>
              <h2 id="apps-heading">The gallery wall</h2>
              <p>
                {apps.length > 0
                  ? "Each application mounts at its own path — distinct atmosphere, shared host."
                  : "No applications registered yet. Site packages will appear here once added to the catalog."}
              </p>
            </div>

            {apps.length > 0 ? (
              <nav aria-label="Registered applications" className={styles.galleryWall}>
                {apps.map((site) => {
                  const identity = getGalleryIdentity(site);
                  return (
                    <Link
                      key={site.id}
                      to={site.basePath}
                      className={[styles.galleryPanel, identity.atmosphere]
                        .filter(Boolean)
                        .join(" ")}
                      aria-label={site.title}
                    >
                      <span className={styles.galleryVeil} aria-hidden="true" />
                      <span className={styles.galleryKicker}>{identity.kicker}</span>
                      <span className={styles.galleryTitle}>{site.title}</span>
                      <span className={styles.galleryPath}>{site.basePath}</span>
                      <span className={styles.galleryTagline}>{identity.tagline}</span>
                    </Link>
                  );
                })}
              </nav>
            ) : (
              <div className={styles.emptyState} role="status">
                <span className={styles.emptyStateIcon} aria-hidden="true" />
                <p className={styles.emptyStateTitle}>No applications yet</p>
                <p className={styles.emptyStateText}>
                  Register site packages in the catalog to populate this workspace.
                </p>
              </div>
            )}
          </div>
        </RevealSection>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <p className={styles.footerBrand}>Songara Studio</p>
            <p className={styles.footerTagline}>Modular platform host — Website Hosting</p>
            <p className={styles.footerArch}>
              Catalog → site packages → shared UI. One direction, no circular deps.
            </p>
          </div>
          <nav aria-label="Footer navigation" className={styles.footerNav}>
            <Link to="/components">Components</Link>
            {apps.map((site) => (
              <Link key={site.id} to={site.basePath}>
                {site.title}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
