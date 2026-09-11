// Reference ranks measure recorded dependency structure, not personal mastery.
import { clone, levels, validate, DOMAINS } from './model.js';
export function referenceLevels(graph, preserve=true) {
  const depth=levels(graph), maximum=Math.max(0,...depth.values());
  if(maximum>99)throw Error('This prerequisite chain needs more than 100 distinct levels. Review the graph before arranging.');
  const step=maximum?Math.min(3,99/maximum):3;
  const ranks=new Map(), incoming=new Map(graph.nodes.map(n=>[n.id,[]]));
  for(const e of graph.edges)if(e.type==='prerequisite')incoming.get(e.target).push(e.source);
  for(const n of [...graph.nodes].sort((a,b)=>depth.get(a.id)-depth.get(b.id)||a.id.localeCompare(b.id))) {
    const proposed=preserve&&n.skillLevel!=null?n.skillLevel:1+Math.floor(step*depth.get(n.id));
    const rank=Math.max(proposed,...incoming.get(n.id).map(id=>ranks.get(id)+1));
    if(rank>100)throw Error(`No level above its prerequisites is available for ${n.name}. Lower an earlier level or recalculate levels.`);
    ranks.set(n.id,rank);
  }
  return ranks;
}
export function assignReferenceLevels(graph, preserve=true) {
  validate(graph);const result=clone(graph),ranks=referenceLevels(result,preserve);
  for(const n of result.nodes)n.skillLevel=ranks.get(n.id);
  return result;
}
export function arrangeVortex(graph, {recalculate=false}={}) {
  const result=assignReferenceLevels(graph,!recalculate),groups=new Map();
  for(const n of result.nodes){const key=`${n.domain}:${n.skillLevel}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(n);}
  // Six colored ribbons wind twice around an expanding central space.
  // Equal-level peers fan across a sector and then into outward rows.
  for(const peers of groups.values()) {
    peers.sort((a,b)=>(a.subdomain||'').localeCompare(b.subdomain||'')||a.id.localeCompare(b.id));
    const level=peers[0].skillLevel,t=(level-1)/99,domain=Object.keys(DOMAINS).indexOf(peers[0].domain);
    const center=domain*Math.PI/3+t*Math.PI*4;
    const baseRadius=420+580*t,arc=Math.PI/3*.76;
    const columns=Math.max(3,Math.floor(baseRadius*arc/62));
    peers.forEach((n,i)=>{
      if(n.pinned)return;
      const row=Math.floor(i/columns),count=Math.min(columns,peers.length-row*columns);
      const theta=center+((i%columns+.5)/count-.5)*arc,radius=baseRadius+row*70;
      n.position=[Math.cos(theta)*radius,(level-1)*64,Math.sin(theta)*radius].map(v=>Math.round(v*1000)/1000);
      n.layoutMode='vortex';
    });
  }
  result.layout={type:'vortex',version:1,turns:2,heightPerLevel:64,levelMeaning:'Provisional reference rank from recorded prerequisites; not proficiency or a standardized difficulty scale.'};
  return validate(result);
}
