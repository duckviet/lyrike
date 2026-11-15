export type Lang = "en" | "vi";

export const STORE_URL =
  "https://chromewebstore.google.com/detail/jkddkopefokablebabnohoggiadolgkm";
export const REPO_URL = "https://github.com/duckviet/lyrike";
export const LRCLIB_URL = "https://lrclib.net";

export const COPY = {
  en: {
    metaTitle: "Lyrike - synced lyrics that stay on top",
    metaDesc:
      "A Chrome extension that shows synced lyrics for YouTube and YouTube Music in a floating, always-on-top window.",
    otherLang: "Tiếng Việt",
    otherHref: "/vi",
    cta: "Add to Chrome",
    source: "Source on GitHub",
    heroTitle: "Lyrics that stay on top.",
    heroBody:
      "Synced lyrics for YouTube and YouTube Music, in a window that floats over whatever else you are doing.",
    syncTitle: "In time, line by line.",
    syncBody:
      "Lyrike finds the song you are playing and moves through its lyrics in step with the music. The line being sung is always the one that stands out.",
    pipTitle: "Out of the tab.",
    pipBody:
      "Open the lyrics in Picture-in-Picture and they stay above your other tabs and apps. Write, browse, play, and keep singing.",
    pipHint:
      "The window on this page behaves the same way. Scroll and it stays. Drag it by its title bar.",
    pipOpen: "Open it in real Picture-in-Picture",
    styleTitle: "Set it the way you read.",
    styleBody:
      "These are a few of the extension's real settings. Change them and watch the window.",
    track: "Demo track",
    font: "Font",
    display: "Lyric display",
    classic: "Classic",
    poster: "Poster",
    artwork: "Vinyl artwork",
    background: "Cover background",
    align: "Alignment",
    left: "Left",
    center: "Center",
    on: "On",
    off: "Off",
    startTitle: "From install to first line.",
    steps: [
      ["Add Lyrike to Chrome", "Install it from the Chrome Web Store."],
      [
        "Play a song",
        "Open any music video on YouTube, or a track on YouTube Music.",
      ],
      [
        "Read along",
        "Lyrics appear in a floating widget. Its title bar has the Picture-in-Picture button.",
      ],
    ],
    faqTitle: "Good to know",
    faq: [
      [
        "Where do the lyrics come from?",
        "From LRCLIB, a free community lyrics database. To find a match, Lyrike sends the song's title and artist to LRCLIB.",
      ],
      [
        "Does every song have lyrics?",
        "No. If nobody has added synced lyrics for a song to LRCLIB yet, Lyrike has nothing to show for it.",
      ],
      [
        "Is Lyrike made by YouTube?",
        "No. Lyrike is an independent project and is not affiliated with or endorsed by YouTube or Google.",
      ],
      [
        "Where does it run?",
        "In Chrome on desktop, on youtube.com and music.youtube.com. Your settings are saved in your browser.",
      ],
    ],
    closeTitle: "Put the words where you can see them.",
    footer:
      "Lyrike is an independent project, not affiliated with YouTube or Google. Lyrics are provided by LRCLIB.",
    winLabel: "Lyrics demo window",
    winNote: "Demo track.",
    dragHint: "Drag the window anywhere.",
    move: "Move window with the arrow keys",
    pipFail: "Picture-in-Picture could not open here.",
    // Window labels below use the extension's own wording (src/locales/en.json).
    tabLyrics: "Lyrics",
    tabSettings: "Settings",
    pipBtn: "Picture-in-Picture",
    minimize: "Minimize",
    expand: "Expand",
    hide: "Hide",
    reopen: "Reopen lyrics widget",
    searching: "Searching for lyrics...",
    setTypography: "Typography",
    setTypographyDesc: "Adjust font settings and text size for lyrics.",
    setFont: "Font Family",
    setAlign: "Text Align",
    setPip: "Picture-in-Picture",
    setPipDesc: "Settings specific to PiP mode.",
    setDisplay: "Lyric Display",
    setMeta: "Show Track Info",
    setThumb: "Thumbnail Background",
    play: "Play",
    pause: "Pause",
    pipActive: "Playing in Picture-in-Picture.",
    pipBack: "Bring it back",
  },
  vi: {
    metaTitle: "Lyrike - lời bài hát đồng bộ, luôn nổi trên cùng",
    metaDesc:
      "Extension Chrome hiển thị lời bài hát đồng bộ cho YouTube và YouTube Music trong một cửa sổ nổi, luôn ở trên cùng.",
    otherLang: "English",
    otherHref: "/",
    cta: "Thêm vào Chrome",
    source: "Mã nguồn trên GitHub",
    heroTitle: "Lời nhạc luôn nổi trên cùng.",
    heroBody:
      "Lời bài hát đồng bộ cho YouTube và YouTube Music, trong một cửa sổ nổi phía trên mọi thứ bạn đang làm.",
    syncTitle: "Đúng nhịp, từng câu một.",
    syncBody:
      "Lyrike nhận ra bài bạn đang nghe và chạy lời theo đúng nhịp nhạc. Câu đang hát luôn là câu nổi bật nhất.",
    pipTitle: "Thoát khỏi tab.",
    pipBody:
      "Mở lời bài hát ở chế độ Picture-in-Picture, nó sẽ nằm trên các tab và ứng dụng khác. Cứ viết, lướt web, chơi game và hát tiếp.",
    pipHint:
      "Cửa sổ trên trang này hoạt động y như vậy. Bạn cuộn, nó vẫn ở đó. Kéo thanh tiêu đề để di chuyển.",
    pipOpen: "Mở bằng Picture-in-Picture thật",
    styleTitle: "Chỉnh theo cách bạn đọc.",
    styleBody:
      "Đây là một vài cài đặt thật của extension. Thử đổi và nhìn cửa sổ thay đổi.",
    track: "Bài demo",
    font: "Phông chữ",
    display: "Kiểu hiển thị",
    classic: "Cổ điển",
    poster: "Poster",
    artwork: "Đĩa than",
    background: "Nền ảnh bìa",
    align: "Căn lề",
    left: "Trái",
    center: "Giữa",
    on: "Bật",
    off: "Tắt",
    startTitle: "Từ lúc cài đến câu hát đầu tiên.",
    steps: [
      ["Thêm Lyrike vào Chrome", "Cài từ Chrome Web Store."],
      [
        "Bật một bài hát",
        "Mở một video nhạc trên YouTube hoặc một bài trên YouTube Music.",
      ],
      [
        "Hát theo",
        "Lời hiện trong một widget nổi. Nút Picture-in-Picture nằm trên thanh tiêu đề của nó.",
      ],
    ],
    faqTitle: "Nên biết",
    faq: [
      [
        "Lời bài hát lấy từ đâu?",
        "Từ LRCLIB, một cơ sở dữ liệu lời bài hát miễn phí do cộng đồng đóng góp. Để tìm lời, Lyrike gửi tên bài và nghệ sĩ tới LRCLIB.",
      ],
      [
        "Bài nào cũng có lời chứ?",
        "Không. Nếu chưa ai thêm lời đồng bộ của bài đó vào LRCLIB thì Lyrike không có gì để hiển thị.",
      ],
      [
        "Lyrike có phải của YouTube không?",
        "Không. Lyrike là dự án độc lập, không liên kết với và không được YouTube hay Google bảo trợ.",
      ],
      [
        "Lyrike chạy ở đâu?",
        "Trên Chrome máy tính, tại youtube.com và music.youtube.com. Cài đặt được lưu trong trình duyệt của bạn.",
      ],
    ],
    closeTitle: "Đặt lời hát ở nơi bạn luôn nhìn thấy.",
    footer:
      "Lyrike là dự án độc lập, không liên kết với YouTube hay Google. Lời bài hát do LRCLIB cung cấp.",
    winLabel: "Cửa sổ demo lời bài hát",
    winNote: "Bài demo.",
    dragHint: "Kéo cửa sổ đi đâu cũng được.",
    move: "Di chuyển cửa sổ bằng phím mũi tên",
    pipFail: "Không mở được Picture-in-Picture ở đây.",
    // Nhãn trong cửa sổ dùng đúng lời của extension (src/locales/vi.json).
    tabLyrics: "Lyrics",
    tabSettings: "Settings",
    pipBtn: "Picture-in-Picture",
    minimize: "Thu nhỏ",
    expand: "Mở rộng",
    hide: "Ẩn",
    reopen: "Mở lại widget lời bài hát",
    searching: "Đang tìm lyric...",
    setTypography: "Typography",
    setTypographyDesc: "Điều chỉnh phông chữ và kích thước hiển thị lời bài hát.",
    setFont: "Phông chữ",
    setAlign: "Căn lề",
    setPip: "Picture-in-Picture",
    setPipDesc: "Cài đặt dành riêng cho chế độ PiP.",
    setDisplay: "Kiểu hiển thị lyric",
    setMeta: "Hiển thị thông tin bài hát",
    setThumb: "Nền thumbnail",
    play: "Phát",
    pause: "Tạm dừng",
    pipActive: "Đang phát trong Picture-in-Picture.",
    pipBack: "Đưa về trang",
  },
} as const;

export type Copy = (typeof COPY)[Lang];
