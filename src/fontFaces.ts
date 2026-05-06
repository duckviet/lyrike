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
  src: url("${font("fonts/Amatic_SC/AmaticSC-Regular.ttf")}") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Amatic SC";
  src: url("${font("fonts/Amatic_SC/AmaticSC-Bold.ttf")}") format("truetype");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Cal Sans";
  src: url("${font("fonts/Cal_Sans/CalSans-Regular.ttf")}") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-ExtraLight.ttf")}") format("truetype");
  font-weight: 200;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-ExtraLightItalic.ttf")}") format("truetype");
  font-weight: 200;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-Light.ttf")}") format("truetype");
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-LightItalic.ttf")}") format("truetype");
  font-weight: 300;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-Regular.ttf")}") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-Italic.ttf")}") format("truetype");
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-Medium.ttf")}") format("truetype");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-MediumItalic.ttf")}") format("truetype");
  font-weight: 500;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-SemiBold.ttf")}") format("truetype");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-SemiBoldItalic.ttf")}") format("truetype");
  font-weight: 600;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-Bold.ttf")}") format("truetype");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Fahkwang";
  src: url("${font("fonts/Fahkwang/Fahkwang-BoldItalic.ttf")}") format("truetype");
  font-weight: 700;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Google Sans";
  src: url("${font("fonts/Google_Sans/GoogleSans-Italic-VariableFont_GRAD,opsz,wght.ttf")}") format("truetype");
  font-weight: 100 900;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Playwrite NO";
  src: url("${font("fonts/Playwrite_NO/PlaywriteNO-VariableFont_wght.ttf")}") format("truetype");
  font-weight: 100 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Tinos";
  src: url("${font("fonts/Tinos/Tinos-Regular.ttf")}") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Tinos";
  src: url("${font("fonts/Tinos/Tinos-Italic.ttf")}") format("truetype");
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Tinos";
  src: url("${font("fonts/Tinos/Tinos-Bold.ttf")}") format("truetype");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Tinos";
  src: url("${font("fonts/Tinos/Tinos-BoldItalic.ttf")}") format("truetype");
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
