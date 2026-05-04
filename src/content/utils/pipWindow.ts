export function preparePiPDocument(
  pipWindow: Window,
  cssText: string,
): HTMLElement {
  const doc = pipWindow.document;

  doc.title = "YouTube Lyrics";

  doc.documentElement.style.background = "transparent";
  doc.documentElement.style.width = "100%";
  doc.documentElement.style.height = "100%";

  doc.body.style.margin = "0";
  doc.body.style.background = "transparent";
  doc.body.style.width = "100%";
  doc.body.style.height = "100%";
  doc.body.style.overflow = "hidden";

  const baseStyleEl = doc.createElement("style");
  baseStyleEl.textContent = `
    html,
    body,
    #ytl-pip-root {
      width: 100%;
      height: 100%;
      margin: 0;
      overflow: hidden;
      background: transparent;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }
  `;
  doc.head.appendChild(baseStyleEl);

  const styleEl = doc.createElement("style");
  styleEl.textContent = cssText;
  doc.head.appendChild(styleEl);

  const root = doc.createElement("div");
  root.id = "ytl-pip-root";

  doc.body.replaceChildren(root);

  return root;
}
