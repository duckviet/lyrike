export function tracePiPBackdropLayers(pipWindow: Window, root: HTMLElement | null): void {
  try {
    const doc = pipWindow.document;
    const html = doc.documentElement;
    const body = doc.body;
    const shell = root?.querySelector(".pip-shell");

    const htmlStyle = pipWindow.getComputedStyle(html);
    const bodyStyle = pipWindow.getComputedStyle(body);
    const rootStyle = root ? pipWindow.getComputedStyle(root) : null;
    const shellStyle = shell ? pipWindow.getComputedStyle(shell as Element) : null;

    console.groupCollapsed("[Lyrics PiP] Backdrop trace");
    console.table({
      htmlBackground: htmlStyle.backgroundColor,
      bodyBackground: bodyStyle.backgroundColor,
      rootBackground: rootStyle?.backgroundColor,
      shellBackground:
        shellStyle?.backgroundImage || shellStyle?.backgroundColor,
      shellOpacityVar: shellStyle
        ?.getPropertyValue("--pip-bg-opacity")
        ?.trim(),
      shellOpacity: shellStyle?.opacity,
    });
    console.info(
      "PiP host backdrop (outside document content) is browser-" +
        "controlled and cannot be directly styled by extension CSS.",
    );
    console.groupEnd();
  } catch (error) {
    console.error("[Lyrics PiP] Backdrop trace failed:", error);
  }
}

export function preparePiPDocument(pipWindow: Window, cssText: string): HTMLElement {
  const doc = pipWindow.document;

  doc.title = "YouTube Lyrics";
  doc.documentElement.style.background = "transparent";
  doc.body.style.margin = "0";
  doc.body.style.background = "transparent";

  const styleEl = doc.createElement("style");
  styleEl.textContent = cssText;
  doc.head.appendChild(styleEl);

  const root = doc.createElement("div");
  root.id = "ytl-pip-root";

  doc.body.replaceChildren(root);

  pipWindow.requestAnimationFrame(() => {
    tracePiPBackdropLayers(pipWindow, root);
  });

  return root;
}