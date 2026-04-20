export function preparePiPDocument(
  pipWindow: Window,
  cssText: string,
): HTMLElement {
  const doc = pipWindow.document;

  doc.title = "YouTube Lyrics";
  doc.documentElement.style.background = "transparent";
  doc.body.style.margin = "0";
  doc.body.style.background = "transparent";

  [...document.styleSheets].forEach((styleSheet) => {
    try {
      if (styleSheet.cssRules) {
        const newStyleEl = doc.createElement("style");
        for (const rule of styleSheet.cssRules) {
          newStyleEl.appendChild(doc.createTextNode(rule.cssText));
        }
        doc.head.appendChild(newStyleEl);
      } else if (styleSheet.href) {
        const newLinkEl = doc.createElement("link");
        newLinkEl.rel = "stylesheet";
        newLinkEl.href = styleSheet.href;
        doc.head.appendChild(newLinkEl);
      }
    } catch (e) {
      console.warn("[Lyrics PiP] Could not copy stylesheet:", e);
    }
  });

  const styleEl = doc.createElement("style");
  styleEl.textContent = cssText;
  doc.head.appendChild(styleEl);

  const root = doc.createElement("div");
  root.id = "ytl-pip-root";

  doc.body.replaceChildren(root);

  return root;
}
