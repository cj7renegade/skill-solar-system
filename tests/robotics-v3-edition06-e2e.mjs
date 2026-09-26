// Electron checks for the six Edition 06 cards in an isolated profile.
import { copyFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';

const source=process.env.SSS_V3_MAP;
if(!source){console.log('Skipped: set SSS_V3_MAP to the integrated Robotics V3 export.');process.exit(0);}
const {check,passed}=checker();const app=await launchApp('sss-v3-e06-');
try{
  const {evaluate,open,pageErrors}=app;const file=path.join(app.dir,'robotics-v3.json');copyFileSync(source,file);const data=JSON.parse(readFileSync(source,'utf8'));
  await open(file);
  const ids=['rob3:Q06','rob3:B-D08','rob3:E11','rob3:V06','rob3:V07','rob3:I05'];
  const answer=id=>evaluate(`JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.find(n=>n.id===${JSON.stringify(id)}).proficiency80`);
  for(const id of ids){
    const node=data.nodes.find(n=>n.id===id),name=JSON.stringify(node.name);
    await evaluate(`(()=>{[...document.querySelectorAll('.node-item')].find(b=>b.textContent===${name}).click();[...document.querySelectorAll('#inspector button')].find(b=>b.textContent==='Read subject details').click()})()`);await sleep(160);
    const text=await evaluate(`document.getElementById('details-body').innerText`);
    check(`${id} opens with its authored lesson`,text.includes('Explanation and worked example')&&text.includes('Practice question')&&text.includes('Full demonstration and evidence'));
    check(`${id} distinguishes introductory from full evidence`,/synthetic/i.test(node.lesson.practice_mode)&&/physical|actual/i.test(node.lesson.practice_mode));
    check(`${id} begins with answers hidden`,await evaluate(`document.querySelectorAll('#details-body .lesson-answer:not([hidden])').length`)===0);
    await evaluate(`document.querySelector('#details-body details.lesson-section:nth-of-type(3)').open=true;document.querySelector('#details-body button.reveal').click()`);await sleep(40);
    check(`${id} reveals an answer without proficiency`,await evaluate(`document.querySelectorAll('#details-body .lesson-answer:not([hidden])').length`)===1&&await answer(id)===null);
    await evaluate(`document.getElementById('details-dialog').close()`);
  }
  const thermal=await evaluate(`JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.find(n=>n.id==='rob3:B-D08').details`);
  check('thermal symbols and model terms survive import',thermal.includes('DeltaTss=P*Rth')&&thermal.includes('tau=Rth*Cth')&&thermal.includes('exp(-t/tau)'));
  check('map has 298 authored / 82 pending / 1 roadmap',data.nodes.filter(n=>n.lesson).length===298&&data.nodes.filter(n=>n.contentStatus==='introductory lesson pending').length===82&&data.nodes.filter(n=>n.contentStatus==='roadmap note, not assessed').length===1);
  check('no uncaught page errors',pageErrors.length===0,pageErrors.join('\n'));
  console.log(`\n${passed.length} Edition 06 Electron checks passed.`);
}finally{await app.stop();}
