import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: "Lyrik - YouTube Lyrics",
  description:
    "Hiển thị lời bài hát đồng bộ với Picture-in-Picture trên YouTube.",
  version: "1.0.3",
  permissions: ["storage"],
  host_permissions: ["https://www.youtube.com/*", "https://lrclib.net/*"],
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["https://www.youtube.com/*"],
      js: ["src/content/main.tsx"],
      run_at: "document_idle",
    },
  ],
});
