import { Shell } from "../shell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <Shell lang="vi">{children}</Shell>;
}
