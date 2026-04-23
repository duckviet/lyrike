# Architecture

## Overview

Lyrik is a Chrome extension that displays synchronized lyrics on YouTube video pages. It uses a content script that injects a React application into the page.

## Components

### Content Script Flow

```
YouTube Page
    │
    ├── FloatingLyricsWidget (always visible below video)
    │   ├── WidgetHeader (title, collapse button)
    │   ├── TabSwitcher (Settings / Lyrics)
    │   ├── LyricsContent / SettingsPanel
    │   └── ReopenLyricsButton
    │
    └── LyricsPiPPortal (Picture-in-Picture mode)
        ├── PiPBackground (video/thumbnail background)
        └── LyricsContent
```

### Rendering Strategy

- **LyricsContent**: Main component displaying synced lyrics with GSAP animations
- **LyricsLines**: Individual line renderer with position animations
- **LyricsPiPPortal**: Portal to render in PiP window via `document.createElement("iframe")`

### State Management

- Local React state in components
- Chrome storage sync for settings persistence
- `useLyricsData` hook: fetches lyrics from providers
- `useLyricsSettings` hook: manages settings state
- `useWatchTrack` hook: polls for track changes

## Data Flow

1. **Track Detection**: `useWatchTrack` polls YouTube player state
2. **Lyrics Fetch**: `useLyricsData` calls external lyrics APIs
3. **Rendering**: Lyrics displayed with GSAP animations
4. **Sync**: Active line calculated from video currentTime

## Key Files

| File | Purpose |
|------|---------|
| `src/content/main.tsx` | Entry point, initializes React |
| `src/content/App.tsx` | Main app with state providers |
| `src/content/components/LyricsContent.tsx` | Lyrics rendering with measurements |
| `src/content/components/LyricsLines.tsx` | GSAP-animated line components |
| `src/content/components/LyricsPiPPortal.tsx` | PiP mode portal |
| `src/content/hooks/useLyricsData.ts` | Lyrics fetching logic |
| `src/content/utils/lyricsUtils.ts` | Lyrics parsing utilities |
| `src/content/utils/pipWindow.ts` | PiP window creation |