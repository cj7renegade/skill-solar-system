// Regenerates the readable Edition 06 lesson document and full content ledger from the
// authoritative payload. Source records and baseline evidence are never modified.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT=path.resolve(import.meta.dirname,'..','..');
const DIR=path.join(ROOT,'packages','repeatable-work-system-learning-edition-06');
const doc=JSON.parse(readFileSync(path.join(DIR,'Repeatable-Work-System-Lessons-06.json'),'utf8'));
const base=JSON.parse(readFileSync(path.join(DIR,'baseline','Confirmed-Edition05-Export.json'),'utf8'));
const added=new Map(doc.lessons.map(lesson=>[lesson.id,lesson]));
const csv=value=>/[",\n]/.test(String(value))?`"${String(value).replaceAll('"','""')}"`:String(value);

const cards=['# Robotics Repeatable Work System - Learning Edition 06','',
  'Six introductory cards close the I05 prerequisite chain. They do not mark proficiency or demonstrate a physical robot. Synthetic exercises are preparation only; every physical demonstration remains separate.',''];
for(const lesson of doc.lessons){
  cards.push(`## ${lesson.id} - ${lesson.name}`,'',`**Prerequisites:** ${lesson.requires.join(', ') || 'None'}`,'',`**Why it matters:** ${lesson.why_it_matters}`,'',lesson.explanation,'',`**Worked example:** ${lesson.worked_example}`,'',`**Practice:** ${lesson.practice.question}`,'',`<details><summary>Practice answer</summary>\n\n${lesson.practice.answer}\n\n</details>`,'',`**Boundary or misconception check:** ${lesson.boundary_case.question}`,'',`<details><summary>Boundary answer</summary>\n\n${lesson.boundary_case.answer}\n\n</details>`,'',`**Full demonstration:** ${lesson.full_demonstration}`,'',`**Evidence expectations:** ${lesson.assessment_contract.acceptance} Record ${lesson.assessment_contract.evidence_record.join('; ')}.`,'',`**Practice mode:** ${lesson.practice_mode}`,'',`**Remaining work:** ${lesson.required_future_work}`,'');
}
writeFileSync(path.join(DIR,'Repeatable-Work-System-Learning-Edition-06.md'),cards.join('\n')+'\n');

const rows=[['Planning ID','Name','Authoring status','Integration evidence']];
for(const node of base.nodes){
  const lesson=added.get(node.planningId);
  rows.push([node.planningId,node.name,lesson?'introductory card authored':node.contentStatus==='introductory lesson authored'?'introductory card authored':node.contentStatus==='roadmap note, not assessed'?'roadmap note, not assessed':'introductory card pending',lesson?'Edition 06 package; integration pending':node.lesson?'confirmed Edition 05 export':'confirmed Edition 05 export']);
}
writeFileSync(path.join(DIR,'Content-Status-Ledger.csv'),rows.map(row=>row.map(csv).join(',')).join('\r\n')+'\r\n');
console.log(`Wrote ${doc.lessons.length} readable cards and ${base.nodes.length} ledger rows.`);
