import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleConnections} from '../src/connections.js';
const edges=[{source:'a',target:'b',type:'prerequisite'},{source:'b',target:'c',type:'supports'},{source:'d',target:'b',type:'related'},{source:'c',target:'e',type:'prerequisite'}];
test('default hides connections until a skill is selected',()=>{
 assert.deepEqual(visibleConnections(edges,null),[]);
 assert.deepEqual(visibleConnections(edges,undefined),[]);
});
test('selection reveals incoming and outgoing edges of every type, with no second-hop edges',()=>{
 assert.deepEqual(visibleConnections(edges,'b'),edges.slice(0,3));
 assert.deepEqual(visibleConnections(edges,'a'),[edges[0]]);
 assert.deepEqual(visibleConnections(edges,'isolated'),[]);
});
test('turning selection-only off shows all connections and preserves map data',()=>{
 const before=JSON.stringify(edges);
 assert.deepEqual(visibleConnections(edges,null,false),edges);
 assert.deepEqual(visibleConnections(edges,'b',false),edges);
 visibleConnections(edges,'b');assert.equal(JSON.stringify(edges),before);
});
