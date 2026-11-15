"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { STORE_URL, type Copy } from "./copy";
import { FONTS, TRACKS, useDemo } from "./demo";

// Icons: same drawings as the extension (src/content/icons.tsx and
// WidgetHeader.tsx), plus play/pause and move for the demo strip.
const icon = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};
const PipIcon = () => (
  <svg {...icon}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <rect x="12" y="9" width="8" height="6" rx="1" />
  </svg>
);
const MinimizeIcon = () => (
  <svg {...icon}>
    <path d="M5 12h14" />
  </svg>
);
const ExpandIcon = () => (
  <svg {...icon}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const CloseIcon = () => (
  <svg {...icon}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const PlayIcon = () => (
  <svg {...icon}>
    <path d="M7 4.5v15l12-7.5z" />
  </svg>
);
const PauseIcon = () => (
  <svg {...icon}>
    <path d="M8 5v14M16 5v14" />
  </svg>
);
const MoveIcon = () => (
  <svg {...icon}>
    <path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" />
  </svg>
);

/** Classic display: the list slides so the sung line sits in the middle. */
function Classic({ lines, idx }: { lines: readonly string[]; idx: number }) {
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const [, relayout] = useState(0);

  useLayoutEffect(() => {
    const el = list.current!.children[idx] as HTMLElement;
    const y = box.current!.clientHeight / 2 - el.offsetTop - el.offsetHeight / 2;
    list.current!.style.transform = `translateY(${y}px)`;
  });

  // A late-loading font changes line heights: measure again.
  useEffect(() => {
    const fonts = box.current!.ownerDocument.fonts;
    const again = () => relayout((n) => n + 1);
    fonts.addEventListener("loadingdone", again);
    return () => fonts.removeEventListener("loadingdone", again);
  }, []);

  return (
    <div ref={box} className="lw-classic">
      <ol ref={list}>
        {lines.map((line, i) => (
          <li key={i} data-d={Math.min(3, Math.abs(i - idx))}>
            {line}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Poster display: two lines at a time, with the sung line ghosted behind. */
function Poster({ lines, idx }: { lines: readonly string[]; idx: number }) {
  const first = idx - (idx % 2);
  return (
    <div className="lw-poster">
      <span key={`ghost-${idx}`} className="lw-ghost" aria-hidden>
        {lines[idx]}
      </span>
      <div key={`pair-${first}`}>
        {[first, first + 1].map((i) => (
          <p key={i} data-on={i <= idx}>
            {lines[i]}
          </p>
        ))}
      </div>
    </div>
  );
}

/** The Settings tab: a few of the extension's real settings, same wording. */
function Settings({ t }: { t: Copy }) {
  const { s, set } = useDemo();
  return (
    <div className="lw-settings">
      <h3>{t.setTypography}</h3>
      <p>{t.setTypographyDesc}</p>
      <label>
        {t.setFont}
        <select
          value={s.font}
          onChange={(e) => set({ font: Number(e.target.value) })}
        >
          {FONTS.map(([name], i) => (
            <option key={name} value={i}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t.setAlign}
        <select
          value={s.center ? "center" : "left"}
          onChange={(e) => set({ center: e.target.value === "center" })}
        >
          <option value="left">{t.left}</option>
          <option value="center">{t.center}</option>
        </select>
      </label>
      <h3>{t.setPip}</h3>
      <p>{t.setPipDesc}</p>
      <label>
        {t.setDisplay}
        <select
          value={s.poster ? "poster" : "classic"}
          onChange={(e) => set({ poster: e.target.value === "poster" })}
        >
          <option value="classic">{t.classic}</option>
          <option value="poster">{t.poster}</option>
        </select>
      </label>
      {(
        [
          ["art", t.setMeta],
          ["cover", t.setThumb],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="lw-switch">
          {label}
          <input
            type="checkbox"
            role="switch"
            checked={s[key]}
            onChange={(e) => set({ [key]: e.target.checked })}
          />
        </label>
      ))}
    </div>
  );
}

export function LyricWindow({ t }: { t: Copy }) {
  const { s, idx, set, pip, canPip, pipFailed, openPip } = useDemo();
  const track = TRACKS[s.track];
  const [min, setMin] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [tab, setTab] = useState<"lyrics" | "settings">("lyrics");
  const [searching, setSearching] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });

  // Switching track shows the extension's "searching" state for a moment.
  const lastTrack = useRef(s.track);
  useEffect(() => {
    if (lastTrack.current === s.track) return;
    lastTrack.current = s.track;
    setSearching(true);
    const id = setTimeout(() => setSearching(false), 900);
    return () => clearTimeout(id);
  }, [s.track]);

  // Move by a delta, keeping the whole window inside the viewport.
  const moveBy = (dx: number, dy: number) => {
    const el = shell.current!;
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(dx, -r.left), innerWidth - r.right);
    const y = Math.min(Math.max(dy, -r.top), innerHeight - r.bottom);
    pos.current = { x: pos.current.x + x, y: pos.current.y + y };
    el.style.translate = `${pos.current.x}px ${pos.current.y}px`;
  };

  const startDrag = (e: React.PointerEvent) => {
    // Only the desktop (fixed) window is draggable; buttons keep their clicks.
    if (
      (e.target as HTMLElement).closest("button") ||
      getComputedStyle(shell.current!).position !== "fixed"
    )
      return;
    e.preventDefault();
    let last = { x: e.clientX, y: e.clientY };
    const move = (ev: PointerEvent) => {
      moveBy(ev.clientX - last.x, ev.clientY - last.y);
      last = { x: ev.clientX, y: ev.clientY };
    };
    // pointercancel too: an interrupted gesture must not leave the drag live.
    const up = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", up);
      removeEventListener("pointercancel", up);
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
    addEventListener("pointercancel", up);
  };

  const nudge = (e: React.KeyboardEvent) => {
    const step: Record<string, [number, number]> = {
      ArrowLeft: [-24, 0],
      ArrowRight: [24, 0],
      ArrowUp: [0, -24],
      ArrowDown: [0, 24],
    };
    if (!step[e.key]) return;
    e.preventDefault();
    moveBy(...step[e.key]);
  };

  // A resized viewport could strand the window off screen: put it back.
  useEffect(() => {
    const reset = () => {
      pos.current = { x: 0, y: 0 };
      shell.current!.style.translate = "";
    };
    addEventListener("resize", reset);
    return () => removeEventListener("resize", reset);
  }, []);

  const lyrics = (
    <div
      className="lw-lyrics"
      style={{
        fontFamily: FONTS[s.font][1],
        textAlign: s.center ? "center" : "left",
      }}
    >
      {s.cover && <img className="lw-bg" src={track.cover} alt="" />}
      {s.art && (
        <span className="lw-vinyl" aria-hidden>
          <img src={track.thumb} alt="" />
        </span>
      )}
      {s.poster ? (
        <Poster lines={track.lines} idx={idx} />
      ) : (
        <Classic lines={track.lines} idx={idx} />
      )}
    </div>
  );

  const body =
    tab === "settings" ? (
      <Settings t={t} />
    ) : pip ? (
      <div className="lw-state">
        <p>{t.pipActive}</p>
        <button type="button" onClick={() => pip.close()}>
          {t.pipBack}
        </button>
      </div>
    ) : searching ? (
      <div className="lw-state" role="status">
        <span className="lw-dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <p>{t.searching}</p>
      </div>
    ) : (
      lyrics
    );

  return (
    <>
      <div ref={shell} className="lw-wrap" data-paused={!s.playing}>
        {hidden ? (
          // The extension leaves this button behind when the widget is hidden.
          <button
            type="button"
            className="lw-reopen"
            aria-label={t.reopen}
            onClick={() => setHidden(false)}
          >
            <img src="/lyrike.svg" alt="" width={16} height={13} /> Lyrike
          </button>
        ) : (
          <div className="lw" role="group" aria-label={t.winLabel}>
            <div className="lw-head" onPointerDown={startDrag}>
              <div className="lw-meta">
                <strong>{track.title}</strong>
                <span>{track.artist}</span>
              </div>
              {canPip && !pip && (
                <button
                  type="button"
                  aria-label={t.pipBtn}
                  title={t.pipBtn}
                  onClick={openPip}
                >
                  <PipIcon />
                </button>
              )}
              <button
                type="button"
                aria-label={min ? t.expand : t.minimize}
                title={min ? t.expand : t.minimize}
                aria-expanded={!min}
                onClick={() => setMin(!min)}
              >
                {min ? <ExpandIcon /> : <MinimizeIcon />}
              </button>
              <button
                type="button"
                aria-label={t.hide}
                title={t.hide}
                onClick={() => setHidden(true)}
              >
                <CloseIcon />
              </button>
            </div>
            <div className="lw-tabs">
              {(["lyrics", "settings"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={tab === id}
                  onClick={() => setTab(id)}
                >
                  {id === "lyrics" ? t.tabLyrics : t.tabSettings}
                </button>
              ))}
            </div>
            {!min && body}
          </div>
        )}

        {/* Demo-only controls live outside the window, which mirrors the product. */}
        <div className="lw-demo">
          <button
            type="button"
            className="lw-move"
            aria-label={t.move}
            title={t.move}
            onKeyDown={nudge}
          >
            <MoveIcon />
          </button>
          <button
            type="button"
            aria-label={s.playing ? t.pause : t.play}
            title={s.playing ? t.pause : t.play}
            onClick={() => set({ playing: !s.playing, manual: s.manual })}
          >
            {s.playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <p role={pipFailed ? "status" : undefined}>
            {pipFailed ? t.pipFail : t.winNote}
            {!pipFailed && <span className="lw-drag"> {t.dragHint}</span>}
          </p>
          <a href={STORE_URL}>{t.cta}</a>
        </div>
      </div>
      {pip && createPortal(lyrics, pip.document.body)}
    </>
  );
}
