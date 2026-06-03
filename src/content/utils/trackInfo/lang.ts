export interface LangConfig {
  artistLabels: string[];
  trackLabels: string[];
  albumLabels: string[];
}

export const EN: LangConfig = {
  artistLabels: ["artist", "performer"],
  trackLabels: ["song", "track", "title"],
  albumLabels: ["album", "album name"],
};

export const VI: LangConfig = {
  artistLabels: ["ca sĩ", "thể hiện"],
  trackLabels: ["bài hát", "tên bài"],
  albumLabels: ["tên album", "đĩa nhạc"],
};

export const LANGS: LangConfig[] = [EN, VI];
