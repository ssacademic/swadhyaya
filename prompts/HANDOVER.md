# Handover: स्वाध्याय (Svadhyay), a devotional reading app

Paste this whole file as the first message of a new chat, and attach the files listed under **Attach**. Then add your request at the end.

---

## Who I am and what this is

I digitise old Hindi spiritual books (OCR → edited Markdown) and publish them in **स्वाध्याय**, a quiet, habit-forming reading app for devotees, hosted free on **GitHub Pages** (Android Chrome, installable as an app). Plain HTML/CSS/JS, **no build step, no dependencies, no server**; all personal data stays in the reader's browser (localStorage).

This chat has two jobs:
1. **App development:** improve features, polish, fix bugs.
2. **Book transformation:** turn a new book (`.docx`/`.md`) into the app's format, choose its वचन (sayings), tag them to the shared themes, and add it.

## How I like to work

- **Functional first, minimal.** Quality, correctness and meaning come before looks. No feature creep; polish what exists. Offer the lighter version first.
- **Save tokens:** no unnecessary work, no long recaps. Test what you change, but don't redo what's done.
- **Fidelity:** never change the saint's meaning; footnote any change to meaning-bearing words.
- Interface in Hindi by default (English switch exists); numbers as **1 2 3**, never १ २ ३.
- When you change files, tell me **exactly which files to upload** (I upload through the GitHub website) and **bump `VERSION` in `sw.js`** so phones refresh.
- Send me the full zip when many files change.

## Attach

| For | Attach |
|---|---|
| App work, or adding a book (recommended) | **`svadhyay.zip`** (the whole repository) |
| A new book | the book's **`.docx`** (or `.md`) |
| Only preparing a book, without app changes | `prompts/0-guide.md`, `prompts/1-book-to-markdown.md`, `prompts/2-vachan-chunna.md`, `books/themes.json`, `books/books.json`, + the book |
| A bug | a screenshot + what you tapped |

## Current state (1 Nov 2026)

**Books (3):**

| slug | type | sittings | वचन | notes |
|---|---|---|---|---|
| `udiya-baba-upadesh` | उपदेश: parts → chapters → प्रश्नोत्तर + numbered sayings | 71 | 937 (auto, all numbered sayings; could be curated to the best ~250) | |
| `swarg-ka-viman` | दृष्टान्त-कथा: 325 short teachings, headings are sayings | 80 (packed) | 283 (headings minus questions; topics from the book's own विषय-संकेत) | |
| `ramakrishna-vachanamrit-1` | संवाद (dialogue diary) | 96 | 95 (hand-picked; each runs to the end of its thought) | `voice: श्रीरामकृष्ण` |

**Themes:** 10 shared themes in `books/themes.json`, each with sub-topics (e.g. भक्ति और प्रेम → भक्ति, प्रेम, भक्त, कृपा, व्याकुलता, जगन्माता).

**Live preview:** a Claude artifact “स्वाध्याय” (single-page version built from the same files; can't download files or work offline).

## Files

| File | Role |
|---|---|
| `index.html` | shell; loads `book.js` then `app.js` |
| `book.js` | **reading a book** (pure functions, also used by Node tools): Markdown subset → HTML, chapters, sittings, packing, labels, footnotes, anchors, `parseVachans`, `speechText` |
| `app.js` | everything else: views, routing, storage, listening, i18n |
| `style.css` | themes (old paper / light / night), all styles |
| `sw.js` | offline cache (stale-while-revalidate). **Bump `VERSION` on every app change** |
| `manifest.webmanifest`, `icon-*.png`, `icon.svg` | install as app (`id: ./svadhyay-app`, scope `./`) |
| `books/books.json` | catalogue |
| `books/themes.json` | shared वचन themes → topics |
| `books/<slug>.md` | the book |
| `books/<slug>.vachan.md` | its वचन |
| `prompts/0-guide.md` | **the full guide**: book types, how the app reads a file, वचन rules, problems |
| `prompts/1-book-to-markdown.md` | prompt: OCR → app Markdown |
| `prompts/2-vachan-chunna.md` | prompt: choose and tag वचन |
| `tools/make-audio.js` | per-sitting text / MP3 (edge-tts) for background listening |
| `tools/vachan-candidates.py` | finds वचन candidates in a dialogue book's main speaker's lines (review by hand) |
| `tools/smoke-test.js` | 20-step user walkthrough with screenshots (Playwright) |
| `README.md` | hosting, adding books, features |

## App map (routes, all `#/…`)

- `#/` **आज**: daily वचन (from all books, by date) · recall card (a saved item ≥3 days old: shows the first words, tap to reveal) · continue card · today's practice ring + 7 dots + weekly streak (a week counts with 3+ reading days; tap for 8-week chart) · shelves (≤4 books: list; more: “पढ़ रहे हैं” + one shelf per category; single-book categories go to “अन्य”)
- `#/library[/category]`: grid, category/saint chips, search, sort
- `#/book/<slug>`: cover, progress, rounds (“2 बार पूर्ण”, next round with undo), वचन button, search, contents (parts; chapters with parts nested; packed sittings fold out; thin progress line under half-read sittings), reset progress (confirm + undo)
- `#/read/<slug>/<n>[/a/<anchor>|/f/<text>]`: reader. Tap a paragraph → सहेजें / सुनें / चित्र / भेजें (or कॉपी). Select words → हाइलाइट व सहेजें. Saved = yellow; the book's chosen वचन = faint margin line + “❁ वचन” label. Footnotes in a sheet; cross-refs jump. End: मनन (one-line reflection), next sitting.
- `#/vachan`: वचनामृत: सभी / बिना क्रम (fixed shuffle) / per book / per theme (fold-out sub-topics; sub-topics <5 hidden)
- `#/deck/<id>`: one वचन at a time (`all`, `mix`, `b:<slug>`, `th:<theme>`, `t:<topic>`, `saved`); swipe; remembers place; rounds; “आरम्भ से” with undo
- `#/saved`: tabs सहेजे वचन / मनन; search, newest/oldest, per book, paging, one-by-one deck, remove with undo
- `#/find/<slug>/<text>[/<chapter>]`: opens where a वचन is in the book
- `#/check/<slug>`: quality report for a new book

**Listening:** device Hindi voice (Web Speech) sentence-chunked (~220 chars) with follow-scroll; or recorded MP3s if `books.json` has `audio`. Player bar: ⏾ sleep timer (15/30/60/end of sitting), speed (5 steps), pause, stop; folds to a small button after 4 s. Media Session: notification + headset (play/pause; ⏩⏪ = paragraph or ±15 s; next/prev = sitting). A 20 s silent loop keeps the session alive (Chrome ignores media <5 s). Continues into the next sitting.

**Settings (⚙):** language हिन्दी/English (interface only; content marked `lang="hi"` is never translated; dictionaries `EXACT`/`PHRASES` in `app.js`), colours, typeface (Tiro / Noto), 5 sizes, daily goal, reminder time → Google Calendar / .ics, speed, voice, backup/restore.

**Storage keys (`sv:` prefix):** `settings, days, last, pos, done:<slug>, rounds:<slug>, units:<slug>, opened, saved, notes, vpos, vseen, vseed`.

## Book formats (short; details in `prompts/0-guide.md`)

- `#` part / front matter · `##` chapter · `###`/`####` sub-sections. Text before the first heading and `विषय-सूची`-type sections are ignored.
- Chapters > 3,000 words split into equal parts of ~2,000 words at the nearest heading / `**प्रश्न` / `**N.**` (paragraph as last resort); a part with 10+ chapters under 700 words is **packed**.
- Label line before a heading (`अध्याय 2`, `शिक्षा 12`, …) = chapter number.
- `**प्रश्न —**`, `**उत्तर —**`, `**N.**`, `**नाम —**` / `**नाम** (…) **—**` (dialogue), verse lines ending in two spaces, `— source`, `भावार्थ —`, `[^n]` footnotes, `<span id>` + `[…](#id)`.
- **वचन file:** blocks of `> text` + `विषय: a, b` (+ optional `अध्याय:`); **no `---` front matter** (GitHub Pages hides such files); notes as `<!-- -->`. Text must be word-for-word for “प्रसंग” and margin marks.

## How to add a book (what worked)

1. `pandoc book.docx -t gfm --wrap=none -o books/<slug>.md`
2. Inspect: headings (`grep -n '^#'`), sizes per chapter, dialogue format, numbered sayings, a subject index. Decide the **type** (see guide).
3. Parse check: `node -e "const b=require('./book.js'),fs=require('fs');const bk=b.parseBook(fs.readFileSync('books/<slug>.md','utf8'),{});console.log(bk.units.length, bk.words)"`; adjust `book.js` only if a new pattern needs it (keep earlier books' sittings unchanged: saved progress is keyed by sitting number).
4. वचन: numbered sayings → automatic; short-teaching headings → script; dialogue → `tools/vachan-candidates.py` then **choose by hand**; with a subject index → use it for topics. Tag only with `themes.json` topics; extend the list only when 20+ वचन need a new topic.
5. Add the `books.json` entry (`slug, file, title, author, speaker, [voice], category, about, color, vachans`).
6. Test: serve locally (`python3 -m http.server 8765`), Playwright on `#/check/<slug>`, a reader page, the book's deck + “प्रसंग”, then `tools/smoke-test.js`. Look at a couple of screenshots.
7. Bump `VERSION` in `sw.js`, rebuild the preview, zip, and tell me which files to upload.

## Known issues / decisions

- **GitHub Pages + `---` front matter** hid the वचन files: fixed (comments instead; app falls back to numbered sayings if a file fails).
- **Android install** showed “already installed / couldn't open”; it also happened with an older app, so it's on the phone side (Chrome/WebAPK after an update). Advice given: restart, update Chrome/WebView/Play services, uninstall leftover “स्वाध्याय” (bottom of the app list), clear site data, Install app. Manifest now has PNG icons and its own `id`.
- Browser speech stops when the screen locks on iPhone; recordings (`tools/make-audio.js`) are the reliable background option.
- Progress is keyed by sitting number; when sittings change, `migrateLayout` (app.js) moves read marks, notes, place and saved links using each sitting's opening words (`layout:<slug>` in storage; `books/layout-legacy.json` holds the pre-Nov-2 layouts).
- Research behind habit features: weekly streak (Silverman & Barasch 2023), recall before reveal (Rowland 2014), reading-time intention (Gollwitzer & Sheeran 2006), habit ≈ 66 days, a missed day doesn't matter (Lally).

## Ideas not done yet (only if asked)

Search across all books · a share link that opens a specific वचन · a gentle “book finished” recap of saved items · curating उड़िया बाबा's 938 वचन down to the best ~250 · large-text high-contrast mode · moving backup/restore to the संग्रह page.

---

**My request:**
