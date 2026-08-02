import { useEffect, useState } from "react";
import {
  PackReadyGate,
  getPackEntryText,
} from "@platform/runtime";
import styles from "./HomePage.module.css";

const APP_ID = "hello";
const PACK_ID = "hello-base";

type Welcome = {
  title?: string;
  message?: string;
};

function HelloContent() {
  const [welcome, setWelcome] = useState<Welcome | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const text = await getPackEntryText(APP_ID, PACK_ID, "meta/welcome.json");
      if (cancelled || !text) return;
      try {
        setWelcome(JSON.parse(text) as Welcome);
      } catch {
        setWelcome({ title: "Hello", message: "Hello World" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>@platform/hello-web</p>
      <h1 className={styles.title}>{welcome?.title ?? "Hello"}</h1>
      <p className={styles.body}>{welcome?.message ?? "Loading content pack…"}</p>
      <p className={styles.meta}>
        Pack <code>{PACK_ID}</code> · scaffolded with <code>pnpm new-app</code>
      </p>
    </main>
  );
}

export function HomePage() {
  return (
    <PackReadyGate
      appId={APP_ID}
      packIds={[PACK_ID]}
      copy={{
        preparingTitle: "Preparing Hello",
        preparingBody: "Installing the base content pack…",
        preparingDetail: "Fetching Hello World content…",
        errorTitle: "Hello could not finish installing",
        errorHint: "Check that Content Packs are available under {packsRoot}, then reload.",
      }}
    >
      <HelloContent />
    </PackReadyGate>
  );
}
