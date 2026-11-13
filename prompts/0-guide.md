# Guide: from a scanned book to स्वाध्याय

What three very different books (उड़िया बाबाजी के उपदेश, स्वर्ग का विमान, श्रीरामकृष्णवचनामृत) taught about turning a book into a good reading experience, and how the app reads what you give it.

## The pipeline

| Step | Who | Input → output | Check |
|---|---|---|---|
| 1. OCR + edit | AI chat with **prompt 1** | scan / OCR text → `books/<slug>.md` + a `books.json` entry | headings, footnotes, verses (prompt 1 self-check) |
| 2. Choose वचन | AI chat with **prompt 2** | the finished `.md` → `books/<slug>.vachan.md` | every वचन word-for-word, 1–3 topics |
| 2b. **Eval** | `python3 tools/check-vachans.py <slug>` | the वचन file → list of flagged वचन | **read every flagged one**; fix, or mark `जाँच: ठीक` if it is fine; must end with 0 flagged |
| 3. Add | you | upload both files to `books/`, add the entry to `books/books.json` | — |
| 4. Check | the app | open `…/#/check/<slug>` | fix anything listed under “ध्यान दें” |
| 5. Read it once | you | open a few sittings on the phone | sitting length, dialogue, verse layout |

Work on one book at a time; for long books, give prompt 1 one part at a time and join the pieces.

## Know the book type first

The type decides the structure (prompt 1) and where the वचन come from (prompt 2).

| Type | Shape | Structure to write | वचन | Example |
|---|---|---|---|---|
| **उपदेश / sayings** | parts → chapters → प्रश्नोत्तर + numbered sayings | `#` part, `##` chapter, `###` प्रश्नोत्तर / उपदेश-वचन, `**प्रश्न —**`, `**N.**` | the numbered sayings (150–300) | उड़िया बाबाजी के उपदेश: 938 |
| **Short teachings / दृष्टान्त** | hundreds of short pieces, each with a saying as its heading | one `#` part; each piece `शिक्षा N` line + `##` heading | the headings themselves, minus questions (250–300) | स्वर्ग का विमान: 283 of 325 |
| **संवाद / diary** | visits or days, narration + dialogue | `##` per visit, `### (1)`, `#### topic`, `**नाम —** …` for every spoken line; `voice` in books.json | the main speaker's own self-contained sentences, chosen by hand (80–150) | रामकृष्णवचनामृत भाग 1: 95, भाग 2: 86 |
| **शास्त्र / श्लोक + अनुवाद** | chapters of śloka groups; each group (lines ending in two spaces, `॥ N॥`) is followed by one translation paragraph per śloka ending `॥ N॥`, plus commentary (`**विशेष —**`, `**विमर्श —**`) | `#` खण्ड, `अध्याय N` label + `##` chapter; keep each group and its translations together | only the translation paragraphs (they end in `॥ N॥`; commentary doesn't): drop story narration, objections the text refutes, and lines leaning on the previous śloka; strip a leading address (“हे परशुराम!”) (100–150) | त्रिपुरारहस्य |
| **जीवनी / narrative** | chapters of story | `#`/`##` chapters | quoted words only (30–60) | — |
| **पद / भजन** | many short verses | `##` per pad, lines ending in two spaces | short whole pads or couplets | — |

## How the app turns the file into reading

**Sittings.** Each `##` (or a standalone `#`) is a chapter. The aim is a sitting of about 12–15 minutes (1,800 words at 140 words a minute):
- chapters over ~3,000 words are split into equal parts of about 2,000 words: the app first decides how many parts, then cuts at the sub-heading (best), question or numbered saying (next), or plain paragraph (last resort) nearest each equal share, never inside a verse or list, so there are no tiny leftovers; the parts show as “भाग 1/3” under the chapter;
- a part with **10 or more chapters under 700 words** is packed instead: neighbours are joined into one sitting (“शिक्षा 1–8”), each keeps its heading, and the contents fold them out;
- a `#` with only a short introduction becomes a **part** (आचार खण्ड) shown above its first chapter;
- `विषय-सूची`, `विषयानुक्रमणिका`, `अनुक्रमणिका` are skipped (the app builds its own contents); text before the first heading is ignored.

**Labels.** A line like `अध्याय 2`, `शिक्षा 12`, `प्रकरण 3` just before a heading becomes that chapter's number.

**What each paragraph looks like** (decided by how it starts):

| Paragraph starts with | Shown as |
|---|---|
| `**प्रश्न —**` / `**उत्तर —**` | question (accent) / answer |
| `**12.**` | numbered saying |
| `**नाम —**` or `**नाम** (…) **—**` | dialogue line; the `voice` speaker in accent, others muted |
| lines ending in two spaces | centred verse |
| `— source` | small centred source |
| `भावार्थ —` / `अर्थ —` | shaded meaning box |
| `❀ ॥ इति … ॥ ❀` | centred closing line |
| `> …` | editor's note box |

**Footnotes and cross-references.** `[^n]` anywhere, definitions at the end; `<span id="shl5"></span>` + `[…](#shl5)` jumps across chapters (verse indexes). Footnotes inside headings work too.

## How वचन work

- **File:** `books/<slug>.vachan.md`, one वचन per block: `> text` lines, then `विषय: a, b`, optionally `अध्याय: chapter title`. **No `---` block at the top:** GitHub Pages would hide the file. Use `<!-- note -->` lines for notes.
- **Word-for-word** text lets “प्रसंग में पढ़ें” open the exact spot and lets the book show the faint margin line beside it. `#/check/<slug>` lists any that are not found.
- **No file?** The app falls back to the book's `**N.**` sayings automatically.
- **Themes:** `books/themes.json` holds 10 broad themes shared by all books, each with sub-topics. Tag with these words; a new topic is added to the list only when 20+ वचन need it. Sub-topics with fewer than 5 वचन stay inside their theme instead of showing as a row; topics outside the list appear under “अन्य”.
- **Daily वचन** picks from all books by date; **read marks** are shared: a वचन read in any collection, or inside a finished sitting, counts everywhere.

### Choosing वचन well (lessons so far)

- A good वचन stands alone, teaches, and is the saint's own voice, usually 1–4 sentences (60–350 characters).
- **Complete the thought.** Never stop before the punchline of a simile or parable (“मुझे तो सिर्फ़ दूध चाहिए।” needs “गाय के स्तनों से ही दूध आता है। अवतार गाय के स्तन हैं।”). A parable may run to 900 characters; that is fine. Stop before the next sentence that turns to a person in the room.
- Similes and parables are the most loved: the elephant that does not turn back, water/जल/पानी, the monkey's and the kitten's young.
- Leave out: questions, songs quoted from others, personal anecdotes, lines spoken to one person about their case, lines that need the previous sentence (“उसी प्रकार…”, “यही…”), and anything naming people in the conversation.
- In conversation books most of the text is narration and dialogue: automatic extraction found about 170–220 candidates in 150,000 words, and 40–55% were good. Expect to choose by hand, and **read each chosen one in full**, not just its opening: in भाग 2, reading the full text caught endings that ran into a new story (“कोई मतवाला दुर्गा की मूर्ति देख रहा था।”), into another person's view (“हाज़रा यह भी कहता है…”), a closing question to the listener, and keyword tags that were wrong (“नाम का ही रह जाता है” is not नाम-जप). The checker does not catch these.
- If the book has a subject index (विषय-संकेत), use it for topics: it is the editor's own judgement.
- **Headings are not automatically sayings.** In स्वर्ग का विमान many headings were titles (“दान का महत्त्व”), story names (“राजा और विदूषक — ऊपर तलवार और नीचे आग”) or list items (“(1) मूर्ख पापी”). For those, the teaching's own closing lesson is the वचन (“ज्ञानी भक्त तो तैर जाते हैं और ज्ञानी पापी डूब जाते हैं।”).
- **Never ship वचन that no one has read.** Generate with a script if useful, but run `tools/check-vachans.py` and read what it flags, plus a random sample of 20 of the rest.

## books.json fields

| Field | Use |
|---|---|
| `slug`, `file` | short Latin name; the `.md` file name |
| `title`, `author` | shown on the cover and book page |
| `speaker` | the saint or author (for reference only; वचन, images and shares are always credited to the **book title**, since a saint may be quoting a scripture or another saint) |
| `voice` | conversation books only: the main speaker as written in bold |
| `category` | shelf on the home page once there are 5+ books (उपदेश, दृष्टान्त-कथा, संवाद, जीवनी, पद एवं भजन, शास्त्र-टीका, पत्र); a category with only one book goes under “अन्य” |
| `about`, `color` | one line; cover colour (deep, muted) |
| `vachans` | the वचन file name |
| `audio` | optional: folder of `001.mp3…` recordings (see README) |

**Removing the Sanskrit** (done for त्रिपुरारहस्य, for ease of reading and listening): delete the book's own numbered śloka groups, its Sanskrit colophons (॥ इति … ॥) and its verses quoted in the भूमिका; keep quotations from other texts that have a source line; keep the translation's ॥ N॥ (shown, not spoken).

**Śloka books split differently.** In a chapter with 8+ translation paragraphs ending `॥ N॥`, a sitting may only begin where a new śloka group begins, so ślokas and their translation never land in different sittings. Other books are unaffected (a chapter of numbered दोहे without such translations keeps the old rule).

## Common problems

| Symptom | Cause | Fix |
|---|---|---|
| वचन show 0 on the live site | file starts with `---` (GitHub Pages hides it) | remove the block; or add an empty `.nojekyll` file at the repository root |
| A chapter is one huge sitting | sub-sections not marked | add `###` / `####` headings or `**प्रश्न —**` lines |
| Hundreds of tiny sittings | short pieces not under one `#` part | put them under a `#` heading |
| Verse runs into one line | missing two spaces at line ends | add two spaces after every verse line except the last |
| A वचन is just a title or 4–5 words | a heading taken as a saying | run `tools/check-vachans.py`; replace with the teaching's closing lesson |
| “प्रसंग” does not open | वचन not word-for-word | copy exactly, or add `अध्याय:` |
| Sittings change after editing a book | the split moved | the app moves read marks, notes and place to the new sittings automatically (by each sitting's opening words) |
| Phone still shows old version | offline cache | bump `VERSION` in `sw.js` when changing app files |

| A chapter shows no number, its footnote ends in “शिक्षा 141” | the label line got joined to a footnote during conversion | `python3 tools/fix-footnote-labels.py books/<slug>.md` moves it back and lists missing or out-of-order labels |