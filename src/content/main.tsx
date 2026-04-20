import ReactDOM from 'react-dom/client';
import App from './App';

const ROOT_ID = 'yt-floating-lyrics-root';

if (!document.getElementById(ROOT_ID)) {
  const rootEl = document.createElement('div');
  rootEl.id = ROOT_ID;
  document.body.appendChild(rootEl);

  ReactDOM.createRoot(rootEl).render(<App />);
}
