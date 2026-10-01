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

test('demo AI: council, mind map and simulation weave the topic keywords in', () => {
  const council = JSON.parse(demoAiText({
    contents: [{ parts: [{ text: 'You are a supreme council of 5 experts. Analyze "العناد عند الأطفال في المساء".' }] }],
    config: { responseMimeType: 'application/json', responseSchema: { type: 'OBJECT', properties: { council_discussion: { type: 'ARRAY', items: { type: 'OBJECT', properties: {} } }, consultants: { type: 'ARRAY', items: { type: 'OBJECT', properties: {} } } } } },
  }));
  assert.equal(council.consultants.length, 5);
  assert.match(JSON.stringify(council), /العناد/);
  const map = JSON.parse(demoAiText({
    contents: [{ parts: [{ text: 'تنظيم وقت الدراسة' }] }],
    config: { responseSchema: { type: 'OBJECT', properties: { central: { type: 'STRING' }, branches: { type: 'ARRAY', items: { type: 'OBJECT', properties: {} } } } } },
  }));
  assert.equal(map.central, 'تنظيم وقت الدراسة');
  assert.ok(map.branches.length >= 6);
  const sim = JSON.parse(demoAiText({
    contents: [{ parts: [{ text: 'ابدأ المحاكاة الآن حول: رفض الواجبات' }] }],
    config: { responseSchema: { type: 'OBJECT', properties: { scenario: { type: 'STRING' }, decisions: { type: 'ARRAY', items: { type: 'OBJECT', properties: { metrics: { type: 'OBJECT' } } } } } } },
  }));
  assert.match(sim.scenario, /رفض الواجبات/);
  assert.equal(sim.decisions.filter((d: any) => d.isCorrect).length, 1);
});

test('demo AI: quiz answers match options with varied positions; roadmap and story are shaped', () => {
  const quiz = JSON.parse(demoAiText({
    contents: [{ parts: [{ text: 'التعامل مع نوبات الغضب' }] }],
    config: { responseSchema: quizSchema },
  }));
  assert.equal(quiz.length, 6);
  for (const q of quiz) assert.ok(q.options.includes(q.answer));
  assert.ok(new Set(quiz.map((q: any) => q.options.indexOf(q.answer))).size > 1);
  const road = JSON.parse(demoAiText({
    contents: [{ parts: [{ text: 'توليد الخريطة' }] }],
    config: { systemInstruction: 'ولدي خارطة طريق لهدف: تنظيم الشاشات في الأسرة بلهجة بيضاء', responseSchema: { type: 'OBJECT', properties: { title: { type: 'STRING' }, estimated_duration: { type: 'STRING' }, milestones: { type: 'ARRAY', items: { type: 'OBJECT', properties: {} } } } } },
  }));
  assert.match(road.title, /الشاشات/);
  assert.equal(road.milestones.length, 4);
  const story = demoAiText({ contents: [{ parts: [{ text: 'ألفي قصة لـ: رفض المدرسة. التفاصيل: .' }] }], config: { systemInstruction: 'اكتب قصة قصيرة جداً (ميكرو-ستوري) للموضوع: رفض المدرسة. هيكل: المشهد الافتتاحي' } });
  assert.match(story, /المشهد الافتتاحي/);
  assert.doesNotMatch(story, /\\n/);
});
