/**
 * provisionFileSearch.mjs — one-time (idempotent-ish) setup for Evidence Mode.
 *
 * Builds a Gemini File Search store from Tebyān's curated corpus so that
 * Oracle / QawlFasl / Knowledge Center can ground answers in INTERNAL evidence
 * and return citations.
 *
 * This is a DEV/OPS tool (run by a human with the API key), NOT product runtime
 * code. It uses the official @google/genai SDK — already a project dependency —
 * because the SDK handles the multi-step upload→import File Search flow.
 *
 * USAGE
 *   GEMINI_API_KEY=xxxx node scripts/provisionFileSearch.mjs
 *
 * OUTPUT
 *   Prints the created store name, e.g. "fileSearchStores/abc123".
 *   Put that value in the backend environment as TEBYAN_FILE_SEARCH_STORE
 *   (Cloud Function env + server.ts .env). That is the ONLY wiring the product
 *   runtime needs — see functions/aiCore.cjs getFileSearchStore().
 *
 * NOTE ON SDK METHOD NAMES
 *   File Search is a newer API surface. If your installed @google/genai version
 *   exposes slightly different method names, adjust the two calls marked
 *   `// [SDK]` below. The corpus-building step (Phase A) is pure and always works.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CORPUS_DIR = path.join(ROOT, '.filesearch_corpus');
const STORE_DISPLAY_NAME = 'tebyan-knowledge-v1';

// ---------------------------------------------------------------------------
// Phase A — build plain-text documents from the curated JSON corpus.
// ---------------------------------------------------------------------------

function sanitizeFileName(s) {
  return String(s).replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 80);
}

function qawlQuestionToText(q) {
  const lines = [];
  const push = (label, val) => { if (val) lines.push(`${label}: ${val}`); };
  push('السؤال', q.question || q.title);
  push('التصنيف', q.mainCategory);
  push('الفئات العمرية', Array.isArray(q.ageGroups) ? q.ageGroups.join('، ') : q.ageGroups);
  push('مستوى الحساسية', q.riskLevel);
  push('الملخص السريع', q.quickSummary);
  if (q.quickAnswer) {
    push('قل هذا', q.quickAnswer.sayThis);
    push('لا تقل هذا', q.quickAnswer.dontSayThis);
    push('افعل الآن', q.quickAnswer.doThisNow);
  }
  push('الخطأ الشائع', q.commonMistake);
  push('الرؤية التربوية', q.educationalView);
  push('الإجابة المقترحة', q.suggestedAnswer);
  if (Array.isArray(q.practicalSteps)) push('خطوات عملية', q.practicalSteps.join(' | '));
  push('متى تقلق', q.whenToWorry);
  push('مرجع ديني', q.religiousReference);
  push('إحصائية علمية', q.scientificStat);
  push('خلاصة', q.closingThought);
  return lines.join('\n');
}

function buildCorpus() {
  if (fs.existsSync(CORPUS_DIR)) fs.rmSync(CORPUS_DIR, { recursive: true, force: true });
  fs.mkdirSync(CORPUS_DIR, { recursive: true });

  let count = 0;
  const qawlPath = path.join(ROOT, 'qawl_fasl_full_v1.json');
  if (fs.existsSync(qawlPath)) {
    const raw = JSON.parse(fs.readFileSync(qawlPath, 'utf8'));
    const items = Array.isArray(raw) ? raw : (raw.questions || Object.values(raw));
    for (const q of items) {
      if (!q || typeof q !== 'object') continue;
      const text = qawlQuestionToText(q);
      if (!text.trim()) continue;
      const name = sanitizeFileName(q.id || q.question || q.title || `q_${count}`);
      fs.writeFileSync(path.join(CORPUS_DIR, `qawl_${count}_${name}.txt`), text, 'utf8');
      count++;
    }
  } else {
    console.warn('[provision] qawl_fasl_full_v1.json not found — skipping QawlFasl corpus.');
  }
  console.log(`[provision] Phase A: wrote ${count} corpus documents to ${CORPUS_DIR}`);
  return count;
}

// ---------------------------------------------------------------------------
// Phase B — create the File Search store and upload the corpus via SDK.
// ---------------------------------------------------------------------------

async function uploadCorpus() {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!apiKey) {
    console.error('\n[provision] GEMINI_API_KEY not set — Phase A files are ready, but nothing was uploaded.');
    console.error('           Re-run with: GEMINI_API_KEY=xxxx node scripts/provisionFileSearch.mjs\n');
    process.exit(1);
  }

  let GoogleGenAI;
  try {
    ({ GoogleGenAI } = await import('@google/genai'));
  } catch (e) {
    console.error('[provision] @google/genai not installed. Run `npm install` first.');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  // [SDK] Create the store.
  const store = await ai.fileSearchStores.create({
    config: { displayName: STORE_DISPLAY_NAME },
  });
  const storeName = store.name || store.fileSearchStoreName;
  console.log(`[provision] Phase B: created store ${storeName}`);

  const files = fs.readdirSync(CORPUS_DIR).filter((f) => f.endsWith('.txt'));
  let ok = 0;
  for (const f of files) {
    const full = path.join(CORPUS_DIR, f);
    try {
      // [SDK] Upload + import the document into the store.
      let op = await ai.fileSearchStores.uploadToFileSearchStore({
        file: full,
        fileSearchStoreName: storeName,
        config: { displayName: f, mimeType: 'text/plain' },
      });
      // Poll the long-running import operation until done.
      while (op && op.done === false && op.name) {
        await new Promise((r) => setTimeout(r, 1500));
        op = await ai.operations.get({ operation: op });
      }
      ok++;
      if (ok % 25 === 0) console.log(`[provision] imported ${ok}/${files.length}...`);
    } catch (e) {
      console.warn(`[provision] failed to import ${f}: ${e?.message || e}`);
    }
  }

  console.log(`\n[provision] DONE. Imported ${ok}/${files.length} documents.`);
  console.log('=====================================================================');
  console.log(` Set this in your backend env (Cloud Function + server.ts .env):`);
  console.log(`   TEBYAN_FILE_SEARCH_STORE=${storeName}`);
  console.log('=====================================================================\n');
}

// ---------------------------------------------------------------------------

(async () => {
  const n = buildCorpus();
  if (n === 0) {
    console.error('[provision] No documents built — aborting before upload.');
    process.exit(1);
  }
  await uploadCorpus();
})().catch((e) => {
  console.error('[provision] Fatal:', e?.message || e);
  process.exit(1);
});
