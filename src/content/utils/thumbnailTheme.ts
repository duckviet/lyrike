import { getPaletteSync } from "colorthief";
import { ThemeVars } from "../shared/types";

interface RgbColor {
  r: number;
  g: number;
  b: number;
}
interface ColorImpl {
  _r: number;
  _g: number;
  _b: number;
  population: number;
  proportion: number;
}

function colorImplToRgb(color: ColorImpl): RgbColor {
  return { r: color._r, g: color._g, b: color._b };
}

function rgbaFromRgb(rgb: RgbColor, alpha: number): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getLuminance(rgb: RgbColor): number {
  const a = [rgb.r, rgb.g, rgb.b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function createThumbnailThemeFromPalette(
  palette: ColorImpl[],
): ThemeVars {
  const dominant = palette?.[0];

  if (!dominant) {
    return {};
  }

  const dominantRgb = colorImplToRgb(dominant);
  const accentRgb = colorImplToRgb(palette[1] ?? palette[0]);

  const luminance = getLuminance(dominantRgb);
  const isDark = luminance < 0.5;
  const textColor = isDark ? "#ffffff" : "#000000";
  const textRgb = isDark ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  console.log(dominant, dominantRgb, accentRgb, textColor, textRgb, isDark);

  return {
    "--color-bg-primary": rgbaFromRgb(dominantRgb, 0.94),
    "--color-bg-secondary": rgbaFromRgb(dominantRgb, 0.84),
    "--color-bg-tertiary": rgbaFromRgb(accentRgb, 0.16),
    "--color-bg-hover": rgbaFromRgb(accentRgb, 0.16),
    "--color-bg-active": rgbaFromRgb(accentRgb, 0.22),
    "--color-text-primary": textColor,
    "--color-text-secondary": rgbaFromRgb(textRgb, 0.72),
    "--color-text-muted": rgbaFromRgb(textRgb, 0.5),
    "--color-text-accent": rgbaFromRgb(accentRgb, 0.96),
    "--shadow-glow": `0 0 28px ${rgbaFromRgb(accentRgb, 0.26)}`,
  };
}

export async function createThumbnailTheme(
  videoId: string | undefined,
  enabled: boolean = true,
): Promise<ThemeVars> {
  if (!enabled || !videoId) {
    return {};
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";

    // Using a smaller thumbnail for performance
    image.src = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

    const handleLoad = () => {
      try {
        const palette = getPaletteSync(image, {
          colorCount: 5,
        }) as unknown as ColorImpl[];
        console.log(palette);
        resolve(createThumbnailThemeFromPalette(palette));
      } catch (e) {
        console.error("[Lyrics] ColorThief error:", e);
        resolve({});
      }
    };

    const handleError = () => {
      resolve({});
    };

    if (image.complete) {
      handleLoad();
    } else {
      image.onload = handleLoad;
      image.onerror = handleError;
    }
  });
}
