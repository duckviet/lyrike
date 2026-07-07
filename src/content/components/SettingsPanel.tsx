import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PIP_LAYOUT_MODE, Settings, WatchInfo } from "../shared/types";
import { FONTS } from "../constants/settings";
import { ReadmeSection } from "./ReadmeSection";
import { ReportBugSection } from "./ReportBugSection";

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
      <span className="min-w-[48px] text-right text-[12px] text-text-secondary tabular-nums">
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
      role="switch"
      aria-checked={checked}
      className={`w-11 h-6 rounded-full cursor-pointer relative transition-colors duration-200 shrink-0 ${
        checked
          ? "bg-text-accent"
          : "bg-bg-tertiary border border-border-subtle"
      }`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`absolute top-[1.45px] w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
          checked ? "right-0" : "left-0"
        }`}
      />
    </button>
  );
}
/* ---------- Layout helpers ---------- */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className="flex flex-col gap-3 pb-4 border-b border-border-subtle last:border-b-0 last:pb-0">
      <header className="flex flex-col gap-[2px]">
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-text-accent">
          {title}
        </h3>
        {description && (
          <p className="text-[11px] text-text-secondary leading-snug">
            {description}
          </p>
        )}
      </header>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className="flex flex-col py-4 border-b border-border-subtle last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left cursor-pointer group py-1 select-none border-none bg-transparent outline-none"
      >
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-text-accent group-hover:text-text-accent/80 transition-colors duration-150">
          {title}
        </h3>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-text-secondary group-hover:text-text-primary transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div
        className={`grid transition-all duration-200 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 text-[13px] text-text-primary leading-normal">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}




function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <label className="text-[13px] text-text-primary">{label}</label>
        {hint && (
          <div className="relative group">
            <div className="rounded-full text-text-secondary text-[12px] flex items-center justify-center cursor-default select-none leading-none">
              ⓘ
            </div>
            <div className="absolute bottom-full left-[-8px] mb-2 w-max max-w-[200px] px-2 py-1.5 bg-bg-secondary border border-border-subtle rounded text-[11px] text-text-secondary leading-snug shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[999]">
              {hint}
              {/* Arrow */}
              <div className="absolute top-full left-[14px] -translate-x-1/2 border-4 border-transparent border-t-border-subtle" />
              <div className="absolute top-full left-[14px] -translate-x-1/2 -mt-px border-4 border-transparent border-t-bg-secondary" />
            </div>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col gap-px flex-1 min-w-0">
        <label className="text-[13px] text-text-primary">{label}</label>
        {hint && (
          <span className="text-[11px] text-text-secondary leading-snug">
            {hint}
          </span>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function RadioGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (value: T) => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`flex items-start gap-3 p-3 rounded-md border text-left transition-all duration-150 cursor-pointer ${
            value === opt.value
              ? "bg-text-accent/10 border-text-accent"
              : "bg-bg-tertiary border-border-subtle hover:border-text-muted"
          }`}
          onClick={() => onChange(opt.value)}
        >
          <div
            className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-150 ${
              value === opt.value
                ? "border-text-accent"
                : "border-border-subtle"
            }`}
          >
            {value === opt.value && (
              <div className="w-2 h-2 rounded-full bg-text-accent" />
            )}
          </div>
          <div className="flex flex-col gap-px min-w-0">
            <span className="text-[13px] text-text-primary font-medium leading-none">
              {opt.label}
            </span>
            {opt.hint && (
              <span className="text-[11px] text-text-secondary leading-snug">
                {opt.hint}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

/* ---------- Panel ---------- */

interface SettingsPanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onReset: () => void;
  track?: WatchInfo | null;
  lyricsId?: number;
}

export function SettingsPanel({
  settings,
  onChange,
  onReset,
  track,
  lyricsId,
}: SettingsPanelProps): React.JSX.Element {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (settings.language === "auto") {
      const browserLang = navigator.language.startsWith("vi") ? "vi" : "en";
      i18n.changeLanguage(browserLang);
    } else {
      i18n.changeLanguage(settings.language);
    }
  }, [settings.language, i18n]);

  const handleChange = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ): void => {
    onChange({ ...settings, [key]: value });
  };

  const selectClass =
    "w-full p-[8px_10px] bg-bg-tertiary border border-border-subtle rounded-sm text-text-primary text-[13px] cursor-pointer outline-none";

  const selectedFont =
    FONTS.find((f) => f.value === settings.fontFamily) || FONTS[0];

  const handleFontFamilyChange = (value: string) => {
    const newFont = FONTS.find((f) => f.value === value) || FONTS[0];
    const updates: Partial<Settings> = { fontFamily: value };

    // Clamp weights to new font's range
    const minW = newFont.minWeight ?? Math.min(...newFont.weights);
    const maxW = newFont.maxWeight ?? Math.max(...newFont.weights);

    if (settings.activeFontWeight < minW) updates.activeFontWeight = minW;
    if (settings.activeFontWeight > maxW) updates.activeFontWeight = maxW;
    if (settings.fontWeight < minW) updates.fontWeight = minW;
    if (settings.fontWeight > maxW) updates.fontWeight = maxW;

    // Reset italic if not supported
    if (!newFont.supportsItalic && settings.fontStyle === "italic") {
      updates.fontStyle = "normal";
    }

    onChange({ ...settings, ...updates });
  };

  const minWeight = selectedFont.minWeight ?? Math.min(...selectedFont.weights);
  const maxWeight = selectedFont.maxWeight ?? Math.max(...selectedFont.weights);
  const weightStep = selectedFont.isVariable ? 10 : 100;

  return (
    <div className="flex flex-col gap-4">
      {/* Readme */}
      <ReadmeSection />

      {/* Typography */}
      <Section
        title={t("settings.typography.title")}
        description={t("settings.typography.desc")}
      >
        <Field
          label={t("settings.typography.font_family.label")}
          hint={t("settings.typography.font_family.hint")}
        >
          <select
            className={selectClass}
            value={settings.fontFamily}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
          >
            {FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label={t("settings.typography.text_size.label")}
          hint={t("settings.typography.text_size.hint")}
        >
          <Slider
            value={settings.textSize}
            onChange={(v) => handleChange("textSize", v)}
            min={12}
            max={32}
            unit="px"
          />
        </Field>

        <Field
          label={t("settings.typography.active_line_size.label")}
          hint={t("settings.typography.active_line_size.hint")}
        >
          <Slider
            value={settings.activeTextSize}
            onChange={(v) => handleChange("activeTextSize", v)}
            min={14}
            max={40}
            unit="px"
          />
        </Field>

        {selectedFont.weights.length > 1 && (
          <>
            <Field
              label={t("settings.typography.active_font_weight.label")}
              hint={t("settings.typography.active_font_weight.hint")}
            >
              <Slider
                value={settings.activeFontWeight}
                onChange={(v) => handleChange("activeFontWeight", v)}
                min={minWeight}
                max={maxWeight}
                step={weightStep}
              />
            </Field>

            <Field
              label={t("settings.typography.base_font_weight.label")}
              hint={t("settings.typography.base_font_weight.hint")}
            >
              <Slider
                value={settings.fontWeight}
                onChange={(v) => handleChange("fontWeight", v)}
                min={minWeight}
                max={maxWeight}
                step={weightStep}
              />
            </Field>
          </>
        )}

        {selectedFont.supportsItalic && (
          <Field
            label={t("settings.typography.font_style.label")}
            hint={t("settings.typography.font_style.hint")}
          >
            <select
              className={selectClass}
              value={settings.fontStyle}
              onChange={(e) =>
                handleChange(
                  "fontStyle",
                  e.target.value as Settings["fontStyle"],
                )
              }
            >
              <option value="normal">Normal</option>
              <option value="italic">Italic</option>
            </select>
          </Field>
        )}

        <Field
          label={t("settings.typography.text_align.label")}
          hint={t("settings.typography.text_align.hint")}
        >
          <select
            className={selectClass}
            value={settings.textAlign}
            onChange={(e) =>
              handleChange("textAlign", e.target.value as Settings["textAlign"])
            }
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </Field>
      </Section>

      {/* Layout */}
      <Section
        title={t("settings.layout.title")}
        description={t("settings.layout.desc")}
      >
        <Field
          label={t("settings.layout.visible_lines.label")}
          hint={t("settings.layout.visible_lines.hint")}
        >
          <Slider
            value={settings.visibleLineCount}
            onChange={(v) => handleChange("visibleLineCount", v)}
            min={3}
            max={15}
            step={2}
          />
        </Field>

        <Field
          label={t("settings.layout.widget_width.label")}
          hint={t("settings.layout.widget_width.hint")}
        >
          <Slider
            value={settings.widgetWidth}
            onChange={(v) => handleChange("widgetWidth", v)}
            min={280}
            max={500}
            step={10}
            unit="px"
          />
        </Field>

        <Field
          label={t("settings.layout.border_radius.label")}
          hint={t("settings.layout.border_radius.hint")}
        >
          <Slider
            value={settings.borderRadius}
            onChange={(v) => handleChange("borderRadius", v)}
            min={8}
            max={32}
            unit="px"
          />
        </Field>

        <Field
          label={t("settings.layout.line_gap.label")}
          hint={t("settings.layout.line_gap.hint")}
        >
          <Slider
            value={settings.lineGap}
            onChange={(v) => handleChange("lineGap", v)}
            min={0}
            max={20}
            unit="px"
          />
        </Field>
      </Section>

      {/* Appearance */}
      <Section
        title={t("settings.appearance.title")}
        description={t("settings.appearance.desc")}
      >
        <Field
          label={t("settings.appearance.inactive_opacity.label")}
          hint={t("settings.appearance.inactive_opacity.hint")}
        >
          <Slider
            value={Math.round(settings.inactiveOpacity * 100)}
            onChange={(v) => handleChange("inactiveOpacity", v / 100)}
            min={10}
            max={100}
            unit="%"
          />
        </Field>

        <Field
          label={t("settings.appearance.background_opacity.label")}
          hint={t("settings.appearance.background_opacity.hint")}
        >
          <Slider
            value={settings.backgroundOpacity}
            onChange={(v) => handleChange("backgroundOpacity", v)}
            min={30}
            max={100}
            unit="%"
          />
        </Field>

        <Field
          label={t("settings.appearance.glide_duration.label")}
          hint={t("settings.appearance.glide_duration.hint")}
        >
          <Slider
            value={settings.lyricSlideDurationSec ?? 0.5}
            onChange={(v) => handleChange("lyricSlideDurationSec", v)}
            min={0.2}
            max={0.8}
            step={0.05}
            displayValue={`${(settings.lyricSlideDurationSec ?? 0.5).toFixed(2)}s`}
          />
        </Field>

        <ToggleRow
          label={t("settings.appearance.prioritize_karaoke.label")}
          hint={t("settings.appearance.prioritize_karaoke.hint")}
          checked={settings.prioritizeKaraoke}
          onChange={(v) => handleChange("prioritizeKaraoke", v)}
        />
      </Section>

      {/* Picture-in-Picture */}
      <Section
        title={t("settings.pip.title")}
        description={t("settings.pip.desc")}
      >
        <ToggleRow
          label={t("settings.pip.hide_on_pip.label")}
          hint={t("settings.pip.hide_on_pip.hint")}
          checked={settings.hideFloatingWhenPiPOpen}
          onChange={(v) => handleChange("hideFloatingWhenPiPOpen", v)}
        />

        <Field
          label={t("settings.pip.background_mode.label")}
          hint={t("settings.pip.background_mode.hint")}
        >
          <RadioGroup
            value={settings.pipBackgroundMode}
            onChange={(v) => handleChange("pipBackgroundMode", v)}
            options={[
              {
                value: "default",
                label: t("settings.pip.background_mode.default"),
                hint: t("settings.pip.background_mode.hint"),
              },
              {
                value: "color",
                label: t("settings.pip.background_mode.color"),
                hint: t("settings.pip.dominant_color.hint"),
              },
              {
                value: "thumbnail",
                label: t("settings.pip.background_mode.thumbnail"),
                hint: t("settings.pip.thumbnail_bg.hint"),
              },
              {
                value: "video",
                label: t("settings.pip.background_mode.video"),
                hint: t("settings.pip.video_bg.hint"),
              },
            ]}
          />
        </Field>

        <Field
          label={t("settings.pip.layout_mode.label")}
          hint={t("settings.pip.layout_mode.hint")}
        >
          <RadioGroup
            value={settings.pipLayoutMode}
            onChange={(v) => handleChange("pipLayoutMode", v)}
            options={[
              {
                value: PIP_LAYOUT_MODE.CLASSIC,
                label: t("settings.pip.layout_mode.classic"),
                hint: t("settings.pip.layout_mode.classic_hint"),
              },
              {
                value: PIP_LAYOUT_MODE.SPLIT,
                label: t("settings.pip.layout_mode.split"),
                hint: t("settings.pip.layout_mode.split_hint"),
              },
            ]}
          />
        </Field>

        {/* <Field
          label={t("settings.pip.info_collapse_width.label")}
          hint={t("settings.pip.info_collapse_width.hint")}
        >
          <div className="flex items-center gap-[10px]">
            <input
              className={`${selectClass} flex-1`}
              type="number"
              min={320}
              step={10}
              value={settings.pipInfoCollapseWidth ?? 300}
              onChange={(e) =>
                handleChange(
                  "pipInfoCollapseWidth",
                  Number(e.target.value || 0),
                )
              }
            />
            <span className="min-w-[48px] text-right text-[12px] text-text-secondary tabular-nums">
              px
            </span>
          </div>
        </Field> */}
      </Section>

      {/* Language */}
      <Section
        title={t("settings.language.title")}
        description={t("settings.language.desc")}
      >
        <Field
          label={t("settings.language.label")}
          hint={t("settings.language.hint")}
        >
          <select
            className={selectClass}
            value={settings.language}
            onChange={(e) =>
              handleChange("language", e.target.value as Settings["language"])
            }
          >
            <option value="auto">{t("settings.language.auto")}</option>
            <option value="vi">{t("settings.language.vi")}</option>
            <option value="en">{t("settings.language.en")}</option>
          </select>
        </Field>
      </Section>

      {/* Report Issue */}
      <ReportBugSection track={track} lyricsId={lyricsId} />

      <button
        className="mt-sm p-[8px_16px] border border-border-light rounded-sm bg-transparent text-text-secondary text-[12px] cursor-pointer transition-all duration-150 hover:bg-bg-hover hover:text-text-primary"
        onClick={onReset}
      >
        {t("common.reset_to_default")}
      </button>
    </div>
  );
}
