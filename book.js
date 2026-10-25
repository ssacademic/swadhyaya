/* स्वाध्याय — reading a book file: Markdown subset, chapters, sittings, vachans.
   Pure functions, shared by the app (browser) and tools/ (Node). */
'use strict';
const WPM = 140;               // unhurried devotional reading pace
const TARGET_WORDS = 1800;     // ≈ one 12–15 minute sitting
const MAX_WORDS = 2600;        // longer chapters are divided into sittings
const escB = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- Markdown (the subset these books use) ---------- */
function inline(s) {
  s = s.replace(/\\([\\`*_{}\[\]()#+\-.!>|])/g, (m, c) => `\u0000${c.charCodeAt(0)}\u0000`);
  s = s.replace(/\[\^([^\]\s]+)\]/g, (m, id) => `<sup class="fnref"><a href="#" data-fn="${escB(id)}">${escB(id)}</a></sup>`);
  s = s.replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, (m, t, u) => u.startsWith('#')
    ? `<a href="#" data-anchor="${escB(u.slice(1))}">${t}</a>`
    : `<a href="${escB(u)}" target="_blank" rel="noopener">${t}</a>`);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\s](?:[^*]*?[^*\s])?)\*/g, '$1<em>$2</em>');
  s = s.replace(/ {2,}\n|\\\n/g, '<br>').replace(/\n/g, ' ');
  return s.replace(/\u0000(\d+)\u0000/g, (m, c) => '&#' + c + ';');
}

const isListLine = l => /^\s*([-*+]|\d+[.)])\s+/.test(l);
function classify(raw, html) {
  const t = raw.trim();
  if (/^[❀✿✦✧❁◆*•·\s]+$/.test(t) && t.length < 20) return 'orn';
  if (/^[❀॥].*[❀॥]$/.test(t)) return 'iti';
  if (/^\*\*प्रश्न/.test(t)) return 'q';
  if (/^\*\*उत्तर/.test(t)) return 'a';
  if (/^\*\*\d+\.\*\*/.test(t)) return 'vachan';
  if (/^(भावार्थ|अर्थ)\s*—/.test(t)) return 'bhav';
  if (LABEL.test(t)) return 'num';
  if (/^—\s/.test(t)) return 'src';
  if (html.includes('<br>')) return 'verse';
  return '';
}

function renderMd(md) {
  const L = md.split('\n'), out = [];
  let i = 0;
  while (i < L.length) {
    const l = L[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = l.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/))) {
      const n = Math.min(6, Math.max(2, m[1].length));
      out.push(`<h${n}>${inline(m[2])}</h${n}>`); i++; continue;
    }
    if (/^>/.test(l)) {
      const q = [];
      while (i < L.length && L[i].trim() && (/^>/.test(L[i]) || q.length)) { q.push(L[i].replace(/^>\s?/, '')); i++; }
      out.push(`<blockquote>${renderMd(q.join('\n'))}</blockquote>`); continue;
    }
    if (isListLine(l)) {
      const ordered = /^\s*\d/.test(l), items = [];
      while (i < L.length) {
        if (isListLine(L[i])) { items.push(L[i].replace(/^\s*([-*+]|\d+[.)])\s+/, '')); i++; }
        else if (L[i].trim() && /^\s{2,}/.test(L[i])) { items[items.length - 1] += '\n' + L[i].trim(); i++; }
        else if (!L[i].trim() && i + 1 < L.length && isListLine(L[i + 1])) i++;
        else break;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map(t => `<li>${inline(t)}</li>`).join('')}</${tag}>`); continue;
    }
    const p = [];
    while (i < L.length && L[i].trim() && !(p.length && (/^#{1,6}\s/.test(L[i]) || /^>/.test(L[i])))) { p.push(L[i]); i++; }
    const raw = p.join('\n');
    if (/^<(div|figure|table|hr|section|aside)\b/i.test(raw.trim())) { out.push(raw); continue; }
    const html = inline(raw), cls = classify(raw, html);
    out.push(`<p${cls ? ` class="${cls}"` : ''}>${html}</p>`);
  }
  return out.join('\n');
}

const plain = s => s.replace(/\[\^[^\]]+\]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/<[^>]+>/g, '').replace(/\*\*?/g, '').replace(/\\(.)/g, '$1').replace(/\s+/g, ' ').trim();
const wordsIn = s => (s.match(/\S+/g) || []).length;

/* ---------- Book parsing: split into chapters and reading sittings ---------- */
const LABEL = /^(अध्याय|शिक्षा|प्रकरण|सर्ग|पाठ|कथा|प्रसंग)\s+\S+$/;  // a number line printed just before a heading
const SKIP = /^(विषय-?\s?सूची|विषयानुक्रमणिका|अनुक्रमणिका|अनुक्रम|contents|table of contents)$/i;

function parseBook(src, meta) {
  src = src.replace(/\r\n?/g, '\n').replace(/^﻿/, '');
  if (src.startsWith('---\n')) { const e = src.indexOf('\n---', 4); if (e > 0) src = src.slice(src.indexOf('\n', e + 1) + 1); }

  // 1. lift out footnote definitions (they may sit anywhere; usually at the end)
  const fns = {}, body = [], lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\[\^([^\]\s]+)\]:\s?(.*)$/);
    if (!m) { body.push(lines[i]); continue; }
    const t = [m[2]];
    while (i + 1 < lines.length && (/^(\s{2,}|\t)\S/.test(lines[i + 1]) || (!lines[i + 1].trim() && /^(\s{2,}|\t)\S/.test(lines[i + 2] || '')))) {
      i++; t.push(lines[i].replace(/^(\t| {1,4})/, ''));
    }
    fns[m[1]] = t.join('\n');
  }

  // 2. sections by heading
  const secs = [];
  let cur = null;
  for (const line of body) {
    const h = line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/);
    if (h) {
      // a chapter label like "अध्याय 2" (plus ornaments) printed just before the heading belongs to the next chapter
      let num = null;
      if (cur) {
        const tail = cur.lines.map((l, i) => [l.trim(), i]).filter(([l]) => l).slice(-3);
        const at = tail.findIndex(([l]) => LABEL.test(l));
        if (at >= 0 && tail.slice(at + 1).every(([l]) => /^[❀✿✦✧❁◆*•·\s]+$/.test(l))) {
          num = tail[at][0]; cur.lines.length = tail[at][1];
        }
      }
      cur = { level: h[1].length, title: plain(h[2]), raw: h[2], head: line, lines: [], num }; secs.push(cur);
    }
    else if (cur) cur.lines.push(line);
  }

  // 3. chapters: every # or ## starts one; ### stays inside. A short # (a "part" like आचार खण्ड) becomes an intro.
  const chs = [];
  let part = null, intro = null, skipping = false;
  for (let k = 0; k < secs.length; k++) {
    const s = secs[k], next = secs[k + 1];
    if (s.level <= 2) skipping = SKIP.test(s.title);
    if (skipping) continue;
    if (s.level === 1) {
      if (next && next.level === 2 && wordsIn(s.lines.join(' ')) < 200) {
        part = s.title; intro = { title: s.title, md: s.lines.join('\n').trim() }; continue;
      }
      part = null;
      chs.push({ title: s.title, raw: s.raw, part: null, intro: null, num: s.num, lines: [...s.lines] });
    } else if (s.level === 2) {
      chs.push({ title: s.title, raw: s.raw, part, intro, num: s.num, lines: [...s.lines] }); intro = null;
    } else {
      if (!chs.length) chs.push({ title: s.title, part, intro: null, lines: [] });
      chs[chs.length - 1].lines.push('', s.head, ...s.lines);
    }
  }

  // 3b. books of many short pieces (e.g. 325 short teachings): pack neighbours into one sitting of ~TARGET words;
  //     each keeps its own heading inside, and the sitting lists them as items for the contents
  const packed = [], smallIn = {};
  chs.forEach(c => { if (c.part && wordsIn(c.lines.join(' ')) < 700) smallIn[c.part] = (smallIn[c.part] || 0) + 1; });
  for (const c of chs) {
    const w = wordsIn(c.lines.join(' ')), prev = packed[packed.length - 1];
    if (!(smallIn[c.part] >= 10)) { packed.push({ ...c, items: null }); continue; }
    if (w < 700 && prev && prev.small && prev.part === c.part && !c.intro && prev.words < TARGET_WORDS && prev.words + w <= MAX_WORDS) {
      prev.lines.push('', ...(c.num ? [c.num, ''] : []), '## ' + (c.raw || c.title), ...c.lines); prev.words += w; prev.items.push({ title: c.title, num: c.num });
    } else packed.push({ ...c, lines: w < 700 ? [...(c.num ? [c.num, ''] : []), '## ' + (c.raw || c.title), ...c.lines] : c.lines, small: w < 700, words: w, items: [{ title: c.title, num: c.num }] });
  }
  chs.length = 0;
  packed.forEach(c => {
    if (c.small && c.items.length > 1) {
      const nums = c.items.map(x => x.num).filter(Boolean);
      c.title = nums.length === c.items.length ? `${nums[0]}–${nums[nums.length - 1].replace(/^\S+\s+/, '')}` : c.items[0].title + ' …';
      c.num = null;
    } else if (c.small) { c.lines = c.lines.filter((l, i) => !(i < 3 && (l === c.num || l === '## ' + (c.raw || c.title)))); c.items = null; }
    else c.items = null;
    chs.push(c);
  });

  // 4. divide long chapters into sittings at natural breaks (sub-heading, question, numbered vachan)
  const units = [];
  chs.forEach((c, ci) => {
    const blocks = c.lines.join('\n').split(/\n\s*\n/).filter(b => b.trim());
    const total = wordsIn(c.lines.join(' '));
    const base = { title: c.title, raw: c.items ? null : c.raw, part: c.part, num: c.num, chapter: ci, items: c.items || null };
    if (total <= MAX_WORDS) { units.push({ ...base, intro: c.intro, md: blocks.join('\n\n'), words: total }); return; }
    const w = blocks.map(b => wordsIn(b));
    const suffix = []; let acc = 0;
    for (let j = w.length - 1; j >= 0; j--) { acc += w[j]; suffix[j] = acc; }
    let start = 0, sum = 0, h3 = null, ctxAtStart = null;
    const pieces = [];
    for (let j = 0; j < blocks.length; j++) {
      const isHead = /^###\s/.test(blocks[j]);
      const good = isHead || /^\*\*(प्रश्न|\d+\.)/.test(blocks[j]);
      const enough = sum >= TARGET_WORDS || (isHead && sum >= TARGET_WORDS * 0.6);
      if (j > start && good && enough && suffix[j] >= 600) {
        pieces.push({ from: start, to: j, words: sum, ctx: ctxAtStart });
        start = j; sum = 0; ctxAtStart = isHead ? null : h3;
      }
      if (isHead) h3 = plain(blocks[j].replace(/^###\s+/, ''));
      sum += w[j];
    }
    pieces.push({ from: start, to: blocks.length, words: sum, ctx: ctxAtStart });
    pieces.forEach((p, n) => units.push({
      ...base, intro: n ? null : c.intro, md: blocks.slice(p.from, p.to).join('\n\n'), words: p.words,
      piece: n + 1, pieces: pieces.length, ctx: p.ctx,
    }));
  });

  // 5. anchors (for cross-references like the verse index) and daily vachans
  const anchors = {}, vachans = [];
  units.forEach((u, ui) => {
    for (const m of u.md.matchAll(/id="([^"]+)"/g)) anchors[m[1]] = ui;
    for (const line of u.md.split('\n')) {
      const m = line.match(/^\*\*(\d+)\.\*\*\s*(.+)$/);
      if (!m) continue;
      const text = plain(m[2]);
      if (text.length >= 60 && text.length <= 340 && !/[—:–-]\s*$/.test(text)) vachans.push({ ui, text, num: m[1] });
    }
  });
  return { meta, units, fns, anchors, vachans, words: units.reduce((a, u) => a + u.words, 0) };
}

function parseVachans(src, slug) {
  src = src.replace(/\r\n?/g, '\n');
  if (src.startsWith('---\n')) { const e = src.indexOf('\n---', 4); if (e > 0) src = src.slice(src.indexOf('\n', e + 1) + 1); }
  const out = [];
  for (const block of src.split(/\n\s*\n/)) {
    const text = []; let tags = [], ch = null;
    for (const l of block.split('\n')) {
      if (/^>/.test(l)) text.push(plain(l.replace(/^>\s?/, '')));
      else if (/^विषय\s*:/.test(l)) tags = l.replace(/^विषय\s*:/, '').split(/[,،]/).map(s => s.trim()).filter(Boolean);
      else if (/^अध्याय\s*:/.test(l)) ch = l.replace(/^अध्याय\s*:/, '').trim();
    }
    if (text.join('').trim()) out.push({ slug, text: text.filter(Boolean).join('\n'), tags, ch });
  }
  return out;
}

/* plain text for speech: no footnote markers, markup or ornaments */
function speechText(md) {
  return md.split(/\n\s*\n/).map(b => plain(b.replace(/^#{1,6}\s+/, '').replace(/ {2,}\n/g, '\n')))
    .filter(t => t && !/^[❀✿✦✧❁◆*•·\s॥]+$/.test(t)).join('\n\n');
}
if (typeof module !== 'undefined') module.exports = { inline, parseBook, parseVachans, renderMd, plain, wordsIn, speechText, WPM };
