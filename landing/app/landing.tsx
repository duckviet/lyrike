import { COPY, LRCLIB_URL, REPO_URL, STORE_URL, type Lang } from "./copy";
import { LyricSheet, PipButton, StyleControls } from "./controls";
import { DemoProvider } from "./demo";
import { LyricWindow } from "./lyric-window";

const wrap = "mx-auto w-full max-w-[1280px] px-5 lg:px-10";
// Text keeps to the left so the floating window has room on wide screens.
const col = "lg:max-w-[600px]";
const h2 = "font-display text-4xl leading-[1.05] text-balance md:text-5xl";
const body = "mt-5 max-w-[60ch] text-lg leading-relaxed text-ink-2";

function Cta({ label, className = "" }: { label: string; className?: string }) {
  return (
    <a href={STORE_URL} className={`btn btn-ink ${className}`}>
      {label}
    </a>
  );
}

export function Landing({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  return (
    <DemoProvider lang={lang}>
      <div>
        <header className={`${wrap} flex h-16 items-center gap-4`}>
          <a href={lang === "en" ? "/" : "/vi"} className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-[10px] bg-ink">
              <img src="/lyrike.svg" alt="" width={18} height={15} />
            </span>
            <span className="font-display text-xl">Lyrike</span>
          </a>
          <a
            href={t.otherHref}
            hrefLang={lang === "en" ? "vi" : "en"}
            className="link ml-auto text-sm font-medium"
          >
            {t.otherLang}
          </a>
          <Cta label={t.cta} className="btn-sm max-sm:hidden" />
        </header>

        <main>
          <section
            data-scene="classic"
            className={`${wrap} flex flex-col justify-center py-14 xl:min-h-[calc(80dvh-4rem)] lg:py-20`}
          >
            <h1 className="font-display text-[clamp(2.75rem,6vw,5.25rem)] leading-[1.04] text-balance xl:max-w-[calc(100%-420px)]">
              {t.heroTitle}
            </h1>
            <p className={`${body} ${col} lg:max-w-[460px]`}>{t.heroBody}</p>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Cta label={t.cta} />
              <a href={REPO_URL} className="link font-medium">
                {t.source}
              </a>
            </div>
          </section>

          <LyricWindow t={t} />

          <section data-scene="classic" className="py-24 lg:py-36">
            <div className={wrap}>
              <div className={col}>
                <h2 className={h2}>{t.syncTitle}</h2>
                <p className={body}>{t.syncBody}</p>
              </div>
              <LyricSheet />
            </div>
          </section>

          <section data-scene="pip" className="band py-24 lg:py-40">
            <div className={wrap}>
              <div className={col}>
                <h2 className={h2}>{t.pipTitle}</h2>
                <p className="mt-5 max-w-[60ch] text-xl leading-relaxed">
                  {t.pipBody}
                </p>
                <p className="mt-4 max-w-[60ch] leading-relaxed opacity-85 max-xl:hidden">
                  {t.pipHint}
                </p>
                <PipButton label={t.pipOpen} />
              </div>
            </div>
          </section>

          <section className="py-24 lg:py-36">
            <div className={wrap}>
              <div className="lg:max-w-[720px]">
                <h2 className={h2}>{t.styleTitle}</h2>
                <p className={body}>{t.styleBody}</p>
                <StyleControls t={t} />
              </div>
            </div>
          </section>

          <section data-scene="classic" className="pb-24 lg:pb-36">
            <div className={wrap}>
              <h2 className={`${h2} ${col}`}>{t.startTitle}</h2>
              <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8 lg:max-w-[820px]">
                {t.steps.map(([title, text]) => (
                  <li key={title} className="border-t-2 border-ink pt-5">
                    <h3 className="font-display text-2xl">{title}</h3>
                    <p className="mt-2 leading-relaxed text-ink-2">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="pb-24 lg:pb-36">
            <div className={wrap}>
              <div className="lg:max-w-[720px]">
                <h2 className={h2}>{t.faqTitle}</h2>
                <div className="mt-8 border-b border-line">
                  {t.faq.map(([q, a]) => (
                    <details key={q} className="faq border-t border-line">
                      <summary>{q}</summary>
                      <p className="max-w-[60ch] pb-6 leading-relaxed text-ink-2">
                        {a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="band py-24 lg:py-36">
            <div className={wrap}>
              <h2 className="max-w-[760px] font-display text-[clamp(2.5rem,5.4vw,4.75rem)] leading-[1.04] text-balance">
                {t.closeTitle}
              </h2>
              <a href={STORE_URL} className="btn btn-onaccent mt-10">
                {t.cta}
              </a>
            </div>
          </section>
        </main>

        <footer className={`${wrap} py-10 text-sm text-ink-3`}>
          <p className="max-w-[60ch] leading-relaxed">{t.footer}</p>
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <a className="link" href={STORE_URL}>Chrome Web Store</a>
            <a className="link" href={REPO_URL}>GitHub</a>
            <a className="link" href={LRCLIB_URL}>LRCLIB</a>
          </p>
        </footer>
      </div>
    </DemoProvider>
  );
}
