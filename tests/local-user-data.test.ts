import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clearLocalUserDataOnSignOut, clearQuestionHistory } from '../src/lib/localUserData';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

function fakeStorage(entries: Record<string, string>) {
  const map = new Map(Object.entries(entries));
  return {
    map,
    get length() { return map.size; },
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (k: string) => void map.delete(k),
  };
}

const deviceOfUserA = () => fakeStorage({
  tebyan_memory: '{"query":"ابني يكذب"}',
  tebyan_search_history: '["ابني يكذب"]',
  tebyan_thought_memory: '[{"originalText":"ابنتي تعرضت لتنمر"}]',
  tebyan_cognitive_memory: '{"topic":"x"}',
  tebyan_last_session: '{"query":"ابني يكذب"}',
  'tebyan_cache_v1_ابني يكذب': 'true',
  tebyan_custom_avatar: 'data:image/png;base64,AAA',
  tebyan_onboarding_seen_v3: 'true',
  tebyan_panic_mode: 'false',
});

test('erase memory removes every stored question, including the Insights Vault', () => {
  const s = deviceOfUserA();
  clearQuestionHistory(s);
  for (const k of s.map.keys()) assert.doesNotMatch(k, /memory|history|last_session|cache_v1_/, `${k} survived the erase`);
  // Device preferences are not question history.
  assert.ok(s.map.has('tebyan_onboarding_seen_v3'));
  assert.ok(s.map.has('tebyan_panic_mode'));
});

test('sign-out leaves nothing of the previous account’s questions for the next one', () => {
  const s = deviceOfUserA();
  clearLocalUserDataOnSignOut(s);
  assert.deepEqual([...s.map.keys()].sort(), ['tebyan_onboarding_seen_v3', 'tebyan_panic_mode']);
});

test('both sign-out buttons and the erase button use the shared clearing', () => {
  const menu = read('src/components/UserMenu.tsx');
  const panel = read('src/components/ClientProfilePanel.tsx');
  assert.match(menu, /clearLocalUserDataOnSignOut\(\);\s*\n\s*if \(IS_DEMO_MODE\)/);
  assert.match(panel, /clearLocalUserDataOnSignOut\(\);\s*\n\s*if \(IS_DEMO_MODE\)/);
  assert.match(panel, /clearQuestionHistory\(\);\s*\n\s*setKnowledgeTree\(\[\]\)/);
});
