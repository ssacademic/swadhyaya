# Prompt 2 — Choose the वचन (great thoughts) from a book

Run this **after** the book's Markdown is final (Prompt 1). Paste everything below the line, then attach the book's `.md` file. Save the answer as `books/<slug>.vachan.md` and add `"vachans": "<slug>.vachan.md"` to that book's entry in `books/books.json`. Then open `#/check/<slug>` in the app: it tells you if any वचन was not found word-for-word in the book.

---

You are choosing the **वचन** (sayings) from a Hindi spiritual book for a reading app. Each वचन is shown alone on a card, as the "आज का वचन" on the home screen, inside topic collections, read aloud, and shared as an image on WhatsApp. A devotee may meet it with no context at all.

## First, see what kind of book it is

| Book type | Where the वचन are | Example |
|---|---|---|
| **Numbered sayings** (उपदेश-वचन) | the `**N.**` paragraphs; also self-contained answers in प्रश्न/उत्तर | श्री उड़िया बाबाजी के उपदेश |
| **Many short teachings/stories** | each teaching's **heading** is usually the saying itself; also the closing moral line | स्वर्ग का विमान |
| **Conversations / diary** (संवाद) | only inside the main speaker's lines (`**श्रीरामकृष्ण —** …`); take 1–3 sentences that teach on their own, especially parables and similes | श्रीरामकृष्णवचनामृत |
| **Biography / narrative** | few or none: the saint's quoted words only; it is fine to return 30–60 | — |

If the book has its own subject index (विषय-संकेत, विषयानुक्रमणिका by topic), use it to choose topics.

## Choose sayings that
- **stand alone:** understandable without the sentence before; no “इसलिए”, “वह”, “ऊपर कहा गया” pointing outside itself.
- **carry the saint's own teaching:** not the editor's narration, not biography, not a question.
- **are complete thoughts:** usually 1–4 sentences, about 60–350 characters. A short verse with its source is also fine.
- **vary:** practical (आचरण, दिनचर्या), devotional (भजन, प्रेम, शरणागति), contemplative (ज्ञान, ध्यान). Avoid near-duplicates; keep the strongest one.
- **are gentle to meet cold:** skip sayings that only make sense historically, or that a modern reader would find harsh without explanation (they remain in the book with their context).

**How many:** quality over quantity. Typical: 150–300 for a book of sayings, 250–300 for short-teaching books, **80–150 for conversation books** (most of the text is narration and dialogue), 30–60 for biographies.

**Complete the thought:** include the whole simile or parable up to its point; never end before the punchline. Stop before a sentence that addresses or names someone present.

**Leave out:** song lyrics and verses quoted from others (unless the book is a book of verses), personal anecdotes ("मैं जब …"), lines addressed to one person about their situation, lines that need the previous sentence (“उसी प्रकार…”, “यही…”), and anything naming a specific person in the conversation.

## Copy exactly
Copy each वचन **word-for-word** from the book (same spelling and punctuation) so the app can open it "in context". You may:
- drop a leading “**12.**” number or a leading connective (“और”, “अतः”) at the very start;
- end at a sentence boundary before the paragraph ends.
Do not change, join or paraphrase anything else. Remove footnote markers like `[^64]` and Markdown `**`.

If you must shorten in the middle (rarely), use “…” and add an `अध्याय:` line (below) so the app can still find the chapter.

## Tag each with 1–3 topics from the shared theme list

The app groups वचन into **broad themes shared by all books** (file `books/themes.json`). Use these exact topic words, so that a new book adds to the same themes instead of creating new, tiny ones:

| Theme | Topics |
|---|---|
| सन्त और सत्संग | सत्संग · सन्त-महिमा · गुरु |
| नाम और भजन | नाम-जप · भजन · कीर्तन · प्रार्थना |
| भक्ति और प्रेम | भक्ति · प्रेम · भक्त · कृपा · व्याकुलता · जगन्माता |
| शरणागति और धैर्य | शरणागति · प्रभु-इच्छा · विश्वास · दुःख-सुख · धैर्य · निर्भयता · कृतज्ञता · संतोष |
| वैराग्य और त्याग | वैराग्य · त्याग · संसार · माया · धन · मृत्यु · जीवन का मूल्य · कामिनी-कांचन |
| मन और संयम | मन · संयम · इन्द्रिय · ब्रह्मचर्य · काम-क्रोध · अहंकार · दम्भ |
| साधना और अभ्यास | साधना · अभ्यास · ध्यान · दिनचर्या · आहार · स्वाध्याय |
| ज्ञान और तत्त्व | ज्ञान · आत्मा · ईश्वर · तत्त्व-चिन्तन · ईश्वर-दर्शन · समाधि · अवतार · समन्वय |
| धर्म और आचरण | आचरण · धर्म · पाप-पुण्य · दान-परोपकार · सेवा · सद्गुण · सत्य · दया · क्षमा · विनय · वाणी · गृहस्थ · समाज · कर्म |
| लीला, धाम और आनन्द | लीला · धाम · आनन्द · शान्ति |

Put the most fitting topic first. Invent a new topic only if a large group of वचन (20+) truly fits none; then also tell me which theme it belongs to, so `books/themes.json` can be updated. Topics outside the list are shown under "अन्य".

## Output format (nothing else in your answer)

Do **not** start the file with a `---` block: GitHub Pages would turn it into a web page and the app could not read it.

```
<!-- book: <slug> -->

> पहला वचन, ठीक वैसा जैसा ग्रन्थ में है।
विषय: सत्संग, ज्ञान

> दूसरा वचन…
विषय: नाम-जप

> निष्किंचन इन्द्रिय-दमन, रमा-रमण इकतार।  
> तुलसी ऐसे सन्तजन, बिरले या संसार॥
विषय: सन्त-महिमा
अध्याय: सन्त-महिमा
```

- Each वचन starts with `> `. For a verse, put each line on its own `> ` line.
- `विषय:` comma-separated topics (required).
- `अध्याय:` exact `##` chapter title (only when the text is shortened with “…”, or not word-for-word).
- One blank line between वचन. Keep them in **book order**.

## Self-check before answering

0. No titles, labels, story names or list items (“दान का महत्त्व”, “(1) मूर्ख पापी”, “राजा और विदूषक — …”). Every वचन is a full statement with a verb that teaches something.
1. Every वचन stands alone and is the saint's teaching.
2. Every वचन is word-for-word (or has an `अध्याय:` line).
3. Every वचन has 1–3 topics from the list.
4. No duplicates; a good spread across the whole book, not just the first chapters.
5. Read each वचन **to its last sentence**: it must not end by starting a new story, quoting another person's view, or asking the listener a question. Check each topic against the meaning, not a word match (“नाम का ही रह जाता है” is not नाम-जप).
