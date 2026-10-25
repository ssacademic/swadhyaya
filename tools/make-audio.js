#!/usr/bin/env node
/* Make one audio file per reading sitting, so the app can play a book with the screen off.

   Usage (from the svadhyay folder):
     node tools/make-audio.js <slug> --text-only          # just write the text of each sitting (for any TTS service or a human reader)
     node tools/make-audio.js <slug>                      # also synthesise MP3s with edge-tts (pip install edge-tts)
     node tools/make-audio.js <slug> --voice hi-IN-MadhurNeural --rate -10% --only 1-5

   Output: books/audio/<slug>/001.txt, 001.mp3, 002…  (number = sitting number in the app, from 1)
   Then add  "audio": "audio/<slug>/"  to the book in books/books.json  (or a full https:// folder URL if you host audio elsewhere).

   Notes
   • Sittings are cut by the same code the app uses (book.js), so files and sittings always match.
     If you later change the book's headings, regenerate the audio.
   • edge-tts uses Microsoft's online neural voices (free, unofficial; check that its terms suit your use).
     Official alternatives: Google Cloud Text-to-Speech (hi-IN Neural2/Wavenet) or Azure Speech, using the .txt files.
   • A devotee's own recorded voice works the same way: save NNN.mp3 files in the folder.
   • Size: about 20 MB per hour of audio. GitHub Pages sites should stay under ~1 GB, so for many books host audio
     elsewhere (e.g. archive.org) and point "audio" to that URL. */
'use strict';
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const { parseBook, speechText } = require('../book.js');

const args = process.argv.slice(2), slug = args.find(a => !a.startsWith('--') && !/^-?\d/.test(a));
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
if (!slug) { console.log('Usage: node tools/make-audio.js <slug> [--text-only] [--voice hi-IN-SwaraNeural] [--rate -5%] [--only 1-5]'); process.exit(1); }

const root = path.join(__dirname, '..');
const meta = JSON.parse(fs.readFileSync(path.join(root, 'books/books.json'), 'utf8')).find(b => b.slug === slug);
if (!meta) { console.error(`"${slug}" is not in books/books.json`); process.exit(1); }
const bk = parseBook(fs.readFileSync(path.join(root, 'books', meta.file), 'utf8'), meta);
const out = path.join(root, 'books/audio', slug); fs.mkdirSync(out, { recursive: true });

const [from, to] = (opt('only', `1-${bk.units.length}`)).split('-').map(Number);
const textOnly = args.includes('--text-only'), voice = opt('voice', 'hi-IN-SwaraNeural'), rate = opt('rate', '-5%');
let haveTTS = !textOnly && spawnSync('edge-tts', ['--help'], { stdio: 'ignore' }).status === 0;
if (!textOnly && !haveTTS) console.log('edge-tts not found → writing text only. Install with:  pip install edge-tts');

bk.units.forEach((u, i) => {
  const n = i + 1; if (n < from || n > (to || from)) return;
  const id = String(n).padStart(3, '0');
  const head = [u.intro ? u.intro.title : '', u.title + (u.pieces ? `, भाग ${u.piece}` : '')].filter(Boolean).join('। ') + '।';
  const text = head + '\n\n' + (u.intro ? speechText(u.intro.md) + '\n\n' : '') + speechText(u.md);
  const txt = path.join(out, id + '.txt'), mp3 = path.join(out, id + '.mp3');
  fs.writeFileSync(txt, text);
  if (!haveTTS) { console.log(`${id}.txt  ${u.title}`); return; }
  if (fs.existsSync(mp3)) { console.log(`${id}.mp3 exists, skipped`); return; }
  const r = spawnSync('edge-tts', ['--voice', voice, `--rate=${rate}`, '-f', txt, '--write-media', mp3], { stdio: 'inherit' });
  console.log(r.status === 0 ? `${id}.mp3  ${u.title}` : `${id} failed`);
});
console.log(`\nDone. Add to "${slug}" in books/books.json:\n  "audio": "audio/${slug}/"`);
