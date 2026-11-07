#!/usr/bin/env python3
import re, json, sys
# Usage: python3 tools/vachan-candidates.py books/<slug>.md "<speaker as written in bold>" out.json
# Finds 1–3 sentence teachings in the main speaker's lines (and their continuation paragraphs), scores them
# (topic words, similes, length), skips context-dependent ones, max 8 per chapter. Review by hand before use.
src=open(sys.argv[1]).read(); SPK=re.escape(sys.argv[2])
def plain(s):
    s=re.sub(r'\[\^[^\]]+\]','',s); s=re.sub(r'<[^>]+>','',s); s=re.sub(r'\[([^\]]*)\]\([^)]*\)',r'\1',s)
    return re.sub(r'\s+',' ',s.replace('**','').replace('\\','')).strip()
KEY=r'ईश्वर|भगवान्|भगवान|माँ|मन |मन,|मन का|मन में|संसार|भक्ति|भक्त|माया|ज्ञान|कामिनी|कांचन|साधु|सत्संग|प्रेम|विश्वास|व्याकुल|साधना|ध्यान|समाधि|अहंकार|मैं|त्याग|वैराग्य|नाम|जप|प्रार्थना|गुरु|शरण|कृपा|आत्मा|ब्रह्म|शक्ति|अवतार|धर्म|मत|पथ|सत्य|जीव'
SIMILE=r'जैसे|मानो|वैसे ही|उसी प्रकार|उसी तरह'
BAD_START=r'^(उसी प्रकार|इसी प्रकार|ऐसे ही|यही|वही|उनकी|उनका|उनके|उन्हें|और|पर |परन्तु|तो |इसलिए|वह |यह |वे |उसने|उन्होंने|हाँ|नहीं|क्यों|अच्छा|क्या|अरे|ओह|अजी|देखो,? तुम|तुम्हारा|आप |आपका|बैठो|आओ|अब |फिर |इसके|उसके|उस |इस )'
best=[]; part=None; dar=None; cont=False
for block in src.split('\n\n'):
    b=block.strip()
    if b.startswith('**') and not b.startswith('**'+sys.argv[2]): cont=False
    if b.startswith('#') or b.startswith('—') or b.startswith('भावार्थ') or b.startswith('<span') or b.startswith('[^'): cont=False
    if b.startswith('# '): part=b[2:]; continue
    if b.startswith('## '): dar=plain(b[3:]); continue
    m=re.match(r'^\*\*'+SPK+r'[^*]*\*\*(\s*\([^)]*\))?\s*(\*\*)?\s*—\s*(\*\*)?\s*(.*)$', b, re.S)
    if m: cont=True; t=plain(m.group(4))
    elif cont and not b.startswith('**') and sys.argv[2] not in b and not b.startswith('('): t=plain(b)
    else: continue
    if not dar or part=='# श्लोक-सूची': continue
    t=t.strip(' "“”')
    pbest=None
    if len(t)<50: continue
    sents=[x.strip() for x in re.split(r'(?<=[।!?])\s+', t) if x.strip()]
    # windows of 1-3 consecutive sentences
    for i in range(len(sents)):
        for k in (1,2,3):
            w=' '.join(sents[i:i+k])
            if i+k>len(sents) or not (70<=len(w)<=300): continue
            if w.endswith('?') or re.match(BAD_START,w) or '(' in w[:3] or w.count('“')!=w.count('”'): continue
            sc=len(re.findall(KEY,w))*2 + (3 if re.search(SIMILE,w) else 0) - abs(len(w)-170)/60
            if re.search(r'मास्टर|नरेन्द्र|केशव|मणि|राखाल|विजय|ईशान|महेन्द्र|श्रीश|कप्तान|केदार|बलराम|विद्यासागर|शम्भु|प्राणकृष्ण|सुरेन्द्र|गिरीश|हाजरा|भवनाथ|बाबूराम|योगीन|अधर|त्रैलोक्य|शशधर|मैंने कहा|उसने कहा|हास्य|कल |आज ', w): continue
            if re.search(r'तुम|आप', w): sc-=2
            if not pbest or sc>pbest[0]: pbest=(sc,dar,w)
    if pbest: best.append(pbest)
# per darshan: top items, no overlaps
seen=set(); out=[]; perd={}
for sc,d,w in sorted(best,key=lambda x:-x[0]):
    key=w[:40]
    if sc<0 or any(w[:30] in o or o[:30] in w for o in seen): continue
    if perd.get(d,0)>=8: continue
    perd[d]=perd.get(d,0)+1; seen.add(w); out.append((d,w))
order={d:i for i,d in enumerate(re.findall(r'^## (.+)$',src,re.M))}
out.sort(key=lambda x:(order.get(next((k for k in order if plain(k)==x[0]),''),0), src.find(x[1][:20])))
print(len(out), 'from', len(perd), 'darshans', file=sys.stderr)
# complete the thought: run each pick forward to the end of its idea (whole simile/parable, ≤ 900 chars),
# stopping before a sentence that names or addresses someone present, or an aside in brackets
STOP=r'मास्टर|नरेन्द्र|केशव|मणि|राखाल|विजय|ईशान|महेन्द्र|श्रीश|कप्तान|केदार|बलराम|विद्यासागर|शम्भु|प्राणकृष्ण|सुरेन्द्र|गिरीश|हाजरा|भवनाथ|बाबूराम|योगीन|अधर|त्रैलोक्य|शशधर|हरीश|बंकिम|\(|तुम्हें मैं|तू क्या|तेरी|तुम्हारा|क्यों रे'
paras=[plain(b) for b in src.split('\n\n')]
full=[]
for d,w in out:
    p=next((x for x in paras if w in x),'')
    i=p.find(w); new=w
    if i>=0:
        for s_ in [x for x in re.split(r'(?<=[।!?])\s+',p[i+len(w):]) if x.strip()]:
            if re.search(STOP,s_) or len(new)+len(s_)>900: break
            new+=' '+s_
    full.append((d,re.sub(r' +',' ',new).strip().rstrip('“”"').strip()))
out=full
json.dump(out, open(sys.argv[3],'w'), ensure_ascii=False)
for i,(d,w) in enumerate(out): print(i, d, '|', w)

