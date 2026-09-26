import test from 'node:test';
import assert from 'node:assert/strict';
import { findSkills, FIND_LIMIT } from '../src/find.js';

const node = name => ({ id: name.toLowerCase().replace(/\W+/g, '-'), name, domain: 'Computing' });
const nodes = [node('Loops and iteration'), node('Variables and assignment'), node('Lists, dictionaries, and sets'), node('Recursion'), node('Conditional branching'), node('Reading and writing files')];
const names = list => list.map(n => n.name);

test('an empty or blank query matches nothing, so the list stays closed until you type', () => {
  for (const query of ['', '   ', null, undefined]) assert.deepEqual(findSkills(nodes, query), []);
});

test('matching ignores case and finds text anywhere in the name', () => {
  assert.deepEqual(names(findSkills(nodes, 'RECURSION')), ['Recursion']);
  assert.deepEqual(names(findSkills(nodes, 'and')), ['Lists, dictionaries, and sets', 'Loops and iteration', 'Reading and writing files', 'Variables and assignment']);
  assert.deepEqual(findSkills(nodes, 'quantum'), []);
});

test('names that begin with the query come first, each group in alphabetical order', () => {
  // Reading and Recursion begin with "r"; the others contain it in branching, dictionaries,
  // iteration and Variables, so they follow, alphabetically.
  assert.deepEqual(names(findSkills(nodes, 'r')), ['Reading and writing files', 'Recursion', 'Conditional branching', 'Lists, dictionaries, and sets', 'Loops and iteration', 'Variables and assignment']);
  // Only one name contains "li": matching is a plain substring, so "files" and "Variables" do not count.
  assert.deepEqual(names(findSkills(nodes, 'li')), ['Lists, dictionaries, and sets']);
});

test('the list is capped so it cannot cover the map', () => {
  const many = Array.from({ length: 40 }, (_, i) => node(`Skill ${String(i).padStart(2, '0')}`));
  assert.equal(findSkills(many, 'skill').length, FIND_LIMIT);
  assert.equal(findSkills(many, 'skill', 3).length, 3);
  assert.deepEqual(findSkills(many, 'skill', 0), []);
});

test('searching never changes the map and tolerates missing data', () => {
  const before = JSON.stringify(nodes);
  findSkills(nodes, 'loops');
  assert.equal(JSON.stringify(nodes), before);
  assert.deepEqual(findSkills(null, 'loops'), []);
  assert.deepEqual(findSkills([{ id: 'x' }], 'loops'), []);
});
