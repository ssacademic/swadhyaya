# स्वाध्याय — a quiet reader for digitised spiritual books

A static web app (plain HTML/CSS/JS, no build step, no dependencies). Host it free on GitHub Pages; readers can "Add to Home Screen" and it then works offline like an app.

## Put it online (one time, ~5 minutes)

1. Create a new repository on GitHub (e.g. `svadhyay`) and upload everything in this folder (drag-and-drop on the GitHub website works).
2. Repository → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → Save.
3. After a minute the site is live at `https://<your-username>.github.io/svadhyay/`.

To try it on your own computer first: in this folder run `python3 -m http.server` and open http://localhost:8000.

## Add a book: the pipeline

1. **Convert**: give the OCR text to an AI chat with [`prompts/1-book-to-markdown.md`](prompts/1-book-to-markdown.md). It returns the `.md` and a `books.json` entry.
2. **Choose वचन**: give the finished `.md` to an AI chat with [`prompts/2-vachan-chunna.md`](prompts/2-vachan-chunna.md). Save the result as `books/<slug>.vachan.md`.
3. **Add** both files to `books/`, and the entry (with `"vachans": "<slug>.vachan.md"`) to `books/books.json`.
4. **Check**: open `…/#/check/<slug>` in the app. It lists chapters and sittings, missing footnotes, broken links, वचन not found word-for-word, empty fields. Fix, commit, done.

Books are grouped automatically: up to 4 show as a simple list; beyond that the home page shows “पढ़ रहे हैं” plus one shelf per `category`, and the ग्रन्थ tab offers category / saint filters, search and sorting. Topics (`विषय`) shared across books become cross-book वचन collections, so keep to the topic list in prompt 2.

### Manual details (if not using the prompts)

1. Put the Markdown file in `books/`, e.g. `books/bhakti-sutra.md`.
   - From a .docx: `pandoc book.docx -t gfm --wrap=none -o books/bhakti-sutra.md`
2. Add an entry to `books/books.json`:
   ```json
   {
     "slug": "bhakti-sutra",
     "file": "bhakti-sutra.md",
     "title": "नारद भक्ति सूत्र",
     "author": "…",
     "about": "one line shown on the book page",
     "speaker": "whose words the daily vachan should be credited to",
     "color": "#2f5d50"
   }
   ```
3. Commit. Done. (If readers already installed the app, bump `VERSION` in `sw.js` so their copies refresh.)

### How the Markdown is read (the conventions your conversion chats should follow)

| In the .md | Becomes |
|---|---|
| `# Heading` | a top-level section. If it has only a short intro followed by `##` chapters, it becomes a **part** (e.g. आचार खण्ड) |
| `## Heading` | a chapter |
| `### Heading` | a sub-section inside a chapter (प्रश्नोत्तर, उपदेश-वचन) |
| `# विषय-सूची` / `अनुक्रमणिका` | skipped — the app builds its own contents |
| text before the first heading | skipped (title page) |
| `अध्याय 2` line just before a heading | shown as the chapter number |
| `**प्रश्न —** …` / `**उत्तर —** …` | styled question / answer |
| `**12.** text` | a numbered vachan — also feeds **आज का वचन** on the home page |
| lines ending in two spaces (hard breaks) | a centred **verse** |
| `— source` line under a verse | small centred citation |
| `भावार्थ — …` | shaded meaning box |
| `[^12]` + `[^12]: note` | tap-to-open footnote |
| `<span id="shl5"></span>` + `[…](#shl5)` | cross-reference that jumps across chapters (used by पद्य-सूची) |

Long chapters are automatically divided into sittings of ~12–15 minutes, breaking only at a sub-heading, a question, or a numbered vachan. Books made of many short pieces (10+ chapters under 700 words in one part, like the 325 शिक्षाएँ of स्वर्ग का विमान) are packed into sittings of the same length; each piece keeps its heading, and the contents list them in a fold-out. A label line just before a heading (`अध्याय 2`, `शिक्षा 12`, `प्रकरण 3`…) is shown as its number.

## What's in this version (functional base)

- **Home**: today's vachan (changes daily), "जहाँ छोड़ा था" continue card, today's practice ring + last 7 days, bookshelf.
- **Reader**: remembers the exact position in every sitting; reading-time estimate; progress line; footnotes in a bottom sheet; tap any paragraph to save / copy / share it (verses are saved with their source and meaning).
- **मनन**: one-line reflection at the end of each sitting, collected in संग्रह.
- **Gentle habit tracking**: daily goal (5–30 min) counted only while actually reading; no streak to "break" — it shows days this week and total days.
- **Book page**: contents grouped by part, ✓ for finished sittings, full-text search.
- **Settings**: old-paper / light / night themes, classic or modern Devanagari type, five text sizes; export/import of personal data (it lives only in the reader's browser).
- **Offline** after first visit (service worker).
- **सुनें (listen)**: the phone's own Hindi voice reads aloud from any paragraph, highlighting as it goes. Nothing to record, so every new book can be heard at once.
- **चित्र (vachan image)**: any vachan becomes a framed 1080×1350 image, shared straight to WhatsApp/status from the phone.
- **संकल्प (daily time)**: choose a reading time → add a daily event to Google Calendar or any calendar app (.ics). A reminder with no server and no notification permission.
- **पुनः स्मरण (recall)**: each day the home page brings back one passage you saved 3+ days ago.
- The reader's top bar slides away while reading and returns on a slight scroll up.
- **वचनामृत** tab: वचन in collections (all in order, a fixed shuffle, per book, per topic). Each collection remembers where you stopped and shows progress; swipe or tap to move; **सुनें** reads वचन after वचन with a pause.
- **Audio settings**: speed (4 steps) and voice (the Hindi voices installed on the device); the screen stays awake while listening. Uses the device's own text-to-speech, so quality depends on the phone (Android: Google Hindi; iPhone: Lekha). Speech usually stops if the screen is locked: a browser limit.
- **Weekly streak** (सप्ताह-क्रम): a week counts with 3+ reading days; tap it for an explanation and the last 8 weeks.
- **Themes**: वचन are grouped into broad themes shared by all books (`books/themes.json`), each with sub-topics. Edit that file to add or rename themes; topics not listed appear under “अन्य”.
- **Rounds & reset**: finishing a book or a वचन collection offers the next round (counted: “2 बार पूर्ण”). Book page → “इस ग्रन्थ की प्रगति मिटाएँ…” resets with confirmation; resets, removals and restarts show an **undo** for 5 seconds.
- **Contents** show a thin progress line under any sitting left midway; the listening bar folds into a small button after 4 s (tap to open).
- **वचन in the book**: paragraphs that are among the book's chosen वचन carry a faint line in the margin; tapping one shows “❁ वचन” in the action bar.
- **Highlights**: long-press / select a few words in the book → “हाइलाइट व सहेजें” saves just those words and marks them in the text.
- **वचन progress is shared**: a वचन read in any collection, or inside a finished sitting of the book, counts as read in every collection that holds it.
- **Listening extras**: phone media notification and lock-screen/headset controls (play-pause; ⏩/⏪ = next/previous paragraph, or ±15 s for recordings; next/previous track = sitting), and a sleep timer (15 / 30 / 60 min or end of sitting; recordings fade out).
- **Saved**: tap सहेजें again to remove; saved passages are highlighted in the book; the संग्रह tab has search, newest/oldest, per-book filter, and “read one by one”.
- **Bottom tabs**: आज · ग्रन्थ · वचन · संग्रह.

## Listening with the screen off

Two ways, chosen automatically per book:

- **Device voice (every book, no setup):** the phone's own Hindi text-to-speech. A silent audio loop and lock-screen controls keep it going with the screen off where the phone allows it (many Android phones). iPhones stop browser speech when locked.
- **Recorded audio (works on every phone, screen off, lock-screen controls, ±15 s):** one MP3 per sitting in `books/audio/<slug>/001.mp3, 002.mp3 …`, and `"audio": "audio/<slug>/"` in books.json (or a full `https://…/` folder URL if you host the audio elsewhere, e.g. archive.org).
  - Make them with `node tools/make-audio.js <slug>` (uses `edge-tts`, free Microsoft neural voices such as hi-IN-SwaraNeural / hi-IN-MadhurNeural; `pip install edge-tts`), or `--text-only` to get each sitting's text for Google Cloud / Azure TTS, or for a devotee to record in their own voice.
  - About 20 MB per hour. Keep the GitHub repo under ~1 GB.
  - If a recording is missing, the app falls back to the device voice for that sitting.

In both modes the text follows the voice (sentence by sentence, or by position in the recording); scrolling yourself pauses the following for a few seconds. Listening continues into the next sitting.

## Interface language

Settings → भाषा · Language: हिन्दी or English. Only the interface changes; the books, वचन, titles and names stay in Hindi. To translate more interface text, add entries to `EXACT` / `PHRASES` in `app.js`; anything marked `lang="hi"` is never translated.

## Files

`index.html` shell · `book.js` reads book files (shared with tools) · `app.js` the app · `tools/make-audio.js` audio · `prompts/` AI prompts · `style.css` look · `sw.js` offline · `books/` content.
