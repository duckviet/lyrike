import React from "react";
import { Settings } from "../shared/types";
import { FONTS } from "../constants/settings";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  displayValue?: string;
}

function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
  displayValue,
}: SliderProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-[10px]">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="yl-slider flex-1"
      />
      <span className="min-w-[42px] text-right text-[12px] text-text-secondary tabular-nums">
        {displayValue ?? `${value}${unit}`}
      </span>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ checked, onChange }: ToggleProps): React.JSX.Element {
  return (
    <button
      type="button"
      className={`w-10 h-[22px] bg-bg-tertiary border border-border-subtle rounded-[11px] cursor-pointer relative transition-all duration-150 p-0.5 ${
        checked ? "bg-text-accent border-text-accent" : ""
      }`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-text-primary rounded-full transition-transform duration-150 ${
          checked ? "translate-x-[18px]" : ""
        }`}
      />
    </button>
  );
}

interface SettingsPanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onReset: () => void;
}

export function SettingsPanel({
  settings,
  onChange,
  onReset,
}: SettingsPanelProps): React.JSX.Element {
  const handleChange = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ): void => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-[6px]">
        <label className="text-[13px] text-text-secondary">Font Family</label>
        <select
          className="w-full p-[8px_10px] bg-bg-tertiary border border-border-subtle rounded-sm text-text-primary text-[13px] cursor-pointer outline-none"
          value={settings.fontFamily}
          onChange={(e) => handleChange("fontFamily", e.target.value)}
        >
          {FONTS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-[6px]">
        <label className="text-[13px] text-text-secondary">Text Size</label>
        <Slider
          value={settings.textSize}
          onChange={(v) => handleChange("textSize", v)}
          min={12}
          max={32}
          unit="px"
        />
      </div>

      <div className="flex flex-col gap-[6px]">
        <label className="text-[13px] text-text-secondary">
          Active Line Size
        </label>
        <Slider
          value={settings.activeTextSize}
          onChange={(v) => handleChange("activeTextSize", v)}
          min={14}
          max={40}
          unit="px"
        />
      </div>

      <div className="flex flex-col gap-[6px]">
        <label className="text-[13px] text-text-secondary">Visible Lines</label>
        <Slider
          value={settings.visibleLineCount}
          onChange={(v) => handleChange("visibleLineCount", v)}
          min={3}
          max={15}
          step={2}
        />
      </div>

      <div className="flex flex-col gap-[6px]">
        <label className="text-[13px] text-text-secondary">
          Active Font Weight
        </label>
        <Slider
          value={settings.activeFontWeight}
          onChange={(v) => handleChange("activeFontWeight", v)}
          min={400}
          max={800}
          step={100}
        />
      </div>

      <div className="flex flex-col gap-[6px]">
        <label className="text-[13px] text-text-secondary">
          Inactive Opacity
        </label>
        <Slider
          value={Math.round(settings.inactiveOpacity * 100)}
          onChange={(v) => handleChange("inactiveOpacity", v / 100)}
          min={10}
          max={100}
          unit="%"
        />
      </div>

      <div className="flex flex-col gap-[6px]">
        <label className="text-[13px] text-text-secondary">
          Lyric Glide Duration
        </label>
        <Slider
          value={settings.lyricSlideDurationSec ?? 0.5}
          onChange={(v) => handleChange("lyricSlideDurationSec", v)}
          min={0.2}
          max={0.8}
          step={0.05}
          displayValue={`${(settings.lyricSlideDurationSec ?? 0.5).toFixed(2)}s`}
        />
      </div>

      <div className="flex flex-col gap-[6px]">
        <label className="text-[13px] text-text-secondary">Widget Width</label>
        <Slider
          value={settings.widgetWidth}
          onChange={(v) => handleChange("widgetWidth", v)}
          min={280}
          max={500}
          step={10}
          unit="px"
        />
      </div>

      <div className="flex flex-col gap-[6px]">
        <label className="text-[13px] text-text-secondary">Border Radius</label>
        <Slider
          value={settings.borderRadius}
          onChange={(v) => handleChange("borderRadius", v)}
          min={8}
          max={32}
          unit="px"
        />
      </div>

      <div className="flex flex-col gap-[6px]">
        <label className="text-[13px] text-text-secondary">
          Background Opacity
        </label>
        <Slider
          value={settings.backgroundOpacity}
          onChange={(v) => handleChange("backgroundOpacity", v)}
          min={30}
          max={100}
          unit="%"
        />
      </div>

      <div className="flex gap-[6px] flex-row items-center justify-between">
        <label className="text-[13px] text-text-secondary">Auto-scroll</label>
        <Toggle
          checked={settings.autoScroll}
          onChange={(v) => handleChange("autoScroll", v)}
        />
      </div>

      <div className="flex gap-[6px] flex-row items-center justify-between">
        <label className="text-[13px] text-text-secondary">Hide on PiP</label>
        <Toggle
          checked={settings.hideFloatingWhenPiPOpen}
          onChange={(v) => handleChange("hideFloatingWhenPiPOpen", v)}
        />
      </div>

      <div className="flex gap-[6px] flex-row items-center justify-between">
        <label className="text-[13px] text-text-secondary">
          PiP dominant color
        </label>
        <Toggle
          checked={settings.usePiPDominantColorTheme}
          onChange={(v) => handleChange("usePiPDominantColorTheme", v)}
        />
      </div>

      <div className="flex gap-[6px] flex-row items-center justify-between">
        <label className="text-[13px] text-text-secondary">
          PiP thumbnail background
        </label>
        <Toggle
          checked={settings.pipShowThumbnailBackground}
          onChange={(v) => handleChange("pipShowThumbnailBackground", v)}
        />
      </div>

      <div className="flex gap-[6px] flex-row items-center justify-between">
        <label className="text-[13px] text-text-secondary">
          PiP video background
        </label>
        <Toggle
          checked={settings.pipShowVideoBackground}
          onChange={(v) => handleChange("pipShowVideoBackground", v)}
        />
      </div>

      <div className="yl-settings-group">
        <label className="text-[13px] text-text-secondary">Text Align</label>
        <select
          className="w-full p-[8px_10px] bg-bg-tertiary border border-border-subtle rounded-sm text-text-primary text-[13px] cursor-pointer outline-none"
          value={settings.textAlign}
          onChange={(e) =>
            handleChange("textAlign", e.target.value as Settings["textAlign"])
          }
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      <button
        className="mt-sm p-[8px_16px] border border-border-light rounded-sm bg-transparent text-text-secondary text-[12px] cursor-pointer transition-all duration-150 hover:bg-bg-hover hover:text-text-primary"
        onClick={onReset}
      >
        Reset to Default
      </button>
    </div>
  );
}
