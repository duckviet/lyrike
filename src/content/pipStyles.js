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

:root {
  --pip-bg-opacity: 0.88;
  --pip-bg-primary: rgba(15, 15, 18, var(--pip-bg-opacity));
  --pip-bg-secondary: rgba(28, 28, 32, 0.9);
  --pip-bg-tertiary: rgba(45, 45, 52, 0.8);
  --pip-text-primary: #ffffff;
  --pip-text-secondary: rgba(255, 255, 255, 0.68);
  --pip-text-muted: rgba(255, 255, 255, 0.44);
  --pip-text-accent: rgba(180, 160, 255, 0.92);
  --pip-border-subtle: rgba(255, 255, 255, 0.08);
  --pip-border-light: rgba(255, 255, 255, 0.14);
  --pip-radius: 12px;
  --pip-radius-sm: 8px;
}

body {
  background: transparent !important;
  color: var(--pip-text-primary);
  overflow: hidden;
}

@media (display-mode: picture-in-picture) {
  html, body, #ytl-pip-root {
    background: transparent !important;
  }

  .pip-shell {
    background: linear-gradient(
      180deg,
      rgba(35, 35, 42, var(--pip-bg-opacity)) 0%,
      var(--pip-bg-primary) 100%
    );
  }
}

.pip-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(35, 35, 42, var(--pip-bg-opacity)) 0%, var(--pip-bg-primary) 100%);
  border-radius: 16px;
  overflow: hidden;
}

.pip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid var(--pip-border-subtle);
}

.pip-meta {
  min-width: 0;
  flex: 1;
}

.pip-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pip-artist {
  margin-top: 2px;
  font-size: 12px;
  color: var(--pip-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pip-close-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--pip-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.pip-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--pip-text-primary);
}

.pip-tabs-wrapper {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--pip-border-subtle);
}

.pip-tabs {
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--pip-radius-sm);
  padding: 3px;
}

.pip-tab {
  flex: 1;
  padding: 7px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--pip-text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pip-tab:hover {
  color: var(--pip-text-primary);
}

.pip-tab.active {
  color: var(--pip-text-primary);
  background: var(--pip-bg-secondary);
}

.pip-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 14px 16px 18px;
}

.pip-body::-webkit-scrollbar {
  width: 5px;
}

.pip-body::-webkit-scrollbar-track {
  background: transparent;
}

.pip-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 3px;
}

.pip-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.pip-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 14px;
  text-align: center;
}

.pip-status-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--pip-text-muted);
}

.pip-lines {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pip-line {
  font-size: 15px;
  line-height: 1.6;
  color: var(--pip-text-muted);
  word-break: break-word;
  transition: color 0.2s ease, opacity 0.2s ease, text-shadow 0.2s ease, transform 0.2s ease;
  padding: 3px 0;
}

.pip-line.active {
  color: var(--pip-text-primary);
  font-weight: 600;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.12);
  transform: scale(1.01);
  transform-origin: left center;
}

.pip-line.plain {
  color: var(--pip-text-secondary);
}

.pip-footer {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid var(--pip-border-subtle);
  font-size: 10px;
  color: var(--pip-text-muted);
}

.pip-settings-wrapper {
  padding: 4px 0;
}

.pip-settings-note {
  text-align: center;
  font-size: 12px;
  color: var(--pip-text-muted);
  padding: 20px;
}

@keyframes pip-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

.pip-loading-dots {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
}

.pip-loading-dots span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--pip-text-accent);
  animation: pip-pulse 1.4s ease-in-out infinite;
}

.pip-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.pip-loading-dots span:nth-child(3) { animation-delay: 0.4s; }
`;
