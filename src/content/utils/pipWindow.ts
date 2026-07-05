import { PIP_CSS } from "../pipStyles";
import { buildFontFaceCss } from "../../fontFaces";

export function preparePiPDocument(
  pipWindow: Window,
  tailwindStyles?: string,
): HTMLElement {
  const pipDocument = pipWindow.document;
  pipDocument.title = "lyrike";

  // Clear existing content
  pipDocument.head.innerHTML = "";
  pipDocument.body.innerHTML = "";

  const meta = pipDocument.createElement("meta");
  meta.name = "viewport";
  meta.content = "width=device-width, initial-scale=1";
  pipDocument.head.appendChild(meta);

  // Inject Font Faces
  const fontStyle = pipDocument.createElement("style");
  fontStyle.id = "ytl-pip-font-faces";
  fontStyle.textContent = buildFontFaceCss();
  pipDocument.head.appendChild(fontStyle);

  // Inject Base CSS
  const baseStyle = pipDocument.createElement("style");
  baseStyle.id = "ytl-pip-base-css";
  baseStyle.textContent = PIP_CSS;
  pipDocument.head.appendChild(baseStyle);

  // Inject Tailwind Styles if provided
  if (tailwindStyles) {
    const tailwindStyle = pipDocument.createElement("style");
    tailwindStyle.id = "ytl-pip-tailwind";
    tailwindStyle.textContent = tailwindStyles;
    pipDocument.head.appendChild(tailwindStyle);
  }

  const root = pipDocument.createElement("div");
  root.id = "ytl-pip-root";
  pipDocument.body.appendChild(root);

  return root;
}
