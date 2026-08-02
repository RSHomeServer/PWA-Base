import {
  PLATFORM_NAV_GROUPS,
  NavLogoChip,
  platformNavLinkProps,
  type PlatformNavLink,
} from "@platform/runtime";
import styles from "./CataloguePage.module.css";

function SiteCard({ link }: { link: PlatformNavLink }) {
  const props = platformNavLinkProps(link);

  return (
    <a {...props} className={styles.card}>
      <NavLogoChip link={link} size={44} className={styles.cardLogo} />
      <span className={styles.cardBody}>
        <span className={styles.cardTitleRow}>
          <span className={styles.cardTitle}>{link.label}</span>
          {link.external ? (
            <span className={styles.externalBadge} aria-label="Opens in a new tab">
              ↗
            </span>
          ) : null}
        </span>
        <span className={styles.cardDescription}>{link.description}</span>
        <span className={styles.cardHost}>{new URL(link.href).hostname}</span>
      </span>
    </a>
  );
}

/** Catalogue landing for apps.songara.uk — sectioned cards matching platform chrome nav. */
export function CataloguePage() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Songara Studio</p>
        <h1 className={styles.title}>Application catalogue</h1>
        <p className={styles.lede}>
          Independently hosted apps and shared services. Use the top bar to jump anywhere — including
          back here from another host.
        </p>
      </header>

      {PLATFORM_NAV_GROUPS.map((group) => (
        <section
          key={group.id}
          id={group.id}
          className={styles.section}
          aria-labelledby={`${group.id}-heading`}
        >
          <div className={styles.sectionHead}>
            <h2 id={`${group.id}-heading`} className={styles.sectionTitle}>
              {group.label}
            </h2>
            <p className={styles.sectionBlurb}>{group.blurb}</p>
          </div>
          <ul className={styles.grid} aria-label={group.label}>
            {group.links.map((link) => (
              <li key={link.id} className={styles.gridItem}>
                <SiteCard link={link} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
