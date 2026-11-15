# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Extension: React 19, Vite, Tailwind CSS 4, GSAP (existing, in `src/`).
Landing page: Next.js + Tailwind, in `landing/` (user's choice, 2026-11-12). Kept independent from the extension build.

## Users

People who listen to music on YouTube and YouTube Music in a desktop Chrome browser and want to read or sing along with the lyrics while the song plays, often while doing something else in another tab or window. Global audience; Vietnamese listeners are a confirmed second audience (the extension ships `en` and `vi` locales).

## Product Purpose

Lyrike is a Chrome extension that shows time-synced lyrics for the track playing on YouTube or YouTube Music. Success for the landing page is an install from the Chrome Web Store.

## Positioning

The lyrics leave the tab: Lyrike can put synced lyrics in a Picture-in-Picture window that stays on top of any other app, in addition to a draggable floating widget on the player page.

## Operating Context

- Runs as a content script on `www.youtube.com` and `music.youtube.com`.
- Lyrics come from LRCLIB (`lrclib.net`), a free community lyrics database. Coverage depends on LRCLIB; not every song has synced lyrics.
- Distributed through the Chrome Web Store: https://chromewebstore.google.com/detail/jkddkopefokablebabnohoggiadolgkm
- Source: https://github.com/duckviet/lyrike

## Capabilities and Constraints

- Synced lyrics that auto-scroll with the song.
- Floating, draggable lyrics widget on the page.
- Picture-in-Picture lyrics window, with optional blurred video or thumbnail background and a theme taken from the video's dominant colour.
- Appearance settings: font (Montserrat, Google Sans, Tinos, Amatic SC, Cal Sans, Fahkwang, Playwrite NO), text size, active-line weight, inactive-line opacity, widget width, corner radius, background opacity, text alignment, visible line count.
- In-extension bug/lyrics report.
- Independent project. Not affiliated with, endorsed by, or made by YouTube or Google.
- Undecided: licence, pricing statement beyond "free on the Chrome Web Store", Firefox/Edge support.

## Brand Commitments

- Name: Lyrike (store listing: "Lyrike - YouTube Lyrics"). Icon: `public/icons/lyrike-icon.svg`.
- Landing page is bilingual, English by default, Vietnamese as the alternate (confirmed 2026-11-12).
- Must not read as a generic SaaS/AI product page.
- Must not lean on YouTube branding or look like an official YouTube/Google product.
- Must stay light: restrained motion, fast load, like the extension itself.

## Evidence on Hand

- No screenshots or video of the extension exist in the repo. Product proof on the landing page is a working lyrics demo rebuilt on the page (confirmed 2026-11-12).
- No install counts, ratings, reviews, testimonials, or press. None may be invented.
- Fonts used by the extension: `public/fonts/`.

## Product Principles

1. Show the lyrics working rather than describing them.
2. Claim only what the extension does today.
3. The page should feel as light as the extension.
4. Lyrike is its own thing, living alongside the player, not part of it.
