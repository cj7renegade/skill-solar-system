import test from 'node:test';
import assert from 'node:assert/strict';
import {spacingValue,displayPosition,storedPosition,spacingCameraShift} from '../src/spacing.js';
test('spacing changes separation without modifying the saved positions',()=>{
  const a=[-30,60,10],b=[50,100,-20],copy=[...a];
  const distance=(x,y)=>Math.hypot(...x.map((v,i)=>v-y[i]));
  for(const factor of [.5,1,2,4])assert(Math.abs(distance(displayPosition(a,factor),displayPosition(b,factor))-distance(a,b)*factor)<1e-9);
  assert.deepEqual(a,copy);
});
test('drag coordinates round trip at every supported slider step',()=>{
  for(let i=10;i<=80;i++){
    const factor=i/20,point=[-193.2,773.4,1200.8];
    const result=storedPosition(displayPosition(point,factor),factor);
    result.forEach((v,j)=>assert(Math.abs(v-point[j])<1e-9));
  }
});
test('spacing retains camera offset and the point under the orbit target',()=>{
  const target=[100,200,-50],camera=[400,500,900];
  const shift=spacingCameraShift(target,1,3);
  const newTarget=target.map((v,i)=>v+shift[i]),newCamera=camera.map((v,i)=>v+shift[i]);
  assert.deepEqual(newTarget,displayPosition(target,3));
  assert.deepEqual(newCamera.map((v,i)=>v-newTarget[i]),camera.map((v,i)=>v-target[i]));
  spacingCameraShift(newTarget,3,1).forEach((v,i)=>assert(Math.abs(v+shift[i])<1e-9));
});
test('invalid or excessive spacing cannot collapse or invert the layout',()=>{
  assert.equal(spacingValue(NaN),1);assert.equal(spacingValue(Infinity),1);
  assert.equal(spacingValue(-2),.5);assert.equal(spacingValue(100),4);assert.equal(spacingValue('2.5'),2.5);
});
