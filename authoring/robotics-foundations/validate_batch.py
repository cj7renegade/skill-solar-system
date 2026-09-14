"""Read-only content validation. Usage: python validate_batch.py MASTER.json [BATCH.json]"""
import json,sys,hashlib,collections
from pathlib import Path
master_path=Path(sys.argv[1]); batch_path=Path(sys.argv[2]) if len(sys.argv)>2 else Path(__file__).with_name('robotics-foundations-batch-01.json')
m=json.loads(master_path.read_text());b=json.loads(batch_path.read_text()); old={n['id']:n for n in m['nodes']};new={n['id']:n for n in b['nodes']}
assert len(old)==len(m['nodes']) and len(new)==len(b['nodes']),'Duplicate node ID'
assert not old.keys()&new.keys(),'Batch IDs already exist: reconcile instead of applying again'
norm=lambda x:' '.join(x.casefold().split())
names=collections.defaultdict(list)
for n in m['nodes']+b['nodes']:names[norm(n['name'])].append(n['id'])
assert all(len(names[norm(n['name'])])==1 for n in b['nodes']),'New name duplicates an existing name'
allnodes=old|new
key=lambda e:(e['type'],*sorted([e['source'],e['target']])) if e['type']=='related' else (e['type'],e['source'],e['target'])
oldedges={key(e) for e in m['edges']}; seen=set()
for e in b['edges']:
 assert e['source'] in allnodes and e['target'] in allnodes,'Missing endpoint'
 assert e['source']!=e['target'] and e['type'] in ('prerequisite','supports','related')
 assert key(e) not in oldedges|seen,'Duplicate edge'
 assert len(e['rationale'])>30
 seen.add(key(e))
for n in b['nodes']:
 assert len(n['details'].split('\n\n'))==2 and all(len(p.split())>=25 for p in n['details'].split('\n\n'))
 assert n['proficiency80'] is None and n['domain']=='Robotics'
 assert set(n['sourceRefs'])<=b['sources'].keys()
 assert 'position' not in n and 'skillLevel' not in n,'Authoring record must not pretend layout is assigned'
 assert len(n['placementNote'].split('. '))<=2
adj=collections.defaultdict(list);incoming=collections.defaultdict(list);indeg={i:0 for i in allnodes}
for e in m['edges']+b['edges']:
 if e['type']=='prerequisite':
  adj[e['source']].append(e['target']);incoming[e['target']].append(e['source']);indeg[e['target']]+=1
q=collections.deque(i for i in indeg if indeg[i]==0);depth={i:0 for i in allnodes};processed=[]
while q:
 i=q.popleft();processed.append(i)
 for j in adj[i]:
  depth[j]=max(depth[j],depth[i]+1);indeg[j]-=1
  if not indeg[j]:q.append(j)
assert len(processed)==len(allnodes),'Prerequisite cycle in merged graph'
external=sorted({e[k] for e in b['edges'] for k in ['source','target'] if e[k] not in new})
closure=set(new);todo=list(new)
while todo:
 for i in incoming[todo.pop()]:
  if i not in closure:closure.add(i);todo.append(i)
report={'status':'passed','baselineSha256':hashlib.sha256(master_path.read_bytes()).hexdigest(),'baselineNodeCount':len(old),'baselineEdgeCount':len(m['edges']),'newNodeCount':len(new),'newEdgeCount':len(b['edges']),'edgeTypes':dict(collections.Counter(e['type'] for e in b['edges'])),'prospectiveNodes':len(allnodes),'prospectiveEdges':len(m['edges'])+len(b['edges']),'newPrerequisiteDepthRange':[min(depth[i] for i in new),max(depth[i] for i in new)],'newLevelRangeIfLegacyDepthFormulaUsed':[min(1+3*depth[i] for i in new),max(1+3*depth[i] for i in new)],'prerequisiteClosureNodeCount':len(closure),'externalReferences':[{'id':i,'name':old[i]['name']} for i in external],'checks':['unique new IDs and normalized names','all edge endpoints resolve','new edges unique including reverse related edges','merged prerequisite graph acyclic','two paragraphs per new skill','source IDs resolve','new skills unmarked','no fabricated positions/levels','read-only baseline'],'notVerified':['current local app schema/build/Electron rendering','local shared proficiency store','independent expert curriculum review'],'integrationWarning':'Existing overview nodes and their original prerequisites remain unchanged; overview/narrow-skill overlap is intentionally retained. These totals are node counts, not distinct competency totals.'}
print(json.dumps(report,indent=2,ensure_ascii=False))
