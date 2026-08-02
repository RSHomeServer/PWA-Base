import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import styles from "./PageOutlet.module.css";

export function PageOutlet() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <main id="main-content" ref={mainRef} tabIndex={-1} className={styles.main}>
      <div className={styles.content} key={location.pathname}>
        <Outlet />
      </div>
    </main>
  );
}
