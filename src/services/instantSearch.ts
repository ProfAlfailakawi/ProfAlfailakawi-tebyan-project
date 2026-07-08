/**
 * Instant, Arabic-aware search engine.
 *
 * Pure, dependency-free functions that run entirely on the client in well
 * under a millisecond over hundreds of documents. This is what makes search
 * feel "instant" (صاروخي): matching happens locally on every keystroke, with
 * the AI refinement layered on top as an enhancement — never a blocker.
 *
 * The normalization layer is the important part for Arabic: users type without
 * tashkeel, mix hamza/alef forms, and end words with ة/ه or ى/ي interchangeably.
 * We fold all of that into one canonical form so "الله" matches "اللّه",
 * "صلاه" matches "صلاة", and "احمد" matches "أحمد".
 */

export interface SearchableQuestion {
  id: string;
  question?: string;
  title?: string;
  quickSummary?: string;
  category?: string;
  categorySlug?: string;
  mainCategory?: string;
  keywords?: string[];
  ageGroups?: string[];
  [key: string]: any;
}

export interface InstantResult {
  item: SearchableQuestion;
  question: string;
  score: number;
  matchedTokens: string[];
}

// Arabic diacritics (tashkeel), superscript alef, and tatweel.
const TASHKEEL = /[ؗ-ًؚ-ْٰـ]/g;

/** Fold Arabic text into a canonical, diacritic-free, punctuation-free form. */
export function normalizeArabic(input: string): string {
  if (!input) return '';
  return input
    .replace(TASHKEEL, '')
    .replace(/[آأإٱ]/g, 'ا') // آ أ إ ٱ -> ا
    .replace(/ى/g, 'ي') // ى -> ي
    .replace(/ة/g, 'ه') // ة -> ه
    .replace(/ؤ/g, 'و') // ؤ -> و
    .replace(/ئ/g, 'ي') // ئ -> ي
    .replace(/ء/g, '') // hamza on its own -> drop
    .replace(/[^؀-ۿ0-9a-zA-Z\s]/g, ' ') // strip punctuation & symbols
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// High-frequency Arabic function words we don't want to drive ranking.
const STOPWORDS = new Set([
  'في', 'من', 'الى', 'على', 'عن', 'مع', 'هل', 'ما', 'ماذا', 'كيف', 'لماذا',
  'هو', 'هي', 'ان', 'انا', 'او', 'و', 'ثم', 'قد', 'كان', 'يا', 'اذا', 'التي',
  'الذي', 'هذا', 'هذه', 'ولا', 'لا', 'بعد', 'قبل', 'كل', 'به', 'اني', 'عندي',
]);

interface IndexedDoc {
  item: SearchableQuestion;
  question: string;
  titleNorm: string;
  keywordsNorm: string;
  bodyNorm: string;
  tokens: string[];
}

export interface InstantIndex {
  docs: IndexedDoc[];
}

/** Pre-compute normalized fields once so each keystroke search stays O(N) and tiny. */
export function createIndex(items: SearchableQuestion[]): InstantIndex {
  const docs: IndexedDoc[] = (items || []).map((item) => {
    const question = (item.question || item.title || '').trim();
    const titleNorm = normalizeArabic(question);
    const keywordsNorm = normalizeArabic((item.keywords || []).join(' '));
    const bodyNorm = normalizeArabic(
      [item.quickSummary, item.category, item.mainCategory].filter(Boolean).join(' '),
    );
    const tokens = Array.from(
      new Set(`${titleNorm} ${keywordsNorm}`.split(' ').filter(Boolean)),
    );
    return { item, question, titleNorm, keywordsNorm, bodyNorm, tokens };
  });
  return { docs };
}

/** Rank documents for a raw query. Returns the top `limit` matches, best first. */
export function runSearch(index: InstantIndex, rawQuery: string, limit = 6): InstantResult[] {
  const qNorm = normalizeArabic(rawQuery);
  if (qNorm.length < 2) return [];

  const qTokens = qNorm.split(' ').filter(Boolean);
  const meaningful = qTokens.filter((t) => !STOPWORDS.has(t) && t.length > 1);
  const tokensToUse = meaningful.length ? meaningful : qTokens;

  const scored: InstantResult[] = [];

  for (const doc of index.docs) {
    let score = 0;
    const matched: string[] = [];

    // Whole-phrase match in the title is the strongest possible signal.
    if (doc.titleNorm.includes(qNorm)) score += 100;
    if (doc.titleNorm.startsWith(qNorm)) score += 40;

    for (const t of tokensToUse) {
      if (doc.titleNorm.includes(t)) {
        score += 18;
        matched.push(t);
      } else if (doc.keywordsNorm.includes(t)) {
        score += 12;
        matched.push(t);
      } else if (doc.bodyNorm.includes(t)) {
        score += 6;
        matched.push(t);
      }
      // Prefix match on any token ("صلا" -> "صلاة") — great for as-you-type.
      if (doc.tokens.some((dt) => dt.startsWith(t))) score += 8;
    }

    // Reward documents that cover every meaningful query token.
    if (tokensToUse.length && new Set(matched).size >= tokensToUse.length) score += 25;

    if (score > 0) {
      scored.push({
        item: doc.item,
        question: doc.question,
        score,
        matchedTokens: Array.from(new Set(matched)),
      });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.question.length - b.question.length);
  return scored.slice(0, limit);
}
