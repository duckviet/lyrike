import React from "react";
import { useTranslation } from "react-i18next";

interface TabSwitcherProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

export function TabSwitcher({
  activeTab,
  onChange,
}: TabSwitcherProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex px-3 py-1.5 gap-xs bg-black/20 border-b border-border-subtle rounded-sm">
      <button
        className={`flex-1 px-3 py-1.5 border-none rounded-sm bg-transparent text-text-secondary text-[13px] font-medium cursor-pointer transition-all duration-150 hover:text-text-primary hover:bg-bg-hover ${
          activeTab === "lyrics" ? "text-text-primary bg-bg-active" : ""
        }`}
        onClick={() => onChange("lyrics")}
      >
        {t("common.lyrics")}
      </button>
      <button
        className={`flex-1 px-3 py-1.5 border-none rounded-sm bg-transparent text-text-secondary text-[13px] font-medium cursor-pointer transition-all duration-150 hover:text-text-primary hover:bg-bg-hover ${
          activeTab === "settings" ? "text-text-primary bg-bg-active" : ""
        }`}
        onClick={() => onChange("settings")}
      >
        {t("common.settings")}
      </button>
    </div>
  );
}
