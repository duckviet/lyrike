import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "__MSG_extName__",
  description: "__MSG_extDesc__",
  default_locale: "en",
  version: "1.0.7",
  permissions: ["storage"],
  host_permissions: [
    "https://www.youtube.com/*",
    "https://lrclib.net/*",
    "https://i.ytimg.com/*",
    "https://fonts.googleapis.com/*",
    "https://fonts.gstatic.com/*",
  ],
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
