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
    label: "Google Sans",
    value: "'Google Sans', sans-serif",
    isVariable: true,
    minWeight: 400,
    maxWeight: 700,
    weights: [400, 500, 600, 700],
    supportsItalic: true,
  },
  {
    label: "Inter",
    value: "'Inter', sans-serif",
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    supportsItalic: true,
  },
  {
    label: "JetBrains Mono",
    value: "'JetBrains Mono', monospace",
    weights: [100, 200, 300, 400, 500, 600, 700, 800],
    supportsItalic: true,
  },
];
