import { getPaletteSync, Color } from "colorthief";
import { ThemeVars } from "../../shared/types";

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RgbColor | null {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const parsed = Number.parseInt(value, 16);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function rgbaFromRgb(rgb: RgbColor, alpha: number): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function colorObjectToRgb(color: Color): RgbColor {
  const [r, g, b] = color.array();
  return { r, g, b };
}

export function createThumbnailThemeFromPalette(palette: Color[]): ThemeVars {
  const dominantColor = palette?.[0];

  if (!dominantColor) {
    return {};
  }

  const accentColor = palette[1] || palette[0];
  const bgRgb = colorObjectToRgb(dominantColor);
  const accentRgb = colorObjectToRgb(accentColor);
  const textRgb = hexToRgb(dominantColor.textColor || "#ffffff") || {
    r: 255,
    g: 255,
    b: 255,
  };

  return {
    "--yl-bg-primary": rgbaFromRgb(bgRgb, 0.94),
    "--yl-bg-secondary": rgbaFromRgb(bgRgb, 0.84),
    "--yl-bg-tertiary": rgbaFromRgb(accentRgb, 0.16),
    "--yl-bg-hover": rgbaFromRgb(accentRgb, 0.16),
    "--yl-bg-active": rgbaFromRgb(accentRgb, 0.22),
    "--yl-text-primary": dominantColor.textColor || "#ffffff",
    "--yl-text-secondary": rgbaFromRgb(textRgb, 0.72),
    "--yl-text-muted": rgbaFromRgb(textRgb, 0.5),
    "--yl-text-accent": rgbaFromRgb(accentRgb, 0.96),
    "--yl-shadow-glow": `0 0 28px ${rgbaFromRgb(accentRgb, 0.26)}`,
  };
}

export async function createThumbnailTheme(videoId: string | undefined, enabled: boolean = true): Promise<ThemeVars> {
  if (!enabled || !videoId) {
    return {};
  }

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.referrerPolicy = "no-referrer";
  image.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (image.decode) {
    await image.decode();
  } else {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
  }

  const palette = getPaletteSync(image, { colorCount: 5 });
  return createThumbnailThemeFromPalette(palette);
}