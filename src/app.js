import { arrangeVortex } from './vortex.js';
import { DOMAINS, TYPES, clone, validate, normalize, arrange, removeNode, editedPosition, positionExplanation, placementSummary, LEVEL_NOTE, proficiencyLabel, nodeColor, PROFICIENCY_COLORS } from './model.js';
import { spacingValue } from './spacing.js';
import { findSkills } from './find.js';
import { starter } from './starter.js';
import { createViewer } from './viewer.js';
import { ICONS, iconElement } from './icons.js';
import { panDirection, createActivationTracker } from './interaction.js';
import { createReviewDialog } from './review-dialog.js';
import { domainCounts, toggleSubject, pruneSubjects } from './highlight.js';
import { atlasFamily, emptyRecord, reconcile, recordAnswers, diffProficiency, validateRecord, mergeImport, adoptFileAnswers, recordSummary } from './proficiency.js';
import { createRecordStore } from './proficiency-store.js';

const $=id=>document.getElementById(id), CACHE='skill-solar-system-v1';
let graph=normalize(starter),selected=null,editing=false,dirty=false,history=[],redo=[],viewer,proficiencyOn=false,subjects=new Set();
const listActivation=createActivationTracker();
const SPACING_CACHE='skill-solar-system-spacing';
// Which panels the user has collapsed. Both start open, so nothing is hidden on a first run.
const PANELS_CACHE='skill-solar-system-panels-v1';
let panels={tools:true,card:true};
try{const saved=JSON.parse(localStorage.getItem(PANELS_CACHE)||'{}');panels={...panels,...saved};}catch{}
const savePanels=()=>{try{localStorage.setItem(PANELS_CACHE,JSON.stringify(panels));}catch{}};
let spacing=1,spacingFrame=null;
try{const saved=localStorage.getItem(SPACING_CACHE);if(saved!==null)spacing=spacingValue(saved);}catch{}
const message=text=>{$('status').textContent=text;};
try {const saved=localStorage.getItem(CACHE);if(saved){graph=normalize(JSON.parse(saved));dirty=true;message('Recovered local draft. Save map for a portable copy.');}}catch{message('No readable draft found. Open a saved JSON file to recover your work.');}
const emptyInspector=$('inspector').cloneNode(true);
try { viewer=createViewer($('canvas'),$('labels'),id=>{selected=id;render();},(id,position)=>{change(next=>{Object.assign(next.nodes.find(n=>n.id===id),{position,layoutMode:'manual'});},'Node moved.');},id=>{selected=id;openDetails();}); }
catch(error){$('render-error').hidden=false;$('render-error').textContent='3D view could not start. Enable hardware acceleration / WebGL in your graphics settings. The data console remains available. '+error.message;}
function el(tag,props={},...children){const node=document.createElement(tag);for(const [key,value]of Object.entries(props)){if(key==='text')node.textContent=value;else if(key.startsWith('on'))node.addEventListener(key.slice(2),value);else if(key==='class')node.className=value;else node[key]=value;}for(const child of children)if(child)node.append(child);return node;}
function options(values,current){return values.map(value=>el('option',{value,text:value,selected:value===current}));}
function field(title,input){return el('label',{class:'field'},document.createTextNode(title),input);}
function cache(){try{localStorage.setItem(CACHE,JSON.stringify(graph));return true;}catch{message('Draft cache unavailable. Save map to a JSON file now.');return false;}}
const safeStorage={getItem:key=>{try{return localStorage.getItem(key);}catch{return null;}},setItem:(key,value)=>localStorage.setItem(key,value)};

// Shared offline proficiency: one record per atlas family, stored outside map files. An opened map
// takes the shared answers, and every proficiency change in the open map is written back through
// commit() (console, guided review, edit mode, Undo/Redo). Nothing else in a map is shared.
const records=createRecordStore(window.desktop?.proficiency,safeStorage);
let family=null,record=null,recordError=null,fileAnswers=null,writes=Promise.resolve(),sync='none',syncDetail='';
function setSync(state,detail=''){sync=state;syncDetail=detail;renderShared();}
function persistRecord(){
  if(!record)return Promise.resolve(false);
  const snapshot=record;setSync('saving');
  writes=writes.then(()=>records.save(snapshot.family,snapshot)).then(()=>{if(record===snapshot)setSync('saved');return true;},error=>{
    const reason=String(error?.message||error).replace(/^Error invoking remote method '[^']+': (Error: )?/,'').replace(/\.$/,'');
    setSync('failed',reason);
    message(`Shared proficiency was NOT saved on ${records.location}: ${reason}. The answer is in this map and its local draft; use Retry in the footer.`);
    return false;
  });
  return writes;
}
async function loadRecord(map){
  const next=atlasFamily(map);
  if(next!==family){family=next;record=null;recordError=null;}
  if(!family){setSync('none');return null;}
  if(record)return record;
  try{record=(await records.load(family))||emptyRecord(family);recordError=null;if(sync!=='saving')setSync('ready');return record;}
  catch(error){record=null;recordError=error.message||String(error);setSync('unreadable',recordError);return null;}
}
const plural=(n,word)=>`${n} ${word}${n===1?'':'s'}`;
// Applies shared answers to a validated map and returns the effective map with a short status note.
async function applyShared(map){
  const shared=await loadRecord(map);
  if(!shared)return {graph:map,changed:0,note:family?` Shared proficiency is unavailable (${recordError}); answers stay in this map only.`:''};
  const result=reconcile(map,shared,{map:map.title||null});
  if(result.adopted.length){record=result.record;persistRecord();}
  const notes=[];
  if(result.applied.length)notes.push(`Applied shared proficiency to ${plural(result.applied.length,'skill')}.`);
  if(result.adopted.length)notes.push(`Added ${plural(result.adopted.length,'answer')} from this map to the shared record.`);
  return {graph:result.graph,changed:result.applied.length,note:notes.length?' '+notes.join(' '):''};
}
function shareChanges(before,after,source){
  if(!family||atlasFamily(after)!==family)return '';
  const changes=diffProficiency(before,after);if(!changes.length)return '';
  if(!record){setSync('unreadable',recordError||'The shared record is not loaded.');return ' The shared record is unavailable, so this change stays in this map only.';}
  record=recordAnswers(record,changes,{source,map:after.title||null});persistRecord();
  return '';
}
function setProficiency(next,values){for(const n of next.nodes)if(values.has(n.id))n.proficiency80=values.get(n.id);}

function change(mutator,status){if(editing)commit(mutator,status);}
function commit(mutator,status,source='edit',{share=true}={}){
  try{const previous=graph,next=clone(graph);mutator(next);const normalized=normalize(next);history.push(clone(graph));if(history.length>50)history.shift();redo=[];graph=normalized;dirty=true;const cached=cache();const note=share?shareChanges(previous,normalized,source):'';render();message(`${status}${note}${cached?'':' Draft cache unavailable: save the map to a JSON file now.'}`);return {ok:true,cached};}
  catch(error){message(error.message);return {ok:false,cached:false};}
}
function replace(next,status){
  listActivation.reset();closeDetails();
  const normalized=normalize(next);history.push(clone(graph));if(history.length>50)history.shift();redo=[];graph=normalized;selected=null;dirty=true;subjects=pruneSubjects(subjects,graph);cache();render();viewer?.highlight(subjects);viewer?.fit();message(status);
}
function render(){
  if(!graph.nodes.some(n=>n.id===selected))selected=null;
  $('counts').textContent=`${graph.nodes.length} subjects / ${graph.edges.length} connections`;
  $('dirty').textContent=dirty?'Local draft · save to file':'Saved to file';
  $('map-name').textContent=graph.title||'Untitled map';
  $('layout-summary').textContent=graph.nodes.some(n=>n.layoutMode==='vortex')?'Upward: reference level · Around: domain · Proficiency is separate':'Foundations below. Connections above.';
  viewer?.setGraph(graph,selected);viewer?.setEdit(editing);
  renderLegend();renderList();inspect();renderShared();if($('details-dialog').open)fillDetails();document.querySelectorAll('[data-edit]').forEach(button=>button.disabled=!editing);
  $('undo').disabled=!editing||!history.length;$('redo').disabled=!editing||!redo.length;
}
function renderList(){
  const scrollTop=$('node-list').scrollTop;
  const query=$('search').value.trim().toLowerCase();$('node-list').replaceChildren();
  const nodes=graph.nodes.filter(n=>n.name.toLowerCase().includes(query)).sort((a,b)=>a.name.localeCompare(b.name));
  for(const n of nodes){const dot=el('span',{class:'dot'});dot.style.background=nodeColor(n,proficiencyOn);$('node-list').append(el('button',{class:'node-item'+(selected===n.id?' selected':''),onclick:event=>{const action=listActivation.click(n.id,event.clientX,event.clientY,performance.now());selected=n.id;render();viewer?.focus(n.id);if(action==='open'&&!editing)openDetails();}},dot,document.createTextNode(n.name)));}
  if(!nodes.length)$('node-list').append(el('p',{class:'caption',text:'No subjects found.'}));
  $('node-list').scrollTop=scrollTop;
}
function inspect(){
  const panel=$('inspector');panel.replaceChildren();const n=graph.nodes.find(n=>n.id===selected);
  if(!n){panel.append(...[...emptyInspector.childNodes].map(n=>n.cloneNode(true)));return;}
  const cardToggle=el('button',{id:'inspector-toggle',text:panels.card?'▾':'▸',title:panels.card?'Collapse this subject card':'Expand this subject card',ariaLabel:panels.card?'Collapse this subject card':'Expand this subject card',onclick:()=>{panels.card=!panels.card;savePanels();inspect();}});
  cardToggle.setAttribute('aria-expanded',String(panels.card));
  const body=el('div',{class:'inspector-body'});
  panel.classList.toggle('collapsed',!panels.card);
  panel.append(el('div',{class:'inspector-heading'},el('div',{class:'subject-heading'},iconElement(n.icon),el('div',{},el('h3',{text:n.name}),el('p',{class:'edge-note',title:LEVEL_NOTE,text:n.domain+(n.skillLevel!=null?` · Level ${n.skillLevel}/100`:' · Level unassigned')}))),cardToggle),body);
  if(!editing){
    body.append(el('p',{text:n.description}),el('button',{text:'Read subject details',onclick:openDetails}),proficiencyControls(n));
    return;
  }
  const skillLevel=el('input',{type:'number',min:1,max:100,step:1,value:n.skillLevel??'',id:'node-level'});
  const name=el('input',{value:n.name,maxLength:120,disabled:!editing,id:'node-name'});
  const domain=el('select',{disabled:!editing,id:'node-domain'},...options(Object.keys(DOMAINS),n.domain));
  const description=el('textarea',{value:n.description,maxLength:5000,disabled:!editing,id:'node-description'});
  const details=el('textarea',{value:n.details,maxLength:12000,id:'node-details'});
  const note=el('textarea',{value:n.placementNote,maxLength:12000,id:'node-placement-note'});
  const icon=el('select',{id:'node-icon'},...Object.entries(ICONS).map(([value,[text]])=>el('option',{value,text,selected:value===n.icon})));
  const proficiency=el('select',{id:'node-proficiency'},el('option',{value:'unset',text:'Not marked',selected:n.proficiency80===null}),el('option',{value:'yes',text:'Yes',selected:n.proficiency80===true}),el('option',{value:'no',text:'No',selected:n.proficiency80===false}));
  const coords=n.position.map((v,i)=>el('input',{type:'number',value:Math.round(v*100)/100,step:'any',min:-100000,max:100000,disabled:!editing,id:['node-x','node-y','node-z'][i]}));
  const pinned=el('input',{type:'checkbox',checked:n.pinned,disabled:!editing,id:'node-pinned'});
  body.append(field('Subject',name),el('div',{class:'node-id',text:`ID · ${n.id}`}),field('Domain',domain),field('Reference level · 1–100 (blank = unassigned)',skillLevel),el('p',{class:'edge-note',text:'A reference rank, not proficiency. Apply saves the number; Arrange level spiral updates height and raises levels where prerequisites require it.'}),field('Short description',description),field('Detailed description · separate paragraphs with a blank line',details),field('Placement note · optional author explanation',note),field('Console icon',icon),field('Self-reported proficiency of at least 80%',proficiency),el('div',{class:'coords'},...coords.map((c,i)=>field(['X','Y · height','Z'][i],c))),el('p',{class:'edge-note',text:positionExplanation(graph,n)}),el('label',{},pinned,document.createTextNode(' Pin position during arrangement')));
  body.append(el('div',{class:'button-row'},el('button',{text:'Apply changes',disabled:!editing,id:'apply-node',onclick:()=>change(next=>{const target=next.nodes.find(v=>v.id===n.id);if(coords.some(c=>!c.value.trim()))throw Error('Enter all three coordinates.');const position=editedPosition(target.position,coords.map(c=>c.value));if(position.some((v,i)=>v!==target.position[i]))target.layoutMode='manual';Object.assign(target,{skillLevel:skillLevel.value.trim()===''?null:Number(skillLevel.value),details:details.value,placementNote:note.value,icon:icon.value,proficiency80:proficiency.value==='unset'?null:proficiency.value==='yes',name:name.value.trim(),domain:domain.value,description:description.value,pinned:pinned.checked,position});},'Subject updated.')}),el('button',{text:'Delete',class:'danger',disabled:!editing,id:'delete-node',onclick:()=>{if(confirm(`Delete ${n.name} and its connections? Undo is available.`))change(next=>Object.assign(next,removeNode(next,n.id)),'Subject deleted.');}})));
  body.append(el('h3',{text:'Connections'}));
  const links=graph.edges.filter(e=>e.source===n.id||e.target===n.id);
  for(const edge of links){
    const source=graph.nodes.find(x=>x.id===edge.source).name,target=graph.nodes.find(x=>x.id===edge.target).name;
    const verb=edge.type==='prerequisite'?'is prerequisite for':edge.type==='supports'?'supports':'is related to';
    body.append(el('div',{class:'edge-item'},el('span',{text:`${source} ${verb} ${target}`}),el('button',{text:'×',title:'Remove connection',ariaLabel:'Remove connection',disabled:!editing,onclick:()=>change(next=>{next.edges=next.edges.filter(e=>!(e.source===edge.source&&e.target===edge.target&&e.type===edge.type));},'Connection removed.')})));
  }
  if(!links.length)body.append(el('p',{class:'edge-note',text:'No connections yet.'}));
  if(!editing)return;
  const type=el('select',{id:'edge-type'},...options(TYPES,'supports'));
  const direction=el('select',{id:'edge-direction'},el('option',{value:'out',text:'This subject → other subject'}),el('option',{value:'in',text:'Other subject → this subject'}));
  const target=el('select',{id:'edge-target'},...graph.nodes.filter(x=>x.id!==n.id).map(x=>el('option',{value:x.id,text:x.name})));
  body.append(el('h3',{text:'Add a connection'}),field('Relationship',type),field('Direction',direction),field('Other subject',target),el('p',{class:'edge-note',text:'Prerequisite: source must come before target. Supports: directional contribution. Related: no learning order.'}),el('button',{text:'Connect subjects',id:'connect',disabled:graph.nodes.length<2,onclick:()=>change(next=>{next.edges.push({source:direction.value==='out'?n.id:target.value,target:direction.value==='out'?target.value:n.id,type:type.value});},'Connection added.')}));
}
$('edit-mode').onchange=e=>{listActivation.reset();closeDetails();editing=e.target.checked;render();message(editing?'Edit mode · Apply changes commits console edits.':'View mode · Select a subject to inspect.');};
$('search').oninput=renderList;
// Find skill sits in the map tools, so searching still works when the console is hidden. It selects
// and travels to a skill exactly as the console list does, and changes nothing in the map.
let matches=[],activeMatch=-1;
function closeFind(){const results=$('find-results');results.hidden=true;results.replaceChildren();$('find-skill').setAttribute('aria-expanded','false');$('find-skill').removeAttribute('aria-activedescendant');matches=[];activeMatch=-1;}
function renderFind(){
  const results=$('find-results');results.replaceChildren();
  if(!$('find-skill').value.trim()){closeFind();return;}
  matches=findSkills(graph.nodes,$('find-skill').value);
  if(!matches.length)results.append(el('p',{class:'caption',text:'No skills found.'}));
  matches.forEach((n,i)=>{
    const dot=el('span',{class:'dot'});dot.style.background=nodeColor(n,proficiencyOn);
    const option=el('button',{id:`find-option-${i}`,class:i===activeMatch?'active':'',onclick:()=>chooseMatch(i)},dot,document.createTextNode(n.name),el('span',{class:'find-domain',text:n.domain}));
    option.setAttribute('role','option');option.setAttribute('aria-selected',String(i===activeMatch));
    results.append(option);
  });
  results.hidden=false;$('find-skill').setAttribute('aria-expanded','true');
  if(activeMatch>=0)$('find-skill').setAttribute('aria-activedescendant',`find-option-${activeMatch}`);else $('find-skill').removeAttribute('aria-activedescendant');
}
function chooseMatch(index){
  const node=matches[index];if(!node)return;
  selected=node.id;$('find-skill').value=node.name;closeFind();render();viewer?.focus(node.id);message(`Found ${node.name}.`);
}
$('find-skill').oninput=()=>{activeMatch=-1;renderFind();};
$('find-skill').onkeydown=e=>{
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){if(!matches.length)return;e.preventDefault();activeMatch=(activeMatch+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length;renderFind();}
  else if(e.key==='Enter'&&matches.length){e.preventDefault();chooseMatch(activeMatch<0?0:activeMatch);}
  else if(e.key==='Escape'){e.preventDefault();$('find-skill').value='';closeFind();}
};
// A click on a result must register before the list closes.
$('find-skill').onblur=()=>setTimeout(closeFind,150);
function applyToolsPanel(){
  document.querySelector('.view-tools').classList.toggle('collapsed',!panels.tools);
  const button=$('view-tools-toggle');
  button.textContent=panels.tools?'Tools ▾':'Tools ▸';
  button.title=panels.tools?'Hide the map tools':'Show the map tools';
  button.setAttribute('aria-expanded',String(panels.tools));
}
$('view-tools-toggle').onclick=()=>{panels.tools=!panels.tools;savePanels();if(!panels.tools)closeFind();applyToolsPanel();};
applyToolsPanel();
$('console-toggle').onclick=()=>{document.body.classList.toggle('console-hidden');$('console-toggle').setAttribute('aria-expanded',String(!document.body.classList.contains('console-hidden')));};
function setSpacing(value){
  spacing=spacingValue(value);
  $('sphere-spacing').value=String(spacing);
  $('spacing-value').value=`${spacing.toFixed(2)}×`;
  $('sphere-spacing').setAttribute('aria-valuetext',`${spacing.toFixed(2)} times`);
  if(spacingFrame===null)spacingFrame=requestAnimationFrame(()=>{spacingFrame=null;viewer?.spacing(spacing);});
}
$('sphere-spacing').oninput=e=>setSpacing(e.target.value);
$('sphere-spacing').onchange=()=>{try{localStorage.setItem(SPACING_CACHE,String(spacing));}catch{}};
$('reset-spacing').onclick=()=>{setSpacing(1);try{localStorage.setItem(SPACING_CACHE,'1');}catch{}};
$('home').onclick=()=>viewer?.fit();$('front').onclick=()=>viewer?.fit(true);
$('show-proficiency').onchange=e=>{proficiencyOn=e.target.checked;viewer?.proficiency(proficiencyOn);renderLegend();renderList();};
$('show-labels').onchange=e=>viewer?.labels(e.target.checked);$('selected-connections').onchange=e=>viewer?.selectedConnections(e.target.checked);
$('add-node').onclick=()=>{const id=crypto.randomUUID();const base=graph.nodes.find(n=>n.id===selected)?.position||[0,0,0];change(next=>{next.nodes.push({id,name:'New subject',domain:'Robotics',description:'',details:'',placementNote:'',proficiency80:null,icon:'robot',layoutMode:'manual',position:[base[0]+40,base[1]+30,base[2]+30],pinned:false});},'New subject added. Edit its fields and apply changes.');selected=id;$('search').value='';render();$('node-name')?.focus();};
// Undo and Redo restore whole map versions. Within the same map, reversed answers are written to
// the shared record, so a reversed answer cannot return when a related map is opened. Crossing a
// map change (for example undoing Open map) re-applies the shared answers to the restored map.
let traveling=false;
async function travel(from,to,source){
  if(traveling||!editing||!from.length)return;
  traveling=true;
  try{
    const previous=graph;to.push(clone(graph));let next=from.pop(),note='';
    if(atlasFamily(previous)===atlasFamily(next)&&(previous.title||'')===(next.title||''))note=shareChanges(previous,next,source);
    else{const shared=await applyShared(next);next=normalize(shared.graph);note=shared.note;}
    graph=next;dirty=true;subjects=pruneSubjects(subjects,graph);cache();render();viewer?.highlight(subjects);
    message(`${source==='undo'?'Previous map restored.':'Change redone.'}${note}`);
  }finally{traveling=false;}
}
$('undo').onclick=()=>travel(history,redo,'undo');
$('redo').onclick=()=>travel(redo,history,'redo');
$('vortex').onclick=()=>{if(confirm('Arrange an upward spiral? Unassigned levels are estimated from prerequisites; existing levels are raised if needed to stay above their prerequisites. Pinned positions remain fixed. Undo restores the map.')){change(next=>Object.assign(next,arrangeVortex(next)),'Spiral arranged. Reference levels reconciled; pinned positions retained.');viewer?.fit();}};
$('recalculate-vortex').onclick=()=>{if(confirm('Recalculate ALL reference levels from the recorded prerequisite graph and arrange a spiral? This replaces edited levels but keeps proficiency and pinned positions. Undo is available.')){change(next=>Object.assign(next,arrangeVortex(next,{recalculate:true})),'Reference levels recalculated and spiral arranged.');viewer?.fit();}};
$('arrange').onclick=()=>{if(confirm('Arrange unpinned nodes using strict prerequisites only? Supports links do not affect height. Undo restores your layout.'))change(next=>Object.assign(next,arrange(next)),'Dependency layout applied. Pinned nodes kept their positions.');};
$('blank').onclick=()=>{if(editing&&confirm('Start an empty map? Save your current map first if you need a separate copy. Undo is available.')){replace({schemaVersion:1,title:'Skill Solar System',nodes:[],edges:[]},'Empty map created.');loadRecord(graph);}};
$('reset').onclick=()=>{if(editing&&confirm('Restore the starter map? Undo is available.')){replace(starter,'Starter restored.');loadRecord(graph);}};
$('load').onclick=()=>{if(!dirty||confirm('Open another map? Current changes are cached only until replacement. Save a file first if needed.'))$('file').click();};
// Opening a map: validate it, then apply shared answers before anything (counts, review) reads it.
$('file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>10_000_000)throw Error('Map files must be smaller than 10 MB.');const parsed=validate(JSON.parse(await file.text()));const answers=new Map(parsed.nodes.map(n=>[n.id,n.proficiency80??null]));const shared=await applyShared(normalize(parsed));fileAnswers={title:parsed.title||'',family:atlasFamily(parsed),answers};replace(shared.graph,`Opened ${file.name}.${shared.note}`);dirty=shared.changed>0;render();}catch(error){message(`Could not open map: ${error.message}`);}e.target.value='';};
$('save').onclick=async()=>{try{const text=JSON.stringify(graph,null,2);if(window.desktop){if(!await window.desktop.saveMap(text)){message('Save canceled.');return;}}else{const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=el('a',{href:url,download:'Skill-Solar-System.json'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}dirty=false;render();message(window.desktop?'Map saved to file.':'Map download requested. Keep the downloaded JSON as your saved copy.');}catch(error){message(`Save failed: ${error.message}`);}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
// Held navigation keys pan continuously, scaled by frame time; releasing, blurring, typing, or opening a dialog stops them.
const heldKeys=new Map();let panFrame=null,panClock=0;
function typingOrReading(){const target=document.activeElement;return $('details-dialog').open||$('review-dialog').open||['INPUT','TEXTAREA','SELECT','BUTTON'].includes(target.tagName)||target.isContentEditable;}
function stopPanning(){heldKeys.clear();if(panFrame!==null)cancelAnimationFrame(panFrame);panFrame=null;}
function panStep(time){
  if(!heldKeys.size||typingOrReading()){stopPanning();return;}
  let horizontal=0,vertical=0;for(const [x,y]of heldKeys.values()){horizontal+=x;vertical+=y;}
  if(horizontal||vertical)viewer?.pan(Math.sign(horizontal),Math.sign(vertical),(time-panClock)/1000);
  panClock=time;panFrame=requestAnimationFrame(panStep);
}
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();$('save').click();return;}
  if(typingOrReading())return;
  const direction=panDirection(e.key);
  if(direction&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();heldKeys.set(e.key.toLowerCase(),direction);if(panFrame===null){panClock=performance.now();panFrame=requestAnimationFrame(panStep);}}
  if(e.key==='Escape'){selected=null;render();viewer?.fit();}
});
document.addEventListener('keyup',e=>heldKeys.delete(e.key.toLowerCase()));
window.addEventListener('blur',stopPanning);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPanning();});
// Subject highlights are display state only: no map change, selection, camera move, or dirty flag.
function setSubjects(next){
  const focused=document.activeElement?.dataset?.subject;
  subjects=pruneSubjects(next,graph);viewer?.highlight(subjects);renderLegend();
  if(focused)$('legend').querySelector(`[data-subject="${focused}"]`)?.focus();
}
function renderLegend(){
  const legend=$('legend');legend.replaceChildren();
  const counts=domainCounts(graph);
  legend.append(el('div',{class:'legend-heading',text:'Subjects · click to highlight'}));
  for(const [name,color]of Object.entries(DOMAINS)){
    const on=subjects.has(name),dot=el('span',{class:'dot'});dot.style.background=color;
    const button=el('button',{class:'legend-item subject'+(on?' active':''),disabled:!counts[name],title:counts[name]?`${on?'Remove the highlight from':'Highlight'} all ${counts[name]} ${name} skills`:`No ${name} skills in this map`,onclick:()=>setSubjects(toggleSubject(subjects,name))},dot,el('span',{text:name}),el('span',{class:'legend-count',text:String(counts[name])}));
    button.dataset.subject=name;button.setAttribute('aria-pressed',String(on));legend.append(button);
  }
  if(subjects.size)legend.append(el('button',{class:'legend-clear',id:'clear-highlights',text:'Clear highlights',onclick:()=>setSubjects(new Set())}));
  if(proficiencyOn){
    legend.append(el('div',{class:'legend-heading',text:'Sphere colour · proficiency'}));
    for(const [name,color]of [['Yes',PROFICIENCY_COLORS.yes],['No or unanswered',PROFICIENCY_COLORS.no]]){const dot=el('span',{class:'dot'});dot.style.background=color;legend.append(el('div',{class:'legend-item'},dot,document.createTextNode(name)));}
    legend.append(el('div',{class:'edge-note',text:'Manual self-report'}));
  }
  legend.append(el('div',{class:'edge-note',text:'Gold → prerequisite'}),el('div',{class:'edge-note',text:'Dashed → supports'}),el('div',{class:'edge-note',text:'Violet — related'}));
}
function renderShared(){
  const mapFamily=atlasFamily(graph),summary=recordSummary(record),loaded=!!record&&record.family===mapFamily;
  $('shared-summary').textContent=!mapFamily?'This map has no atlas family, so its proficiency answers stay in this map only.':loaded?`Atlas family “${mapFamily}”: ${plural(summary.total,'shared answer')} (${summary.yes} Yes, ${summary.no} No, ${summary.cleared} cleared).`:`Atlas family “${mapFamily}”: the shared record is not available${recordError?` (${recordError})`:''}.`;
  $('export-record').disabled=!loaded;$('import-record').disabled=!loaded;
  $('adopt-file').disabled=!(loaded&&fileAnswers&&fileAnswers.family===mapFamily&&fileAnswers.title===(graph.title||''));
  const labels={none:'',ready:'Shared answers: up to date',saving:'Shared answers: saving…',saved:`Shared answers saved on ${records.location}`,failed:'Shared answers NOT saved · Retry',unreadable:'Shared record unreadable · Retry'};
  const state=$('sync-state');state.textContent=labels[sync]||'';state.hidden=!labels[sync];state.disabled=!(sync==='failed'||sync==='unreadable');state.className=`sync-state ${sync}`;state.title=syncDetail;
}
$('sync-state').onclick=async()=>{
  if(sync==='failed'){persistRecord();return;}
  if(sync!=='unreadable')return;
  record=null;const shared=await applyShared(graph);
  if(shared.changed){const values=new Map(shared.graph.nodes.map(n=>[n.id,n.proficiency80]));commit(next=>setProficiency(next,values),`Shared proficiency loaded.${shared.note}`,'shared record',{share:false});}
  else{message(record?`Shared proficiency loaded.${shared.note}`:`Shared proficiency is still unavailable.${shared.note}`);renderShared();}
};
$('export-record').onclick=async()=>{
  if(!record)return;
  const text=JSON.stringify(record,null,2),name=`proficiency-${record.family.replace(/[^\w.-]+/g,'_')}.json`,count=recordSummary(record).total;
  try{
    if(window.desktop){if(!await window.desktop.saveMap(text,{defaultName:name,kind:'record'})){message('Export canceled.');return;}}
    else{const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));el('a',{href:url,download:name}).click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    message(`Exported ${plural(count,'shared answer')} to a proficiency record file. The map file is unchanged.`);
  }catch(error){message(`Export failed: ${error.message}`);}
};
$('import-record').onclick=()=>{if(record)$('record-file').click();};
// Import policy: answers in the file replace shared answers for the same skills; others are kept.
$('record-file').onchange=async e=>{
  const file=e.target.files[0];e.target.value='';if(!file||!record)return;
  try{
    if(file.size>5_000_000)throw Error('Proficiency records must be smaller than 5 MB.');
    const incoming=validateRecord(JSON.parse(await file.text()),family),merged=mergeImport(record,incoming),total=Object.keys(incoming.entries).length;
    if(!confirm(`Import ${plural(total,'proficiency answer')} into atlas family “${family}”?\n\n${merged.added} new, ${merged.changed} different from the shared record, ${merged.unchanged} the same.\nImported answers replace shared answers for the same skills; skills not in the file keep their shared answer.`))return;
    record=merged.record;const saved=await persistRecord();
    const applied=reconcile(graph,record,{map:graph.title||null});
    if(applied.adopted.length){record=applied.record;persistRecord();}
    const note=`Imported ${plural(merged.added+merged.changed,'shared answer')}.${saved?'':' The shared record could not be saved.'}`;
    if(applied.applied.length){const values=new Map(applied.graph.nodes.map(n=>[n.id,n.proficiency80]));commit(next=>setProficiency(next,values),`${note} Applied to ${plural(applied.applied.length,'skill')} in this map.`,'imported record',{share:false});}
    else{message(note);renderShared();}
  }catch(error){message(`Could not import proficiency record: ${error.message}`);}
};
// Deliberately replaces the shared answers for every skill in this map with the answers embedded in the file.
$('adopt-file').onclick=async()=>{
  if(!record||!fileAnswers||fileAnswers.family!==family||fileAnswers.title!==(graph.title||''))return;
  const answers=fileAnswers.answers,count=answers.size;
  if(!confirm(`Replace the shared answers for all ${count} skills in this map with the answers saved in the file “${fileAnswers.title}”?\n\nSkills that are unmarked in the file become Cleared in the shared record. Other maps in this atlas family use these answers the next time they are opened.`))return;
  record=adoptFileAnswers(record,answers,{map:graph.title||null});const saved=await persistRecord();
  commit(next=>setProficiency(next,answers),`Shared answers for ${plural(count,'skill')} now match this file.${saved?'':' The shared record could not be saved.'}`,'adopted from file',{share:false});
};
function proficiencyControls(node){
  const group=el('div',{class:'proficiency-controls'},el('h3',{text:'At least 80% proficient?'}),el('p',{class:'edge-note',text:'Your judgment only. No tests or automatic scoring.'}));
  const row=el('div',{class:'button-row'});
  for(const [label,value]of [['Yes',true],['No',false],['Clear',null]]){
    const b=el('button',{text:label,class:node.proficiency80===value?'chosen':'',onclick:()=>commit(next=>{next.nodes.find(n=>n.id===node.id).proficiency80=value;},'Proficiency updated. Save map to keep it in the file.','console')});
    b.setAttribute('aria-pressed',String(node.proficiency80===value));row.append(b);
  }
  group.append(row);return group; // the chosen button and the sphere colour show the current answer
}
function openDetails(){stopPanning();fillDetails();if(selected&&!$('details-dialog').open)$('details-dialog').showModal();}
function closeDetails(){if($('details-dialog').open)$('details-dialog').close();}
// The card shows the 1–2 detail paragraphs, one short placement summary, and the connection list.
// Coordinates, layout provenance, and placement notes stay in the file and the edit console.
function fillDetails(){
  const node=graph.nodes.find(n=>n.id===selected);if(!node){closeDetails();return;}
  const body=$('details-body');body.replaceChildren();
  $('details-title').textContent=node.name;
  body.append(el('div',{class:'subject-heading'},iconElement(node.icon),el('p',{class:'edge-note',title:LEVEL_NOTE,text:node.domain+(node.skillLevel!=null?` · Reference level ${node.skillLevel}/100`:' · Reference level unassigned')})));
  const paragraphs=node.details.trim().split(/\n\s*\n/).filter(Boolean);
  for(const paragraph of paragraphs)body.append(el('p',{text:paragraph}));
  if(!paragraphs.length)body.append(el('p',{class:'subject-summary',text:node.description||'No description yet. In Edit mode, add one or two paragraphs in Detailed description.'}));
  body.append(el('h3',{text:'Where it sits'}),el('p',{text:placementSummary(graph,node)}));
  const names=new Map(graph.nodes.map(n=>[n.id,n.name]));
  const links=graph.edges.filter(e=>e.source===node.id||e.target===node.id);
  if(links.length){
    const list=el('details',{class:'connections',open:links.length<=12},el('summary',{text:`Connections (${links.length})`}));
    for(const edge of links){
      const verb=edge.type==='prerequisite'?'is prerequisite for':edge.type==='supports'?'supports':'is related to',text=`${names.get(edge.source)} ${verb} ${names.get(edge.target)}`;
      list.append(edge.rationale&&edge.rationale.length>80?el('details',{class:'detail-link'},el('summary',{text}),el('p',{text:edge.rationale})):el('p',{class:'detail-link',text:text+(edge.rationale?' — '+edge.rationale:'')}));
    }
    body.append(list);
  }
  body.append(proficiencyControls(node));
}
$('details-close').onclick=closeDetails;
$('details-dialog').addEventListener('click',e=>{const r=$('details-dialog').getBoundingClientRect();if(e.target===$('details-dialog')&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))closeDetails();});
$('details-dialog').addEventListener('close',()=>{$('canvas').focus();});
$('canvas').tabIndex=0;
$('canvas').addEventListener('pointerdown',()=>{$('canvas').focus({preventScroll:true});});
// Guided proficiency review: answers use the normal commit path (history, draft cache, dirty state, shared record).
const review=createReviewDialog({dialog:$('review-dialog'),opener:$('mark-proficiency'),getGraph:()=>graph,storage:safeStorage,
  apply:(id,value,nextId)=>{const name=graph.nodes.find(n=>n.id===id).name;if(nextId)selected=nextId;const result=commit(next=>{next.nodes.find(n=>n.id===id).proficiency80=value;},`Marked ${name}: ${proficiencyLabel(value)}. Kept in the local draft; Save map writes the JSON file.`,'review');if(result.ok&&nextId)viewer?.focus(nextId);return result;},
  show:id=>{if(!id)return;selected=id;render();viewer?.focus(id);},
  onOpen:()=>{stopPanning();listActivation.reset();closeDetails();}});
$('mark-proficiency').onclick=()=>review.open();
viewer?.spacing(spacing);
$('sphere-spacing').value=String(spacing);$('spacing-value').value=`${spacing.toFixed(2)}×`;
render();viewer?.fit();
// Shared answers are applied to a recovered draft before the review can open.
const startup=graph;$('mark-proficiency').disabled=true;
applyShared(graph).then(shared=>{
  if(graph!==startup)return;
  if(shared.changed){graph=normalize(shared.graph);dirty=true;cache();render();}
  if(shared.note)message(`${$('status').textContent.trim()}${shared.note}`);
}).finally(()=>{$('mark-proficiency').disabled=false;renderShared();});
