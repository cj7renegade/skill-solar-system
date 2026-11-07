// End-to-end test launcher: isolates userData (never touches a real draft cache or shared
// proficiency record), replaces the native save dialog with a fixed path in the test folder, then
// runs the real desktop/main.cjs. SSS_FAIL_PROFICIENCY_WRITES=1 makes shared-record writes fail,
// to test how the app reports a failed write.
const { app, dialog } = require('electron');
const path = require('node:path');
const dir = process.env.SSS_E2E_DIR;
app.setPath('userData', path.join(dir, 'userdata'));
// The "Your maps" dropdown lists this folder instead of the real Maps folder, unless a test sets it.
process.env.SSS_MAPS_DIR ||= path.join(dir, 'maps');
dialog.showSaveDialog = async () => ({ canceled: false, filePath: path.join(dir, 'saved.json') });
dialog.showMessageBoxSync = () => 1;
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path.join(dir, 'saved.json')] });
if (process.env.SSS_FAIL_PROFICIENCY_WRITES === '1') {
  const fs = require('node:fs/promises'), rename = fs.rename;
  fs.rename = async (from, to) => {
    if (String(to).includes(`${path.sep}proficiency${path.sep}`)) throw Object.assign(Error('Simulated disk failure'), { code: 'EIO' });
    return rename(from, to);
  };
}
// SSS_GUIDE_FAKE=1 replaces the Guide's Claude client with a scripted one, so no request leaves the
// computer. The test turns the "network" off and on with guide-net.json in the test folder, and every
// request the Guide would have sent is appended to guide-requests.jsonl for the test to read.
if (process.env.SSS_GUIDE_FAKE === '1') {
  const fs = require('node:fs'), SDK = require('@anthropic-ai/sdk');
  const up = () => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'guide-net.json'), 'utf8')).up !== false; } catch { return true; } };
  const down = () => new SDK.APIConnectionError({ message: 'Connection error.' });
  global.__sssGuideClient = () => ({
    models: { retrieve: async id => { if (!up()) throw down(); return { id }; } },
    beta: { messages: { stream: params => {
      fs.appendFileSync(path.join(dir, 'guide-requests.jsonl'), JSON.stringify(params) + '\n');
      const handlers = [], last = params.messages[params.messages.length - 1];
      const toolResult = Array.isArray(last.content) && last.content.find(b => b.type === 'tool_result');
      let content;
      // Lesson requests use structured output: the lesson itself, the answer check, or a repaired
      // problem. The scripted lesson is tests/fixtures/ai-lesson.json; the check agrees with its key.
      const format = params.output_config?.format?.schema;
      const lesson = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'ai-lesson.json'), 'utf8'));
      if (format?.properties?.answers) {
        const problems = JSON.parse(params.messages[0].content.split('<problems>')[1].split('</problems>')[0]);
        const key = new Map([...lesson().guidedPractice, ...lesson().independentPractice].map(p => [p.id, p]));
        content = [{ type: 'text', text: JSON.stringify({ answers: problems.map(p => ({ id: p.id, answer: key.get(p.id).answer, finalValue: key.get(p.id).finalValue, unit: key.get(p.id).unit })) }) }];
      } else if (format?.properties?.objectives) content = [{ type: 'text', text: JSON.stringify(lesson()) }];
      // A request without tools is the notes summary.
      else if (!params.tools) content = [{ type: 'text', text: '- Goal: reach First milestone.\n- Studies about 6 hours a week.' }];
      else if (toolResult) {
        const result = JSON.parse(toolResult.content), first = result.next?.[0];
        content = [{ type: 'text', text: first ? `Start with [${first.name}](skill:${first.id}).\n\n- It is ready now.\n- Then [Path to ${result.target.name}](path:${result.target.id}).` : 'Nothing is ready.' }];
      } else content = [{ type: 'thinking', thinking: '', signature: 'fake' }, { type: 'tool_use', id: `tool-${Date.now()}`, name: 'next_up', input: {} }];
      return { on: (event, fn) => { if (event === 'text') handlers.push(fn); },
        finalMessage: async () => {
          if (!up()) throw down();
          await new Promise(r => setTimeout(r, 150));
          for (const b of content) if (b.type === 'text') for (const h of handlers) h(b.text);
          return { content, stop_reason: content.some(b => b.type === 'tool_use') ? 'tool_use' : 'end_turn', model: params.model, usage: { input_tokens: 2000, output_tokens: 200 } };
        } };
    } } }
  });
}
require(path.join(__dirname, '..', 'desktop', 'main.cjs'));
