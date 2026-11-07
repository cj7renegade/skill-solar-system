// The lesson viewer's text handling: markdown blocks and inline pieces (math, code, emphasis), and
// the practice items review sessions reuse from a cached lesson.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { markdownBlocks, inlineParts, practiceItems } from '../src/lesson-render.js';

test('markdown: headings, paragraphs, lists, fenced code and display math', () => {
  const blocks = markdownBlocks('## Title\nOne line\nsame paragraph.\n\n- a\n- b\n\n1. x\n2. y\n\n```python\nR = V / I\n```\n\n$$V = IR$$\n\n$$\nP = VI\n$$');
  assert.deepEqual(blocks.map(b => b.type), ['h', 'p', 'ul', 'ol', 'code', 'math', 'math']);
  assert.equal(blocks[1].text, 'One line same paragraph.'); assert.deepEqual(blocks[2].items, ['a', 'b']);
  assert.deepEqual(blocks[4], { type: 'code', lang: 'python', text: 'R = V / I' });
  assert.equal(blocks[5].text, 'V = IR'); assert.equal(blocks[6].text, 'P = VI');
});

test('inline: math, code, bold and italics; anything else stays text', () => {
  assert.deepEqual(inlineParts('Use $V = IR$ and `R = V/I`, **always** with *units*.').map(p => p.t), ['text', 'math', 'text', 'code', 'text', 'b', 'text', 'i', 'text']);
  assert.deepEqual(inlineParts('<img src=x onerror=alert(1)> [link](http://x)'), [{ t: 'text', text: '<img src=x onerror=alert(1)> [link](http://x)' }]);
  assert.equal(inlineParts(String.raw`a \(x^2\) b`)[1].text, 'x^2');
});

test('review sessions reuse the cached lesson\'s practice, the same items every time', () => {
  const content = JSON.parse(readFileSync(new URL('./fixtures/ai-lesson.json', import.meta.url), 'utf8'));
  const items = practiceItems({ ai: { content } });
  assert.equal(items.length, 6); assert.match(items[0].question, /20 V/); assert.match(items[0].answer, /10 Ω/);
  assert.deepEqual(practiceItems({ ai: { content } }), items);
  assert.deepEqual(practiceItems({ archive: { content: { lesson: { practice: { question: 'q', answer: 'a' } } } } }), [{ question: 'q', answer: 'a' }]);
  assert.deepEqual(practiceItems({}), []);
});
