import type { Metadata } from "next";
import { COPY } from "../copy";
import { Landing } from "../landing";

export const metadata: Metadata = {
  title: COPY.en.metaTitle,
  description: COPY.en.metaDesc,
  alternates: { languages: { vi: "/vi" } },
};

export default function Page() {
  return <Landing lang="en" />;
}
