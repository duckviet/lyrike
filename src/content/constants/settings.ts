export interface FontOption {
  label: string;
  value: string;
  weights: number[]; // e.g. [400, 700] or a range if variable
  isVariable?: boolean;
  minWeight?: number;
  maxWeight?: number;
  supportsItalic: boolean;
}

export const FONTS: FontOption[] = [
  {
    label: "Montserrat",
    value: "Montserrat, sans-serif",
    isVariable: true,
    minWeight: 100,
    maxWeight: 900,
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    supportsItalic: true,
  },
  {
    label: "Google Sans",
    value: "'Google Sans', sans-serif",
    isVariable: true,
    minWeight: 100,
    maxWeight: 900,
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    supportsItalic: true,
  },
  {
    label: "Tinos",
    value: "'Tinos', serif",
    weights: [400, 700],
    supportsItalic: true,
  },
  {
    label: "Amatic SC",
    value: "'Amatic SC', cursive",
    weights: [400, 700],
    supportsItalic: false,
  },
  {
    label: "Cal Sans",
    value: "'Cal Sans', sans-serif",
    weights: [400],
    supportsItalic: false,
  },
  {
    label: "Fahkwang",
    value: "'Fahkwang', sans-serif",
    weights: [200, 300, 400, 500, 600, 700],
    supportsItalic: true,
  },
  {
    label: "Playwrite NO",
    value: "'Playwrite NO', cursive",
    isVariable: true,
    minWeight: 100,
    maxWeight: 400,
    weights: [100, 200, 300, 400],
    supportsItalic: false,
  },
];

export const FONT_STYLE = {
  NORMAL: "normal",
  ITALIC: "italic",
} as const;
export type FontStyle = (typeof FONT_STYLE)[keyof typeof FONT_STYLE];

export const TEXT_ALIGN = {
  LEFT: "left",
  CENTER: "center",
  RIGHT: "right",
} as const;
export type TextAlign = (typeof TEXT_ALIGN)[keyof typeof TEXT_ALIGN];

export const LANGUAGE = {
  VI: "vi",
  EN: "en",
  AUTO: "auto",
} as const;
export type Language = (typeof LANGUAGE)[keyof typeof LANGUAGE];

export const PIP_BG_MODE = {
  DEFAULT: "default",
  COLOR: "color",
  THUMBNAIL: "thumbnail",
  VIDEO: "video",
} as const;
export type PipBackgroundMode = (typeof PIP_BG_MODE)[keyof typeof PIP_BG_MODE];
