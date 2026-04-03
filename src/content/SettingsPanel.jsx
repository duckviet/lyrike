import React from "react";

const FONTS = [
  {
    label: "Inter",
    value: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  {
    label: "System UI",
    value: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Open Sans", value: "Open Sans, sans-serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Poppins", value: "Poppins, sans-serif" },
  { label: "JetBrains Mono", value: "JetBrains Mono, monospace" },
];

function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
  displayValue,
}) {
  return (
    <div className="yl-slider-row">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="yl-slider"
      />
      <span className="yl-slider-value">
        {displayValue ?? `${value}${unit}`}
      </span>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      className={`yl-toggle ${checked ? "active" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="yl-toggle-thumb" />
    </button>
  );
}

export function SettingsPanel({ settings, onChange, onReset }) {
  const handleChange = (key, value) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="yl-settings">
      <div className="yl-settings-group">
        <label className="yl-settings-label">Font Family</label>
        <select
          className="yl-settings-select"
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

      <div className="yl-settings-group">
        <label className="yl-settings-label">Text Size</label>
        <Slider
          value={settings.textSize}
          onChange={(v) => handleChange("textSize", v)}
          min={12}
          max={24}
          unit="px"
        />
      </div>

      <div className="yl-settings-group">
        <label className="yl-settings-label">Active Line Size</label>
        <Slider
          value={settings.activeTextSize}
          onChange={(v) => handleChange("activeTextSize", v)}
          min={14}
          max={32}
          unit="px"
        />
      </div>

      <div className="yl-settings-group">
        <label className="yl-settings-label">Visible Lines</label>
        <Slider
          value={settings.visibleLineCount}
          onChange={(v) => handleChange("visibleLineCount", v)}
          min={3}
          max={15}
          step={2}
        />
      </div>

      <div className="yl-settings-group">
        <label className="yl-settings-label">Active Font Weight</label>
        <Slider
          value={settings.activeFontWeight}
          onChange={(v) => handleChange("activeFontWeight", v)}
          min={400}
          max={800}
          step={100}
        />
      </div>

      <div className="yl-settings-group">
        <label className="yl-settings-label">Inactive Opacity</label>
        <Slider
          value={Math.round(settings.inactiveOpacity * 100)}
          onChange={(v) => handleChange("inactiveOpacity", v / 100)}
          min={10}
          max={100}
          unit="%"
        />
      </div>

      <div className="yl-settings-group">
        <label className="yl-settings-label">Lyric Glide Duration</label>
        <Slider
          value={settings.lyricSlideDurationSec ?? 0.5}
          onChange={(v) => handleChange("lyricSlideDurationSec", v)}
          min={0.2}
          max={0.8}
          step={0.05}
          displayValue={`${(settings.lyricSlideDurationSec ?? 0.5).toFixed(2)}s`}
        />
      </div>

      <div className="yl-settings-group">
        <label className="yl-settings-label">Widget Width</label>
        <Slider
          value={settings.widgetWidth}
          onChange={(v) => handleChange("widgetWidth", v)}
          min={280}
          max={500}
          step={10}
          unit="px"
        />
      </div>

      <div className="yl-settings-group">
        <label className="yl-settings-label">Border Radius</label>
        <Slider
          value={settings.borderRadius}
          onChange={(v) => handleChange("borderRadius", v)}
          min={8}
          max={32}
          unit="px"
        />
      </div>

      <div className="yl-settings-group">
        <label className="yl-settings-label">Background Opacity</label>
        <Slider
          value={settings.backgroundOpacity}
          onChange={(v) => handleChange("backgroundOpacity", v)}
          min={30}
          max={100}
          unit="%"
        />
      </div>

      <div className="yl-settings-group yl-settings-row">
        <label className="yl-settings-label">Auto-scroll</label>
        <Toggle
          checked={settings.autoScroll}
          onChange={(v) => handleChange("autoScroll", v)}
        />
      </div>

      <div className="yl-settings-group yl-settings-row">
        <label className="yl-settings-label">Hide on PiP</label>
        <Toggle
          checked={settings.hideFloatingWhenPiPOpen}
          onChange={(v) => handleChange("hideFloatingWhenPiPOpen", v)}
        />
      </div>

      <div className="yl-settings-group">
        <label className="yl-settings-label">Text Align</label>
        <select
          className="yl-settings-select"
          value={settings.textAlign}
          onChange={(e) => handleChange("textAlign", e.target.value)}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      <button className="yl-settings-reset" onClick={onReset}>
        Reset to Default
      </button>
    </div>
  );
}
