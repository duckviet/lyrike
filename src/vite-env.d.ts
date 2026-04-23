/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_YOUTUBE_API_KEY: string;
  readonly VITE_YOUTUBE_LEAP_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
