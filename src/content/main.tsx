import ReactDOM from 'react-dom/client';
import App from './App';
import "../i18n";
import styles from "./styles.css?inline";

const ROOT_ID = 'yt-floating-lyrics-root';
const CONTAINER_ID = 'lyrik-extension-container';

if (!document.getElementById(CONTAINER_ID)) {
  const container = document.createElement('div');
  container.id = CONTAINER_ID;
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
  shadow.appendChild(root);

  ReactDOM.createRoot(root).render(<App />);
}
