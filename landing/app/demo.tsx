"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Lang } from "./copy";

// Demo material. Both songs were written for this page; they are not real releases.
export const TRACKS = {
  en: {
    title: "Blue Hour",
    artist: "Lyrike demo",
    cover: "/covers/blue-hour.jpg",
    thumb: "/covers/blue-hour-96.jpg",
    lines: [
      "The tide comes in on a borrowed tune",
      "Blue hour settles on the bay",
      "I count the lights along the shore",
      "One for every word we say",
      "Hold the line, hold the line with me",
      "Let the chorus carry out to sea",
      "Sing it soft so only we can hear",
      "Then sing it loud until the stars appear",
      "The last boat leaves, we let it go",
      "The radio knows every word we know",
      "Hold the line, hold the line with me",
      "Till the morning takes the melody",
    ],
  },
  vi: {
    title: "Đồi Gió",
    artist: "Lyrike demo",
    cover: "/covers/doi-gio.jpg",
    thumb: "/covers/doi-gio-96.jpg",
    lines: [
      "Nắng nghiêng nghiêng trên triền đồi xanh",
      "Gió mang theo câu hát đi xa",
      "Em đếm từng áng mây trôi qua",
      "Mỗi áng mây là một lời chưa nói",
      "Hát cùng nhau, đừng lỡ một câu nào",
      "Để điệp khúc bay qua bên kia đồi",
      "Hát thật khẽ, chỉ hai ta nghe thôi",
      "Rồi hát thật to cho đến khi sao lên",
      "Chiều dần buông, cứ để chiều trôi",
      "Chiếc radio thuộc hết lời ta hát",
      "Hát cùng nhau, đừng lỡ một câu nào",
      "Đến khi bình minh mang giai điệu đi",
    ],
  },
} as const;

// Seconds each line is held; uneven on purpose so it reads like a song.
const HOLD = [3.4, 3, 3.2, 2.8, 3.6, 3.2, 3, 3.6, 3.2, 3, 3.6, 4];

// The extension's own font shelf (see public/fonts in the extension).
export const FONTS = [
  ["Montserrat", "var(--font-montserrat), sans-serif"],
  ["Cal Sans", "var(--font-cal), sans-serif"],
  ["Tinos", "Tinos, serif"],
  ["Amatic SC", "'Amatic SC', cursive"],
  ["Fahkwang", "Fahkwang, sans-serif"],
  ["Playwrite NO", "'Playwrite NO', cursive"],
] as const;

export interface DemoState {
  track: Lang;
  font: number;
  poster: boolean;
  art: boolean;
  cover: boolean;
  center: boolean;
  playing: boolean;
  /** The visitor has touched a control: scroll scenes stop driving the window. */
  manual: boolean;
}

const SCENES: Record<string, Partial<DemoState>> = {
  classic: { poster: false, art: false, cover: false },
  pip: { poster: true, art: true, cover: true },
};

const Ctx = createContext<{
  s: DemoState;
  idx: number;
  set: (patch: Partial<DemoState>) => void;
  /** The real Document Picture-in-Picture window, when the visitor opened one. */
  pip: Window | null;
  canPip: boolean;
  /** The browser refused the last Picture-in-Picture request. */
  pipFailed: boolean;
  openPip: () => void;
} | null>(null);

export const useDemo = () => useContext(Ctx)!;

export function DemoProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  const [s, setS] = useState<DemoState>({
    track: lang,
    font: 0,
    poster: false,
    art: false,
    cover: false,
    center: false,
    playing: true,
    manual: false,
  });
  const [idx, setIdx] = useState(0);
  const set = (patch: Partial<DemoState>) =>
    setS((p) => ({ ...p, manual: true, ...patch }));

  const [pip, setPip] = useState<Window | null>(null);
  const [canPip, setCanPip] = useState(false);
  const [pipFailed, setPipFailed] = useState(false);

  // Start paused for visitors who asked for less motion.
  useEffect(() => {
    setCanPip("documentPictureInPicture" in window);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches)
      setS((p) => ({ ...p, playing: false }));
  }, []);

  const openPip = async () => {
    let w: Window;
    try {
      w = await (
        window as unknown as {
          documentPictureInPicture: {
            requestWindow(o: object): Promise<Window>;
          };
        }
      ).documentPictureInPicture.requestWindow({ width: 400, height: 300 });
    } catch {
      // Refused or blocked: say so in the window and stop offering it.
      setPipFailed(true);
      setCanPip(false);
      return;
    }
    // The new window starts empty: give it this page's styles and font classes.
    for (const sheet of document.styleSheets) {
      try {
        const style = w.document.createElement("style");
        style.textContent = [...sheet.cssRules].map((r) => r.cssText).join("");
        w.document.head.append(style);
      } catch {
        const link = w.document.createElement("link");
        link.rel = "stylesheet";
        link.href = sheet.href!;
        w.document.head.append(link);
      }
    }
    w.document.documentElement.className = document.documentElement.className;
    w.document.body.className = "lw-pip-body";
    w.addEventListener("pagehide", () => setPip(null));
    setPip(w);
  };

  useEffect(() => {
    if (!s.playing) return;
    const id = setTimeout(
      () => setIdx((idx + 1) % HOLD.length),
      HOLD[idx] * 1000,
    );
    return () => clearTimeout(id);
  }, [idx, s.playing]);

  // Each section the window "performs" is marked with data-scene.
  useEffect(() => {
    if (s.manual) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const scene = SCENES[(e.target as HTMLElement).dataset.scene!];
          if (e.isIntersecting && scene) setS((p) => ({ ...p, ...scene }));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    document.querySelectorAll("[data-scene]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [s.manual]);

  return (
    <Ctx.Provider value={{ s, idx, set, pip, canPip, pipFailed, openPip }}>
      <div data-track={s.track}>{children}</div>
    </Ctx.Provider>
  );
}
