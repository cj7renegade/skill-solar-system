import { arrangeVortex } from './vortex.js';
import { isHelixMap, helixCourses, courseColors, arrangeHelix, tierOf, matchesHelixFilters, activeFilters, levelLine } from './helix.js';
import { DOMAINS, TYPES, LIMITS, clone, validate, normalize, arrange, removeNode, editedPosition, positionExplanation, placementSummary, LEVEL_NOTE, proficiencyLabel, nodeColor, PROFICIENCY_COLORS } from './model.js';
import { spacingValue } from './spacing.js';
import { findSkills } from './find.js';
import { starter } from './starter.js';
import { createViewer } from './viewer.js';
import { ICONS, iconElement } from './icons.js';
import { panDirection, createActivationTracker } from './interaction.js';
import { createReviewDialog } from './review-dialog.js';
import { renderSkillCard } from './skill-card.js';
import { createLessonUI } from './lesson-ui.js';
import { createLessonQueue, queueCandidates } from './lesson-queue.js';
import { createLessonSettings } from './lesson-settings.js';
import { practiceItems, renderMarkdown } from './lesson-render.js';
import { revealBlock } from './lesson-viewer.js';
import { prerequisiteChain, chainSummary, defaultSelection, pendingChanges, stepLabel } from './prerequisites.js';
import { domainCounts, toggleSubject, pruneSubjects } from './highlight.js';
import { atlasFamily, emptyRecord, reconcile, recordAnswers, diffProficiency, validateRecord, mergeImport, adoptFileAnswers, recordSummary } from './proficiency.js';
import { createRecordStore } from './proficiency-store.js';
import { createTour } from './tour.js';
import { undoLimit, trimHistory } from './history.js';
import { renderHud, learnerState, activeTarget, storeTarget, reviewLeft } from './hud.js';
import { FAMILIES, familyOf, FRONTIER_GLOW } from './palette.js';
import { remainingPath, studyOrder, totalHours, effortHours, formatHours } from './learner.js';
import { planLayout, renderPlan } from './plan.js';
import { listOrder, recentAnswers, renderToday } from './panel.js';
import { createGuidePanel } from './guide-panel.js';
import { createLessonIndex, embeddedLesson, LESSON_FIELDS } from './lessons.js';
import { readAppearance, applyAppearance } from './theme/appearance.js';
import { createSettingsDialog } from './settings-dialog.js';
import { renderStyleGuide } from './theme/styleguide.js';

const $=id=>document.getElementById(id), CACHE='skill-solar-system-v1';
// Lessons live outside map files (src/lessons.js); every reader goes through lessonIndex.getLesson.
const lessonIndex=createLessonIndex(window.desktop?.lessons);
// The appearance (Classic or Cyberpunk HUD, glow, motion, atmosphere) is applied before anything draws.
try{applyAppearance(document.documentElement,readAppearance(localStorage));}catch{}
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
try {const saved=localStorage.getItem(CACHE);if(saved){graph=normalize(JSON.parse(saved));dirty=true;}}catch{message('No readable draft found. Open a saved JSON file to recover your work.');}
const emptyInspector=$('inspector').cloneNode(true);
try { viewer=createViewer($('canvas'),$('labels'),id=>{selected=id;render();},(id,position)=>{change(next=>{Object.assign(next.nodes.find(n=>n.id===id),{position,layoutMode:'manual'});},'Node moved.');},id=>{selected=id;openDetails();}); }
catch(error){$('render-error').hidden=false;$('render-error').textContent='3D view could not start. Enable hardware acceleration / WebGL in your graphics settings. The data console remains available. '+error.message;}
function el(tag,props={},...children){const node=document.createElement(tag);for(const [key,value]of Object.entries(props)){if(key==='text')node.textContent=value;else if(key.startsWith('on'))node.addEventListener(key.slice(2),value);else if(key==='class')node.className=value;else node[key]=value;}for(const child of children)if(child)node.append(child);return node;}
function options(values,current){return values.map(value=>el('option',{value,text:value,selected:value===current}));}
function field(title,input){return el('label',{class:'field'},document.createTextNode(title),input);}
// mapChars: the size of the map as saved text, which also sets how many Undo steps fit in memory (history.js).
let mapChars=0;
// Added to the status line whenever the draft could not be stored, so the next message never hides it.
const DRAFT_WARNING=' Draft cache unavailable: save the map to a JSON file now.';
function cache(){try{const text=JSON.stringify(graph);mapChars=text.length;localStorage.setItem(CACHE,text);draftSaved=true;return true;}catch{draftSaved=false;message('Draft cache unavailable. Save map to a JSON file now.');return false;}}
// One save indicator: every change is kept at once in the local draft and (answers) in the shared
// record. "Saving…" while the shared record is being written, "Unsaved changes" if either could not
// be stored, otherwise "Saved ✓". Exporting a portable file is separate, under File.
let draftSaved=true;
function renderSaveState(){
  const failed=!draftSaved||sync==='failed'||sync==='unreadable',saving=sync==='saving';
  const state=$('dirty');state.textContent=failed?'Unsaved changes':saving?'Saving…':'Saved ✓';
  state.className=`save-state ${failed?'failed':saving?'saving':'saved'}`;
  state.dataset.exported=dirty?'no':'yes';
  state.title=failed?'A change could not be stored on this computer. Use File ▸ Save map to keep a copy now.':`Kept on this computer.${dirty?' Not exported since your last change: File ▸ Save map writes a portable copy.':' Matches the last exported file.'}`;
}
const safeStorage={getItem:key=>{try{return localStorage.getItem(key);}catch{return null;}},setItem:(key,value)=>localStorage.setItem(key,value)};

// Shared offline proficiency: one record per atlas family, stored outside map files. An opened map
// takes the shared answers, and every proficiency change in the open map is written back through
// commit() (console, guided review, edit mode, Undo/Redo). Nothing else in a map is shared.
const records=createRecordStore(window.desktop?.proficiency,safeStorage);
let family=null,record=null,recordError=null,fileAnswers=null,writes=Promise.resolve(),sync='none',syncDetail='';
function setSync(state,detail=''){sync=state;syncDetail=detail;renderShared();renderSaveState();}
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
  try{const previous=graph,next=clone(graph);mutator(next);const normalized=normalize(next);history.push(clone(graph));trimHistory(history,undoLimit(mapChars));redo=[];graph=normalized;dirty=true;const cached=cache();const note=share?shareChanges(previous,normalized,source):'';render();message(`${status}${note}${cached?'':DRAFT_WARNING}`);return {ok:true,cached};}
  catch(error){message(error.message);return {ok:false,cached:false};}
}
function replace(next,status){
  listActivation.reset();closeDetails();
  const normalized=normalize(next);history.push(clone(graph));trimHistory(history,undoLimit(mapChars));redo=[];graph=normalized;selected=null;dirty=true;subjects=pruneSubjects(subjects,graph);pathTarget=null;planOpen=false;$('plan-view').hidden=true;const cached=cache();render();viewer?.highlight(subjects);viewer?.fit();message(`${status}${cached?'':DRAFT_WARNING}`);
}
// Lessons still embedded in the open map (an older file or draft) are handed to the lesson store as
// reviewed archives; once stored identically they leave the in-memory map, so Save map writes a
// lesson-free file. Only the two lesson fields change; the graph and answers do not.
let absorbing=null;
function absorbEmbedded(){
  if(absorbing===graph||!window.desktop?.lessons||!graph.nodes.some(embeddedLesson))return;
  const g=absorbing=graph;
  lessonIndex.absorb(g).then(ids=>{
    if(graph!==g||!ids.length)return;
    const safe=new Set(ids);for(const n of graph.nodes)if(safe.has(n.id))for(const k of LESSON_FIELDS)delete n[k];
    cache();render();message(`${$('status').textContent.trim()} ${ids.length.toLocaleString('en')} lessons are now kept in the lesson store, outside the map.`);
  },()=>{});
}
function render(){
  if(!graph.nodes.some(n=>n.id===selected))selected=null;
  $('counts').textContent=`${graph.nodes.length.toLocaleString('en')} skills · ${graph.edges.length.toLocaleString('en')} links`;
  renderSaveState();
  $('map-name').textContent=graph.title||'Untitled map';$('header-map').textContent=graph.title||'Untitled map';
  document.querySelector('.layout-tools').hidden=!editing;
  const target=activeTarget(graph,safeStorage);$('path-mode').disabled=!target;$('path-mode').setAttribute('aria-pressed',String(!!pathTarget));$('path-mode').textContent=pathTarget?'Exit path':'Path mode';
  $('layout-help').textContent=isHelixMap(graph)?HELIX_LAYOUT_HELP:SPIRAL_LAYOUT_HELP;
  $('layout-summary').title=isHelixMap(graph)?'Height is the helix level: 1 + 3 × the longest chain of prerequisites below a skill. It shows how much rests underneath, not how hard the skill is, and it is separate from your proficiency.':'';
  $('layout-summary').textContent=isHelixMap(graph)?'Height: helix level (longest prerequisite chain, not difficulty) · Around: course':graph.nodes.some(n=>n.layoutMode==='vortex')?'Upward: reference level · Around: domain · Proficiency is separate':'Foundations below. Links above.';
  viewer?.path(pathState()?.remaining??null,false);viewer?.setGraph(graph,selected);viewer?.setEdit(editing);
  renderLearner();renderPathCard();if(planOpen)renderPlanView();
  lessonIndex.load(graph);absorbEmbedded();
  renderLegend();renderList();inspect();renderShared();if($('details-dialog').open)fillDetails();if($('chain-dialog').open)fillChain();document.querySelectorAll('[data-edit]').forEach(button=>button.disabled=!editing);
  $('undo').disabled=!editing||!history.length;$('redo').disabled=!editing||!redo.length;
}
// The learner HUD and the frontier glow, from the map's own answers and prerequisite links. Both are
// recomputed only when the map version or the target changes (hud.js caches by map object).
function learner(){return learnerState(graph,activeTarget(graph,safeStorage));}
function flyTo(id){selected=id;render();viewer?.fly(id);}
function renderLearner(){
  const state=learner();
  renderHud($('hud'),{graph,state,palette:palette(),reviewCount:reviewLeft(safeStorage,graph),el,actions:{
    setTarget:id=>{storeTarget(safeStorage,graph,id);render();message(`Working toward ${graph.nodes.find(n=>n.id===id)?.name}.`);},
    select:flyTo,openReview:()=>review.open(),pathTo:id=>setPath(id)}});
  viewer?.frontier(state.frontier);viewer?.target(state.target);viewer?.keep(state.next.slice(0,8).map(x=>x.node.id));
}
// --- Path mode ----------------------------------------------------------------------------------
// "Path to…" any skill or milestone: the remaining path stays lit on the map, everything else dims,
// and a card lists what is left in a valid study order. Display state only; Esc or Exit leaves it.
let pathTarget=null,planOpen=false;
const pathCache=new WeakMap();
function pathState(){
  if(!pathTarget||!graph.nodes.some(n=>n.id===pathTarget))return null;
  let byTarget=pathCache.get(graph);if(!byTarget)pathCache.set(graph,byTarget=new Map());
  if(!byTarget.has(pathTarget)){
    const index=learner().index,remaining=remainingPath(graph,pathTarget,index);
    byTarget.set(pathTarget,{target:index.byId.get(pathTarget),remaining,order:studyOrder(graph,remaining,index),hours:totalHours(graph,remaining,index),
      courses:new Set([...remaining].map(id=>{const n=index.byId.get(id);return n.courseCode??n.domain;})).size});
  }
  return byTarget.get(pathTarget);
}
function setPath(id){
  pathTarget=id;if(!id)closePlan();render();
  const p=pathState();if(p&&p.remaining.size)viewer?.fit(false,new Set([...p.remaining,p.target.id]));
  message(p?`Path mode: ${p.remaining.size} skills left to reach ${p.target.name}. Esc leaves path mode.`:'Path mode off.');
}
function renderPathCard(){
  const card=$('path-card'),p=pathState();card.replaceChildren();card.hidden=!p;$('hud').classList.toggle('path-on',!!p);
  if(!p)return;
  const left=p.remaining.size;
  card.append(el('div',{class:'hud-label',text:'Path mode'}),
    el('p',{class:'path-summary',id:'path-summary',text:left?`To reach ${p.target.name}: ${left.toLocaleString('en')} skill${left===1?'':'s'} left · ${formatHours(p.hours)} · ${p.courses} course${p.courses===1?'':'s'}`:`${p.target.name} is already marked proficient.`}),
    el('div',{class:'button-row'},el('button',{id:'plan-toggle',text:planOpen?'Hide 2D plan':'2D plan',ariaPressed:String(planOpen),disabled:!left,onclick:()=>planOpen?closePlan():openPlan()}),el('button',{id:'exit-path',text:'Exit path (Esc)',onclick:()=>setPath(null)})));
  if(!left)return;
  const steps=el('ol',{class:'path-steps',id:'path-steps'}),shown=p.order.slice(0,150),front=learner().frontier;
  const byId=learner().index.byId;
  for(const id of shown){const n=byId.get(id),b=el('button',{class:'path-step'+(id===selected?' selected':''),title:front.has(id)?`${n.name} · ready to study`:n.name,onclick:()=>flyTo(id)},el('span',{class:'hud-next-name',text:n.name}),el('span',{class:'hud-hours',text:formatHours(effortHours(graph,n))}));b.dataset.id=id;steps.append(el('li',{class:front.has(id)?'ready':''},b));}
  card.append(el('div',{class:'hud-label',text:'Study order'}),steps);
  if(p.order.length>shown.length)card.append(el('p',{class:'hud-detail',text:`…and ${(p.order.length-shown.length).toLocaleString('en')} more. The 2D plan shows them all.`}));
}
// The 2D plan: the current path, or the isolated course or family when there is no path.
function planSet(){
  const p=pathState();if(p)return {ids:p.remaining,title:`Path to ${p.target.name} · ${p.remaining.size} skills, columns = prerequisite depth, rows = course`};
  if(isolation){const codes=isolation.kind==='family'?Object.keys(FAMILIES.find(f=>f.id===isolation.id).courses):[isolation.id];const ids=new Set(graph.nodes.filter(n=>codes.includes(n.courseCode)).map(n=>n.id));return {ids,title:`${isolation.kind==='family'?FAMILIES.find(f=>f.id===isolation.id).name:isolation.id} · ${ids.size} skills`};}
  return null;
}
function openPlan(){if(!planSet())return;planOpen=true;renderPlanView();renderPathCard();$('plan-close').focus();}
function closePlan(){if(!planOpen)return;planOpen=false;$('plan-view').hidden=true;renderPathCard();}
function renderPlanView(){
  const set=planSet();$('plan-view').hidden=!planOpen||!set;if(!planOpen||!set)return;
  const index=learner().index,pal=palette(),front=learner().frontier;
  $('plan-title').textContent=set.title;
  renderPlan($('plan-body'),planLayout(graph,set.ids,index,helixCourses(graph).map(([code])=>code)),{title:set.title,frontier:front,selected,
    colorOf:n=>nodeColor(n,proficiencyOn,pal),onSelect:id=>{selected=id;render();viewer?.fly(id);}});
}
$('plan-close').onclick=closePlan;
function renderList(){
  const scrollTop=$('node-list').scrollTop;
  const query=$('search').value.trim().toLowerCase();$('node-list').replaceChildren();
  // Ready to study first, then recently answered, then lowest level (panel.js); or A–Z.
  const state=learner(),pal=palette();
  const nodes=listOrder(graph.nodes.filter(n=>n.name.toLowerCase().includes(query)),{frontier:state.frontier,recent:recentAnswers(record,graph),mode:listSort});
  for(const n of nodes){
    const dot=el('span',{class:'dot'+(state.frontier.has(n.id)?' ready':'')});dot.style.background=nodeColor(n,proficiencyOn,pal);
    const item=el('button',{class:'node-item'+(selected===n.id?' selected':''),title:state.frontier.has(n.id)?`${n.name} · ready to study`:n.name,onclick:event=>{const action=listActivation.click(n.id,event.clientX,event.clientY,performance.now());selected=n.id;render();viewer?.focus(n.id);if(action==='open'&&!editing)openDetails();}},dot,document.createTextNode(n.name));
    item.dataset.name=n.name;$('node-list').append(item);
  }
  if(!nodes.length)$('node-list').append(el('p',{class:'caption',text:'No skills found.'}));
  $('node-list').scrollTop=scrollTop;
}
function inspect(){
  const panel=$('inspector');panel.replaceChildren();const n=graph.nodes.find(n=>n.id===selected);
  if(!n){panel.classList.remove('collapsed');renderToday(panel,{graph,state:learner(),record,reviewCount:reviewLeft(safeStorage,graph),el,palette:palette(),actions:{select:flyTo,openReview:()=>review.open()}});return;}
  const cardToggle=el('button',{id:'inspector-toggle',text:panels.card?'▾':'▸',title:panels.card?'Collapse this skill card':'Expand this skill card',ariaLabel:panels.card?'Collapse this skill card':'Expand this skill card',onclick:()=>{panels.card=!panels.card;savePanels();inspect();}});
  cardToggle.setAttribute('aria-expanded',String(panels.card));
  const body=el('div',{class:'inspector-body'});
  panel.classList.toggle('collapsed',!panels.card);
  panel.append(el('div',{class:'inspector-heading'},el('div',{class:'subject-heading'},iconElement(n.icon),el('div',{},el('h3',{text:n.name}),el('p',{class:'edge-note',title:LEVEL_NOTE,text:levelLine(graph,n,'Level',' · Level unassigned')}))),cardToggle),body);
  if(!editing){
    panel.dataset.card='skill';
    body.append(skillCard(n,[proficiencyControls(n)]));
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
  body.append(field('Skill',name),el('div',{class:'node-id',text:`ID · ${n.id}`}),field('Domain',domain),field('Reference level · 1–100 (blank = unassigned)',skillLevel),el('p',{class:'edge-note',text:'A reference rank, not proficiency. Apply saves the number; Arrange level spiral updates height and raises levels where prerequisites require it.'}),field('Short description',description),field('Detailed description · separate paragraphs with a blank line',details),field('Placement note · optional author explanation',note),field('Console icon',icon),field('Self-reported proficiency of at least 80%',proficiency),el('div',{class:'coords'},...coords.map((c,i)=>field(['X','Y · height','Z'][i],c))),el('p',{class:'edge-note',text:positionExplanation(graph,n)}),el('label',{},pinned,document.createTextNode(' Pin position during arrangement')));
  body.append(el('div',{class:'button-row'},el('button',{text:'Apply changes',disabled:!editing,id:'apply-node',onclick:()=>change(next=>{const target=next.nodes.find(v=>v.id===n.id);if(coords.some(c=>!c.value.trim()))throw Error('Enter all three coordinates.');const position=editedPosition(target.position,coords.map(c=>c.value));if(position.some((v,i)=>v!==target.position[i]))target.layoutMode='manual';Object.assign(target,{skillLevel:skillLevel.value.trim()===''?null:Number(skillLevel.value),details:details.value,placementNote:note.value,icon:icon.value,proficiency80:proficiency.value==='unset'?null:proficiency.value==='yes',name:name.value.trim(),domain:domain.value,description:description.value,pinned:pinned.checked,position});},'Skill updated.')}),el('button',{text:'Delete',class:'danger',disabled:!editing,id:'delete-node',onclick:()=>{if(confirm(`Delete ${n.name} and its links? Undo is available.`))change(next=>Object.assign(next,removeNode(next,n.id)),'Skill deleted.');}})));
  body.append(el('h3',{text:'Links'}));
  const links=graph.edges.filter(e=>e.source===n.id||e.target===n.id);
  for(const edge of links){
    const source=graph.nodes.find(x=>x.id===edge.source).name,target=graph.nodes.find(x=>x.id===edge.target).name;
    const verb=edge.type==='prerequisite'?'is prerequisite for':edge.type==='supports'?'supports':'is related to';
    body.append(el('div',{class:'edge-item'},el('span',{text:`${source} ${verb} ${target}`}),el('button',{text:'×',title:'Remove link',ariaLabel:'Remove link',disabled:!editing,onclick:()=>change(next=>{next.edges=next.edges.filter(e=>!(e.source===edge.source&&e.target===edge.target&&e.type===edge.type));},'Link removed.')})));
  }
  if(!links.length)body.append(el('p',{class:'edge-note',text:'No links yet.'}));
  if(!editing)return;
  const type=el('select',{id:'edge-type'},...options(TYPES,'supports'));
  const direction=el('select',{id:'edge-direction'},el('option',{value:'out',text:'This skill → other skill'}),el('option',{value:'in',text:'Other skill → this skill'}));
  const target=el('select',{id:'edge-target'},...graph.nodes.filter(x=>x.id!==n.id).map(x=>el('option',{value:x.id,text:x.name})));
  body.append(el('h3',{text:'Add a link'}),field('Relationship',type),field('Direction',direction),field('Other skill',target),el('p',{class:'edge-note',text:'Prerequisite: source must come before target. Supports: directional contribution. Related: no learning order.'}),el('button',{text:'Link skills',id:'connect',disabled:graph.nodes.length<2,onclick:()=>change(next=>{next.edges.push({source:direction.value==='out'?n.id:target.value,target:direction.value==='out'?target.value:n.id,type:type.value});},'Link added.')}));
}
$('edit-mode').onchange=e=>{listActivation.reset();closeDetails();editing=e.target.checked;render();message(editing?'Edit mode · Apply changes commits console edits. Layout tools are at the end of the console.':'View mode.');};
$('search').oninput=renderList;
// The skill list's order: ready to study first (default) or A–Z, remembered on this computer.
const LIST_SORT='skill-solar-system-list-sort';
let listSort='suggested';try{listSort=localStorage.getItem(LIST_SORT)==='az'?'az':'suggested';}catch{}
$('list-sort').value=listSort;
$('list-sort').onchange=e=>{listSort=e.target.value==='az'?'az':'suggested';try{localStorage.setItem(LIST_SORT,listSort);}catch{}renderList();};
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
    const dot=el('span',{class:'dot'});dot.style.background=nodeColor(n,proficiencyOn,palette());
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
// Two small menus: File (open, export) in the header and View (display settings) in the map tools.
// Each opens on its button, closes on a second click, on Esc or on a click elsewhere, and returns
// focus to its button when closed from the keyboard.
const MENUS=[['file-menu','file-menu-items'],['view-settings','view-popover']];
function setMenu(button,panel,open){$(panel).hidden=!open;$(button).setAttribute('aria-expanded',String(open));}
for(const [button,panel] of MENUS){
  $(button).onclick=e=>{e.stopPropagation();const open=$(panel).hidden;for(const [b,p] of MENUS)setMenu(b,p,false);setMenu(button,panel,open);if(open)$(panel).querySelector('button,input')?.focus();};
  $(panel).addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();setMenu(button,panel,false);$(button).focus();}});
}
document.addEventListener('click',e=>{for(const [button,panel] of MENUS)if(!$(panel).hidden&&!$(panel).contains(e.target)&&e.target!==$(button))setMenu(button,panel,false);});
$('load').addEventListener('click',()=>setMenu('file-menu','file-menu-items',false));$('save').addEventListener('click',()=>setMenu('file-menu','file-menu-items',false));
// Path mode from the toolbar: the path to the active target, or back out of path mode.
$('path-mode').onclick=()=>{if(pathTarget)setPath(null);else{const target=activeTarget(graph,safeStorage);if(target)setPath(target);}};
// Grouping distant skills into subject clusters (level of detail), remembered on this computer.
const GROUPS_CACHE='skill-solar-system-groups';
try{if(localStorage.getItem(GROUPS_CACHE)==='off')$('show-groups').checked=false;}catch{}
viewer?.grouping($('show-groups').checked);
$('show-groups').onchange=e=>{viewer?.grouping(e.target.checked);try{localStorage.setItem(GROUPS_CACHE,e.target.checked?'on':'off');}catch{}};
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
$('add-node').onclick=()=>{const id=crypto.randomUUID();const base=graph.nodes.find(n=>n.id===selected)?.position||[0,0,0];change(next=>{next.nodes.push({id,name:'New skill',domain:'Robotics',description:'',details:'',placementNote:'',proficiency80:null,icon:'robot',layoutMode:'manual',position:[base[0]+40,base[1]+30,base[2]+30],pinned:false});},'New skill added. Edit its fields and apply changes.');selected=id;$('search').value='';render();$('node-name')?.focus();};
// Undo and Redo restore whole map versions. Within the same map, reversed answers are written to
// the shared record, so a reversed answer cannot return when a related map is opened. Crossing a
// map change (for example undoing Open map) re-applies the shared answers to the restored map.
let traveling=false;
async function travel(from,to,source){
  if(traveling||!editing||!from.length)return;
  traveling=true;
  try{
    const previous=graph;to.push(clone(graph));trimHistory(to,undoLimit(mapChars));let next=from.pop(),note='';
    if(atlasFamily(previous)===atlasFamily(next)&&(previous.title||'')===(next.title||''))note=shareChanges(previous,next,source);
    else{const shared=await applyShared(next);next=normalize(shared.graph);note=shared.note;}
    graph=next;dirty=true;subjects=pruneSubjects(subjects,graph);const cached=cache();render();viewer?.highlight(subjects);
    message(`${source==='undo'?'Previous map restored.':'Change redone.'}${note}${cached?'':DRAFT_WARNING}`);
  }finally{traveling=false;}
}
$('undo').onclick=()=>travel(history,redo,'undo');
$('redo').onclick=()=>travel(redo,history,'redo');
// On a helix map both arrange buttons rebuild the helix (src/helix.js) instead of the six-domain spiral,
// whose 100-level scale cannot hold the helix's levels. Skill levels are not changed.
const helixArrange=()=>{if(confirm('Arrange the helix again? Height comes from each skill\'s helix level (1 + 3 × its longest prerequisite chain) and angle from its course. Pinned positions remain fixed. Undo restores the map.')){change(next=>Object.assign(next,arrangeHelix(next)),'Helix arranged. Pinned positions retained.');viewer?.fit();}};
$('vortex').onclick=()=>{if(isHelixMap(graph))return helixArrange();if(confirm('Arrange an upward spiral? Unassigned levels are estimated from prerequisites; existing levels are raised if needed to stay above their prerequisites. Pinned positions remain fixed. Undo restores the map.')){change(next=>Object.assign(next,arrangeVortex(next)),'Spiral arranged. Reference levels reconciled; pinned positions retained.');viewer?.fit();}};
$('recalculate-vortex').onclick=()=>{if(isHelixMap(graph))return helixArrange();if(confirm('Recalculate ALL reference levels from the recorded prerequisite graph and arrange a spiral? This replaces edited levels but keeps proficiency and pinned positions. Undo is available.')){change(next=>Object.assign(next,arrangeVortex(next,{recalculate:true})),'Reference levels recalculated and spiral arranged.');viewer?.fit();}};
$('arrange').onclick=()=>{if(confirm('Arrange unpinned nodes using strict prerequisites only? Supports links do not affect height. Undo restores your layout.'))change(next=>Object.assign(next,arrange(next)),'Dependency layout applied. Pinned nodes kept their positions.');};
$('blank').onclick=()=>{if(editing&&confirm('Replace the whole current map with an empty map? Every skill and link disappears from view; your answers stay in the shared record. Undo brings the map back, and File ▸ Save map can export it first.')){replace({schemaVersion:1,title:'HelixSkill',nodes:[],edges:[]},'Empty map created.');loadRecord(graph);}};
$('reset').onclick=()=>{if(editing&&confirm('Replace the whole current map with the small starter map? Undo brings the current map back, and File ▸ Save map can export it first.')){replace(starter,'Starter restored.');loadRecord(graph);}};
$('load').onclick=()=>{if(!dirty||confirm('Open another map? Current changes are cached only until replacement. Save a file first if needed.'))$('file').click();};
// Opening a map, from a file or from Your maps: validate it, then apply shared answers before anything (counts, review) reads it.
async function openMap(name,size,readText){try{if(size>LIMITS.mapBytes)throw Error(`Map files must be smaller than ${LIMITS.mapBytes/1_000_000} MB.`);const parsed=validate(JSON.parse(await readText()));const answers=new Map(parsed.nodes.map(n=>[n.id,n.proficiency80??null]));const shared=await applyShared(normalize(parsed));fileAnswers={title:parsed.title||'',family:atlasFamily(parsed),answers};replace(shared.graph,`Opened ${name}.${shared.note}`);dirty=shared.changed>0;render();}catch(error){message(`Could not open map: ${error.message}`);}}
$('file').onchange=async e=>{const file=e.target.files[0];if(!file)return;await openMap(file.name,file.size,()=>file.text());e.target.value='';};
// Your maps: the maps in the project's Maps folder (desktop only; archive and backup folders are never listed).
const mapLabel=m=>{const title=m.title&&m.title.length>60?`${m.title.slice(0,59)}…`:m.title;return title?`${title} — ${m.path}`:m.path;};
async function refreshMapPicker(){if(!window.desktop?.maps)return;try{const maps=await window.desktop.maps.list(),picker=$('map-picker');picker.replaceChildren(el('option',{value:'',text:maps.length?'Your maps…':'No maps in the Maps folder'}),...maps.map(m=>el('option',{value:m.path,text:mapLabel(m),title:m.path})));picker.hidden=false;}catch{}}
$('map-picker').onchange=async e=>{const choice=e.target.value;e.target.value='';if(!choice)return;if(dirty&&!confirm('Open another map? Current changes are cached only until replacement. Save a file first if needed.'))return;try{const map=await window.desktop.maps.read(choice);await openMap(map.name,map.bytes,async()=>map.text);}catch(error){message(`Could not open map: ${error.message}`);}};
refreshMapPicker();
// The guided tour. Its button stays in the header; until the tour has been opened once, the button glows.
const TOUR_SEEN='skill-solar-system-tour-seen-v1';
createTour({button:$('tour-button'),onOpen:()=>{$('tour-button').classList.remove('unseen');try{localStorage.setItem(TOUR_SEEN,'1');}catch{}}});
try{if(!localStorage.getItem(TOUR_SEEN))$('tour-button').classList.add('unseen');}catch{}
$('save').onclick=async()=>{try{const text=JSON.stringify(graph,null,2);if(window.desktop){if(!await window.desktop.saveMap(text)){message('Save canceled.');return;}}else{const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=el('a',{href:url,download:'Skill-Solar-System.json'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}dirty=false;render();guidePanel?.saveNotes();message(window.desktop?'Map saved to file.':'Map download requested. Keep the downloaded JSON as your saved copy.');refreshMapPicker();}catch(error){message(`Save failed: ${error.message}`);}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
// Held navigation keys pan continuously, scaled by frame time; releasing, blurring, typing, or opening a dialog stops them.
const heldKeys=new Map();let panFrame=null,panClock=0;
function typingOrReading(){const target=document.activeElement;return $('details-dialog').open||$('review-dialog').open||$('chain-dialog').open||['INPUT','TEXTAREA','SELECT','BUTTON'].includes(target.tagName)||target.isContentEditable;}
function stopPanning(){heldKeys.clear();if(panFrame!==null)cancelAnimationFrame(panFrame);panFrame=null;}
function panStep(time){
  if(!heldKeys.size||typingOrReading()){stopPanning();return;}
  let horizontal=0,vertical=0;for(const [x,y]of heldKeys.values()){horizontal+=x;vertical+=y;}
  if(horizontal||vertical)viewer?.pan(Math.sign(horizontal),Math.sign(vertical),(time-panClock)/1000);
  panClock=time;panFrame=requestAnimationFrame(panStep);
}
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();$('save').click();return;}
  // Esc leaves the 2D plan, then path mode, even from a focused button; text fields and dialogs keep their own Esc.
  if(e.key==='Escape'&&(planOpen||pathTarget)&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.querySelector('dialog[open]')){e.preventDefault();if(planOpen)closePlan();else setPath(null);return;}
  if(typingOrReading())return;
  const direction=panDirection(e.key);
  if(direction&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();heldKeys.set(e.key.toLowerCase(),direction);if(panFrame===null){panClock=performance.now();panFrame=requestAnimationFrame(panStep);}}
  // Esc steps back one level: the 2D plan, then path mode, then the selection.
  if(e.key==='Escape'){if(planOpen){closePlan();return;}if(pathTarget){setPath(null);return;}selected=null;render();viewer?.fit();}
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
// The Map layout help: the page's own wording for the spiral, and the helix's on helix maps.
const SPIRAL_LAYOUT_HELP=document.getElementById('layout-help').textContent;
const HELIX_LAYOUT_HELP='Helix: each skill\'s height is its helix level (1 + 3 × its longest prerequisite chain), scaled so the top level sits where level 100 does on other maps. Each of the 16 courses winds upward in its own band; milestones sit on the axis. Levels are independent of proficiency. Pins keep their positions. Both arrange buttons rebuild the helix.';
// Course colours on helix maps (src/helix.js); null elsewhere, so other maps keep their domain colours.
function palette(){return isHelixMap(graph)?courseColors(helixCourses(graph)):null;}
// Helix filters are display state only, like subject highlights: they dim non-matching skills and never
// change the map, the selection or any answer. They reset when another map is opened.
let helixFilters={},helixFilterMap=null;
function setHelixFilter(key,value){helixFilters={...helixFilters,[key]:value};viewer?.filters(helixFilters);renderLegend();}
// Legend isolation: a course or a whole family stays at full strength and every other skill fades.
// Display state only, like the filters; a second click on the same row clears it.
let isolation=null;
function setIsolation(next){
  isolation=next&&isolation&&next.kind===isolation.kind&&next.id===isolation.id?null:next;
  const codes=!isolation?null:isolation.kind==='family'?Object.keys(FAMILIES.find(f=>f.id===isolation.id).courses):[isolation.id];
  viewer?.isolate(codes&&new Set(codes));renderLegend();
  const focus=isolation?$('legend').querySelector(`[data-isolate="${isolation.kind}:${isolation.id}"]`):null;focus?.focus();
}
function renderHelixLegend(legend){
  if(helixFilterMap!==graph.title){helixFilters={};helixFilterMap=graph.title;viewer?.filters(helixFilters);isolation=null;viewer?.isolate(null);}
  const courses=helixCourses(graph),colors=courseColors(courses),count=test=>graph.nodes.filter(test).length;
  // Courses by family: the family header isolates the family, a course row isolates the course. Each
  // row shows its skill count and the share you have marked proficient (your own answers).
  const stats=new Map(courses.map(([code])=>[code,{total:0,yes:0}]));
  for(const n of graph.nodes){const s=stats.get(n.courseCode);if(s){s.total++;if(n.proficiency80===true)s.yes++;}}
  const pct=s=>s.total?Math.round(100*s.yes/s.total):0;
  const isolateButton=(kind,id,label,s,swatch,extra='')=>{
    const on=isolation?.kind===kind&&isolation?.id===id,dot=el('span',{class:kind==='family'?'swatch':'dot'});dot.style.background=swatch;
    const b=el('button',{class:`legend-item isolate ${kind}${on?' active':''}${extra}`,title:on?`Show every course again`:`Show only ${label}; other skills fade`,onclick:()=>setIsolation({kind,id})},dot,el('span',{class:'legend-name',text:label}),el('span',{class:'legend-count',text:`${s.total} · ${pct(s)}%`}));
    b.dataset.isolate=`${kind}:${id}`;b.setAttribute('aria-pressed',String(on));return b;
  };
  legend.append(el('div',{class:'legend-heading',text:'Courses · click to isolate · skills · % proficient'}));
  const names=Object.fromEntries(courses);
  for(const family of FAMILIES){
    const codes=Object.keys(family.courses).filter(code=>code in names);if(!codes.length)continue;
    const total=codes.reduce((t,c)=>({total:t.total+stats.get(c).total,yes:t.yes+stats.get(c).yes}),{total:0,yes:0});
    legend.append(isolateButton('family',family.id,family.name,total,`linear-gradient(90deg,${codes.map(c=>colors[c]).join(',')})`));
    for(const code of codes)legend.append(isolateButton('course',code,`${code} · ${names[code]}`,stats.get(code),colors[code],' course'));
  }
  const other=courses.filter(([code])=>!familyOf(code));
  for(const [code,name] of other)legend.append(isolateButton('course',code,`${code} · ${name}`,stats.get(code),colors[code],' course'));
  if(isolation)legend.append(el('button',{class:'legend-clear',id:'clear-isolation',text:'Show all courses',onclick:()=>setIsolation(null)}));
  legend.append(el('div',{class:'edge-note',text:'Octahedron = milestone (on the axis) · small sphere = checkpoint'}));
  // The filters stay available, folded away under the key.
  const filters=el('details',{class:'legend-filters',open:activeFilters(helixFilters).length>0},el('summary',{text:'Filters · dim other skills'}));
  legend.append(filters);legend=filters;
  const select=(key,label,choices)=>{const s=el('select',{id:`helix-filter-${key}`,ariaLabel:label,title:label,onchange:e=>setHelixFilter(key,e.target.value)},el('option',{value:'',text:`Any ${label.toLowerCase()}`}),...choices.map(([value,text])=>el('option',{value,text})));s.value=helixFilters[key]||'';return el('label',{class:'helix-filter'},document.createTextNode(label),s);};
  legend.append(select('course','Course',courses.map(([code,name])=>[code,`${name} (${count(n=>n.courseCode===code)})`])));
  const stages=[...new Set(graph.nodes.map(n=>n.buildStage).filter(v=>v!=null))].sort((a,b)=>a-b),stageNames=graph.metadata?.humanoidHelixImport?.buildStages||{};
  legend.append(select('stage','Build stage',[...stages.map(s=>[String(s),`${s} ${stageNames[s]||''}`.trim()]),['none','No stage (enrichment)']]));
  legend.append(select('path','On humanoid path',[['true','Yes'],['false','No']]));
  const tiers=[...new Set(graph.nodes.map(n=>tierOf(graph,n)).filter(Boolean))];
  legend.append(select('tier','Level',tiers.map(tier=>[tier,`${tier} (${count(n=>tierOf(graph,n)===tier)})`])));
  helixExtras=legend;
  if(activeFilters(helixFilters).length){
    const shown=count(n=>matchesHelixFilters(graph,n,helixFilters));
    legend.append(el('div',{class:'edge-note',id:'helix-filter-count',text:`Showing ${shown} of ${graph.nodes.length} skills`}),el('button',{class:'legend-clear',id:'clear-helix-filters',text:'Clear filters',onclick:()=>{helixFilters={};viewer?.filters(helixFilters);renderLegend();}}));
  }
}
let helixExtras=null;
function renderLegend(){
  let legend=$('legend');legend.replaceChildren();
  legend.classList.toggle('helix-legend',isHelixMap(graph));
  helixExtras=null;if(isHelixMap(graph))renderHelixLegend(legend);
  // On helix maps the six-subject highlight sits with the filters, under the course key.
  const counts=domainCounts(graph),key=legend;legend=helixExtras||legend;
  legend.append(el('div',{class:'legend-heading',text:'Domains · click to highlight'}));
  for(const [name,color]of Object.entries(DOMAINS)){
    const on=subjects.has(name),dot=el('span',{class:'dot'});dot.style.background=color;
    const button=el('button',{class:'legend-item subject'+(on?' active':''),disabled:!counts[name],title:counts[name]?`${on?'Remove the highlight from':'Highlight'} all ${counts[name]} ${name} skills`:`No ${name} skills in this map`,onclick:()=>setSubjects(toggleSubject(subjects,name))},dot,el('span',{text:name}),el('span',{class:'legend-count',text:String(counts[name])}));
    button.dataset.subject=name;button.setAttribute('aria-pressed',String(on));legend.append(button);
  }
  if(subjects.size)legend.append(el('button',{class:'legend-clear',id:'clear-highlights',text:'Clear highlights',onclick:()=>setSubjects(new Set())}));
  legend=key;
  if(proficiencyOn){
    legend.append(el('div',{class:'legend-heading',text:'Sphere colour · proficiency'}));
    for(const [name,color]of [['Proficient (Yes)',PROFICIENCY_COLORS.yes],['Not marked',PROFICIENCY_COLORS.unset],['Marked No (darker)',PROFICIENCY_COLORS.no]]){const dot=el('span',{class:'dot'});dot.style.background=color;legend.append(el('div',{class:'legend-item'},dot,document.createTextNode(name)));}
    const glow=el('span',{class:'dot glow'});glow.style.background=PROFICIENCY_COLORS.unset;glow.style.boxShadow=`0 0 5px 3px ${FRONTIER_GLOW}`;legend.append(el('div',{class:'legend-item'},glow,document.createTextNode('Glow · ready to study')));
    legend.append(el('div',{class:'edge-note',text:'Manual self-report'}));
  }
  legend.append(el('div',{class:'edge-note',text:'Links: gold → prerequisite · dashed → supports · violet — related'}));
}
function renderShared(){
  const mapFamily=atlasFamily(graph),summary=recordSummary(record),loaded=!!record&&record.family===mapFamily;
  $('shared-summary').textContent=!mapFamily?'This map has no atlas family, so its proficiency answers stay in this map only.':loaded?`Atlas family “${mapFamily}”: ${plural(summary.total,'shared answer')} (${summary.yes} Yes, ${summary.no} No, ${summary.cleared} cleared).`:`Atlas family “${mapFamily}”: the shared record is not available${recordError?` (${recordError})`:''}.`;
  $('export-record').disabled=!loaded;$('import-record').disabled=!loaded;
  $('adopt-file').disabled=!(loaded&&fileAnswers&&fileAnswers.family===mapFamily&&fileAnswers.title===(graph.title||''));
  const labels={none:'',ready:'Shared answers: up to date',saving:'Shared answers: saving…',saved:`Shared answers saved on ${records.location}`,failed:'Shared answers NOT saved · Retry',unreadable:'Shared record unreadable · Retry'};
  const state=$('sync-state');state.textContent=labels[sync]||'';state.hidden=!(sync==='failed'||sync==='unreadable');   // the save indicator covers the rest; failures keep their Retry buttonstate.disabled=!(sync==='failed'||sync==='unreadable');state.className=`sync-state ${sync}`;state.title=syncDetail;
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
    const b=el('button',{text:label,class:node.proficiency80===value?'chosen':'',onclick:()=>commit(next=>{next.nodes.find(n=>n.id===node.id).proficiency80=value;},'Proficiency updated.','console')});
    b.setAttribute('aria-pressed',String(node.proficiency80===value));row.append(b);
  }
  group.append(row);
  // The whole chain this skill rests on, answered in one deliberate pass. The button only opens the
  // list; nothing is recorded until the reader confirms it there. A skill with no recorded
  // prerequisites has no chain to offer, so the button is left off its card entirely.
  const chain=prerequisiteChain(graph,node.id);
  if(chain.length){
    const summary=chainSummary(chain);
    group.append(el('button',{class:'chain-open',text:`Mark proficient on all prerequisite skills (${summary.total})…`,onclick:()=>openChain(node.id)}));
    group.append(el('p',{class:'edge-note',text:`${node.name} rests on ${summary.total} ${summary.total===1?'skill':'skills'}, ${summary.yes} already marked Yes. Nothing is marked until you confirm the list.`}));
  }
  return group; // the chosen button and the sphere colour show the current answer
}
// --- Marking a whole prerequisite chain ---------------------------------------------------------
// One reader decision applied to many skills. Every skill the chain reaches is listed with the
// answer it currently holds, ticked only where the chosen answer would change it, and nothing is
// written until Mark is pressed. The app still never infers an answer: this is the reader saying
// the same thing about a list of skills at once, through the ordinary commit path, so it lands in
// the history, the draft cache and the shared record exactly like a single answer, and Undo
// reverses the whole pass.
let chain={id:null,value:true,selected:new Set()};
function openChain(id){
  // One modal at a time: the card steps aside while the list is up, and comes back when it closes,
  // so a reader who came from the card is returned to it rather than to the bare map.
  const fromCard=$('details-dialog').open;
  stopPanning();closeDetailsKeepSelection();
  chain={id,value:true,selected:null,fromCard};
  fillChain();
  if(!$('chain-dialog').open)$('chain-dialog').showModal();
}
function closeChain(){if($('chain-dialog').open)$('chain-dialog').close();}
function fillChain(){
  const node=graph.nodes.find(n=>n.id===chain.id);
  const body=$('chain-body');
  if(!node){closeChain();return;}
  const list=prerequisiteChain(graph,node.id),summary=chainSummary(list);
  if(chain.selected===null)chain.selected=defaultSelection(list,chain.value);
  // A skill that has since left the map must not linger in the selection.
  const present=new Set(list.map(s=>s.id));
  chain.selected=new Set([...chain.selected].filter(id=>present.has(id)));
  const changes=pendingChanges(list,chain.selected,chain.value);
  body.replaceChildren();
  $('chain-title').textContent=`Prerequisites of ${node.name}`;
  body.append(el('p',{text:`${node.name} rests on ${summary.total} ${summary.total===1?'skill':'skills'}, ${summary.depth} ${summary.depth===1?'step':'steps'} down at the deepest. Choose the answer to record, check the skills it should apply to, then mark them.`}));
  body.append(el('p',{class:'edge-note',text:'Your own judgment, as everywhere else: there is no test and no scoring. Marking a skill here says nothing about any other skill, and the skill this chain belongs to is not changed.'}));
  body.append(el('p',{class:'edge-note',text:`Now: ${summary.yes} Yes · ${summary.no} No · ${summary.unmarked} not marked. Only prerequisite links are followed; supporting and related links are not learning order and are left out.`}));

  const answers=el('div',{class:'button-row chain-answer'});
  for(const [label,value]of [['Yes',true],['No',false],['Clear',null]]){
    const b=el('button',{text:label,class:chain.value===value?'chosen':'',onclick:()=>{chain.value=value;chain.selected=null;fillChain();}});
    b.setAttribute('aria-pressed',String(chain.value===value));answers.append(b);
  }
  body.append(el('h3',{text:'Answer to record'}),answers);

  const changeable=list.filter(s=>s.proficiency80!==chain.value).map(s=>s.id);
  body.append(el('div',{class:'button-row chain-bulk'},
    el('button',{text:`Check the ${changeable.length} this would change`,disabled:!changeable.length,onclick:()=>{chain.selected=new Set(changeable);fillChain();}}),
    el('button',{text:'Check all',onclick:()=>{chain.selected=new Set(list.map(s=>s.id));fillChain();}}),
    el('button',{text:'Uncheck all',onclick:()=>{chain.selected=new Set();fillChain();}})));

  let step=0;
  const items=el('div',{class:'chain-list'});
  for(const skill of list){
    if(skill.steps!==step){step=skill.steps;items.append(el('h4',{class:'chain-step',text:`${stepLabel(step)} (${list.filter(s=>s.steps===step).length})`}));}
    const box=el('input',{type:'checkbox',checked:chain.selected.has(skill.id),onchange:event=>{
      if(event.target.checked)chain.selected.add(skill.id);else chain.selected.delete(skill.id);
      updateChainAction(list);
    }});
    const state=proficiencyLabel(skill.proficiency80);
    items.append(el('label',{class:'chain-item'+(skill.proficiency80===chain.value?' chain-item-settled':'')},box,
      el('span',{class:'chain-name',text:skill.name}),
      el('span',{class:'chain-meta',text:`${skill.domain} · ${state}`})));
  }
  body.append(items);

  const action=el('button',{class:'primary',id:'chain-apply',text:'',onclick:()=>applyChain(list)});
  const note=el('p',{class:'edge-note',id:'chain-note',text:''});
  body.append(el('div',{class:'chain-actions'},el('div',{class:'button-row'},action,el('button',{text:'Cancel',onclick:closeChain})),note));
  updateChainAction(list);
}
function updateChainAction(list){
  const changes=pendingChanges(list,chain.selected,chain.value);
  const action=$('chain-apply'),note=$('chain-note');
  if(!action)return;
  action.disabled=!changes.length;
  const count=`${changes.length} ${changes.length===1?'skill':'skills'}`;
  action.textContent=!changes.length?'Nothing to change':chain.value===null?`Clear ${count}`:`Mark ${count} ${proficiencyLabel(chain.value)}`;
  const checked=[...chain.selected].length;
  note.textContent=changes.length
    ?`${checked} checked; ${changes.length} would change. Undo reverses the whole pass. File ▸ Save map exports it.`
    :`${checked} checked, none of which would change. Pick another answer or check more skills.`;
}
function applyChain(list){
  const node=graph.nodes.find(n=>n.id===chain.id);
  const changes=pendingChanges(list,chain.selected,chain.value);
  if(!changes.length)return;
  const ids=new Set(changes);
  const result=commit(next=>{for(const n of next.nodes)if(ids.has(n.id))n.proficiency80=chain.value;},
    `${chain.value===null?'Cleared':'Marked'} ${changes.length} ${changes.length===1?'prerequisite':'prerequisites'} of ${node.name}${chain.value===null?'':`: ${proficiencyLabel(chain.value)}`}. Undo reverses the whole pass.`,'prerequisite chain');
  if(result.ok){viewer?.focus(chain.id);closeChain();}
  else fillChain();
}
$('chain-close').onclick=closeChain;
$('chain-dialog').addEventListener('close',()=>{
  if(chain.fromCard&&graph.nodes.some(n=>n.id===selected))openDetails();
  else $('canvas').focus();
});

function openDetails(){stopPanning();fillDetails();if(selected&&!$('details-dialog').open)$('details-dialog').showModal();}
// Closing the card to show the chain list must not clear the selection the list belongs to.
function closeDetailsKeepSelection(){if($('details-dialog').open)$('details-dialog').close();}
function closeDetails(){if($('details-dialog').open)$('details-dialog').close();}
// --- The skill card ------------------------------------------------------------------------------
// One card for every node (src/skill-card.js): the console and the full card dialog show the same
// layout, and no lesson body appears on it. The lesson opens in the lesson viewer.
// Whether lessons can be generated now (key, connection, budget), from the main process. Refreshed
// when the Guide's connection changes, so the card's Generate button follows it.
let lessonStatus=null;
function refreshLessonStatus(){
  if(!window.desktop?.lessons)return Promise.resolve(null);
  return window.desktop.lessons.status().then(next=>{const changed=JSON.stringify(next?.availability)!==JSON.stringify(lessonStatus?.availability)||next?.settings?.model!==lessonStatus?.settings?.model;lessonStatus=next;if(changed)render();return next;},()=>null);
}
function lessonGeneration(){
  if(!window.desktop?.lessons)return {ok:false,reason:'Lessons are generated in the desktop app.'};
  return lessonStatus?.availability||{ok:false,reason:'Checking whether lessons can be generated…'};
}
function skillCard(n,extra=[],{inDialog=false}={}){
  const state=learner();
  return renderSkillCard(graph,n,{learner:state,lessonState:lessonIndex.state(graph,n),generation:lessonGeneration(),palette:palette(),el,extra,
    colors:{yes:PROFICIENCY_COLORS.yes,no:PROFICIENCY_COLORS.no,unset:PROFICIENCY_COLORS.unset,ready:FRONTIER_GLOW},
    actions:{select:id=>{selected=id;render();viewer?.focus(id);},path:id=>setPath(id),fly:id=>viewer?.fly(id),openDetails:inDialog?null:openDetails,
      openLesson:()=>lessonUI.open(n.id),generate:()=>lessonUI.generate(n.id),regenerate:()=>lessonUI.regenerate(n.id)}});
}
function fillDetails(){
  const node=graph.nodes.find(n=>n.id===selected);if(!node){closeDetails();return;}
  const body=$('details-body');body.replaceChildren();
  $('details-title').textContent=node.name;
  body.append(el('div',{class:'subject-heading'},iconElement(node.icon),el('p',{class:'edge-note',title:LEVEL_NOTE,text:levelLine(graph,node,'Reference level',' · Reference level unassigned')})));
  // The same card as the console, with the longer description, where the skill sits and its links.
  const paragraphs=node.details.trim().split(/\n\s*\n/).filter(Boolean);
  const more=paragraphs.length?el('div',{class:'skill-details'},...paragraphs.map(p=>el('p',{text:p}))):null;
  body.append(skillCard(node,[more],{inDialog:true}));
  body.append(el('h3',{text:'Where it sits'}),el('p',{text:placementSummary(graph,node)}));
  const names=new Map(graph.nodes.map(n=>[n.id,n.name]));
  const links=graph.edges.filter(e=>e.source===node.id||e.target===node.id);
  if(links.length){
    const list=el('details',{class:'connections',open:links.length<=12},el('summary',{text:`Links (${links.length})`}));
    for(const edge of links){
      const verb=edge.type==='prerequisite'?'is prerequisite for':edge.type==='supports'?'supports':'is related to',text=`${names.get(edge.source)} ${verb} ${names.get(edge.target)}`;
      list.append(edge.rationale&&edge.rationale.length>80?el('details',{class:'detail-link'},el('summary',{text}),el('p',{text:edge.rationale})):el('p',{class:'detail-link',text:text+(edge.rationale?' — '+edge.rationale:'')}));
    }
    body.append(list);
  }
  body.append(proficiencyControls(node));
}
$('details-close').onclick=closeDetails;
// The lesson dialog (src/lesson-ui.js): open, generate with live progress, regenerate, review.
const lessonUI=createLessonUI({bridge:window.desktop?.lessons,index:lessonIndex,el,dialog:$('lesson-dialog'),title:$('lesson-title'),body:$('lesson-body'),
  getGraph:()=>graph,getLearner:learner,getStatus:()=>lessonStatus,onChanged:()=>{refreshLessonStatus();render();},beforeOpen:()=>{stopPanning();closeDetailsKeepSelection();}});
$('lesson-close').onclick=()=>lessonUI.close();
$('lesson-dialog').addEventListener('close',()=>{$('canvas').focus();});
window.desktop?.guide?.onStatus(()=>refreshLessonStatus());
refreshLessonStatus();
// File ▸ Lessons…: settings, usage, the pre-generate queue and export/import (src/lesson-settings.js).
const lessonQueue=createLessonQueue({generate:id=>lessonUI.generateQuietly(id),cancel:()=>lessonUI.cancelQuiet(),onChange:()=>{if($('lessons-dialog').open)lessonSettings.render();}});
const lessonSettings=createLessonSettings({bridge:window.desktop?.lessons,dialog:$('lessons-dialog'),body:$('lessons-body'),el,getStatus:()=>lessonStatus,queue:lessonQueue,
  refresh:async(reload=false)=>{await refreshLessonStatus();if(reload)await lessonIndex.load(graph,true);render();},
  candidates:n=>queueCandidates(learner(),node=>lessonIndex.state(graph,node).has,n)});
$('lessons-open').onclick=()=>{setMenu('file-menu','file-menu-items',false);refreshLessonStatus().then(()=>lessonSettings.open());};
$('lessons-close').onclick=()=>lessonSettings.close();

$('details-dialog').addEventListener('click',e=>{const r=$('details-dialog').getBoundingClientRect();if(e.target===$('details-dialog')&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))closeDetails();});
$('details-dialog').addEventListener('close',()=>{$('canvas').focus();});
$('canvas').tabIndex=0;
$('canvas').addEventListener('pointerdown',()=>{$('canvas').focus({preventScroll:true});});
// Guided proficiency review: answers use the normal commit path (history, draft cache, dirty state, shared record).
const review=createReviewDialog({dialog:$('review-dialog'),opener:$('mark-proficiency'),getGraph:()=>graph,storage:safeStorage,
  apply:(id,value,nextId)=>{const name=graph.nodes.find(n=>n.id===id).name;if(nextId)selected=nextId;const result=commit(next=>{next.nodes.find(n=>n.id===id).proficiency80=value;},`Marked ${name}: ${proficiencyLabel(value)}. Saved on this computer; File ▸ Save map exports a file.`,'review');if(result.ok&&nextId)viewer?.focus(nextId);return result;},
  show:id=>{if(!id)return;selected=id;render();viewer?.focus(id);},
  onOpen:()=>{stopPanning();listActivation.reset();closeDetails();},
  // The skill's cached lesson practice, so the same questions come back in every review.
  practiceFor:node=>lessonIndex.getLesson(graph,node).then(practiceItems),
  renderPractice:items=>el('details',{class:'review-practice',id:'review-practice'},el('summary',{text:`Practice from your lesson (${items.length})`}),
    ...items.slice(0,4).map(item=>revealBlock(el,{question:el('div',{},renderMarkdown(el,item.question)),answer:item.answer},text=>renderMarkdown(el,text))),
    el('p',{class:'edge-note',text:'For your own check only. Nothing here answers the question below.'}))});
$('mark-proficiency').onclick=()=>review.open();
// File ▸ Settings…: Appearance and Developer (src/settings-dialog.js).
const settingsDialog=createSettingsDialog({dialog:$('settings-dialog'),body:$('settings-body'),el,storage:safeStorage,onStyleGuide:()=>openStyleGuide()});
$('settings-open').onclick=()=>{setMenu('file-menu','file-menu-items',false);settingsDialog.open();};
$('settings-close').onclick=()=>settingsDialog.close();
// The Cyberpunk HUD style guide, with readouts from the open map (src/theme/styleguide.js).
function openStyleGuide(){const d=$('styleguide-dialog');renderStyleGuide($('styleguide-body'),{graph,learner:learner(),onClose:()=>d.close()});d.showModal();d.querySelector('button')?.focus();}
// The AI Guide (desktop only): reads the open map through its own read-only tools; links in its
// replies select a skill or show a path, the same as the HUD's buttons.
const guidePanel=createGuidePanel({bridge:window.desktop?.guide,button:$('guide-button'),pill:$('guide-state'),panel:$('guide-panel'),el,getFamily:()=>atlasFamily(graph)||'default',
  getContext:()=>({graph,target:activeTarget(graph,safeStorage),selected,pathTarget,reviewLeft:reviewLeft(safeStorage,graph),record,today:new Date().toISOString().slice(0,10),lessonState:n=>lessonIndex.state(graph,n)}),
  actions:{select:flyTo,path:id=>setPath(id)}});
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
