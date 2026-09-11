import test from 'node:test';
import assert from 'node:assert/strict';
import { starter } from '../src/starter.js';
import { clone, normalize, validate, positionExplanation } from '../src/model.js';
import { referenceLevels, arrangeVortex } from '../src/vortex.js';
const chain=count=>({schemaVersion:1,nodes:Array.from({length:count},(_,i)=>({id:String(i),name:`Skill ${i}`,domain:'Physics',description:'Scope',position:[i,0,0],pinned:false,proficiency80:null})),edges:Array.from({length:Math.max(0,count-1)},(_,i)=>({source:String(i),target:String(i+1),type:'prerequisite'}))});
test('spiral is deterministic, nonmutating, and normalizes old maps without assigning mastery',()=>{
 const g=clone(starter),before=clone(g),out=arrangeVortex(g);
 assert.deepEqual(g,before);assert.deepEqual(out,arrangeVortex(g));
 assert.deepEqual(out,arrangeVortex(out));assert.equal(normalize(out).nodes[0].proficiency80,null);
 assert.match(positionExplanation(out,out.nodes[0]),/spiral placement/);
 for(const n of out.nodes){assert.ok(n.skillLevel>=1&&n.skillLevel<=100);assert.equal(n.position[1],(n.skillLevel-1)*64);}
});
test('every prerequisite ascends, while supporting links impose no level requirement',()=>{
 const g=chain(12);g.edges.push({source:'11',target:'0',type:'supports'});const r=referenceLevels(g);
 assert.equal(r.get('0'),1);assert.equal(r.get('11'),34);
 for(const e of g.edges.filter(e=>e.type==='prerequisite'))assert.ok(r.get(e.source)<r.get(e.target));
});
test('manual levels reconcile upward, recalculation resets them, and pins preserve exact coordinates',()=>{
 const g=chain(3);g.nodes[0].skillLevel=40;g.nodes[1].skillLevel=20;g.nodes[1].pinned=true;g.nodes[1].proficiency80=true;
 const out=arrangeVortex(g);assert.deepEqual(out.nodes.map(n=>n.skillLevel),[40,41,42]);assert.deepEqual(out.nodes[1].position,g.nodes[1].position);assert.equal(out.nodes[1].proficiency80,true);
 const reset=arrangeVortex(g,{recalculate:true});assert.deepEqual(reset.nodes.map(n=>n.skillLevel),[1,4,7]);
 assert.deepEqual(normalize(JSON.parse(JSON.stringify(out))),normalize(out));
});
test('invalid reference levels and impossible strict chains are rejected, not silently clamped',()=>{
 for(const level of [0,101,1.5,'30',NaN]){const g=chain(1);g.nodes[0].skillLevel=level;assert.throws(()=>validate(g),/Reference level/);}
 assert.throws(()=>arrangeVortex(chain(101)),/more than 100/);
 assert.equal(arrangeVortex(chain(100)).nodes.at(-1).skillLevel,100);
 const g=chain(2);g.nodes[0].skillLevel=100;assert.throws(()=>arrangeVortex(g),/No level above/);
});
test('many peers receive unique separated positions and empty maps remain valid',()=>{
 const g=chain(180);g.edges=[];for(const n of g.nodes)n.skillLevel=22;
 const out=arrangeVortex(g);let nearest=Infinity;
 for(let i=0;i<out.nodes.length;i++)for(let j=0;j<i;j++)nearest=Math.min(nearest,Math.hypot(...out.nodes[i].position.map((v,k)=>v-out.nodes[j].position[k])));
 assert.ok(nearest>50,`minimum ${nearest}`);assert.deepEqual(arrangeVortex(chain(0)).nodes,[]);
});
