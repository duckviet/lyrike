import { Montserrat } from "next/font/google";
import localFont from "next/font/local";
import type { Lang } from "./copy";
import "./globals.css";

// Both faces come from the extension's own font list.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "vietnamese"],
});
const cal = localFont({
  src: "../public/fonts/CalSans-Regular.woff2",
  variable: "--font-cal",
  weight: "400",
});

/** Shared document shell; each language has its own root layout so `lang` is correct. */
export function Shell({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  return (
    <html lang={lang} className={`${montserrat.variable} ${cal.variable}`}>
      <body>{children}</body>
    </html>
  );
}
