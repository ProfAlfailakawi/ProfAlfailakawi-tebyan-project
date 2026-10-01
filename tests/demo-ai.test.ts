import test from 'node:test';
import assert from 'node:assert/strict';
import { demoAiText, demoAudioResponse } from '../src/lib/demoAi';

const quizSchema = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      question: { type: 'STRING' },
      type: { type: 'STRING', enum: ['multiple', 'boolean', 'fill'] },
      options: { type: 'ARRAY', items: { type: 'STRING' } },
      answer: { type: 'STRING' },
    },
  },
};

test('demo AI: schema-shaped quiz has answers that match an option', () => {
  const out = JSON.parse(demoAiText({
    contents: [{ parts: [{ text: 'أنتج اختباراً احترافياً عن العناد عند الأطفال' }] }],
    config: { responseMimeType: 'application/json', responseSchema: quizSchema },
  }));
  assert.equal(out.length, 6);
  for (const q of out) assert.ok(q.options.includes(q.answer));
});

test('demo AI: free text is Arabic and echoes a clean topic', () => {
  const t = demoAiText({ contents: [{ parts: [{ text: 'كيف أقلل وقت الشاشة؟ يرجى الإجابة بنقاط' }] }] });
  assert.match(t, /وقت الشاشة/);
  assert.doesNotMatch(t, /يرجى الإجابة/);
});

test('demo AI: json without schema returns parseable JSON; audio is offline', () => {
  const j = JSON.parse(demoAiText({ contents: [{ parts: [{ text: 'x' }] }], config: { responseMimeType: 'application/json', systemInstruction: '{"rage": number}' } }));
  assert.equal(typeof j.rage, 'number');
  assert.equal(demoAudioResponse().offline, true);
});
