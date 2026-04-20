import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: "YouTube Lyrics PiP",
  description:
    "Hiển thị lời bài hát trong một cửa sổ nổi gọn gàng trên YouTube.",
  version: "1.0.2",
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
      css: ["src/content/styles.css"],
      run_at: "document_idle",
    },
  ],
});
