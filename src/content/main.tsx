import ReactDOM from 'react-dom/client';
import App from './App';
import "../i18n";
import styles from "./global.css?inline";
import { injectFontFaces } from '../fontFaces';
import { PlatformContext } from "./PlatformContext";
import { getPlatformAdapter } from "./platforms";

// Inject local fonts into the main document
injectFontFaces();

const ROOT_ID = 'yt-floating-lyrics-root';
const CONTAINER_ID = 'lyrik-extension-container';

if (!document.getElementById(CONTAINER_ID)) {
  const adapter = getPlatformAdapter();

  if (adapter) {
    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.style.position = "fixed";
    container.style.inset = "0";
    container.style.zIndex = "2147483647";
    container.style.pointerEvents = "none";
    document.body.appendChild(container);

    // Use Shadow DOM to prevent Tailwind Preflight from leaking to the host page
    const shadow = container.attachShadow({ mode: 'open' });

    // Inject the processed Tailwind CSS into the shadow root
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    shadow.appendChild(styleEl);

    // Create a mount point inside the shadow root for React
    const root = document.createElement('div');
    root.id = ROOT_ID; // This matches #yt-floating-lyrics-root in styles.css
    root.style.pointerEvents = "auto";
    shadow.appendChild(root);

    ReactDOM.createRoot(root).render(
      <PlatformContext.Provider value={adapter}>
        <App />
      </PlatformContext.Provider>,
    );
  }
}
