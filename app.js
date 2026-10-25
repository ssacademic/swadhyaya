/* स्वाध्याय — a quiet reader for digitised spiritual books.
   No build step, no dependencies. Books are Markdown files listed in books/books.json.
   All personal data (progress, saved passages, notes) lives in this browser's localStorage. */
'use strict';

/* ---------- tiny helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const app = $('#app');

const store = {
  get(k, d) { try { const v = localStorage.getItem('sv:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('sv:' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};

const DEFAULTS = { theme: 'sepia', size: 2, font: 'tiro', goal: 10, rate: 0.9, lang: 'hi' };
let settings = Object.assign({}, DEFAULTS, store.get('settings', {}));
const SIZES = [17, 19, 21, 23, 26];

const today = () => new Date().toLocaleDateString('en-CA');
const dayKey = d => d.toLocaleDateString('en-CA');
const mins = w => Math.max(1, Math.round(w / WPM));
const hiNum = n => n.toLocaleString('en-IN'); // digits 1 2 3 everywhere

function applySettings() {
  const r = document.documentElement;
  r.dataset.theme = settings.theme;
  r.dataset.font = settings.font; r.lang = settings.lang === 'en' ? 'en' : 'hi';
  r.style.setProperty('--fs', SIZES[settings.size] + 'px');
  const tc = { sepia: '#f6efe2', light: '#fdfcf9', dark: '#16130f' }[settings.theme];
  $('meta[name=theme-color]').setAttribute('content', tc);
  store.set('settings', settings);
}
applySettings();

/* ---------- data loading ---------- */
let library = [];
const books = {};
async function loadLibrary() {
  if (library.length) return library;
  library = await (await fetch('books/books.json')).json();
  return library;
}
async function loadBook(slug) {
  if (books[slug]) return books[slug];
  await loadLibrary();
  const meta = library.find(b => b.slug === slug);
  if (!meta) throw new Error('पुस्तक नहीं मिली');
  const txt = await (await fetch('books/' + meta.file)).text();
  const bk = parseBook(txt, meta); store.set('units:' + slug, bk.units.length);
  return (books[slug] = bk);
}

/* ---------- personal state ---------- */
const done = slug => new Set(store.get('done:' + slug, []));
function markDone(slug, ui) {
  const d = done(slug); if (d.has(ui)) return;
  d.add(ui); store.set('done:' + slug, [...d]);
}
const posKey = (slug, ui) => slug + ':' + ui;

/* Reading time: counted in 5s ticks only while the reader is open, visible, and touched in the last minute. */
let lastAct = Date.now(), onReader = false;
['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(e => addEventListener(e, () => { lastAct = Date.now(); }, { passive: true }));
setInterval(() => {
  if (!onReader || document.visibilityState !== 'visible' || Date.now() - lastAct > 60000) return;
  const days = store.get('days', {}), k = today(), before = days[k] || 0;
  days[k] = before + 5; store.set('days', days);
  const goal = settings.goal * 60;
  if (before < goal && days[k] >= goal) toast('॥ आज का नियम पूर्ण हुआ ॥');
}, 5000);

/* ---------- English interface ----------
   Only the interface is translated; anything marked lang="hi" (book text, वचन, titles, names) stays as it is.
   EXACT: whole text of an element; PHRASES: patterns inside longer text. */
const EXACT = {
  'आज': 'Today', 'ग्रन्थ': 'Books', 'वचन': 'Vachan', 'संग्रह': 'Saved', 'सहेजें': 'Save', 'सुनें': 'Listen', 'चित्र': 'Image', 'प्रसंग': 'Context',
  'देखें': 'Reveal', 'भेजें': 'Share', 'आगे': 'Next', 'मनन': 'Reflection', 'सभी': 'All', 'प्रगति': 'Progress', 'रंग': 'Colours', 'अक्षर': 'Typeface',
  'आवाज़': 'Voice', 'उजला': 'Light', 'रात्रि': 'Night', 'धीमी': 'Slow', 'सहज': 'Gentle', 'सामान्य': 'Normal', 'तेज़': 'Fast', 'शास्त्रीय': 'Classic',
  'आधुनिक': 'Modern', 'अनुक्रम': 'Contents', 'र': 'S', 'सो': 'M', 'मं': 'T', 'बु': 'W', 'गु': 'T', 'शु': 'F', 'श': 'S', 'मुख्य': 'Main',
  'सुप्रभात': 'Good morning', 'शुभ दिन': 'Good day', 'शुभ सन्ध्या': 'Good evening', 'शुभ रात्रि': 'Good night', 'ब्राह्म मुहूर्त': 'Brahma muhurta',
  'आरम्भ करें': 'Begin', 'सेटिंग': 'Settings', 'प्रतिलिपि': 'Copy', 'हटाएँ': 'Remove', 'ठीक है': 'Done', 'बन्द करें': 'Close', 'पुराना काग़ज़': 'Old paper',
  'सभी वचन': 'All vachan', 'बिना क्रम': 'Shuffled', 'सभी सन्त': 'All saints', 'हाल में खोले': 'Recent', 'अ–ज्ञ': 'A–Z', 'सप्ताह-क्रम': 'Weekly streak',
  'अन्य कैलेंडर': 'Other calendar', 'देखें': 'View', '✓ सहेजा': '✓ Saved', 'कॉपी': 'Copy', 'वापस': 'Back', 'नए पहले': 'Newest', 'पुराने पहले': 'Oldest', 'सभी ग्रन्थ': 'All books', 'यह': 'now', 'गति': 'Speed', 'सुनकर देखें': 'Test voice', 'उपकरण की आवाज़': 'Device voice', 'खोजें': 'Search', 'सहेजा हुआ': 'Saved',
};
const PHRASES = [
  [/पढ़ने की सुविधा/g, 'Reading settings'], [/अक्षर का आकार/g, 'Text size'], [/दैनिक नियम/g, 'Daily practice'], [/(\d+) मि\./g, '$1 min'],
  [/संकल्प — प्रतिदिन किस समय पढ़ेंगे\?/g, 'Your daily reading time'], [/Google कैलेंडर में/g, 'Add to Google Calendar'],
  [/कैलेंडर रोज़ उसी समय याद दिला देगा।/g, 'Your calendar will remind you daily at this time.'],
  [/सुनने की गति/g, 'Listening speed'], [/इस उपकरण पर हिन्दी आवाज़ नहीं मिली। फ़ोन की सेटिंग → भाषा → Text-to-speech में हिन्दी जोड़ें।/g, 'No Hindi voice on this device. Add Hindi under phone Settings → Language → Text-to-speech.'],
  [/आपकी प्रगति, सहेजे वचन और मनन इसी उपकरण में रहते हैं।/g, 'Your progress, saved vachan and reflections live on this device only.'],
  [/संग्रह की प्रति लें/g, 'Back up'], [/प्रति लौटाएँ/g, 'Restore'], [/भाषा/g, 'Language'],
  [/आज का वचन/g, "Today's vachan"], [/प्रसंग में पढ़ें/g, 'Read in context'], [/चित्र भेजें/g, 'Share as image'], [/और वचन →/g, 'More vachan →'],
  [/जहाँ छोड़ा था/g, 'Where you left off'], [/पढ़ना जारी रखें/g, 'Continue reading'], [/पढ़ना आरम्भ करें/g, 'Start reading'],
  [/पुनः स्मरण · (\d+) दिन पहले आपने सहेजा था/g, 'Recall · you saved this $1 days ago'], [/आगे का वचन मन में दोहराइए, फिर देखिए।/g, 'Try to recall the rest, then reveal.'],
  [/आज का स्वाध्याय/g, "Today's reading"], [/आज का नियम पूर्ण। जितना और पढ़ें, प्रसाद है।/g, "Today's practice is complete. Anything more is a blessing."],
  [/आज (\d+) मिनट हुए — (\d+) मिनट और।/g, '$1 min today — $2 more to go.'], [/आज के (\d+) मिनट अभी शेष हैं।/g, "Today's $1 minutes are still ahead."],
  [/इस सप्ताह (\d+) दिन · अब तक कुल (\d+) दिन/g, '$1 days this week · $2 days in all'], [/लगातार (\d+) सप्ताह/g, '$1-week streak'],
  [/· इस सप्ताह (\d+)\/(\d+) दिन/g, '· this week $1/$2 days'], [/संकल्प: प्रतिदिन (\S+) बजे/g, 'Daily at $1'], [/पढ़ने का एक समय तय करें →/g, 'Set a daily reading time →'],
  [/(\d+) अंश पढ़े/g, '$1 sittings read'], [/पढ़ रहे हैं/g, 'Reading now'], [/सब देखें →/g, 'See all →'], [/(\d+)% पढ़ा/g, '$1% read'],
  [/(\d+) अंश · लगभग (\d+) घण्टे का पाठ/g, '$1 sittings · about $2 hours'], [/ग्रन्थ में खोजें — जैसे ‘नाम-जप’/g, 'Search this book (in Hindi)'],
  [/([\d,+]+) स्थान/g, '$1 places'], [/कुछ नहीं मिला/g, 'Nothing found'], [/भाग (\d+) \/ (\d+)/g, 'Part $1 / $2'], [/लगभग (\d+) मिनट/g, 'about $1 min'],
  [/\(आगे\)/g, '(continued)'], [/इस अंश की कौन-सी एक बात आज मन में रखेंगे\?/g, 'Which one thought from this sitting will you carry today?'],
  [/एक पंक्ति लिखें…/g, 'Write one line…'], [/लिखते ही सहेज लिया जाता है/g, 'Saved as you type'], [/सहेजा गया ✓/g, 'Saved ✓'],
  [/ग्रन्थ पूर्ण हुआ।/g, 'Book complete.'], [/← पिछला/g, '← Previous'], [/अगला →/g, 'Next →'], [/फिर आरम्भ से ↺/g, 'Start again ↺'],
  [/टिप्पणी (\S+)/g, 'Note $1'], [/❚❚ ठहरें/g, '❚❚ Pause'], [/▶ चलाएँ/g, '▶ Play'], [/■ रोकें/g, '■ Stop'], [/ठहरें/g, 'Pause'], [/चलाएँ/g, 'Play'],
  [/वचनामृत/g, 'Vachanamrit'], [/एक-एक वचन, धीरे-धीरे। हर संग्रह याद रखता है कि आप कहाँ रुके थे।/g, 'One vachan at a time. Each collection remembers where you stopped.'],
  [/(\d[\d,]*) वचन/g, '$1 vachan'], [/(\d+) पर रुके/g, 'stopped at $1'], [/(\d+) पढ़े/g, '$1 read'], [/पूर्ण ✓/g, 'complete ✓'],
  [/विषय अनुसार/g, 'By topic'], [/ग्रन्थ अनुसार/g, 'By book'], [/॥ इस संग्रह का अन्तिम वचन ॥/g, '॥ last vachan in this collection ॥'],
  [/नाम से खोजें/g, 'Search by title'], [/ग्रन्थ खोजें/g, 'Search books'], [/कोई ग्रन्थ नहीं मिला।/g, 'No books found.'],
  [/सहेजे वचन/g, 'Saved vachan'], [/पढ़ते समय किसी अनुच्छेद को छूएँ और “सहेजें” चुनें — वह यहाँ आ जाएगा।/g, 'While reading, tap any paragraph and choose “Save” — it will appear here.'],
  [/हर अंश के अन्त में एक पंक्ति का मनन लिखें — वे यहाँ इकट्ठे होंगे।/g, 'Write a one-line reflection at the end of each sitting — they collect here.'],
  [/चित्र सहेजें/g, 'Save image'], [/वचन का चित्र/g, 'Vachan image'], [/कुछ अड़चन आई —/g, 'Something went wrong —'], [/मुख्य पृष्ठ/g, 'Home'],
  [/पहले से संग्रह में है/g, 'Already saved'], [/संग्रह में रखा गया/g, 'Saved'], [/प्रतिलिपि बन गई/g, 'Copied'], [/प्रतिलिपि नहीं बन सकी/g, "Couldn't copy"],
  [/प्रति लौट आई/g, 'Restored'], [/यह फ़ाइल पढ़ी नहीं जा सकी/g, "Couldn't read this file"], [/इस ब्राउज़र में सुनने की सुविधा नहीं है/g, "This browser can't read aloud"],
  [/इस अंश की रिकॉर्डिंग नहीं मिली — उपकरण की आवाज़ से सुन रहे हैं/g, 'No recording for this sitting — using the device voice'],
  [/संग्रह से हटाया/g, 'Removed from saved'], [/यह अंश पढ़ें →/g, 'Read this sitting →'], [/फिर पढ़ें →/g, 'Read again →'], [/वापस लें/g, 'Undo'], [/आरम्भ से/g, 'From start'], [/आरम्भ पर लौटे/g, 'Back to the start'],
  [/(\d+) बार पूर्ण/g, 'completed $1×'], [/पाठ पूर्ण — (\d+) बार। नया पाठ आरम्भ।/g, 'Round complete ($1×). Starting a new round.'], [/पाठ (\d+)/g, 'round $1'],
  [/“अगला” से (\d+)वाँ पाठ आरम्भ होगा।/g, '“Next” starts round $1.'], [/॥ ग्रन्थ पूर्ण ॥ — आपने पूरा ग्रन्थ पढ़ लिया/g, '॥ Book complete ॥ — you have read it all'],
  [/बधाई! क्या एक और पाठ आरम्भ करें\?/g, 'Wonderful! Begin another round?'], [/(\d+)वाँ पाठ आरम्भ करें/g, 'Begin round $1'], [/नया पाठ आरम्भ — प्रगति शून्य से/g, 'New round — progress starts afresh'],
  [/इस ग्रन्थ की प्रगति मिटाएँ…/g, 'Reset progress for this book…'], [/पढ़े हुए अंशों के चिह्न और जगहें मिट जाएँगी। सहेजे वचन और मनन बने रहेंगे।/g, 'Read marks and places will be cleared. Saved vachan and reflections stay.'],
  [/हाँ, मिटाएँ/g, 'Yes, reset'], [/रहने दें/g, 'Cancel'], [/प्रगति मिटाई गई/g, 'Progress reset'], [/सुनना जारी — नियंत्रण दिखाएँ/g, 'Listening — show controls'], [/कॉपी हो गया/g, 'Copied'], [/कॉपी नहीं हो सका/g, "Couldn't copy"],
  [/इस ग्रन्थ के वचन →/g, 'Vachan from this book →'], [/एक-एक करके पढ़ें →/g, 'Read one by one →'], [/संग्रह में खोजें/g, 'Search saved'],
  [/और दिखाएँ · (\d+)/g, 'Show $1 more'], [/(\d+) उप-विषय/g, '$1 sub-topics'], [/इस विषय के सभी वचन/g, 'All vachan in this theme'],
  [/गति: /g, 'Speed: '], [/अति तेज़/g, 'Very fast'], [/सहज/g, 'Gentle'], [/सामान्य/g, 'Normal'], [/धीमी/g, 'Slow'], [/तेज़/g, 'Fast'],
  [/^भाग (\d+)/g, 'Part $1'], [/जिस सप्ताह में आप कम से कम 3 दिन पढ़ते हैं, वह सप्ताह गिना जाता है। ऐसे लगातार सप्ताह आपका क्रम हैं। एक-दो दिन छूट जाएँ तो क्रम नहीं टूटता।/g, 'A week counts when you read on at least 3 days. Consecutive such weeks are your streak. Missing a day or two does not break it.'],
  [/पिछले 8 सप्ताह · अभी: /g, 'Last 8 weeks · now: '], [/नया क्रम आरम्भ करें/g, 'start a new streak'],
  [/॥ आज का नियम पूर्ण हुआ ॥/g, "॥ Today's practice is complete ॥"], [/ऑनलाइन/g, 'online'], [/पुस्तक नहीं मिली/g, 'Book not found'],
];
const isEn = () => settings.lang === 'en';
function tr(s) {
  if (!isEn() || !/[ऀ-ॿ]/.test(s)) return s;
  const t = s.trim();
  if (EXACT[t]) return s.replace(t, EXACT[t]);
  return PHRASES.reduce((a, [re, r]) => a.replace(re, r), s);
}
function localize(root = document.body) {
  if (!isEn() || !root) return;
  const keep = n => n.parentElement && n.parentElement.closest('[lang="hi"], textarea, option, script, style');
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n => { if (!keep(n) && /[ऀ-ॿ]/.test(n.nodeValue)) n.nodeValue = tr(n.nodeValue); });
  $$('[placeholder], [aria-label], [title], [alt]', root).forEach(el => {
    if (el.closest('[lang="hi"]')) return;
    ['placeholder', 'aria-label', 'title', 'alt'].forEach(a => { const v = el.getAttribute(a); if (v) el.setAttribute(a, tr(v)); });
  });
}
const dateLocale = () => isEn() ? 'en-IN' : 'hi-IN';

/* ---------- UI bits ---------- */
let toastT;
function toast(msg, action) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(tr(msg))}</span>${action ? `<button>${esc(tr(action.label || 'वापस लें'))}</button>` : ''}`;
  t.hidden = false;
  if (action) t.querySelector('button').onclick = () => { t.hidden = true; action.fn(); };
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, action ? 5000 : 2600);
}
// remember a few keys, change them, offer to put them back
function withUndo(keys, change, msg) {
  const before = keys.map(k => [k, store.get(k, null)]);
  change();
  toast(msg, { fn: () => { before.forEach(([k, v]) => v == null ? (() => { try { localStorage.removeItem('sv:' + k); } catch { } })() : store.set(k, v)); route(); } });
}
function closeSheet() { const s = $('#sheet'); s.hidden = true; s.innerHTML = ''; }
function openSheet(html) {
  const s = $('#sheet');
  s.innerHTML = `<div class="sheet-bg" data-close></div><div class="sheet-card" role="dialog">${html}</div>`;
  s.hidden = false; localize(s);
  s.onclick = e => { if (e.target.closest('[data-close]')) closeSheet(); };
}

function openSettings() {
  const seg = (key, opts) => `<div class="seg">${opts.map(([v, l]) =>
    `<button data-k="${key}" data-v="${v}" class="${String(settings[key]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  openSheet(`
    <h3>पढ़ने की सुविधा</h3>
    <label lang="hi">भाषा · Language</label>${seg('lang', [['hi', 'हिन्दी'], ['en', 'English']])}
    <label>रंग</label>${seg('theme', [['sepia', 'पुराना काग़ज़'], ['light', 'उजला'], ['dark', 'रात्रि']])}
    <label>अक्षर</label>${seg('font', [['tiro', 'शास्त्रीय'], ['noto', 'आधुनिक']])}
    <label>अक्षर का आकार</label>${seg('size', SIZES.map((s, i) => [i, `<span style="font-size:${12 + i * 2.5}px">अ</span>`]))}
    <label>दैनिक नियम</label>${seg('goal', [[5, '5 मि.'], [10, '10 मि.'], [15, '15 मि.'], [20, '20 मि.'], [30, '30 मि.']])}
    <label>संकल्प — प्रतिदिन किस समय पढ़ेंगे?</label>
    <div class="row"><input type="time" id="stime" value="${settings.time || '06:30'}">
      <a class="btn" id="gcal" target="_blank" rel="noopener">Google कैलेंडर में</a><button class="btn" data-act="ics">अन्य कैलेंडर</button></div>
    <p class="hint" style="margin-top:6px">कैलेंडर रोज़ उसी समय याद दिला देगा।</p>
    <label>सुनने की गति</label>${seg('rate', RATES)}
    <label for="voice">आवाज़</label>
    <div class="row"><select id="voice">${voiceOptions()}</select><button class="btn" data-act="testvoice">सुनकर देखें</button></div>
    ${hiVoices().length ? '' : '<p class="hint" style="margin-top:6px">इस उपकरण पर हिन्दी आवाज़ नहीं मिली। फ़ोन की सेटिंग → भाषा → Text-to-speech में हिन्दी जोड़ें।</p>'}
    <p class="hint">आपकी प्रगति, सहेजे वचन और मनन इसी उपकरण में रहते हैं।</p>
    <div class="row"><button class="btn" data-act="export">संग्रह की प्रति लें</button><label class="btn">प्रति लौटाएँ<input type="file" accept="application/json" hidden data-act="import"></label></div>
    <button class="done" data-close>ठीक है</button>`);
  const card = $('#sheet .sheet-card');
  card.addEventListener('click', e => {
    const b = e.target.closest('button[data-k]');
    if (b) {
      const k = b.dataset.k; settings[k] = ['size', 'goal', 'rate'].includes(k) ? +b.dataset.v : b.dataset.v;
      $$(`button[data-k="${k}"]`, card).forEach(x => x.classList.toggle('on', x === b));
      applySettings();
      if (k === 'lang') { closeSheet(); route(); }
    }
    if (e.target.closest('[data-act=export]')) exportData();
  });
  $('input[data-act=import]', card).addEventListener('change', importData);
  $('#voice', card).addEventListener('change', e => { settings.voice = e.target.value; applySettings(); });
  $('[data-act=testvoice]', card).onclick = () => { const run = startTTS(); if (run) sayText('हरि ॐ। सत्संग से ही विवेक जागता है।', run, stopSpeak); };
  const st = $('#stime', card), gc = $('#gcal', card);
  const syncCal = () => { settings.time = st.value || '06:30'; applySettings(); gc.href = calLink('google'); };
  st.addEventListener('change', syncCal); gc.addEventListener('click', syncCal); gc.href = calLink('google');
  $('[data-act=ics]', card).onclick = () => { syncCal(); const a = document.createElement('a'); a.href = calLink('ics'); a.download = 'svadhyay.ics'; a.click(); };
}

function voiceOptions() {
  const vs = hiVoices();
  if (!vs.length) return '<option value="">उपकरण की आवाज़</option>';
  return vs.map(v => `<option value="${esc(v.name)}" ${v.name === (pickVoice() || {}).name ? 'selected' : ''}>${esc(v.name.replace(/Microsoft |Google |\(.*\)/g, '').trim() || v.name)}${v.localService ? '' : ' · ऑनलाइन'}</option>`).join('');
}
try { speechSynthesis.onvoiceschanged = () => { const s = $('#voice'); if (s) s.innerHTML = voiceOptions(); }; } catch { }

function exportData() {
  const data = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('sv:')) data[k] = localStorage.getItem(k); } } catch { }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
  a.download = `svadhyay-${today()}.json`; a.click();
}
async function importData(e) {
  const f = e.target.files[0]; if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    Object.entries(data).forEach(([k, v]) => { if (k.startsWith('sv:')) localStorage.setItem(k, v); });
    toast('प्रति लौट आई'); setTimeout(() => location.reload(), 800);
  } catch { toast('यह फ़ाइल पढ़ी नहीं जा सकी'); }
}

/* A daily calendar event is the simplest reminder: no server, no notification permission. */
function calLink(kind) {
  const [h, m] = (settings.time || '06:30').split(':').map(Number);
  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(h, m, 0, 0);
  const e = new Date(d.getTime() + settings.goal * 60000);
  const p2 = n => String(n).padStart(2, '0');
  const f = x => `${x.getFullYear()}${p2(x.getMonth() + 1)}${p2(x.getDate())}T${p2(x.getHours())}${p2(x.getMinutes())}00`;
  const title = `स्वाध्याय — ${settings.goal} मिनट`, url = location.href.split('#')[0];
  if (kind === 'google') return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title)
    + `&dates=${f(d)}/${f(e)}&recur=${encodeURIComponent('RRULE:FREQ=DAILY')}&details=${encodeURIComponent(url)}`;
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Svadhyay//HI', 'BEGIN:VEVENT', 'UID:svadhyay-daily@' + (location.hostname || 'local'),
    'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', 'DTSTART:' + f(d), 'DTEND:' + f(e), 'RRULE:FREQ=DAILY',
    'SUMMARY:' + title, 'DESCRIPTION:' + url, 'URL:' + url, 'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:' + title, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  return URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
}

/* पुनः स्मरण: one of your own saved passages, at least 3 days old, comes back each day (spaced recall). */
function resurfaceHtml() {
  const old = store.get('saved', []).filter(s => Date.now() - s.at > 3 * 864e5);
  if (!old.length) return '';
  const s = old[Math.floor(Date.now() / 864e5) % old.length], ago = Math.round((Date.now() - s.at) / 864e5);
  // recalling beats re-reading: show the opening words, let the reader try to complete it, then reveal
  const words = s.text.split(/\s+/), cue = words.slice(0, Math.min(5, Math.ceil(words.length / 3))).join(' ');
  const full = esc(s.text.length > 320 ? s.text.slice(0, 320) + '…' : s.text).replace(/\n/g, '<br>');
  return `<section class="card recall">
    <p class="label">पुनः स्मरण · ${hiNum(ago)} दिन पहले आपने सहेजा था</p>
    <p class="stext" lang="hi">${esc(cue)} …</p>
    <p class="muted small">आगे का वचन मन में दोहराइए, फिर देखिए।</p>
    <div class="row"><button class="btn" data-reveal>देखें</button></div>
    <div hidden data-full><p class="stext" lang="hi">${full}</p>
    <div class="row"><a class="btn" href="#/read/${s.slug}/${s.ui}/f/${encodeURIComponent(s.text.split('\n')[0].slice(0, 40))}">प्रसंग में पढ़ें</a></div></div>
  </section>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-reveal]'); if (!b) return;
  const card = b.closest('.recall'); $('[data-full]', card).hidden = false; b.closest('.row').remove();
  $$(':scope > .stext, :scope > .muted', card).forEach(x => x.remove());
});

/* Weekly streak: a week counts with 3+ reading days. Forgiving, yet still a streak (Silverman & Barasch 2023). */
function weekStreak(days) {
  const read = d => (days[dayKey(d)] || 0) > 0;
  const start = new Date(); start.setHours(12, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday
  const countWeek = mon => [...Array(7)].filter((_, i) => { const d = new Date(mon); d.setDate(d.getDate() + i); return read(d); }).length;
  const thisWeek = countWeek(start);
  let n = 0; const mon = new Date(start);
  for (;;) { mon.setDate(mon.getDate() - 7); if (countWeek(mon) >= 3) n++; else break; }
  if (thisWeek >= 3) n++;
  return { n, thisWeek };
}

/* ---------- views ---------- */
const HI_DAYS = ['र', 'सो', 'मं', 'बु', 'गु', 'शु', 'श'];
function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'ब्राह्म मुहूर्त' : h < 12 ? 'सुप्रभात' : h < 17 ? 'शुभ दिन' : h < 21 ? 'शुभ सन्ध्या' : 'शुभ रात्रि';
}

function practiceHtml() {
  const days = store.get('days', {}), goal = settings.goal * 60;
  const t = days[today()] || 0;
  const week = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d; });
  const dots = week.map(d => {
    const s = days[dayKey(d)] || 0, cls = s >= goal ? 'full' : s > 0 ? 'some' : '';
    return `<span class="dot ${cls}" title="${Math.round(s / 60)} मिनट"><i></i><small>${HI_DAYS[d.getDay()]}</small></span>`;
  }).join('');
  const weekCount = week.filter(d => (days[dayKey(d)] || 0) > 0).length;
  const total = Object.values(days).filter(s => s > 0).length;
  const pct = Math.min(100, Math.round(t / goal * 100));
  const msg = t >= goal ? 'आज का नियम पूर्ण। जितना और पढ़ें, प्रसाद है।'
    : t > 0 ? `आज ${hiNum(Math.ceil(t / 60))} मिनट हुए — ${hiNum(Math.ceil((goal - t) / 60))} मिनट और।`
      : `आज के ${hiNum(settings.goal)} मिनट अभी शेष हैं।`;
  return `<section class="card practice">
    <div class="ring" style="--p:${pct}"><span>${hiNum(Math.floor(t / 60))}<small>/${hiNum(settings.goal)}</small></span></div>
    <div class="pmain"><h3>आज का स्वाध्याय</h3><p>${msg}</p>
      <div class="week">${dots}</div>
      <p class="muted small">इस सप्ताह ${hiNum(weekCount)} दिन · अब तक कुल ${hiNum(total)} दिन</p>
      ${(() => { const w = weekStreak(days); return `<button class="link small streak ${w.n ? '' : 'none'}" data-streak>${w.n ? `लगातार ${hiNum(w.n)} सप्ताह` : 'सप्ताह-क्रम'} <span class="muted">· इस सप्ताह ${hiNum(Math.min(w.thisWeek, 3))}/${hiNum(3)} दिन${w.thisWeek >= 3 ? ' ✓' : ''} ⓘ</span></button>`; })()}
      ${settings.time ? `<p class="small">संकल्प: प्रतिदिन ${esc(settings.time)} बजे</p>` : '<button class="link small" data-settings>पढ़ने का एक समय तय करें →</button>'}</div>
  </section>`;
}

function topbar(extra = '') {
  return `<header class="top"><a href="#/" class="brand" lang="hi">स्वाध्याय</a><nav>${extra}
    <button class="ib" data-settings aria-label="सेटिंग" title="पढ़ने की सुविधा">${ICON.aa}</button></nav></header>`;
}
// Four places, always one thumb away: today, books, vachans, your collection.
function tabbar(active) {
  const t = [['home', '#/', ICON.home, 'आज'], ['library', '#/library', ICON.books, 'ग्रन्थ'], ['vachan', '#/vachan', ICON.quote, 'वचन'], ['saved', '#/saved', ICON.bookmark, 'संग्रह']];
  return `<nav class="tabs" aria-label="मुख्य">${t.map(([k, h, ic, l]) => `<a href="${h}" class="${k === active ? 'on' : ''}" ${k === active ? 'aria-current="page"' : ''}>${ic}<span>${l}</span></a>`).join('')}</nav>`;
}

const ICON = {
  bookmark: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  aa: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  list: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
  ear: '<svg viewBox="0 0 24 24"><path d="M4 10v4h4l5 4V6L8 10zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M12 3c2 2.6 3 4.6 3 6.2a3 3 0 0 1-6 0C9 7.6 10 5.6 12 3zM5 15h14c-.6 3.5-3.4 5.5-7 5.5S5.6 18.5 5 15z"/></svg>',
  books: '<svg viewBox="0 0 24 24"><path d="M4 4h4v16H4zM10 4h4v16h-4zM16 5l3.5-1 2.5 15.5-3.5 1z"/></svg>',
  quote: '<svg viewBox="0 0 24 24"><path d="M5 6h14v9H9l-4 4z"/><path d="M9 10h6"/></svg>',
};

async function viewHome() {
  await loadLibrary();
  const last = store.get('last', null);
  const cont = last && library.find(b => b.slug === last.slug);
  app.innerHTML = `${topbar()}
  <div class="wrap">
    <p class="greet">${greeting()} <span class="muted">· ${new Date().toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' })}</span></p>
    <section class="card vachan-card" id="daily"><p class="label">आज का वचन</p><p class="vtext muted">…</p></section>
    ${cont ? `<a class="card continue" href="#/read/${last.slug}/${last.ui}">
      <p class="label">जहाँ छोड़ा था</p><h3 lang="hi">${esc(last.title)}</h3>
      <p class="muted" lang="hi">${esc(cont.title)}</p>
      <div class="bar"><i style="width:${last.pct || 0}%"></i></div>
      <span class="go">पढ़ना जारी रखें →</span></a>` : ''}
    ${resurfaceHtml()}
    ${practiceHtml()}
    ${shelvesHtml()}
    <p class="foot muted" lang="hi">॥ हरि ॐ तत्सत् ॥</p>
  </div>${tabbar('home')}`;
  fillDaily();
}

/* ---------- the library: modular for 1, 5 or 50 books ---------- */
const metaOf = slug => library.find(b => b.slug === slug) || {};
const speakerOf = slug => { const m = metaOf(slug); return m.speaker || m.title || ''; };
const opened = () => store.get('opened', {});
function bookProgress(b) {
  const d = done(b.slug).size, n = store.get('units:' + b.slug, 0);
  return { d, n, pct: n ? Math.round(d / n * 100) : 0 };
}
function coverHtml(b, cls = '') {
  return `<div lang="hi" class="cover ${cls}" style="--bc:${b.color || '#8a3b12'}"><span class="om">ॐ</span><b>${esc(b.title)}</b></div>`;
}
function tileHtml(b) {
  const p = bookProgress(b);
  return `<a class="tile" href="#/book/${b.slug}">${coverHtml(b)}<b lang="hi">${esc(b.title)}</b>
    <small class="muted">${p.d ? `${hiNum(p.pct)}% पढ़ा` : `<span lang="hi">${esc(b.speaker || b.author || '')}</span>`}</small>
    ${p.d ? `<span class="bar"><i style="width:${p.pct}%"></i></span>` : ''}</a>`;
}
const catOf = b => { const c = b.category || 'अन्य'; return library.length > 4 && library.filter(x => (x.category || 'अन्य') === c).length < 2 ? 'अन्य' : c; };
const categories = () => { const c = [...new Set(library.map(catOf))]; return [...c.filter(x => x !== 'अन्य'), ...c.filter(x => x === 'अन्य')]; };
function shelvesHtml() {
  // up to 4 books: a calm list; more: “पढ़ रहे हैं” + one horizontal shelf per category
  if (library.length <= 4) return `<h2 class="shelf-h">ग्रन्थ</h2><div class="shelf">${library.map(b => {
    const p = bookProgress(b);
    return `<a class="book" href="#/book/${b.slug}">${coverHtml(b)}
      <div class="binfo"><b lang="hi">${esc(b.title)}</b><small lang="hi">${esc(b.author || '')}</small>
      <small class="muted">${p.d ? `${hiNum(p.d)} अंश पढ़े` : 'आरम्भ करें'}</small></div></a>`;
  }).join('')}</div>`;
  const op = opened();
  const reading = library.filter(b => op[b.slug]).sort((a, b) => op[b.slug] - op[a.slug]).slice(0, 10);
  const row = (title, list, more) => `<div class="shelf-row"><h2 class="shelf-h"><span ${title === 'पढ़ रहे हैं' ? '' : 'lang="hi"'}>${esc(title)}</span>${more ? ` <a href="${more}" class="more">सब देखें →</a>` : ''}</h2>
    <div class="hscroll">${list.map(tileHtml).join('')}</div></div>`;
  return (reading.length ? row('पढ़ रहे हैं', reading) : '')
    + categories().map(c => { const l = library.filter(b => catOf(b) === c); return row(c, l.slice(0, 10), `#/library/${encodeURIComponent(c)}`); }).join('');
}
async function viewLibrary(cat) {
  await loadLibrary();
  const cats = categories(), sants = [...new Set(library.map(b => b.speaker).filter(Boolean))];
  let f = { cat: cat || '', sant: '', q: '', sort: 'recent' };
  app.innerHTML = `${topbar()}
  <div class="wrap">
    <h1 class="pageh">ग्रन्थ <span class="muted small">${hiNum(library.length)}</span></h1>
    <input type="search" id="lq" class="lsearch" placeholder="नाम से खोजें" aria-label="ग्रन्थ खोजें">
    ${cats.length > 1 ? `<div class="chips" id="cchips"><button data-c="" class="on">सभी</button>${cats.map(c => `<button lang="hi" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : ''}
    ${sants.length > 1 ? `<div class="chips" id="schips"><button data-s="" class="on">सभी सन्त</button>${sants.map(s => `<button lang="hi" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}
    <div class="chips sm"><button data-o="recent" class="on">हाल में खोले</button><button data-o="az">अ–ज्ञ</button><button data-o="progress">प्रगति</button></div>
    <div class="grid" id="lgrid"></div>
  </div>${tabbar('library')}`;
  const op = opened();
  const draw = () => {
    let l = library.filter(b => (!f.cat || catOf(b) === f.cat) && (!f.sant || b.speaker === f.sant)
      && (!f.q || (b.title + ' ' + (b.author || '') + ' ' + (b.speaker || '')).includes(f.q)));
    if (f.sort === 'az') l = [...l].sort((a, b) => a.title.localeCompare(b.title, 'hi'));
    if (f.sort === 'recent') l = [...l].sort((a, b) => (op[b.slug] || 0) - (op[a.slug] || 0));
    if (f.sort === 'progress') l = [...l].sort((a, b) => bookProgress(b).pct - bookProgress(a).pct);
    $('#lgrid').innerHTML = l.length ? l.map(tileHtml).join('') : '<p class="muted">कोई ग्रन्थ नहीं मिला।</p>';
    localize($('#lgrid'));
  };
  const chipset = (sel, key, attr) => { const box = $(sel); if (!box) return; box.onclick = e => { const b = e.target.closest('button'); if (!b) return; f[key] = b.dataset[attr]; $$('button', box).forEach(x => x.classList.toggle('on', x === b)); draw(); }; };
  chipset('#cchips', 'cat', 'c'); chipset('#schips', 'sant', 's'); chipset('.chips.sm', 'sort', 'o');
  if (cat) $$('#cchips button').forEach(x => x.classList.toggle('on', x.dataset.c === cat));
  $('#lq').oninput = e => { f.q = e.target.value.trim(); draw(); };
  draw();
}

/* ---------- वचन: small curated files per book; fall back to numbered vachans in the book ---------- */
const vcache = {};
async function loadVachans(slug) {
  if (vcache[slug]) return vcache[slug];
  const m = metaOf(slug);
  let list;
  if (m.vachans) {
    const r = await fetch('books/' + m.vachans).catch(() => null);
    if (r && r.ok) list = parseVachans(await r.text(), slug);
  }
  if (!list || !list.length) {   // no vachan file (or it could not be loaded): use the book's numbered vachans
    const bk = await loadBook(slug); list = bk.vachans.map(v => ({ slug, text: v.text, tags: [bk.units[v.ui].title], ui: v.ui })); }
  return (vcache[slug] = list);
}
let THEMES = null;
async function loadThemes() {
  if (THEMES) return THEMES;
  try { THEMES = await (await fetch('books/themes.json')).json(); } catch { THEMES = []; }
  return THEMES;
}
async function allVachans() {
  await loadLibrary(); await loadThemes();
  const lists = await Promise.all(library.map(b => loadVachans(b.slug).catch(() => [])));
  return lists.flat();
}
const ctxLink = v => v.ui != null
  ? `#/read/${v.slug}/${v.ui}/f/${encodeURIComponent(v.text.split('\n')[0].slice(0, 40))}`
  : `#/find/${v.slug}/${encodeURIComponent(v.text.split('\n')[0].slice(0, 40))}${v.ch ? '/' + encodeURIComponent(v.ch) : ''}`;

async function fillDaily() {
  const all = await allVachans();
  const el = $('#daily'); if (!el) return;
  if (!all.length) { el.hidden = true; return; }
  const day = Math.floor(Date.now() / 864e5 - new Date().getTimezoneOffset() / 1440);
  const v = all[(day * 7919 + 13) % all.length];
  el.innerHTML = `<p class="label">आज का वचन</p>
    <blockquote class="vtext" lang="hi">${esc(v.text).replace(/\n/g, '<br>')}</blockquote>
    <p class="vsrc" lang="hi">— ${esc(speakerOf(v.slug))} <span class="muted">${v.tags[0] ? '· ' + esc(v.tags[0]) : ''}</span></p>
    <div class="row"><a class="btn" href="${ctxLink(v)}">प्रसंग में पढ़ें</a>
    <button class="btn" data-save-daily>सहेजें</button><button class="btn" data-img-daily>चित्र भेजें</button>
    <a class="btn ghost" href="#/vachan">और वचन →</a></div>`;
  const sb = $('[data-save-daily]', el), lab = () => { sb.textContent = tr(isSaved(v.text) ? '✓ सहेजा' : 'सहेजें'); sb.classList.toggle('on', isSaved(v.text)); };
  sb.onclick = () => { saveItem({ slug: v.slug, ui: v.ui, text: v.text, where: v.tags[0] || '' }); lab(); }; lab();
  $('[data-img-daily]', el).onclick = () => shareImage(v.text, speakerOf(v.slug));
  localize(el);
}

/* Collections of vachans = micro-books: each remembers where you stopped and how far you have come. */
function seededOrder(n) {
  let seed = store.get('vseed', 0); if (!seed) { seed = 1 + Math.floor(Math.random() * 1e9); store.set('vseed', seed); }
  const a = [...Array(n).keys()];
  let s = seed; const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Decks: all · shuffled · per book · per broad theme (books/themes.json) with its sub-topics.
// Themes are shared by every book, so new books fill the same themes instead of adding new ones.
function buildDecks(all) {
  const decks = [{ id: 'all', title: 'सभी वचन', items: all }, { id: 'mix', title: 'बिना क्रम', items: seededOrder(all.length).map(i => all[i]) }];
  library.forEach(b => {
    const items = all.filter(v => v.slug === b.slug);
    if (items.length) decks.push({ id: 'b:' + b.slug, group: 'ग्रन्थ अनुसार', title: b.title, items });
  });
  const byTag = {}, used = new Set();
  all.forEach(v => v.tags.forEach(t => (byTag[t] = byTag[t] || []).push(v)));
  const sub = t => ({ id: 't:' + t, title: t, items: byTag[t] });
  (THEMES || []).forEach(th => {
    // sub-topics with very few vachan stay inside the theme instead of cluttering the list
    th.topics.forEach(t => used.add(t));
    const subs = th.topics.filter(t => byTag[t] && byTag[t].length >= 5).map(sub);
    if (!th.topics.some(t => byTag[t])) return;
    decks.push({ id: 'th:' + th.theme, group: 'विषय अनुसार', title: th.theme, items: all.filter(v => v.tags.some(t => th.topics.includes(t))), subs });
  });
  const rest = Object.keys(byTag).filter(t => !used.has(t)).sort((x, y) => byTag[y].length - byTag[x].length);
  if (rest.length) decks.push({ id: 'th:अन्य', group: 'विषय अनुसार', title: (THEMES || []).length ? 'अन्य' : 'सभी विषय', items: all.filter(v => v.tags.some(t => rest.includes(t))), subs: rest.map(sub) });
  return decks;
}
function findDeck(all, id) {
  if (id === 'saved') return { id, title: 'सहेजे वचन', back: '#/saved', items: store.get('saved', []).map(x => ({ slug: x.slug, ui: x.ui, text: x.text, tags: x.where ? [x.where] : [] })) };
  for (const d of buildDecks(all)) { if (d.id === id) return d; const s = (d.subs || []).find(x => x.id === id); if (s) return s; }
  return null;
}
const vpos = (id, set) => { const p = store.get('vpos', {}); if (set) { p[id] = { ...(p[id] || {}), ...set }; store.set('vpos', p); } return { i: 0, max: -1, rounds: 0, ...(p[id] || {}) }; };
const roundTxt = n => n ? ` · ${hiNum(n)} बार पूर्ण` : '';

async function viewVachanHome() {
  const all = await allVachans(), decks = buildDecks(all);
  let group = null;
  const meta = d => {
    const p = vpos(d.id), seen = Math.min(d.items.length, p.max + 1);
    return { seen, pct: Math.round(seen / d.items.length * 100), txt: `${hiNum(d.items.length)} वचन${seen ? ` · ${seen >= d.items.length ? 'पूर्ण ✓' : hiNum(seen) + ' पढ़े'}` : ''}${roundTxt(p.rounds)}` };
  };
  const row = (d, cls = '', title = d.title, hi = true) => { const m = meta(d);
    return `<a class="deck-row ${cls}" href="#/deck/${encodeURIComponent(d.id)}"><span><b ${hi ? 'lang="hi"' : ''}>${esc(title)}</b><small class="muted">${m.txt}</small></span>
      ${m.seen ? `<span class="bar"><i style="width:${m.pct}%"></i></span>` : '<span class="go">→</span>'}</a>`; };
  const theme = d => { const m = meta(d);
    return `<details class="theme"><summary class="deck-row"><span><b lang="hi">${esc(d.title)}</b><small class="muted">${m.txt} · ${hiNum(d.subs.length)} उप-विषय</small></span><span class="chev">⌄</span></summary>
      ${row(d, 'sub', 'इस विषय के सभी वचन', false)}${d.subs.map(x => row(x, 'sub')).join('')}</details>`; };
  app.innerHTML = `${topbar()}
  <div class="wrap">
    <h1 class="pageh">वचनामृत</h1>
    <p class="muted">एक-एक वचन, धीरे-धीरे। हर संग्रह याद रखता है कि आप कहाँ रुके थे।</p>
    <div class="deck-top">${decks.slice(0, 2).map(d => {
      const p = vpos(d.id);
      return `<a class="card deck-card" href="#/deck/${d.id}"><b>${esc(d.title)}</b><small class="muted">${hiNum(d.items.length)} वचन${p.max >= 0 ? ` · ${hiNum(p.i + 1)} पर रुके` : ''}</small></a>`;
    }).join('')}</div>
    ${decks.slice(2).map(d => { const h = d.group !== group ? `<h2 class="shelf-h">${esc(d.group)}</h2>` : ''; group = d.group; return h + (d.subs ? theme(d) : row(d)); }).join('')}
  </div>${tabbar('vachan')}`;
}

async function viewDeck(id) {
  const all = await allVachans(), d = findDeck(all, id);
  if (!d || !d.items.length) { location.hash = id === 'saved' ? '#/saved' : '#/vachan'; return; }
  onReader = true;
  let { i, max } = vpos(id); i = Math.min(i, d.items.length - 1);
  app.innerHTML = `
  <header class="rbar"><a href="${d.back || '#/vachan'}" class="ib" aria-label="वापस">${ICON.back}</a>
    <span class="rtitle" ${/^(b|t|th):/.test(id) ? 'lang="hi"' : ''}>${esc(d.title)}</span>
    <button class="ib" data-settings aria-label="पढ़ने की सुविधा">${ICON.aa}</button></header>
  <div class="deck" id="deck">
    <div class="deck-meta"><span id="dcount"></span><span class="bar"><i id="dbar"></i></span><button class="link small" data-restart>आरम्भ से</button></div>
    <div id="dcard"></div>
    <div class="row center-row" id="dact">
      <button class="btn" data-a="save">सहेजें</button><button class="btn" data-deck-listen>सुनें</button>
      <button class="btn" data-a="img">चित्र</button><a class="btn" id="dctx">प्रसंग</a></div>
    <nav class="deck-nav"><button class="btn" data-go="-1">← पिछला</button><button class="btn primary" data-go="1">अगला →</button></nav>
  </div>`;
  const draw = () => {
    const v = d.items[i];
    max = Math.max(max, i); vpos(id, { i, max });
    const r = vpos(id).rounds; $('#dcount').textContent = `${hiNum(i + 1)} / ${hiNum(d.items.length)}${r ? ` · पाठ ${hiNum(r + 1)}` : ''}`;
    $('#dbar').style.width = ((max + 1) / d.items.length * 100) + '%';
    $('#dcard').innerHTML = `<blockquote class="vcard" lang="hi">${esc(v.text).replace(/\n/g, '<br>')}</blockquote>
      <p class="vsrc center" lang="hi">— ${esc(speakerOf(v.slug))}${v.tags[0] ? ` <span class="muted">· ${esc(v.tags[0])}</span>` : ''}</p>
      ${i === d.items.length - 1 ? `<p class="center muted">॥ इस संग्रह का अन्तिम वचन ॥</p><p class="center small">“अगला” से ${hiNum(vpos(id).rounds + 2)}वाँ पाठ आरम्भ होगा।</p>` : ''}`;
    $('#dctx').href = ctxLink(v);
    const sb = $('[data-a="save"]', $('#deck')); sb.textContent = isSaved(v.text) ? '✓ सहेजा' : 'सहेजें'; sb.classList.toggle('on', isSaved(v.text));
    $('[data-go="-1"]').disabled = i === 0;
    $('[data-go="1"]').textContent = i === d.items.length - 1 ? 'फिर आरम्भ से ↺' : 'अगला →';
    localize($('#deck'));
  };
  const go = step => {
    if (i + step >= d.items.length) { vpos(id, { rounds: vpos(id).rounds + 1, max: -1 }); max = -1; i = 0; toast(`पाठ पूर्ण — ${hiNum(vpos(id).rounds)} बार। नया पाठ आरम्भ।`); }
    else i = Math.max(0, i + step);
    draw(); window.scrollTo(0, 0);
    if (tts.on) listen();
  };
  // continuous listening: read a vachan, pause, move on
  const listen = () => {
    const run = startTTS(); if (!run) return;
    $('[data-deck-listen]').classList.add('on');
    sayText(d.items[i].text, run, () => setTimeout(() => { if (tts.on && run === tts.n && i < d.items.length - 1) { i++; draw(); listen(); } else stopSpeak(); }, 1400));
  };
  $('#deck').onclick = e => {
    const g = e.target.closest('[data-go]'); if (g) return go(+g.dataset.go);
    if (e.target.closest('[data-restart]')) { const prev = { i, max }; i = 0; draw(); return toast('आरम्भ पर लौटे', { fn: () => { i = prev.i; max = prev.max; vpos(id, prev); draw(); } }); }
    if (e.target.closest('[data-deck-listen]')) return tts.on ? stopSpeak() : listen();
    const a = e.target.closest('[data-a]'); if (!a) return;
    const v = d.items[i];
    if (a.dataset.a === 'save') { saveItem({ slug: v.slug, ui: v.ui, text: v.text, where: v.tags[0] || '' }); draw(); }
    if (a.dataset.a === 'img') shareImage(v.text, speakerOf(v.slug));
  };
  let x0 = null;
  $('#deck').addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  $('#deck').addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); });
  deckKeys = go;
  draw();
}
let deckKeys = null;

/* #/find/slug/snippet[/chapter] — open the passage a vachan came from */
async function viewFind(slug, snip, ch) {
  const bk = await loadBook(slug), q = plain(snip).slice(0, 30);
  let ui = bk.units.findIndex(u => plain(u.md).includes(q) || plain(u.raw || u.title).includes(q));
  if (ui < 0 && ch) ui = bk.units.findIndex(u => u.title === ch);
  location.replace(ui < 0 ? `#/book/${slug}` : `#/read/${slug}/${ui}/f/${encodeURIComponent(q)}`);
}

/* #/check/slug — a quality report for a newly added book */
async function viewCheck(slug) {
  const bk = await loadBook(slug), m = bk.meta, warn = [], ok = [];
  const refs = new Set(), links = new Set();
  bk.units.forEach(u => { for (const x of ((u.raw || '') + '\n' + u.md).matchAll(/\[\^([^\]\s]+)\](?!:)/g)) refs.add(x[1]); for (const x of u.md.matchAll(/\]\(#([^)]+)\)/g)) links.add(x[1]); });
  const missingFn = [...refs].filter(r => !bk.fns[r]), unusedFn = Object.keys(bk.fns).filter(f => !refs.has(f));
  const brokenLinks = [...links].filter(l => bk.anchors[l] == null);
  const w = bk.units.map(u => u.words), long = Math.max(...w), short = Math.min(...w);
  ok.push(`${hiNum(bk.units.length)} अंश, ${hiNum(bk.words)} शब्द (≈ ${hiNum(Math.round(bk.words / WPM / 60))} घण्टे)`);
  ok.push(`सबसे लम्बा अंश ${hiNum(mins(long))} मि., सबसे छोटा ${hiNum(mins(short))} मि.`);
  ok.push(`पाद-टिप्पणियाँ ${hiNum(Object.keys(bk.fns).length)}, आन्तरिक कड़ियाँ ${hiNum(links.size)}`);
  if (bk.units.length < 3) warn.push('बहुत कम अंश बने — क्या # और ## शीर्षक ठीक लगे हैं?');
  if (missingFn.length) warn.push(`इन टिप्पणियों का पाठ नहीं मिला: ${missingFn.slice(0, 20).join(', ')}`);
  if (unusedFn.length) warn.push(`ये टिप्पणियाँ कहीं प्रयुक्त नहीं: ${unusedFn.slice(0, 20).join(', ')}`);
  if (brokenLinks.length) warn.push(`ये कड़ियाँ टूटी हैं: ${brokenLinks.slice(0, 20).join(', ')}`);
  if (short < 40) warn.push(`कुछ अंश बहुत छोटे हैं: ${bk.units.filter(u => u.words < 40).map(u => u.title).slice(0, 8).join(', ')}`);
  const vs = await loadVachans(slug);
  if (m.vachans) {
    const text = plain(bk.units.map(u => (u.raw || u.title) + '\n' + u.md).join('\n'));
    const lost = vs.filter(v => !v.ch && !text.includes(plain(v.text.split('\n')[0]).slice(0, 30)));
    ok.push(`वचन-फ़ाइल: ${hiNum(vs.length)} वचन, ${hiNum(new Set(vs.flatMap(v => v.tags)).size)} विषय`);
    if (lost.length) warn.push(`${hiNum(lost.length)} वचन ग्रन्थ में अक्षरशः नहीं मिले (“प्रसंग” नहीं खुलेगा): ${lost.slice(0, 3).map(v => '“' + v.text.slice(0, 30) + '…”').join(' ')}`);
    if (vs.some(v => !v.tags.length)) warn.push(`${hiNum(vs.filter(v => !v.tags.length).length)} वचनों पर कोई विषय नहीं।`);
  } else warn.push(`वचन-फ़ाइल नहीं है; ग्रन्थ के क्रमांकित वचनों से ${hiNum(vs.length)} वचन अपने-आप लिए गए।`);
  ['title', 'author', 'speaker', 'category'].forEach(k => { if (!m[k]) warn.push(`books.json में “${k}” खाली है।`); });
  app.innerHTML = `${topbar()}<div class="wrap"><h1 class="pageh">जाँच: ${esc(m.title)}</h1>
    <ul class="check ok">${ok.map(x => `<li>✓ ${esc(x)}</li>`).join('')}</ul>
    ${warn.length ? `<h2 class="shelf-h">ध्यान दें</h2><ul class="check warn">${warn.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p>सब ठीक है।</p>'}
    <h2 class="shelf-h">अंश</h2><ol class="toc small">${bk.units.map((u, i) => `<li><a href="#/read/${slug}/${i}"><span>${esc(u.part ? u.part + ' › ' : '')}${esc(u.title)}${u.pieces ? ` ${u.piece}/${u.pieces}` : ''}</span><small>${hiNum(mins(u.words))} मि.</small></a></li>`).join('')}</ol>
  </div>`;
}

async function viewBook(slug) {
  const bk = await loadBook(slug), d = done(slug), m = bk.meta;
  const last = store.get('last', null);
  const resume = last && last.slug === slug ? last.ui : 0;
  const pct = Math.round(d.size / bk.units.length * 100);
  const pos = store.get('pos', {}), part = k => d.has(k) ? 1 : Math.min(.97, pos[posKey(slug, k)] || 0);
  const fill = f => f > .02 && f < 1 ? `<i class="tfill" style="width:${Math.round(f * 100)}%"></i>` : '';
  const rounds = store.get('rounds:' + slug, 0), complete = d.size >= bk.units.length;
  let curPart, rows = '';
  bk.units.forEach((u, i) => {
    if (u.part !== curPart) { curPart = u.part; if (u.part) rows += `<li class="part" lang="hi">${esc(u.part)}</li>`; }
    const cls = `${d.has(i) ? 'read' : ''} ${i === resume && last ? 'here' : ''}`;
    if (u.items) {   // a sitting made of many short pieces: fold its list of pieces
      const f = part(i);
      rows += `<li class="chap"><details${i === resume && last ? ' open' : ''}><summary class="${cls}"><span lang="hi">${esc(u.title)}</span><small>${d.has(i) ? '✓' : hiNum(mins(u.words)) + ' मि.'} <span class="chev">⌄</span></small>${fill(f)}</summary>
        <ol>${u.items.map(x => `<li class="sub"><a href="#/read/${slug}/${i}/f/${encodeURIComponent(plain(x.title).slice(0, 40))}"><span lang="hi">${esc(plain(x.title))}</span></a></li>`).join('')}</ol>
        <a class="sub-open" href="#/read/${slug}/${i}">${d.has(i) ? 'फिर पढ़ें' : 'यह अंश पढ़ें'} →</a></details></li>`;
      return;
    }
    if (!u.pieces) { rows += `<li><a href="#/read/${slug}/${i}" class="${cls}"><span lang="hi">${esc(u.title)}</span><small>${d.has(i) ? '✓' : hiNum(mins(u.words)) + ' मि.'}</small>${fill(part(i))}</a></li>`; return; }
    if (u.piece === 1) {
      const sibs = bk.units.slice(i, i + u.pieces), nd = sibs.filter((_, k) => d.has(i + k)).length, w = sibs.reduce((a, x) => a + x.words, 0);
      const pf = sibs.reduce((a, _, k) => a + part(i + k), 0) / u.pieces;
      rows += `<li class="chap"><a href="#/read/${slug}/${i}" class="${nd === u.pieces ? 'read' : ''}"><span lang="hi">${esc(u.title)}</span><small>${nd === u.pieces ? '✓' : nd ? `${hiNum(nd)}/${hiNum(u.pieces)}` : hiNum(mins(w)) + ' मि.'}</small>${fill(pf)}</a></li>`;
    }
    rows += `<li class="sub"><a href="#/read/${slug}/${i}" class="${cls}"><span>भाग ${hiNum(u.piece)}${u.ctx ? ` <small lang="hi">· ${esc(u.ctx)}</small>` : ''}</span><small>${d.has(i) ? '✓' : hiNum(mins(u.words)) + ' मि.'}</small>${fill(part(i))}</a></li>`;
  });
  app.innerHTML = `${topbar()}
  <div class="wrap">
    <header class="bookhead" style="--bc:${m.color || '#8a3b12'}">
      <div class="cover big"><span class="om">ॐ</span><b>${esc(m.title)}</b></div>
      <div><h1 lang="hi">${esc(m.title)}</h1><p class="muted" lang="hi">${esc(m.author || '')}</p><p lang="hi">${esc(m.about || '')}</p>
      <p class="muted small">${hiNum(bk.units.length)} अंश · लगभग ${hiNum(Math.round(bk.words / WPM / 60))} घण्टे का पाठ</p>
      <div class="bar"><i style="width:${pct}%"></i></div><p class="muted small">${hiNum(pct)}% पढ़ा${rounds ? ` · ${hiNum(rounds)} बार पूर्ण` : ''}</p>
      ${complete ? `<div class="done-card"><b>॥ ग्रन्थ पूर्ण ॥</b><span>बधाई! क्या एक और पाठ आरम्भ करें?</span><button class="btn primary" data-round>${hiNum(rounds + 2)}वाँ पाठ आरम्भ करें</button></div>` : ''}
      <div class="row"><a class="btn primary" href="#/read/${slug}/${resume}">${last && last.slug === slug ? 'पढ़ना जारी रखें' : 'पढ़ना आरम्भ करें'}</a>
      <a class="btn" href="#/deck/b:${slug}">इस ग्रन्थ के वचन →</a></div></div>
    </header>
    <form class="search" id="sform"><input type="search" placeholder="ग्रन्थ में खोजें — जैसे ‘नाम-जप’" id="q" aria-label="खोजें"></form>
    <div id="results"></div>
    <h2 class="shelf-h">अनुक्रम</h2>
    <ol class="toc">${rows}</ol>
    <div class="reset-zone">${d.size || Object.keys(pos).some(k => k.startsWith(slug + ':')) ? `<button class="link small" data-reset>इस ग्रन्थ की प्रगति मिटाएँ…</button>` : ''}</div>
  </div>${tabbar('library')}`;
  const clearBook = () => {
    store.set('done:' + slug, []);
    const ps = store.get('pos', {}); Object.keys(ps).forEach(k => { if (k.startsWith(slug + ':')) delete ps[k]; }); store.set('pos', ps);
    const l = store.get('last', null); if (l && l.slug === slug) store.set('last', { ...l, ui: 0, pct: 0, title: bk.units[0].title });
  };
  app.onclick = e => {
    if (e.target.closest('[data-round]')) return withUndo(['done:' + slug, 'pos', 'last', 'rounds:' + slug], () => { store.set('rounds:' + slug, rounds + 1); clearBook(); }, 'नया पाठ आरम्भ — प्रगति शून्य से');
    if (e.target.closest('[data-reset]')) {
      $('.reset-zone').innerHTML = `<p class="small">पढ़े हुए अंशों के चिह्न और जगहें मिट जाएँगी। सहेजे वचन और मनन बने रहेंगे।</p>
        <div class="row"><button class="btn" data-reset-yes>हाँ, मिटाएँ</button><button class="btn ghost" data-reset-no>रहने दें</button></div>`; localize($('.reset-zone')); $('.reset-zone').scrollIntoView({ block: 'center', behavior: 'smooth' }); return;
    }
    if (e.target.closest('[data-reset-no]')) return route();
    if (e.target.closest('[data-reset-yes]')) return withUndo(['done:' + slug, 'pos', 'last'], () => { clearBook(); route(); }, 'प्रगति मिटाई गई');
  };
  $('#sform').onsubmit = e => { e.preventDefault(); search(bk, $('#q').value.trim()); };
  const here = $('.toc .here'); if (here) here.scrollIntoView({ block: 'center' });
  scrollTo(0, 0);
}

function search(bk, q) {
  const box = $('#results');
  if (q.length < 2) { box.innerHTML = ''; return; }
  const res = [];
  bk.units.forEach((u, ui) => {
    for (const block of u.md.split(/\n\s*\n/)) {
      const t = plain(block), at = t.indexOf(q);
      if (at < 0) continue;
      res.push({ ui, title: u.title, snip: (at > 50 ? '…' : '') + t.slice(Math.max(0, at - 50), at + q.length + 70) + '…' });
      if (res.length >= 60) break;
    }
  });
  box.innerHTML = `<p class="muted small">${res.length ? hiNum(res.length) + (res.length >= 60 ? '+' : '') + ' स्थान' : 'कुछ नहीं मिला'}</p>
    <ul class="results">${res.map(r => `<li><a href="#/read/${bk.meta.slug}/${r.ui}/f/${encodeURIComponent(q)}">
    <small lang="hi">${esc(r.title)}</small><span lang="hi">${esc(r.snip).split(esc(q)).join(`<mark>${esc(q)}</mark>`)}</span></a></li>`).join('')}</ul>`;
  localize(box);
}

let saveTimer;
async function viewReader(slug, ui, mode, target) {
  const bk = await loadBook(slug);
  ui = Math.max(0, Math.min(bk.units.length - 1, ui | 0));
  const u = bk.units[ui], next = bk.units[ui + 1], prev = bk.units[ui - 1];
  const notes = store.get('notes', {}), nk = posKey(slug, ui);
  onReader = true;
  const op = opened(); op[slug] = Date.now(); store.set('opened', op);
  app.innerHTML = `
  <header class="rbar"><a href="#/book/${slug}" class="ib" aria-label="अनुक्रम">${ICON.back}</a>
    <span class="rtitle" lang="hi">${esc(u.title)}</span>
    <button class="ib" data-listen aria-label="सुनें" title="सुनें">${ICON.ear}</button>
    <button class="ib" data-settings aria-label="पढ़ने की सुविधा">${ICON.aa}</button></header>
  <div class="rprog"><i></i></div>
  <article class="chapter" id="chapter">
    ${u.intro ? `<div class="part-intro" lang="hi"><h2>${esc(u.intro.title)}</h2>${renderMd(u.intro.md)}</div>` : ''}
    <header class="chead">
      ${u.part || u.num ? `<p class="kicker" lang="hi">${esc([u.part, u.num].filter(Boolean).join(' · '))}</p>` : ''}
      <h1 lang="hi">${u.raw && /\[\^/.test(u.raw) ? inline(u.raw) : esc(u.title)}</h1>
      <p class="muted small">${u.pieces ? `भाग ${hiNum(u.piece)} / ${hiNum(u.pieces)} · ` : ''}लगभग ${hiNum(mins(u.words))} मिनट</p>
    </header>
    ${u.ctx ? `<p class="ctx"><span lang="hi">${esc(u.ctx)}</span> <span>(आगे)</span></p>` : ''}
    <div class="body" lang="hi">${renderMd(u.md)}</div>
  </article>
  <section class="end" id="end">
    <p class="orn">❀ ❀ ❀</p>
    <div class="manan"><h3>मनन</h3><p class="muted">इस अंश की कौन-सी एक बात आज मन में रखेंगे?</p>
      <textarea id="note" rows="3" placeholder="एक पंक्ति लिखें…">${esc(notes[nk]?.t || '')}</textarea>
      <small class="muted" id="nsaved">${notes[nk] ? 'सहेजा हुआ' : 'लिखते ही सहेज लिया जाता है'}</small></div>
    ${next ? `<a class="card nextcard" href="#/read/${slug}/${ui + 1}"><small class="muted">आगे</small>
      <b lang="hi">${esc(next.title)}${next.pieces ? ` · ${hiNum(next.piece)}/${hiNum(next.pieces)}` : ''}</b>
      <small class="muted">लगभग ${hiNum(mins(next.words))} मिनट</small></a>`
      : `<p class="center">॥ इति ॥<br><span class="muted">ग्रन्थ पूर्ण हुआ।</span></p>`}
    <nav class="pn">${prev ? `<a href="#/read/${slug}/${ui - 1}">← पिछला</a>` : '<span></span>'}<a href="#/book/${slug}">अनुक्रम</a></nav>
  </section>`;

  const d = done(slug);
  const updateLast = pct => store.set('last', { slug, ui, title: u.title + (u.pieces ? ` · ${u.piece}/${u.pieces}` : ''), pct });
  updateLast(Math.round(d.size / bk.units.length * 100));

  // note autosave
  $('#note').addEventListener('input', e => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const n = store.get('notes', {}), t = e.target.value.trim();
      if (t) n[nk] = { t, at: Date.now(), title: u.title, slug }; else delete n[nk];
      store.set('notes', n); $('#nsaved').textContent = t ? 'सहेजा गया ✓' : '';
    }, 500);
  });

  // where to land: an anchor, a found passage, or where you left off
  const pos = store.get('pos', {});
  requestAnimationFrame(() => {
    let el = null;
    if (mode === 'a') el = document.getElementById(target);
    if (mode === 'f') el = findBlock(target);
    if (el) { el = el.closest('p,li,blockquote,h3') || el; el.scrollIntoView({ block: 'center' }); flash(el); }
    else { const r = pos[nk] || 0; scrollTo(0, r * (document.documentElement.scrollHeight - innerHeight)); }
  });
  markSaved();

  // progress bar, position memory, completion
  const bar = $('.rprog i'), rbar = $('.rbar');
  let ticking = false, lastY = scrollY;
  window.onscroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      const r = max > 0 ? Math.min(1, scrollY / max) : 1;
      bar.style.width = (r * 100) + '%';
      // the bar steps aside while reading down, returns on the slightest scroll up
      if (Math.abs(scrollY - lastY) > 6) { rbar.classList.toggle('away', scrollY > lastY && scrollY > 120); lastY = scrollY; }
      const p = store.get('pos', {}); p[nk] = +r.toFixed(4); store.set('pos', p);
    });
  };
  new IntersectionObserver((ents, obs) => {
    if (ents.some(e => e.isIntersecting)) {
      const was = done(slug).size; markDone(slug, ui); obs.disconnect(); const now = done(slug).size;
      updateLast(Math.round(now / bk.units.length * 100));
      if (now === bk.units.length && was < now) toast('॥ ग्रन्थ पूर्ण ॥ — आपने पूरा ग्रन्थ पढ़ लिया', { label: 'देखें', fn: () => { location.hash = '#/book/' + slug; } });
    }
  }).observe($('#end .manan'));

  // footnotes, cross references, passage actions
  $('#chapter').addEventListener('click', e => {
    const fn = e.target.closest('a[data-fn]');
    if (fn) { e.preventDefault(); const t = bk.fns[fn.dataset.fn]; openSheet(`<p class="label">टिप्पणी ${esc(fn.dataset.fn)}</p><div class="fntext" lang="hi">${t ? renderMd(t) : '—'}</div><button class="done" data-close>ठीक है</button>`); return; }
    const an = e.target.closest('a[data-anchor]');
    if (an) {
      e.preventDefault(); const id = an.dataset.anchor, to = bk.anchors[id];
      if (to === ui) { const el = document.getElementById(id); el.scrollIntoView({ block: 'center' }); flash(el.closest('p') || el); }
      else if (to != null) location.hash = `#/read/${slug}/${to}/a/${encodeURIComponent(id)}`;
      return;
    }
    if (e.target.closest('a')) return;
    if (getSelection().toString().length > 1) return;
    const blk = e.target.closest('.body p, .body li, .body blockquote, .part-intro p');
    if (blk && !blk.classList.contains('orn')) showActions(blk, { slug, ui, where: u.title });
  });
  $('[data-listen]').onclick = () => {
    if (tts.on) return stopSpeak();
    listenUnit(slug, ui, readables().find(el => el.getBoundingClientRect().bottom > 80));
  };
  // listening carried over from the previous sitting continues here
  if (tts.carry && tts.carry.slug === slug) { tts.carry = null; listenUnit(slug, ui, readables()[0], true); }
}

/* ---------- सुनें: listening ----------
   Two sources, one control:
   • recorded audio files (books.json "audio"): true background play with the screen off, lock-screen controls.
   • the device's own Hindi voice: works for every book at once; a silent audio loop + Media Session keep it going
     with the screen off where the phone allows it (many Android phones; iPhone stops speech when locked).
   Either way the text follows the voice, and continues into the next sitting. */
const tts = { on: false, n: 0, lock: null, mode: null, el: null, carry: null, paused: false, followOff: 0 };
const readables = () => $$('#chapter .part-intro p, #chapter .body h2, #chapter .body h3, #chapter .body p, #chapter .body li')
  .filter(el => !el.classList.contains('orn') && !el.classList.contains('iti'));
const hiVoices = () => { try { return speechSynthesis.getVoices().filter(v => /^hi/i.test(v.lang)); } catch { return []; } };
const pickVoice = () => { const vs = hiVoices(); return vs.find(v => v.name === settings.voice) || vs[0] || null; };
const audioEl = new Audio(); audioEl.preload = 'none';
let keepAlive = null;
function silentLoop() {           // 1 s of silence, made in memory
  if (keepAlive) return keepAlive;
  const n = 8000, b = new Uint8Array(44 + n), v = new DataView(b.buffer), w = (o, s) => [...s].forEach((c, i) => b[o + i] = c.charCodeAt(0));
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true); b.fill(128, 44);
  keepAlive = new Audio(URL.createObjectURL(new Blob([b], { type: 'audio/wav' }))); keepAlive.loop = true;
  return keepAlive;
}
// user scrolling pauses the follow for a few seconds
['wheel', 'touchmove'].forEach(ev => addEventListener(ev, () => { if (tts.on) tts.followOff = Date.now() + 8000; }, { passive: true }));
function follow(el, frac = 0) {
  if (!el || Date.now() < tts.followOff || document.visibilityState !== 'visible') return;
  const r = el.getBoundingClientRect();
  scrollTo({ top: scrollY + r.top + r.height * frac - innerHeight * 0.33, behavior: 'smooth' });
}
function mark(el) { if (tts.el === el) return; $$('.speaking-now').forEach(x => x.classList.remove('speaking-now')); el?.classList.add('speaking-now'); tts.el = el; }

function sayText(text, run, onDone, onPart) {
  // sentences joined into chunks of ~220 characters: fewer gaps between utterances, still short enough for every phone
  const sents = text.replace(/[—–]/g, ', ').replace(/([।॥?!\n])\s*/g, '$1\u0001').split('\u0001').map(s => s.trim()).filter(Boolean);
  const parts = sents.reduce((a, x) => { if (a.length && a[a.length - 1].length + x.length < 220) a[a.length - 1] += ' ' + x; else a.push(x); return a; }, []);
  if (!parts.length) return onDone();
  const voice = pickVoice(), total = parts.reduce((a, p) => a + p.length, 0);
  let before = 0;
  parts.forEach((t, i) => {
    const s = new SpeechSynthesisUtterance(t), at = before; before += t.length;
    s.lang = 'hi-IN'; if (voice) s.voice = voice; s.rate = settings.rate || 0.9;
    if (onPart) s.onstart = () => { if (tts.on && run === tts.n) onPart(at / total); };
    if (i === parts.length - 1) s.onend = () => { if (tts.on && run === tts.n) onDone(); };
    speechSynthesis.speak(s);
  });
}
function startTTS(mode = 'tts') {
  if (mode === 'tts' && !('speechSynthesis' in window)) { toast('इस ब्राउज़र में सुनने की सुविधा नहीं है'); return 0; }
  stopSpeak(true);
  tts.on = true; tts.mode = mode; tts.paused = false; $('#tts').hidden = false; ttsBar();
  if (mode === 'tts') silentLoop().play().catch(() => { });
  try { if (!tts.lock) navigator.wakeLock?.request('screen').then(l => { tts.lock = l; }).catch(() => { }); } catch { }
  return ++tts.n;
}
const RATES = [[0.75, 'धीमी'], [0.9, 'सहज'], [1, 'सामान्य'], [1.15, 'तेज़'], [1.3, 'अति तेज़']];
const rateName = () => (RATES.find(r => r[0] === (settings.rate || 0.9)) || RATES[1])[1];
function cycleRate() {
  const k = RATES.findIndex(r => r[0] === (settings.rate || 0.9));
  settings.rate = RATES[(k + 1) % RATES.length][0]; applySettings();
  if (tts.mode === 'file') audioEl.playbackRate = settings.rate / 0.9;
  else if (tts.on && !tts.paused && tts.el) { const el = tts.el; tts.n++; try { speechSynthesis.cancel(); } catch { } tts.el = null; speakEl(el, tts.n, tts.onEnd); }
  ttsBar();
}
let miniT;
function foldSoon() { const b = $('#tts'); b.classList.remove('mini'); clearTimeout(miniT); miniT = setTimeout(() => { if (tts.on && !tts.paused) b.classList.add('mini'); }, 4000); }
function ttsBar() {
  foldSoon();
  $('#tts').innerHTML = `<button class="mini-btn" data-unfold aria-label="सुनना जारी — नियंत्रण दिखाएँ"><span class="wave"><i></i><i></i><i></i></span></button><button data-tr aria-label="गति">गति: ${rateName()}</button><button data-tp aria-label="${tts.paused ? 'चलाएँ' : 'ठहरें'}">${tts.paused ? '▶ चलाएँ' : '❚❚ ठहरें'}</button><button data-ts>■ रोकें</button>`;
  localize($('#tts'));
}
$('#tts').onclick = e => { if (e.target.closest('[data-unfold]')) return foldSoon(); foldSoon(); if (e.target.closest('[data-tr]')) return cycleRate(); if (e.target.closest('[data-ts]')) stopSpeak(); if (e.target.closest('[data-tp]')) togglePause(); };
function togglePause() {
  if (!tts.on) return;
  if (tts.mode === 'file') { if (audioEl.paused) audioEl.play(); else audioEl.pause(); tts.paused = audioEl.paused; }
  else if (!tts.paused) { const el = tts.el; tts.n++; try { speechSynthesis.cancel(); } catch { } tts.paused = true; tts.el = el; keepAlive?.pause(); }
  else { const el = tts.el; tts.paused = false; keepAlive?.play().catch(() => { }); speakEl(el, ++tts.n, tts.onEnd); }
  ttsBar(); mediaState();
}
function speakFrom(el) { if (!el) return; const run = startTTS(); if (run) speakEl(el, run); }
function speakEl(el, run, onEnd) {
  if (!tts.on || run !== tts.n) return;
  if (onEnd) tts.onEnd = onEnd;
  if (!el) return onEnd ? onEnd() : stopSpeak();
  mark(el); follow(el);
  sayText(textOf(el), run, () => { const all = readables(); speakEl(all[all.indexOf(el) + 1], run, onEnd); }, f => follow(el, f));
}
// read a whole sitting (file or voice), then carry on into the next one
function listenUnit(slug, ui, fromEl, auto) {
  const bk = books[slug], u = bk.units[ui], m = bk.meta;
  const nextUnit = () => {
    if (ui + 1 < bk.units.length) { tts.carry = { slug }; location.hash = `#/read/${slug}/${ui + 1}`; }
    else { stopSpeak(); toast('॥ इति ॥'); }
  };
  media(u, m, nextUnit, ui > 0 ? () => { tts.carry = { slug }; location.hash = `#/read/${slug}/${ui - 1}`; } : null);
  if (m.audio) {
    const run = startTTS('file');
    const base = /^https?:/.test(m.audio) ? m.audio : 'books/' + m.audio;
    audioEl.src = base + String(ui + 1).padStart(3, '0') + '.mp3';
    audioEl.playbackRate = settings.rate ? settings.rate / 0.9 : 1;
    // position the recording roughly where the reader is
    const all = readables(), lens = all.map(e => textOf(e).length), total = lens.reduce((a, b) => a + b, 0) || 1;
    const startAt = fromEl && !auto ? lens.slice(0, Math.max(0, all.indexOf(fromEl))).reduce((a, b) => a + b, 0) / total : 0;
    audioEl.onloadedmetadata = () => { if (startAt > 0.02) audioEl.currentTime = startAt * audioEl.duration; };
    audioEl.ontimeupdate = () => {
      if (run !== tts.n || !audioEl.duration) return;
      let c = audioEl.currentTime / audioEl.duration * total, i = 0;
      while (i < lens.length - 1 && c > lens[i]) { c -= lens[i]; i++; }
      mark(all[i]); if (!audioEl.paused) follow(all[i], lens[i] ? c / lens[i] : 0);
      try { navigator.mediaSession?.setPositionState({ duration: audioEl.duration, position: audioEl.currentTime, playbackRate: audioEl.playbackRate }); } catch { }
    };
    audioEl.onended = () => { if (run === tts.n) nextUnit(); };
    audioEl.onerror = () => { if (run !== tts.n) return; toast('इस अंश की रिकॉर्डिंग नहीं मिली — उपकरण की आवाज़ से सुन रहे हैं'); const r2 = startTTS(); if (r2) speakEl(fromEl || all[0], r2, nextUnit); };
    audioEl.play().catch(() => { });
  } else {
    const run = startTTS(); if (run) speakEl(fromEl || readables()[0], run, nextUnit);
  }
  mediaState();
}
// lock-screen / notification controls
function media(u, m, next, prev) {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({ title: u.title + (u.pieces ? ` · ${u.piece}/${u.pieces}` : ''), artist: m.speaker || '', album: m.title, artwork: [{ src: 'icon.svg', sizes: '512x512', type: 'image/svg+xml' }] });
    const h = (a, f) => { try { navigator.mediaSession.setActionHandler(a, f); } catch { } };
    h('play', () => { if (tts.paused) togglePause(); }); h('pause', () => { if (!tts.paused) togglePause(); });
    h('stop', () => stopSpeak()); h('nexttrack', next); h('previoustrack', prev);
    h('seekforward', tts.mode === 'file' ? () => { audioEl.currentTime += 15; } : null);
    h('seekbackward', tts.mode === 'file' ? () => { audioEl.currentTime -= 15; } : null);
  } catch { }
}
function mediaState() { try { navigator.mediaSession.playbackState = !tts.on ? 'none' : tts.paused ? 'paused' : 'playing'; } catch { } }
function stopSpeak(soft) {
  tts.on = false; tts.n++; tts.paused = false;
  try { speechSynthesis.cancel(); } catch { }
  if (!soft) { audioEl.pause(); keepAlive?.pause(); try { tts.lock?.release(); } catch { } tts.lock = null; tts.carry = null; }
  else if (tts.mode === 'file') audioEl.pause();
  $$('.speaking-now').forEach(x => x.classList.remove('speaking-now')); tts.el = null;
  const b = $('#tts'); if (b && !soft) b.hidden = true;
  $$('[data-deck-listen]').forEach(x => x.classList.remove('on'));
  mediaState();
}

/* ---------- वचन as an image, for WhatsApp and status ---------- */
async function vachanImage(text, src) {
  const fam = settings.font === 'noto' ? '"Noto Serif Devanagari"' : '"Tiro Devanagari Hindi"';
  try { await document.fonts.load(`48px ${fam}`); } catch { }
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), font = px => `${px}px ${fam}, "Noto Serif Devanagari", serif`;
  g.fillStyle = '#f6efe2'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#8a3b12'; g.lineWidth = 3; g.strokeRect(48, 48, W - 96, H - 96);
  g.lineWidth = 1; g.strokeRect(62, 62, W - 124, H - 124);
  g.textAlign = 'center'; g.fillStyle = '#8a3b12'; g.font = font(40); g.fillText('॥ श्री ॥', W / 2, 150);
  // fit the text: shrink until it fits the frame
  const wrap = (size) => {
    g.font = font(size); const lines = [];
    for (const para of text.split('\n')) {
      let line = '';
      for (const w of para.split(/\s+/)) {
        const t = line ? line + ' ' + w : w;
        if (g.measureText(t).width > W - 240 && line) { lines.push(line); line = w; } else line = t;
      }
      lines.push(line);
    }
    return lines;
  };
  let size = 60, lines = wrap(size);
  while (lines.length * size * 1.7 > 860 && size > 30) { size -= 2; lines = wrap(size); }
  const lh = size * 1.7, top = 230 + (860 - lines.length * lh) / 2;
  g.fillStyle = '#2b2118'; g.font = font(size);
  lines.forEach((l, i) => g.fillText(l, W / 2, top + i * lh + size));
  g.fillStyle = '#8a3b12'; g.font = font(34); g.fillText('❀', W / 2, 1140);
  g.fillStyle = '#5c4a38'; g.font = font(34); g.fillText('— ' + src, W / 2, 1200);
  return new Promise(r => c.toBlob(r, 'image/png'));
}
async function shareImage(text, src) {
  const blob = await vachanImage(text, src), url = URL.createObjectURL(blob);
  const file = new File([blob], 'vachan.png', { type: 'image/png' });
  const canShare = navigator.canShare && navigator.canShare({ files: [file] });
  openSheet(`<img class="vimg" src="${url}" alt="वचन का चित्र">
    <div class="row">${canShare ? '<button class="btn primary" data-img-share>भेजें</button>' : ''}
    <a class="btn ${canShare ? '' : 'primary'}" href="${url}" download="vachan.png">चित्र सहेजें</a>
    <button class="btn ghost" data-close>बन्द करें</button></div>`);
  const b = $('[data-img-share]'); if (b) b.onclick = async () => { try { await navigator.share({ files: [file] }); } catch { } };
}

function textOf(el) {
  const c = el.cloneNode(true); $$('sup', c).forEach(s => s.remove());
  $$('br', c).forEach(b => b.replaceWith('\n'));
  return c.textContent.replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').trim();
}
function findBlock(q) {
  const n = s => s.replace(/\s+/g, ' ').trim();
  q = n(q);
  return $$('#chapter .body h2, #chapter .body p, #chapter .body li, #chapter .body blockquote').find(el => n(textOf(el)).includes(q)) || null;
}
function flash(el) { el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 2400); }

let selected = null;
function hideActions() { $('#actions').hidden = true; if (selected) selected.classList.remove('sel'); selected = null; }
function showActions(blk, ctx) {
  if (selected === blk) return hideActions();
  hideActions(); selected = blk; blk.classList.add('sel');
  // keep a verse together with its meaning and source when saving; drop a vachan's own number
  let text = textOf(blk);
  if (blk.classList.contains('vachan')) text = text.replace(/^\d+\.\s*/, '');
  if (blk.classList.contains('verse')) {
    let s = blk.nextElementSibling;
    while (s && (s.classList.contains('src') || s.classList.contains('bhav'))) { text += '\n' + textOf(s); s = s.nextElementSibling; }
  }
  const a = $('#actions');
  a.innerHTML = `<button data-a="save">${ICON.bookmark} ${isSaved(text) ? '✓ सहेजा' : 'सहेजें'}</button><button data-a="listen">सुनें</button><button data-a="img">चित्र</button>${navigator.share ? '<button data-a="share">भेजें</button>' : '<button data-a="copy">कॉपी</button>'}<button data-a="x" aria-label="बन्द करें">✕</button>`;
  a.hidden = false; localize(a);
  a.onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    const who = books[ctx.slug].meta.speaker || books[ctx.slug].meta.title;
    const sig = `\n\n— ${who}, ${ctx.where}`;
    if (b.dataset.a === 'save') saveItem({ ...ctx, text });
    if (b.dataset.a === 'listen') { const el = blk; hideActions(); return listenUnit(ctx.slug, ctx.ui, el); }
    if (b.dataset.a === 'img') shareImage(text, who);
    if (b.dataset.a === 'copy') { try { await navigator.clipboard.writeText(text + sig); toast('कॉपी हो गया'); } catch { toast('कॉपी नहीं हो सका'); } }
    if (b.dataset.a === 'share') { try { await navigator.share({ text: text + sig }); } catch { } }
    hideActions();
  };
}

const isSaved = text => store.get('saved', []).some(s => s.text === text);
// tap once to save, again to remove
function saveItem(item) {
  const saved = store.get('saved', []), i = saved.findIndex(s => s.text === item.text);
  if (i >= 0) { const old = saved[i]; saved.splice(i, 1); store.set('saved', saved); toast('संग्रह से हटाया', { fn: () => { const l = store.get('saved', []); l.splice(i, 0, old); store.set('saved', l); markSaved(); $$('[data-a="save"], [data-save-daily]').forEach(b => { b.classList.add('on'); b.textContent = tr('✓ सहेजा'); }); } }); }
  else { saved.unshift({ ...item, at: Date.now() }); store.set('saved', saved); toast('संग्रह में रखा गया'); }
  markSaved(); return i < 0;
}
// saved passages stay highlighted in the book
function markSaved() {
  const m = location.hash.match(/^#\/read\/([^/]+)/); if (!m || !$('#chapter')) return;
  const n = x => x.replace(/\s+/g, ' ').trim();
  const snips = store.get('saved', []).filter(x => x.slug === m[1]).map(x => n(x.text.split('\n')[0]).slice(0, 40)).filter(Boolean);
  $$('#chapter .body p, #chapter .body li, #chapter .part-intro p').forEach(el => {
    const t = n(textOf(el)); el.classList.toggle('is-saved', snips.some(q => t.includes(q)));
  });
}
const savedLink = x => ctxLink({ slug: x.slug, ui: x.ui, text: x.text });

let savedTab = 'v';
async function viewSaved() {
  await loadLibrary();
  const saved = store.get('saved', []), notes = Object.entries(store.get('notes', {})).sort((a, b) => b[1].at - a[1].at);
  const date = t => new Date(t).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short' });
  const slugs = [...new Set(saved.map(x => x.slug))];
  const f = { q: '', book: '', order: 'new', shown: 20 };
  app.innerHTML = `${topbar()}
  <div class="wrap">
    <h1 class="pageh">संग्रह</h1>
    <div class="seg tabs2"><button data-t="v" class="${savedTab === 'v' ? 'on' : ''}">सहेजे वचन · ${hiNum(saved.length)}</button><button data-t="n" class="${savedTab === 'n' ? 'on' : ''}">मनन · ${hiNum(notes.length)}</button></div>
    ${savedTab === 'v' && saved.length ? `
      <div class="row"><a class="btn primary" href="#/deck/saved">एक-एक करके पढ़ें →</a></div>
      <input type="search" id="sq" class="lsearch" placeholder="संग्रह में खोजें" aria-label="संग्रह में खोजें">
      <div class="chips sm" id="sorder"><button data-o="new" class="on">नए पहले</button><button data-o="old">पुराने पहले</button>
      ${slugs.length > 1 ? `<button data-b="" class="on">सभी ग्रन्थ</button>${slugs.map(x => `<button lang="hi" data-b="${esc(x)}">${esc(metaOf(x).title || x)}</button>`).join('')}` : ''}</div>` : ''}
    <div id="slist"></div>
  </div>${tabbar('saved')}`;
  const draw = () => {
    const box = $('#slist');
    if (savedTab === 'n') {
      box.innerHTML = notes.length ? notes.map(([k, n]) => `<a class="card saved" href="#/read/${k.replace(':', '/')}">
        <p class="stext" lang="hi">${esc(n.t)}</p><p class="muted small"><span lang="hi">${esc(n.title || '')}</span> · ${date(n.at)}</p></a>`).join('')
        : '<p class="muted">हर अंश के अन्त में एक पंक्ति का मनन लिखें — वे यहाँ इकट्ठे होंगे।</p>';
    } else if (!saved.length) box.innerHTML = '<p class="muted">पढ़ते समय किसी अनुच्छेद को छूएँ और “सहेजें” चुनें — वह यहाँ आ जाएगा।</p>';
    else {
      let l = saved.map((x, i) => ({ ...x, i })).filter(x => (!f.book || x.slug === f.book) && (!f.q || x.text.includes(f.q) || (x.where || '').includes(f.q)));
      if (f.order === 'old') l.reverse();
      box.innerHTML = (l.length ? '' : '<p class="muted">कुछ नहीं मिला</p>') + l.slice(0, f.shown).map(x => `<article class="card saved">
        <p class="stext clamp" lang="hi" data-open>${esc(x.text).replace(/\n/g, '<br>')}</p>
        <p class="muted small"><span lang="hi">${esc(x.where || '')}${slugs.length > 1 ? ' · ' + esc(metaOf(x.slug).title || '') : ''}</span> · ${date(x.at)}</p>
        <div class="row"><a class="btn" href="${savedLink(x)}">प्रसंग में पढ़ें</a>
        <button class="btn" data-img="${x.i}">चित्र</button><button class="btn ghost" data-del="${x.i}">हटाएँ</button></div></article>`).join('')
        + (l.length > f.shown ? `<button class="btn more-btn" data-more>और दिखाएँ · ${hiNum(l.length - f.shown)}</button>` : '');
    }
    localize(box);
  };
  app.onclick = e => {
    const t = e.target.closest('[data-t]'); if (t) { savedTab = t.dataset.t; return viewSaved().then(() => localize(app)); }
    const o = e.target.closest('#sorder button');
    if (o) { if (o.dataset.o) f.order = o.dataset.o; if (o.dataset.b != null) f.book = o.dataset.b; $$('#sorder button').forEach(x => x.classList.toggle('on', (x.dataset.o && x.dataset.o === f.order) || (x.dataset.b != null && x.dataset.b === f.book))); return draw(); }
    if (e.target.closest('[data-more]')) { f.shown += 20; return draw(); }
    const op = e.target.closest('[data-open]'); if (op) return op.classList.toggle('clamp');
    const im = e.target.closest('[data-img]');
    if (im) { const x = store.get('saved', [])[+im.dataset.img]; return shareImage(x.text, speakerOf(x.slug)); }
    const d = e.target.closest('[data-del]'); if (!d) return;
    withUndo(['saved'], () => { const all = store.get('saved', []); all.splice(+d.dataset.del, 1); store.set('saved', all); }, 'संग्रह से हटाया'); viewSaved().then(() => localize(app));
  };
  const sq = $('#sq'); if (sq) sq.oninput = () => { f.q = sq.value.trim(); f.shown = 20; draw(); };
  draw();
}

/* ---------- router ---------- */
async function route() {
  hideActions(); closeSheet(); stopSpeak(!!tts.carry);
  window.onscroll = null; app.onclick = null; onReader = false; deckKeys = null;
  document.body.className = '';
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  try {
    if (parts[0] === 'read') { document.body.className = 'reading'; await viewReader(parts[1], +parts[2] || 0, parts[3], parts.slice(4).join('/')); }
    else if (parts[0] === 'book') await viewBook(parts[1]);
    else if (parts[0] === 'library') await viewLibrary(parts[1]);
    else if (parts[0] === 'vachan') await viewVachanHome();
    else if (parts[0] === 'deck') { document.body.className = 'reading'; await viewDeck(parts[1]); }
    else if (parts[0] === 'find') await viewFind(parts[1], parts[2] || '', parts[3]);
    else if (parts[0] === 'check') await viewCheck(parts[1]);
    else if (parts[0] === 'saved') await viewSaved();
    else await viewHome();
  } catch (err) {
    console.error(err);
    app.innerHTML = `${topbar()}<div class="wrap"><p>कुछ अड़चन आई — ${esc(err.message)}</p><a class="btn" href="#/">मुख्य पृष्ठ</a></div>`;
  }
  localize(app);
  if (parts[0] !== 'read' && parts[0] !== 'book') scrollTo(0, 0);
}
addEventListener('hashchange', route);
document.addEventListener('click', e => { if (e.target.closest('[data-settings]')) openSettings(); if (e.target.closest('[data-streak]')) streakSheet(); });
function streakSheet() {
  const days = store.get('days', {}), w = weekStreak(days);
  const mon = new Date(); mon.setHours(12, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7) - 7 * 7);
  const weeks = [...Array(8)].map((_, k) => { const n = [...Array(7)].filter((__, i) => { const d = new Date(mon); d.setDate(d.getDate() + k * 7 + i); return (days[dayKey(d)] || 0) > 0; }).length; return n; });
  openSheet(`<h3>सप्ताह-क्रम</h3>
    <p>जिस सप्ताह में आप कम से कम 3 दिन पढ़ते हैं, वह सप्ताह गिना जाता है। ऐसे लगातार सप्ताह आपका क्रम हैं। एक-दो दिन छूट जाएँ तो क्रम नहीं टूटता।</p>
    <div class="weeks">${weeks.map((n, k) => `<span class="${n >= 3 ? 'full' : n ? 'some' : ''}"><i style="height:${Math.max(4, n / 7 * 100)}%"></i><small>${k === 7 ? 'यह' : ''}</small></span>`).join('')}</div>
    <p class="muted small">पिछले 8 सप्ताह · अभी: ${w.n ? `लगातार ${hiNum(w.n)} सप्ताह` : 'नया क्रम आरम्भ करें'}</p>
    <button class="done" data-close>ठीक है</button>`);
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeSheet(); hideActions(); }
  if (!document.body.classList.contains('reading') || e.target.matches('textarea,input,select')) return;
  if (deckKeys) { if (e.key === 'ArrowRight') deckKeys(1); if (e.key === 'ArrowLeft') deckKeys(-1); return; }
  const m = location.hash.match(/^#\/read\/([^/]+)\/(\d+)/); if (!m) return;
  if (e.key === 'ArrowRight' && books[m[1]] && +m[2] < books[m[1]].units.length - 1) location.hash = `#/read/${m[1]}/${+m[2] + 1}`;
  if (e.key === 'ArrowLeft' && +m[2] > 0) location.hash = `#/read/${m[1]}/${+m[2] - 1}`;
});
route();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => { });
}
