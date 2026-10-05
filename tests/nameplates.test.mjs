import test from 'node:test';
import assert from 'node:assert/strict';
import {nameplateProjection, nameplateReadable, LABEL_TEXT_PX, MIN_READABLE_TEXT_PX} from '../src/nameplates.js';
import {readFileSync} from 'node:fs';
const projection=1/Math.tan(43*Math.PI/360);
const close=(a,b)=>assert(Math.abs(a-b)<1e-10);
test('doubling depth halves the entire nameplate and sphere-to-label gap',()=>{
 const near=nameplateProjection(800,projection,1000),far=nameplateProjection(800,projection,2000);
 close(near.scale,far.scale*2);close(near.offsetY,far.offsetY*2);
});
test('label-to-sphere proportion is constant across viewport, zoom, depth and selection',()=>{
 for(const height of [400,800,1600])for(const zoom of [.5,1,2])for(const depth of [50,500,5000,50000])for(const selectedScale of [1,1.35]){
   const plate=nameplateProjection(height,projection*zoom,depth,selectedScale);
   const projectedSphereDiameter=16*selectedScale*height*projection*zoom/(2*depth);
   close(11*plate.scale/projectedSphereDiameter,11/16);
   close(plate.offsetY/projectedSphereDiameter,11/16);
 }
});
test('far labels have no fixed pixel floor and near labels have no fixed pixel cap',()=>{
 assert(nameplateProjection(800,projection,100000).scale<.02);
 assert(nameplateProjection(800,projection,10).scale>50);
});
test('behind-camera and invalid projections are hidden',()=>{
 for(const depth of [0,-100,NaN,Infinity])assert.equal(nameplateProjection(800,projection,depth),null);
 assert.equal(nameplateProjection(0,projection,100),null);
});

test('a nameplate too small to read is skipped, except the selected one',()=>{
 const scale=s=>({scale:s,offsetY:11*s});
 assert.equal(LABEL_TEXT_PX*.3<MIN_READABLE_TEXT_PX,true);
 assert.equal(nameplateReadable(scale(.3)),false);
 assert.equal(nameplateReadable(scale(.3),true),true);
 assert.equal(nameplateReadable(scale(MIN_READABLE_TEXT_PX/LABEL_TEXT_PX)),true);
 assert.equal(nameplateReadable(scale(1)),true);
 assert.equal(nameplateReadable(null,true),false);
});
test('the frame no longer recomputes whole-map values',()=>{
 const viewer=readFileSync(new URL('../src/viewer.js',import.meta.url),'utf8');
 const draw=viewer.slice(viewer.indexOf('function draw()'),viewer.indexOf("controls.addEventListener('change',draw)"));
 assert.doesNotMatch(draw,/objects\.map/);
 assert.doesNotMatch(viewer.slice(viewer.indexOf('function navigation()'),viewer.indexOf('const syncPanSpeed')),/objects\.map/);
});
