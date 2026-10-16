export function getExtensionUrl(path: string): string {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(path);
  }
  return path;
}

export function buildFontFaceCss(): string {
  const font = (path: string) => getExtensionUrl(path);
  return `
@font-face {
  font-family: "Amatic SC";
  src: url("${font("fonts/Amatic_SC/AmaticSC-Regular.woff2")}") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Amatic SC";
  src: url("${font("fonts/Amatic_SC/AmaticSC-Bold.woff2")}") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Cal Sans";
  src: url("${font("fonts/Cal_Sans/CalSans-Regular.woff2")}") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-ExtraLight.woff2")}") format("woff2");
  font-weight: 200;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-ExtraLightItalic.woff2")}") format("woff2");
  font-weight: 200;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-Light.woff2")}") format("woff2");
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-LightItalic.woff2")}") format("woff2");
  font-weight: 300;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-Regular.woff2")}") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-Italic.woff2")}") format("woff2");
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-Medium.woff2")}") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-MediumItalic.woff2")}") format("woff2");
  font-weight: 500;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-SemiBold.woff2")}") format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-SemiBoldItalic.woff2")}") format("woff2");
  font-weight: 600;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-Bold.woff2")}") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-BoldItalic.woff2")}") format("woff2");
  font-weight: 700;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Google Sans";
  src: url("${font("fonts/Google_Sans/GoogleSans-Italic.woff2")}") format("woff2");
  font-weight: 100 900;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Playwrite NO";
  src: url("${font("fonts/Playwrite_NO/PlaywriteNO-VariableFont_wght.woff2")}") format("woff2");
  font-weight: 100 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Tinos";
  src: url("${font("fonts/Tinos/Tinos-Regular.woff2")}") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Tinos";
  src: url("${font("fonts/Tinos/Tinos-Italic.woff2")}") format("woff2");
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Tinos";
  src: url("${font("fonts/Tinos/Tinos-Bold.woff2")}") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Tinos";
  src: url("${font("fonts/Tinos/Tinos-BoldItalic.woff2")}") format("woff2");
  font-weight: 700;
  font-style: italic;
  font-display: swap;
}
`;
}

export function injectFontFaces(doc: Document = document): void {
  if (doc.getElementById("ytl-font-faces")) return;

  const style = doc.createElement("style");
  style.id = "ytl-font-faces";
  style.textContent = buildFontFaceCss();

  doc.head.appendChild(style);
}
