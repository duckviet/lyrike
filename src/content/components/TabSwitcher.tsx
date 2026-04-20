import React from 'react';

interface TabSwitcherProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

export function TabSwitcher({ activeTab, onChange }: TabSwitcherProps): React.JSX.Element {
  return (
    <div className="flex px-3 py-1.5 gap-xs bg-black/20 border-b border-border-subtle">
      <button
        className={`flex-1 px-3 py-1.5 border-none rounded-sm bg-transparent text-text-secondary text-[13px] font-medium cursor-pointer transition-all duration-150 hover:text-text-primary hover:bg-bg-hover ${
          activeTab === 'lyrics' ? 'text-text-primary bg-bg-active' : ''
        }`}
        onClick={() => onChange('lyrics')}
      >
        Lyrics
      </button>
      <button
        className={`flex-1 px-3 py-1.5 border-none rounded-sm bg-transparent text-text-secondary text-[13px] font-medium cursor-pointer transition-all duration-150 hover:text-text-primary hover:bg-bg-hover ${
          activeTab === 'settings' ? 'text-text-primary bg-bg-active' : ''
        }`}
        onClick={() => onChange('settings')}
      >
        Settings
      </button>
    </div>
  );
}
