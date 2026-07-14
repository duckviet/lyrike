import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "__MSG_extName__",
  description: "__MSG_extDesc__",
  default_locale: "en",
  version: "1.2.1",
  icons: {
    "16": "icons/lyrike-icon@16px.png",
    "48": "icons/lyrike-icon@48px.png",
    "128": "icons/lyrike-icon@128px.png",
  },
  action: {
    default_icon: "icons/lyrike-icon@128px.png",
  },
  permissions: ["storage", "unlimitedStorage"],
  host_permissions: [
    "https://music.youtube.com/*",
    "https://www.youtube.com/*",
    "https://lrclib.net/*",
    "https://i.ytimg.com/*",
    "https://fonts.googleapis.com/*",
    "https://fonts.gstatic.com/*",
    "https://lyrike-report-proxy.duckviet.workers.dev/*", // Thêm dòng này
    "https://raw.githubusercontent.com/*",
  ],
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["https://music.youtube.com/*",
        "https://www.youtube.com/*"],
      js: ["src/content/main.tsx"],
      run_at: "document_idle",
    },
  ],
  web_accessible_resources: [
    {
      resources: ["fonts/**/*"],
      matches: ["https://music.youtube.com/*",
        "https://www.youtube.com/*"],
    },
  ],
});
