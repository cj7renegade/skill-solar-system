import test from 'node:test';
import assert from 'node:assert/strict';
import { starter } from '../src/starter.js';
import { normalize, validate, clone, arrange, nodeColor, DOMAINS, positionExplanation } from '../src/model.js';
import { panOffset } from '../src/camera.js';
test('old maps migrate without modifying original nodes, edges, or coordinates',()=>{
 const before=clone(starter), upgraded=normalize(starter);
 assert.deepEqual(starter,before);
 assert.deepEqual(upgraded.edges,starter.edges);
 for(const old of starter.nodes){const n=upgraded.nodes.find(n=>n.id===old.id);for(const key of Object.keys(old))assert.deepEqual(n[key],old[key]);assert.equal(n.proficiency80,null);assert.equal(n.details.split('\n\n').length,2);assert.ok(n.icon);}
});
test('Yes and No and unmarked remain distinct through save and normalization',()=>{
 const g=normalize(starter);g.nodes[0].proficiency80=true;g.nodes[1].proficiency80=false;
 const reopened=normalize(JSON.parse(JSON.stringify(g)));
 assert.equal(reopened.nodes[0].proficiency80,true);assert.equal(reopened.nodes[1].proficiency80,false);assert.equal(reopened.nodes[2].proficiency80,null);
 assert.deepEqual(normalize(reopened),reopened);
});
test('custom details and icons survive normalization and layout',()=>{
 const g=normalize(starter);Object.assign(g.nodes[0],{details:'My first paragraph\n\nMy second paragraph',icon:'robot',placementNote:'My anchor',proficiency80:true,pinned:true});
 assert.deepEqual(arrange(normalize(g)).nodes[0],g.nodes[0]);
});
test('unknown custom nodes receive an icon but no invented detailed prose',()=>{
 const g=clone(starter);g.nodes[0].id='custom';g.edges=g.edges.filter(e=>e.source!=='arithmetic');
 const n=normalize(g).nodes[0];assert.equal(n.icon,'function');assert.equal(n.details,'');
});
test('rejects malformed proficiency and details rather than treating false as empty',()=>{
 for(const value of ['yes',80,{},0]){const g=clone(starter);g.nodes[0].proficiency80=value;assert.throws(()=>validate(g),/Proficiency/);}
 const g=clone(starter);g.nodes[0].details=99;assert.throws(()=>validate(g),/details/);
});
test('map toggle uses three statuses and restores domain colors without data changes',()=>{
 const g=normalize(starter),n=g.nodes[0],before=clone(g);
 const colors=[true,false,null].map(value=>nodeColor({...n,proficiency80:value},true));
 assert.equal(new Set(colors).size,2);assert.equal(colors[1],colors[2],'unanswered skills share the red of No');assert.notEqual(colors[0],colors[1],'marked Yes stands out');
 assert.equal(nodeColor(n,false),DOMAINS[n.domain]);assert.deepEqual(g,before);
});
test('position explanation follows real changes and distinguishes layout provenance',()=>{
 const g=normalize(starter), n=g.nodes[0];n.position=[123,456,789];n.layoutMode='manual';
 assert.match(positionExplanation(g,n),/123, 456, 789/);assert.match(positionExplanation(g,n),/placed manually/);
 const a=arrange(g);assert.match(positionExplanation(a,a.nodes[0]),/Arrange by prerequisites/);
 assert.match(positionExplanation(g,g.nodes.find(n=>n.id==='calculus')),/Algebra/);
});
test('camera pan moves position and target equally, preserving angle and distance',()=>{
 const right=[0,0,-1],up=[0,1,0],camera=[20,10,0],target=[0,0,0];
 const delta=panOffset(right,up,1,1,Math.SQRT2);assert.ok(delta.every((v,i)=>Math.abs(v-[0,1,-1][i])<1e-12));
 const moved=camera.map((v,i)=>v+delta[i]),aim=target.map((v,i)=>v+delta[i]);
 assert.deepEqual(moved.map((v,i)=>v-aim[i]),camera.map((v,i)=>v-target[i]));
 const reverse=panOffset(right,up,-1,-1,Math.SQRT2);assert.ok(delta.every((v,i)=>Math.abs(v+reverse[i])<1e-10));
});
