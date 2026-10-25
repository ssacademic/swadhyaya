# Prompt 1 — Turn an OCR'd book into a स्वाध्याय-ready Markdown file

Use this with any capable AI chat. Paste everything below the line, then attach or paste the OCR text (or the .docx/.pdf). For very long books, work **one part/chapter at a time** and paste the previous chapter's last heading so numbering and structure continue correctly; join the pieces at the end and run the footnote-numbering check (step 9).

---

You are preparing a classic Hindi spiritual book for a quiet reading app called **स्वाध्याय**. Your two loyalties, in this order:

1. **Fidelity of meaning.** This is a saint's teaching. Never add ideas, never "improve" the teaching, never summarise, never drop passages. When something is unclear, keep the original and explain in a footnote.
2. **Ease for today's devotee,** including elderly readers: correct OCR damage, standardise spelling lightly, make structure visible.

## What you receive
OCR text of a printed book (often with broken lines, page numbers, running headers, misread conjuncts, Devanagari digits, hyphenated line ends).

## What you return
**One Markdown file**, plus a **books.json entry** (see the end). Nothing else: no commentary before or after.

## Editing rules

**Clean up silently (no footnote needed):**
- Remove page numbers, running heads, printer's marks, line-end hyphenation; rejoin broken lines into paragraphs.
- Fix obvious OCR errors (e.g. broken conjuncts, `ि` misplaced, ा/ो or ० (zero)/o mix-ups) where the intended word is certain.
- Light spelling standardisation to modern Hindi: लिये → लिए, चाहिये → चाहिए, गयी → गई. Keep tatsam words in their dignified form; don't modernise Sanskrit quotations at all.
- Devanagari digits → international digits (१२ → 12) in prose and numbering. **Keep Sanskrit/verse text exactly as printed.**
- Punctuation: use `।` for full stops in Hindi, `॥` to close verses as printed, the em dash `—` (not `--`), Hindi quotation marks “ ” ‘ ’.

**Change only with a footnote** (so the original is never lost):
- A word/phrase that is probably a printing error and changes meaning: give the reading you chose in the text and the printed reading in the footnote: `14वें संस्करण में “…” छपा है; प्रसंग से “…” पढ़ा गया है।`
- Offensive caste/community terms in the original: replace with a neutral word in the text; give the original word in a footnote.
- Archaic or technical terms a modern reader may not know: keep the word, add a short meaning as a footnote: `[^12]: अर्वाचीन — आधुनिक; हाल के समय का।`
- Quotations whose source you can identify with confidence: add the source in a footnote (scripture, chapter, verse). If unsure, don't guess.

**Never:** rewrite sentences for style, merge or split the saint's numbered sayings, change the order of material, invent headings that interpret the content.

## Structure (the app reads these exactly)

```
# Part or front-matter section          ← level 1
## Chapter                              ← level 2 (each becomes a chapter in the app)
### Sub-section inside a chapter        ← level 3 (e.g. प्रश्नोत्तर, उपदेश-वचन)
```

- Text **before the first heading** (title page) is ignored by the app: put the title, author, translator, edition there.
- **Do not** write a table of contents. If the book has one, drop it (the app builds its own; a section titled `विषय-सूची` or `अनुक्रमणिका` is skipped anyway).
- Front matter that deserves reading (प्रकाशकीय, निवेदन, दो शब्द, भूमिका, जीवन-परिचय) gets its own `#` heading.
- A **part** (आचार खण्ड, उपासना खण्ड…) is a `#` heading followed by at most a few lines of introduction, then `##` chapters.
- If the book numbers chapters, put the label on its own line **just before** the heading, followed by an ornament line. The app shows it above the chapter title:
  ```
  अध्याय 2

  ❀ ❀ ❀

  ## सत्संग
  ```
- Optional chapter close: `❀ ॥ इति सत्संग ॥ ❀` (shown centred).

## Conventions inside chapters

| Write this | App shows |
|---|---|
| `**प्रश्न —** …question…` (one paragraph) | a highlighted question |
| `**उत्तर —** …answer…` | the answer; following paragraphs continue it |
| `**1.** saying…` (bold number + full stop) | a numbered saying (वचन); these also feed the daily वचन if no वचन-file exists |
| a verse with each line ending in **two spaces** | a centred verse, line breaks kept |
| `— रामचरितमानस, उत्तरकाण्ड, दोहा 112 (ख)[^64]` on the line after the verse | small centred source line |
| `भावार्थ — …` right after the verse/source | a shaded meaning box |
| `> **सम्पादकीय निवेदन —** …` | an editor's note box (use sparingly) |
| `- item` / `1. item` | lists |
| `*word*` | italics (rare) |

**Verse example** (note the two trailing spaces after `क्रोध।`):
```
<span id="shl5"></span>उमा जे राम चरन रत बिगत काम मद क्रोध।  
निज प्रभुमय देखहिं जगत केहि सन करहिं बिरोध॥

— रामचरितमानस, उत्तरकाण्ड, दोहा 112 (ख)[^64]

भावार्थ — हे उमा! जो श्रीराम के चरणों में अनुरक्त हैं …
```
Add `भावार्थ` for Sanskrit/Braj/Avadhi/Urdu verses a modern reader may not follow. Keep it faithful and short.

**Footnotes:** reference `[^n]` in the text, define at the **end of the file**:
```
[^64]: मानस, उत्तरकाण्ड 112 (ख)।
[^65]: Multi-line note: continue on the next line
    indented by four spaces.
```
Number footnotes 1, 2, 3… through the whole book, never restarting per chapter.

**Verse index (optional, recommended for books with many verses):** give each verse an anchor `<span id="shl1"></span>` at its start (shl1, shl2… in order), and at the end add:
```
# पद्य-सूची

अ

अनन्यचेताः सततं यो मां स्मरति नित्यशः। […](#shl63)
```
In the app each `[…]` jumps to the verse in whichever chapter it sits.

## Before you hand it over (self-check)
1. Every `[^n]` has exactly one `[^n]:` definition, and vice-versa.
2. No page numbers / running heads left; no lines broken mid-sentence.
3. Every chapter is a `##` (or a standalone `#`), sub-sections are `###`; no heading levels skipped in a confusing way.
4. Every verse line except the last ends with two spaces.
5. Questions and answers use exactly `**प्रश्न —**` and `**उत्तर —**`.
6. Numbered sayings use `**N.**`, numbering as in the original.
7. Nothing summarised or omitted; any change of meaning-bearing words is footnoted.
8. Add a short `# इस संस्करण के विषय में` section at the start listing: the base edition used, what was standardised, what was added (footnotes, भावार्थ, sources), and a request to readers to report errors.
9. Footnote numbers are continuous across the whole file.

## Also return this books.json entry
```json
{
  "slug": "short-latin-name-with-hyphens",
  "file": "short-latin-name-with-hyphens.md",
  "title": "पुस्तक का नाम",
  "author": "लेखक / संग्रहकर्ता — नाम",
  "speaker": "जिनकी वाणी है (वचनों के नीचे यही नाम छपेगा)",
  "category": "उपदेश | जीवनी | पद एवं भजन | शास्त्र-टीका | पत्र | कथा",
  "about": "एक पंक्ति: इस ग्रन्थ में क्या है।",
  "color": "#8a3b12"
}
```
For `color`, pick a deep, muted tone (the cover background): e.g. #8a3b12 गेरुआ, #2f5d50 वन-हरित, #5a3e7a बैंगनी, #2e4a6b नील, #7a5a12 हल्दी.
