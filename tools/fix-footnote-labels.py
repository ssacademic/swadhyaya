#!/usr/bin/env python3
"""Find label lines (शिक्षा N, अध्याय N, …) that got joined onto the end of a
footnote definition, and move each back onto its own line before its heading.
Safe to run more than once. Usage: python3 tools/fix-footnote-labels.py books/<slug>.md [--dry]"""
import re, sys
f = sys.argv[1]; dry = '--dry' in sys.argv
t = open(f, encoding='utf8').read()
LABEL = r'(शिक्षा|अध्याय|प्रकरण|उपदेश|पाठ)'
found = re.findall(rf'^\[\^([^\]]+)\]:.*?\s({LABEL} (\d+))\s*$', t, re.M)
if not found: print('OK: no footnote ends with a label'); sys.exit(0)
for d, lab, word, num in found:
    n = int(num)
    if f'\n{lab}\n' in t: print('skip (label already present):', lab); continue
    nxt = t.find(f'\n{word} {n+1}\n'); prv = t.find(f'\n{word} {n-1}\n')
    if nxt < 0: nxt = len(t)
    h = t.rfind('\n## ', 0, nxt); h_prev = t.find('\n## ', prv) if prv >= 0 else -1
    if not (prv < h_prev < h < nxt): print('CHECK BY HAND:', lab, 'in footnote', d); continue
    print(f'{lab}: footnote {d} → before “{t[h+4:h+50].splitlines()[0]}”')
    t = t[:h] + f'\n{lab}\n' + t[h:]
    t = re.sub(rf'^(\[\^{re.escape(d)}\]:.*?)\s+{lab}\s*$', r'\1', t, count=1, flags=re.M)
labs = [(w, int(x)) for w, x in re.findall(rf'^{LABEL} (\d+)\s*$', t, re.M)]
for w in sorted({w for w, _ in labs}):
    ns = [x for ww, x in labs if ww == w]
    miss = sorted(set(range(min(ns), max(ns) + 1)) - set(ns))
    print(f'{w}: {len(ns)} labels, missing {miss or "none"}, in order: {ns == sorted(ns)}')
if not dry: open(f, 'w', encoding='utf8').write(t); print('written', f)
