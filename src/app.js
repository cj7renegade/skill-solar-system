import { arrangeVortex } from './vortex.js';
import { DOMAINS, TYPES, clone, validate, normalize, arrange, removeNode, editedPosition, positionExplanation, placementSummary, LEVEL_NOTE, proficiencyLabel, nodeColor } from './model.js';
import { spacingValue } from './spacing.js';
import { starter } from './starter.js';
import { createViewer } from './viewer.js';
import { ICONS, iconElement } from './icons.js';
import { panDirection, createActivationTracker } from './interaction.js';
import { createReviewDialog } from './review-dialog.js';

const $=id=>document.getElementById(id), CACHE='skill-solar-system-v1';
let graph=normalize(starter),selected=null,editing=false,dirty=false,history=[],viewer,proficiencyOn=false;
const listActivation=createActivationTracker();
const SPACING_CACHE='skill-solar-system-spacing';
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
function change(mutator,status){if(editing)commit(mutator,status);}
function commit(mutator,status){
  try{const next=clone(graph);mutator(next);const normalized=normalize(next);history.push(clone(graph));if(history.length>50)history.shift();graph=normalized;dirty=true;const cached=cache();render();message(cached?status:`${status} Draft cache unavailable: save the map to a JSON file now.`);return {ok:true,cached};}
  catch(error){message(error.message);return {ok:false,cached:false};}
}
function replace(next,status){
  listActivation.reset();closeDetails();
  const normalized=normalize(next);history.push(clone(graph));if(history.length>50)history.shift();graph=normalized;selected=null;dirty=true;cache();render();viewer?.fit();message(status);
}
function render(){
  if(!graph.nodes.some(n=>n.id===selected))selected=null;
  $('counts').textContent=`${graph.nodes.length} subjects / ${graph.edges.length} connections`;
  $('dirty').textContent=dirty?'Local draft · save to file':'Saved to file';
  $('map-name').textContent=graph.title||'Untitled map';
  $('layout-summary').textContent=graph.nodes.some(n=>n.layoutMode==='vortex')?'Upward: reference level · Around: domain · Proficiency is separate':'Foundations below. Connections above.';
  viewer?.setGraph(graph,selected);viewer?.setEdit(editing);
  renderLegend();renderList();inspect();if($('details-dialog').open)fillDetails();document.querySelectorAll('[data-edit]').forEach(button=>button.disabled=!editing);
  $('undo').disabled=!editing||!history.length;
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
  panel.append(el('div',{class:'subject-heading'},iconElement(n.icon),el('div',{},el('h3',{text:n.name}),el('p',{class:'edge-note',title:LEVEL_NOTE,text:n.domain+(n.skillLevel!=null?` · Level ${n.skillLevel}/100`:' · Level unassigned')}))));
  if(!editing){
    panel.append(el('p',{text:n.description}),el('button',{text:'Read subject details',onclick:openDetails}),proficiencyControls(n));
    return;
  }
  const skillLevel=el('input',{type:'number',min:1,max:100,step:1,value:n.skillLevel??'',id:'node-level'});
  const name=el('input',{value:n.name,maxLength:120,disabled:!editing,id:'node-name'});
  const domain=el('select',{disabled:!editing,id:'node-domain'},...options(Object.keys(DOMAINS),n.domain));
  const description=el('textarea',{value:n.description,maxLength:5000,disabled:!editing,id:'node-description'});
  const details=el('textarea',{value:n.details,maxLength:12000,id:'node-details'});
  const note=el('textarea',{value:n.placementNote,maxLength:12000,id:'node-placement-note'});
  const icon=el('select',{id:'node-icon'},...Object.entries(ICONS).map(([value,[text]])=>el('option',{value,text,selected:value===n.icon})));
  const proficiency=el('select',{id:'node-proficiency'},el('option',{value:'unset',text:'Not marked',selected:n.proficiency80===null}),el('option',{value:'yes',text:'Yes · at least 80%',selected:n.proficiency80===true}),el('option',{value:'no',text:'No · below 80%',selected:n.proficiency80===false}));
  const coords=n.position.map((v,i)=>el('input',{type:'number',value:Math.round(v*100)/100,step:'any',min:-100000,max:100000,disabled:!editing,id:['node-x','node-y','node-z'][i]}));
  const pinned=el('input',{type:'checkbox',checked:n.pinned,disabled:!editing,id:'node-pinned'});
  panel.append(field('Subject',name),el('div',{class:'node-id',text:`ID · ${n.id}`}),field('Domain',domain),field('Reference level · 1–100 (blank = unassigned)',skillLevel),el('p',{class:'edge-note',text:'A reference rank, not proficiency. Apply saves the number; Arrange level spiral updates height and raises levels where prerequisites require it.'}),field('Short description',description),field('Detailed description · separate paragraphs with a blank line',details),field('Placement note · optional author explanation',note),field('Console icon',icon),field('Self-reported proficiency of at least 80%',proficiency),el('div',{class:'coords'},...coords.map((c,i)=>field(['X','Y · height','Z'][i],c))),el('p',{class:'edge-note',text:positionExplanation(graph,n)}),el('label',{},pinned,document.createTextNode(' Pin position during arrangement')));
  panel.append(el('div',{class:'button-row'},el('button',{text:'Apply changes',disabled:!editing,id:'apply-node',onclick:()=>change(next=>{const target=next.nodes.find(v=>v.id===n.id);if(coords.some(c=>!c.value.trim()))throw Error('Enter all three coordinates.');const position=editedPosition(target.position,coords.map(c=>c.value));if(position.some((v,i)=>v!==target.position[i]))target.layoutMode='manual';Object.assign(target,{skillLevel:skillLevel.value.trim()===''?null:Number(skillLevel.value),details:details.value,placementNote:note.value,icon:icon.value,proficiency80:proficiency.value==='unset'?null:proficiency.value==='yes',name:name.value.trim(),domain:domain.value,description:description.value,pinned:pinned.checked,position});},'Subject updated.')}),el('button',{text:'Delete',class:'danger',disabled:!editing,id:'delete-node',onclick:()=>{if(confirm(`Delete ${n.name} and its connections? Undo is available.`))change(next=>Object.assign(next,removeNode(next,n.id)),'Subject deleted.');}})));
  panel.append(el('h3',{text:'Connections'}));
  const links=graph.edges.filter(e=>e.source===n.id||e.target===n.id);
  for(const edge of links){
    const source=graph.nodes.find(x=>x.id===edge.source).name,target=graph.nodes.find(x=>x.id===edge.target).name;
    const verb=edge.type==='prerequisite'?'is prerequisite for':edge.type==='supports'?'supports':'is related to';
    panel.append(el('div',{class:'edge-item'},el('span',{text:`${source} ${verb} ${target}`}),el('button',{text:'×',title:'Remove connection',ariaLabel:'Remove connection',disabled:!editing,onclick:()=>change(next=>{next.edges=next.edges.filter(e=>!(e.source===edge.source&&e.target===edge.target&&e.type===edge.type));},'Connection removed.')})));
  }
  if(!links.length)panel.append(el('p',{class:'edge-note',text:'No connections yet.'}));
  if(!editing)return;
  const type=el('select',{id:'edge-type'},...options(TYPES,'supports'));
  const direction=el('select',{id:'edge-direction'},el('option',{value:'out',text:'This subject → other subject'}),el('option',{value:'in',text:'Other subject → this subject'}));
  const target=el('select',{id:'edge-target'},...graph.nodes.filter(x=>x.id!==n.id).map(x=>el('option',{value:x.id,text:x.name})));
  panel.append(el('h3',{text:'Add a connection'}),field('Relationship',type),field('Direction',direction),field('Other subject',target),el('p',{class:'edge-note',text:'Prerequisite: source must come before target. Supports: directional contribution. Related: no learning order.'}),el('button',{text:'Connect subjects',id:'connect',disabled:graph.nodes.length<2,onclick:()=>change(next=>{next.edges.push({source:direction.value==='out'?n.id:target.value,target:direction.value==='out'?target.value:n.id,type:type.value});},'Connection added.')}));
}
$('edit-mode').onchange=e=>{listActivation.reset();closeDetails();editing=e.target.checked;render();message(editing?'Edit mode · Apply changes commits console edits.':'View mode · Select a subject to inspect.');};
$('search').oninput=renderList;
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
$('undo').onclick=()=>{if(!editing||!history.length)return;graph=history.pop();dirty=true;cache();render();message('Previous map restored.');};
$('vortex').onclick=()=>{if(confirm('Arrange an upward spiral? Unassigned levels are estimated from prerequisites; existing levels are raised if needed to stay above their prerequisites. Pinned positions remain fixed. Undo restores the map.')){change(next=>Object.assign(next,arrangeVortex(next)),'Spiral arranged. Reference levels reconciled; pinned positions retained.');viewer?.fit();}};
$('recalculate-vortex').onclick=()=>{if(confirm('Recalculate ALL reference levels from the recorded prerequisite graph and arrange a spiral? This replaces edited levels but keeps proficiency and pinned positions. Undo is available.')){change(next=>Object.assign(next,arrangeVortex(next,{recalculate:true})),'Reference levels recalculated and spiral arranged.');viewer?.fit();}};
$('arrange').onclick=()=>{if(confirm('Arrange unpinned nodes using strict prerequisites only? Supports links do not affect height. Undo restores your layout.'))change(next=>Object.assign(next,arrange(next)),'Dependency layout applied. Pinned nodes kept their positions.');};
$('blank').onclick=()=>{if(editing&&confirm('Start an empty map? Save your current map first if you need a separate copy. Undo is available.'))replace({schemaVersion:1,title:'Skill Solar System',nodes:[],edges:[]},'Empty map created.');};
$('reset').onclick=()=>{if(editing&&confirm('Restore the starter map? Undo is available.'))replace(starter,'Starter restored.');};
$('load').onclick=()=>{if(!dirty||confirm('Open another map? Current changes are cached only until replacement. Save a file first if needed.'))$('file').click();};
$('file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>10_000_000)throw Error('Map files must be smaller than 10 MB.');const next=validate(JSON.parse(await file.text()));replace(next,`Opened ${file.name}.`);dirty=false;render();}catch(error){message(`Could not open map: ${error.message}`);}e.target.value='';};
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
function renderLegend(){
  $('legend').replaceChildren();
  const palette=proficiencyOn?{'Yes · at least 80%':'#59d49c','No · below 80%':'#ef9290','Not marked':'#99a9bc'}:DOMAINS;
  for(const [name,color]of Object.entries(palette)){const dot=el('span',{class:'dot'});dot.style.background=color;$('legend').append(el('div',{class:'legend-item'},dot,document.createTextNode(name)));}
  if(proficiencyOn)$('legend').append(el('div',{class:'edge-note',text:'Manual self-report'}));
  $('legend').append(el('div',{class:'edge-note',text:'Gold → prerequisite'}),el('div',{class:'edge-note',text:'Dashed → supports'}),el('div',{class:'edge-note',text:'Violet — related'}));
}
function proficiencyControls(node){
  const group=el('div',{class:'proficiency-controls'},el('h3',{text:'At least 80% proficient?'}),el('p',{class:'edge-note',text:'Your judgment only. No tests or automatic scoring.'}));
  const row=el('div',{class:'button-row'});
  for(const [label,value]of [['Yes',true],['No',false],['Clear',null]]){
    const b=el('button',{text:label,class:node.proficiency80===value?'chosen':'',onclick:()=>commit(next=>{next.nodes.find(n=>n.id===node.id).proficiency80=value;},'Proficiency updated. Save map to keep it.')});
    b.setAttribute('aria-pressed',String(node.proficiency80===value));row.append(b);
  }
  group.append(row,el('p',{class:'proficiency-state',text:proficiencyLabel(node.proficiency80)}));return group;
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
// Guided proficiency review: answers use the normal commit path (history, draft cache, dirty state).
const reviewStorage={getItem:key=>{try{return localStorage.getItem(key);}catch{return null;}},setItem:(key,value)=>localStorage.setItem(key,value)};
const review=createReviewDialog({dialog:$('review-dialog'),opener:$('mark-proficiency'),getGraph:()=>graph,storage:reviewStorage,
  apply:(id,value,nextId)=>{const name=graph.nodes.find(n=>n.id===id).name;if(nextId)selected=nextId;const result=commit(next=>{next.nodes.find(n=>n.id===id).proficiency80=value;},`Marked ${name}: ${proficiencyLabel(value)}. Kept in the local draft; Save map writes the JSON file.`);if(result.ok&&nextId)viewer?.focus(nextId);return result;},
  show:id=>{if(!id)return;selected=id;render();viewer?.focus(id);},
  onOpen:()=>{stopPanning();listActivation.reset();closeDetails();}});
$('mark-proficiency').onclick=()=>review.open();
viewer?.spacing(spacing);
$('sphere-spacing').value=String(spacing);$('spacing-value').value=`${spacing.toFixed(2)}×`;
render();viewer?.fit();
