import React from 'react';

interface TabSwitcherProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

export function TabSwitcher({ activeTab, onChange }: TabSwitcherProps): React.JSX.Element {
  return (
    <div className="yl-tabs">
      <button
        className={`yl-tab ${activeTab === 'lyrics' ? 'active' : ''}`}
        onClick={() => onChange('lyrics')}
      >
        Lyrics
      </button>
      <button
        className={`yl-tab ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => onChange('settings')}
      >
        Settings
      </button>
    </div>
  );
}
