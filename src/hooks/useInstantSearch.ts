import { useEffect, useMemo, useState } from 'react';
import { qawlFaslService } from '../services/qawlFaslService';
import {
  createIndex,
  runSearch,
  type InstantIndex,
  type InstantResult,
  type SearchableQuestion,
} from '../services/instantSearch';

/**
 * useInstantSearch — instant, local, Arabic-aware matching over the curated
 * knowledge base. The corpus is loaded once (module-level cache shared across
 * the whole app) from Firestore, with a static seed file as a fallback, then
 * every keystroke is matched synchronously in memory. No network, no debounce.
 */

let cachedIndex: InstantIndex | null = null;
let loadPromise: Promise<InstantIndex> | null = null;

async function loadCorpus(): Promise<InstantIndex> {
  if (cachedIndex) return cachedIndex;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    let items: SearchableQuestion[] = [];

    // Primary source: the live published questions in Firestore.
    try {
      const published = await qawlFaslService.searchQuestions('');
      if (Array.isArray(published) && published.length) {
        items = published as unknown as SearchableQuestion[];
      }
    } catch {
      // Ignore and fall back to the bundled seed below.
    }

    // Fallback seed (also covers first paint before Firestore resolves offline).
    if (!items.length) {
      try {
        const res = await fetch('/qawl_fasl_full_v1.json');
        if (res.ok) {
          const seed = await res.json();
          if (Array.isArray(seed)) items = seed as SearchableQuestion[];
        }
      } catch {
        // No seed available — index stays empty, search simply returns nothing.
      }
    }

    cachedIndex = createIndex(items);
    return cachedIndex;
  })();

  return loadPromise;
}

export function useInstantSearch(query: string, limit = 6) {
  const [index, setIndex] = useState<InstantIndex | null>(cachedIndex);
  const [isReady, setIsReady] = useState<boolean>(!!cachedIndex);

  useEffect(() => {
    if (index) return;
    let alive = true;
    loadCorpus().then((idx) => {
      if (!alive) return;
      setIndex(idx);
      setIsReady(true);
    });
    return () => {
      alive = false;
    };
  }, [index]);

  const results: InstantResult[] = useMemo(() => {
    if (!index) return [];
    return runSearch(index, query, limit);
  }, [index, query, limit]);

  return { results, isReady, corpusSize: index?.docs.length ?? 0 };
}
