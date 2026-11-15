import type { Metadata } from "next";
import { COPY } from "../../copy";
import { Landing } from "../../landing";

export const metadata: Metadata = {
  title: COPY.vi.metaTitle,
  description: COPY.vi.metaDesc,
  alternates: { languages: { en: "/" } },
};

export default function Page() {
  return <Landing lang="vi" />;
}
