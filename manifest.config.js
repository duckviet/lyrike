import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'YouTube Floating Lyrics',
  description: 'Hiển thị lyric nổi bồng bềnh trên YouTube nếu có.',
  version: '1.0.0',
  permissions: ['storage'],
  host_permissions: ['https://www.youtube.com/*', 'https://lrclib.net/*'],
  background: {
    service_worker: 'src/background.js',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://www.youtube.com/*'],
      js: ['src/content/main.jsx'],
      css: ['src/content/styles.css'],
      run_at: 'document_idle',
    },
  ],
});
