import test from 'node:test';
import assert from 'node:assert/strict';
import { panDirection, createActivationTracker } from '../src/interaction.js';

test('WASD and arrow keys have matching screen-space directions',()=>{
 for(const [letter,arrow]of [['w','ArrowUp'],['s','ArrowDown'],['a','ArrowLeft'],['d','ArrowRight']]){
   assert.deepEqual(panDirection(letter),panDirection(arrow));
   assert.deepEqual(panDirection(letter.toUpperCase()),panDirection(arrow));
 }
 assert.equal(panDirection('Enter'),null);
});
test('single clicks select immediately and the second click opens the same skill',()=>{
 const tracker=createActivationTracker();
 assert.equal(tracker.click('algebra',100,100,0),'select');
 assert.equal(tracker.click('algebra',102,101,200),'open');
 assert.equal(tracker.click('algebra',102,101,300),'select');
});
test('different skills, distant clicks, and slow clicks do not open cards',()=>{
 const t=createActivationTracker();
 t.click('algebra',0,0,0);assert.equal(t.click('physics',0,0,100),'select');
 assert.equal(t.click('physics',20,0,200),'select');
 assert.equal(t.click('physics',20,0,900),'select');
});
test('empty space and drag reset break a double-click sequence',()=>{
 const t=createActivationTracker();
 t.click('a',0,0,0);t.click(null,0,0,100);assert.equal(t.click('a',0,0,200),'select');
 t.reset();assert.equal(t.click('a',0,0,250),'select');
});
