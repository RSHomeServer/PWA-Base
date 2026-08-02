interface ImportMetaEnv {
  readonly DEV?: boolean;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_APP_BUILT_AT?: string;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
