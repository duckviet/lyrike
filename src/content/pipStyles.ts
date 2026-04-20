export const PIP_CSS = `
:root {
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

html, body, #ytl-pip-root {
  width: 100%;
  height: 100%;
  margin: 0 !important;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: transparent !important;
}

body {
  overflow-y: hidden;
  overflow-x: hidden;
}

/* Custom scrollbar for PiP window */
::-webkit-scrollbar {
  width: 5px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  border: 1px solid transparent;
  background-clip: padding-box;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.22);
}

::-webkit-scrollbar-thumb:active {
  background: rgba(255, 255, 255, 0.32);
}
`;
