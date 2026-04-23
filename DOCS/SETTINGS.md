# Settings

## Available Settings

| Setting | Type | Default | Range | Description |
|--------|------|---------|-------|-------------|
| `fontFamily` | string | Inter | - | CSS font-family |
| `textSize` | number | 15 | 12-32px | Inactive line font size |
| `activeTextSize` | number | 16 | 14-40px | Active line font size |
| `visibleLineCount` | number | 5 | 3-15 (odd) | Lines visible in viewport |
| `activeFontWeight` | number | 600 | 400-800 | Active line font weight |
| `inactiveOpacity` | number | 0.44 | 0.1-1.0 | Inactive line opacity |
| `lyricSlideDurationSec` | number | 0.5 | 0.2-0.8s | Animation duration |
| `widgetWidth` | number | 360 | 280-500px | Widget width |
| `borderRadius` | number | 20 | 8-32px | Widget border radius |
| `backgroundOpacity` | number | 88 | 30-100% | Background opacity |
| `autoScroll` | boolean | true | - | Auto-scroll to active line |
| `hideFloatingWhenPiPOpen` | boolean | false | - | Hide widget when PiP open |
| `usePiPDominantColorTheme` | boolean | false | - | Use dominant video color |
| `pipShowThumbnailBackground` | boolean | false | - | Show thumbnail blur in PiP |
| `pipShowVideoBackground` | boolean | false | - | Show video blur in PiP |
| `textAlign` | "left" \| "center" \| "right" | "left" | - | Text alignment |

## Storage

Settings are persisted to Chrome sync storage:

```typescript
chrome.storage.sync.get(['lyrik_settings'], (result) => {
  const settings = result.lyrik_settings;
});
```

## Default Settings

```typescript
const DEFAULT_SETTINGS: Settings = {
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  textSize: 15,
  activeTextSize: 16,
  visibleLineCount: 5,
  activeFontWeight: 600,
  inactiveOpacity: 0.44,
  lyricSlideDurationSec: 0.5,
  widgetWidth: 360,
  borderRadius: 20,
  backgroundOpacity: 88,
  autoScroll: true,
  hideFloatingWhenPiPOpen: false,
  usePiPDominantColorTheme: false,
  pipShowThumbnailBackground: false,
  pipShowVideoBackground: false,
  textAlign: "left",
};
```