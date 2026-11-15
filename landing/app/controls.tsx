"use client";

import type { Copy, Lang } from "./copy";
import { FONTS, TRACKS, useDemo } from "./demo";

/** The song printed large on the page, lit in step with the floating window. */
export function LyricSheet() {
  const { s, idx } = useDemo();
  return (
    <ol className="sheet" aria-hidden>
      {TRACKS[s.track].lines.map((line, i) => (
        <li key={i} data-on={i === idx}>
          {line}
        </li>
      ))}
    </ol>
  );
}

export function PipButton({ label }: { label: string }) {
  const { canPip, pip, openPip } = useDemo();
  if (!canPip || pip) return null;
  return (
    <button type="button" className="btn btn-onaccent mt-8" onClick={openPip}>
      {label}
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-t border-line py-5 sm:grid-cols-[11rem_1fr] sm:items-center">
      <span className="text-sm font-semibold text-ink-2">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className="chip" aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

export function StyleControls({ t }: { t: Copy }) {
  const { s, set } = useDemo();
  const pair = (
    key: "poster" | "art" | "cover" | "center",
    off: string,
    on: string,
  ) =>
    [false, true].map((v) => (
      <Chip key={String(v)} on={s[key] === v} onClick={() => set({ [key]: v })}>
        {v ? on : off}
      </Chip>
    ));

  return (
    <div className="mt-10 border-b border-line">
      <Row label={t.track}>
        {(Object.keys(TRACKS) as Lang[]).map((id) => (
          <button
            key={id}
            type="button"
            className="track"
            aria-pressed={s.track === id}
            onClick={() => set({ track: id })}
          >
            <img
              src={TRACKS[id].thumb}
              alt=""
              width={44}
              height={44}
              loading="lazy"
            />
            {TRACKS[id].title}
          </button>
        ))}
      </Row>
      <Row label={t.font}>
        {FONTS.map(([name], i) => (
          <Chip key={name} on={s.font === i} onClick={() => set({ font: i })}>
            {name}
          </Chip>
        ))}
      </Row>
      <Row label={t.display}>{pair("poster", t.classic, t.poster)}</Row>
      <Row label={t.align}>{pair("center", t.left, t.center)}</Row>
      <Row label={t.artwork}>{pair("art", t.off, t.on)}</Row>
      <Row label={t.background}>{pair("cover", t.off, t.on)}</Row>
    </div>
  );
}
