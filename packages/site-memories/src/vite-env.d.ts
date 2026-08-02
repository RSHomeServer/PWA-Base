interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly VITE_PLATFORM_RUNTIME_MODE?: "development" | "production";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
