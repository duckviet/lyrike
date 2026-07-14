import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { CollapsibleSection } from "./SettingsPanel";

function YouTubeLogo({ className = "h-3.5 w-auto" }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="1.376 1.326 243.258 170.273" className={className} xmlns="http://www.w3.org/2000/svg">
      <g fill="none" fillRule="evenodd">
        <path d="m239.564 27.912c-2.786-10.449-11.03-18.69-21.516-21.516-18.962-5.07-95.043-5.07-95.043-5.07s-76.042 0-95.043 5.07c-10.448 2.786-18.692 11.03-21.516 21.516-5.07 18.962-5.07 58.55-5.07 58.55s0 39.59 5.07 58.551c2.786 10.45 11.029 18.691 21.516 21.516 19 5.07 95.043 5.07 95.043 5.07s76.08 0 95.043-5.07c10.449-2.786 18.69-11.029 21.516-21.516 5.07-18.962 5.07-58.55 5.07-58.55s0-39.589-5.07-58.55z" fill="#f00"/>
        <path d="m98.703 122.955 63.194-36.493-63.194-36.492z" fill="#fff"/>
      </g>
    </svg>
  );
}

function YouTubeMusicLogo({ className = "h-3.5 w-auto" }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="0 0 204 204" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="102" cy="102" r="102" fill="red"/>
      <path d="M512,463.36A48.64,48.64,0,1,1,463.36,512,48.69,48.69,0,0,1,512,463.36m0-4.68A53.32,53.32,0,1,0,565.32,512,53.31,53.31,0,0,0,512,458.68Z" transform="translate(-410 -410)" fill="#fff"/>
      <path d="M493.45,538.66l45.2-27.82-45.2-25.5Z" transform="translate(-410 -410)" fill="#fff"/>
    </svg>
  );
}

export function ReadmeSection(): React.JSX.Element {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CollapsibleSection
      title={t("settings.readme.title")}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <ul className="list-disc pl-4 flex flex-col gap-3 text-[12px] text-text-secondary leading-relaxed">
        <li>
          <span>
            {t("settings.readme.source_desc_1")}{" "}
            <a
              href="https://lrclib.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-accent hover:underline font-medium"
            >
              LRCLIB
            </a>{" "}
            {t("settings.readme.source_desc_2")}{" "}
            <a
              href="https://github.com/tranxuanthang/lrclib"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-accent hover:underline font-medium"
            >
              lrclib
            </a>
            {t("settings.readme.source_desc_3")}
          </span>
        </li>
        <li>
          <div className="flex flex-col gap-2">
            <span>{t("settings.readme.support_desc")}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-border-subtle text-[11px] font-medium text-text-primary">
                <YouTubeLogo className="h-3.5 w-auto" />
                <span>YouTube</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-border-subtle text-[11px] font-medium text-text-primary">
                <YouTubeMusicLogo className="h-[13px] w-auto" />
                <span>YouTube Music</span>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </CollapsibleSection>
  );
}
