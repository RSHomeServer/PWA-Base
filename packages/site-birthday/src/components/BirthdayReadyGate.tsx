import type { ReactNode } from "react";
import { PackReadyGate } from "@platform/runtime";
import styles from "./BirthdayReadyGate.module.css";

const REQUIRED_PACKS = ["birthday-base"] as const;

/**
 * Birthday-themed {@link PackReadyGate}: complete-first-install (ADR-005)
 * until the birthday-base Content Pack is active.
 */
export function BirthdayReadyGate({ children }: { children: ReactNode }) {
  return (
    <PackReadyGate
      appId="birthday"
      packIds={REQUIRED_PACKS}
      classNames={styles}
      copy={{
        preparingTitle: "Preparing the keepsake",
        preparingBody:
          "Installing the offline content pack so every memory is here when you need it.",
        preparingDetail: "Gathering letters, photos, and quiet things…",
        errorTitle: "The keepsake could not finish installing",
        errorHint:
          "Check that Content Packs are available under {packsRoot}, then reload.",
      }}
    >
      {children}
    </PackReadyGate>
  );
}
