#!/usr/bin/env python3
"""Quality check for वचन files: run after creating or editing any books/<slug>.vachan.md.

  python3 tools/check-vachans.py            # all books
  python3 tools/check-vachans.py <slug>     # one book

Flags (each needs a human look; some are fine):
  LABEL      reads like a title, not a saying (no verb ending, e.g. "दान का महत्त्व")
  TITLE—SUB  "short title — subtitle/story name" pattern
  LIST       a list item: "(1) …"
  SHORT      under 25 characters or 5 words
  DANGLING   ends with — : , or an opening quote
  DEPENDS    starts with a word that needs the previous sentence (उसी प्रकार, यही, किन्तु …)
  NAMES      names a person present in a conversation (dialogue books)
  LONG       over 900 characters
  NOTFOUND   not word-for-word in the book (“प्रसंग” will not open)
  DUP        same वचन twice
A reviewed वचन that is fine despite a flag can carry a line “जाँच: ठीक” in its block.
Exit code 1 if anything is flagged, so it can gate a release.
"""
import re, sys, json, os

ROOT = os.path.join(os.path.dirname(__file__), '..')
VERB = r'(है|हैं|था|थे|थी|हो|होता|होती|होते|होगा|करो|करे|करता|करते|करना|चाहिए|सकता|सकते|सकती|जाता|जाती|जाते|जाओ|रहो|रहते|रहता|रहना|देता|देते|देना|दो|मिलता|मिलती|लगता|लगती|आता|आती|आए|पड़ता|पड़ती|नहीं|मत|लो|डालो|चेतो|खरीदो|रखना|रखो|जानो|समझो|बनो|छोड़ो|भजो|सहो|ठहर|पाता|पाते|हूँ|हुआ|हुई|हुए|\S+ेगा|\S+ेगी|\S+ेंगे|\S+ेगे)(?=[\s,;!।?॥"”’]|$)'
VERB_END = r'(है|हैं|था|थे|थी|थीं|ता|ती|ते|ो|ए|ें|ेंगे|ेगा|ेगी|गा|गी|गे|ना|नी|ने|ओ|िए|िये|ं|ी|ा|हो|दो|लो|रहो|सकते|सकता|सकती)[!।?॥"”’]*$'
# Awadhi / subjunctive verb forms ending a clause (मिले, लगे, करै, पावै, जाय, होय, खवाए, बोल दे)
SUBJ = r'\S{2,}(?:ाय|ाँय|ोय|ै|े|ये|ाए)(?=[\s,;!।?॥"”’]|$)|(?<=\s)दे(?=[,;!।?॥]|$)'
DEP = r'^(इसी प्रकार|उसी प्रकार|इसी से|इसीलिए|इसलिए|इस प्रकार|ऐसे ही|ऐसा ही|यही |वही |उनके|उनका|उनकी|उन्हें|उपर्युक्त|ऊपर|और |परन्तु|किन्तु|पर |तब |फिर )'
NAMES = r'मास्टर|नरेन्द्र|केशव|मणि|राखाल|विजय|ईशान|महेन्द्र|श्रीश|कप्तान|केदार|बलराम|विद्यासागर|शम्भु|प्राणकृष्ण|सुरेन्द्र|गिरीश|हाजरा|भवनाथ|बाबूराम|योगीन|अधर|त्रैलोक्य|शशधर'

def plain(s):
    s = re.sub(r'\[\^[^\]]+\]', '', s); s = re.sub(r'<[^>]+>', '', s); s = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', s)
    return re.sub(r'\s+', ' ', s.replace('**', '').replace('\\', '')).strip()

def check(slug, meta):
    book = plain(open(os.path.join(ROOT, 'books', meta['file'])).read())
    src = open(os.path.join(ROOT, 'books', meta['vachans'])).read()
    items = []
    for b in src.split('\n\n'):
        lines = [l for l in b.split('\n') if l.startswith('>')]
        if lines: items.append((' '.join(l[1:].strip() for l in lines), b))
    flags, seen = [], set()
    for text, block in items:
        t = plain(text); f = []
        words = len(t.split())
        if re.match(r'^\(\d+\)', t) and words <= 8: f.append('LIST')
        m = re.match(r'^([^—]{2,40}) — (.+)$', t)
        if m and words <= 14 and not re.search(VERB, m.group(1)) and not re.search(VERB, m.group(2)): f.append('TITLE—SUB')
        elif not re.search(VERB, t) and not re.search(SUBJ, t) and words <= 12: f.append('LABEL')
        if len(t) < 18 or words < 4: f.append('SHORT')
        if re.search(r'[—:,“‘]$', t): f.append('DANGLING')
        if re.match(DEP, t): f.append('DEPENDS')
        if meta.get('voice') and re.search(NAMES, t): f.append('NAMES')
        if len(t) > 900: f.append('LONG')
        if 'अध्याय:' not in block and plain(t.split(' ')[0] + ' ' + ' '.join(t.split(' ')[1:6])) not in book: f.append('NOTFOUND')
        if t in seen: f.append('DUP')
        seen.add(t)
        if f and 'जाँच: ठीक' not in block: flags.append((f, t))   # a reviewed वचन can carry “जाँच: ठीक”
    return len(items), flags

books = json.load(open(os.path.join(ROOT, 'books/books.json')))
only = sys.argv[1] if len(sys.argv) > 1 else None
bad = 0
for m in books:
    if only and m['slug'] != only or not m.get('vachans'): continue
    n, flags = check(m['slug'], m)
    print(f"\n{m['slug']}: {n} वचन, {len(flags)} flagged")
    for f, t in flags: print(f"  {'/'.join(f):<16} {t[:120]}")
    bad += len(flags)
sys.exit(1 if bad else 0)
