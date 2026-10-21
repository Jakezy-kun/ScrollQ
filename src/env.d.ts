/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

/** App version from package.json, injected by Vite at build time. */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** "true" to show Continue with Google (set it up in Supabase first). */
  readonly VITE_ENABLE_GOOGLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
