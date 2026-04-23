declare module 'colorthief' {
  export interface Color {
    array(): [number, number, number];
    textColor?: string;
  }
  export function getPaletteSync(image: HTMLImageElement, options: { colorCount: number }): Color[];
}

declare module '@chenglou/pretext' {
  export function prepare(text: string, font: string): unknown;
  export function layout(prepared: unknown, width: number, lineHeight: number): { height: number };
}

interface Window {
  documentPictureInPicture: {
    requestWindow(options: { width: number; height: number }): Promise<Window>;
  };
}
