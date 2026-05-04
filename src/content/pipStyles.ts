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

.h-full { height: 100%; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.overflow-hidden { overflow: hidden; }
.overflow-y-auto { overflow-y: auto; }
.overflow-x-hidden { overflow-x: hidden; }
.relative { position: relative; }
.absolute { position: absolute; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.w-full { width: 100%; }
.pointer-events-none { pointer-events: none; }
.object-cover { object-fit: cover; }
.min-h-0 { min-height: 0; }
.z-below { z-index: -10; }
.opacity-70 { opacity: 0.7; }
.blur-bg { filter: blur(20px); transform: scale(1.1); }
`;
