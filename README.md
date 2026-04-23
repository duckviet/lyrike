# Lyrik - YouTube Lyrics Extension

Chrome extension hiển thị lyrics nhạc trên YouTube với chế độ Picture-in-Picture.

## Tính năng

- **Hiển thị lyrics đồng bộ** - Lyrics tự động cuộn theo nhạc
- **Picture-in-Picture** - Lyrics hiển thị trong cửa sổ PiP
- **Floating widget** - Lyrics hiển thị dưới dạng widget trên YouTube
- **Tùy chỉnh giao diện** - Font, kích thước, màu sắc, độ mờ
- **Auto-scroll** - Tự động cuộn theo bài hát
- **Video/Thumbnail background** - Background trong PiP mode

## Cài đặt

```bash
npm install
npm run build
```

Load thư mục `dist` vào Chrome:
1. Mở `chrome://extensions`
2. Bật "Developer mode"
3. Click "Load unpacked" → chọn thư mục `dist`

## Development

```bash
npm run dev        # Local dev server
npm run dev:host  # Dev server accessible qua network
npm run build     # Build production
npm run lint      # Check lint + type
```

## Cấu trúc dự án

```
src/
├── content/           # Content script & components
│   ├── components/  # React components
│   ├── constants/    # Constants (UI, settings)
│   ├── hooks/       # Custom hooks
│   ├── shared/      # Types & settings
│   └── utils/       # Utilities
├── background.ts     # Background script
└── main.tsx         # Entry point
```

## Dependencies

- React 19
- Tailwind CSS 4
- GSAP (animations)
- @chenglou/pretext (text measuring)
- ColorThief (color extraction)