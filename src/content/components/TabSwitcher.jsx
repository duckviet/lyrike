import React from 'react';

export function TabSwitcher({ activeTab, onChange }) {
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
