import json
from pathlib import Path
P=Path(__file__).parent
nodes=[];edges=[]
sources={k:{'title':title,'url':'https://engineeringstatics.org/'+url,'accessed':'2026-09-14'} for k,title,url in [
('supports','Free-body diagrams','Chapter_05-free-body-diagrams.html'),('couples','Couples','Chapter_04-couples.html'),('equivalence','Equivalent transformations','equivalent-tranformations.html'),('equations','Equations of equilibrium','Chapter_05-equations-of-equilibrium.html'),('reactions','2D rigid body equilibrium','Chapter_05-2d-rigid-body-equilibrium.html'),('stability','Stability and determinacy','Chapter_05-stability-and-determinacy.html'),('members','Frames and machines','frames-and-machines.html'),('transfer','Interactions between members','Chapter_06-interactions-between-members.html'),('internal','Internal forces at a point','internal_force_at_point.html')]}
def ref(s):return 'sss-mech-'+s[1:] if s.startswith('@') else s
def edge(a,b,t,r):edges.append(dict(source=ref(a),target=ref(b),type=t,rationale=r,authorship='editorial'))
def add(key,name,paras,criterion,placement,source,deps,parent='s-load'):
 n=dict(id=ref('@'+key),name=name,domain='Mechanics',subdomain='Planar statics and load transfer',icon='gear',description=paras[0].split('. ')[0]+'.',details='\n\n'.join(paras),proficiency80=None,pinned=False,sourceRefs=[source],proficiencyReference=criterion,placementNote=placement,authoringOrigin='sss-mechanics-statics-batch-01',contentAuthorship='Original editorial content; references support facts, not an official dependency graph.',scopeNote='Ideal planar rigid-body statics under explicitly stated loads and support assumptions.',layoutRequest={'position':'assign-after-merge','referenceLevel':'derive-after-merge','preserveExistingPositions':True})
 nodes.append(n)
 for a,r in deps:edge(a,'@'+key,'prerequisite',r)
 if parent not in [a for a,r in deps]:edge(parent,'@'+key,'related','This narrower ability develops part of the existing overview without replacing its scope or inheriting its proficiency.')
add('support-model','Replace ideal planar supports with their allowed reaction components',[
'Choose reaction unknowns from the motion an ideal support restrains. A frictionless roller supplies a force normal to its surface, an ideal pin supplies two planar force components, and a fixed support also supplies a reaction moment.',
'Draw these reactions on an isolated body before calculating their values. State the idealization explicitly: a real bolted or welded connection does not become an ideal pin or fixed end merely because it looks like a familiar diagram.'],
'I can draw the allowed reactions for a roller, pin, and fixed support, including an inclined roller surface.',
'This connects free-body isolation to the support models needed for reaction calculations.','supports',[('px-fbd-isolate','The body must be isolated before its removed supports are represented by reaction unknowns.')])
add('couple-resultant','Replace an equal-and-opposite force couple with its signed moment',[
'Two equal, opposite, parallel forces on distinct lines have zero resultant force but a nonzero couple moment. Multiply one force magnitude by the perpendicular line separation and assign a consistent rotational sign.',
'The couple has the same net moment about every reference point on a rigid body. Include it even when summing moments about its drawn location; changing that location preserves external equilibrium effects, not necessarily internal stresses.'],
'I can find the signed moment of a couple and explain why changing the moment center does not remove it.',
'This extends signed single-force torque to a force pair that cannot be replaced by a single resultant force.','couples',[('px-torque-sign','Signed moments and perpendicular lever arms are needed to combine the two force effects.')], 'p-torque')
add('force-relocation','Move a force to another point using an equivalent force-and-couple system',[
'To represent a force applied at A by the same force at B, add a couple equal to the original force moment about B. This preserves both resultant force and resultant moment for the rigid body.',
'Check the direction of the added couple with a sketch or signed moment calculation. Moving the force along its own line requires no added couple, while moving it across that line generally does; this equivalence does not preserve local stress distributions.'],
'I can relocate a planar force and supply the correct compensating couple without changing its external static effect.',
'This follows couple representation and helps distinguish a changed load position from an equivalent load system.','equivalence',[('@couple-resultant','The compensating moment must be understood as a free couple rather than another unbalanced force.')])
add('pin-roller-reactions','Solve reactions of a stable pin-and-roller beam under point loads',[
'For a straight horizontal beam with an ideal pin at one end and a vertical roller reaction at the other, calculate reactions from planar equilibrium. Use specified point loads and known distances, taking moments about the pin to find the roller reaction.',
'Use horizontal and vertical force balance to obtain the remaining pin components. Interpret signs relative to the assumed arrows and check whether an unanchored roller would need to pull; a negative contact reaction can invalidate that support assumption.'],
'I can determine all reactions for a pin-and-roller beam with known point loads and check whether contact remains possible.',
'This applies the existing equilibrium skill to an explicit support configuration instead of treating all supports alike.','reactions',[('@support-model','The pin and roller define the available reaction components.'),('p-equilibrium','Force and moment equilibrium provide the equations for the unknown reactions.'),('m-equation','The reaction equations require solving for scalar unknowns.')])
add('fixed-reactions','Solve the force and moment reactions of a planar cantilever',[
'An ideal fixed end can supply two force components and a moment reaction. For a cantilever with specified point forces and applied couples, balance total forces and total moments about the fixed end to determine all three reactions.',
'An end moment is not an additional force or a force multiplied by an arbitrary support width. Keep its units and sign distinct, and report reactions separately from bending stress or deflection, which require additional geometric and material information.'],
'I can calculate a cantilever support moment as well as its force reactions, including a separately applied couple.',
'This introduces the rotational reaction absent from a pin-and-roller support model.','reactions',[('@support-model','A fixed support has a moment reaction as well as force components.'),('@couple-resultant','An applied couple contributes directly to the moment balance.'),('p-equilibrium','Static balances determine the three support reactions.')])
add('balance-audit','Audit a proposed planar reaction solution using force and moment residuals',[
'Substitute proposed reactions into horizontal force balance, vertical force balance, and a moment balance. A nonzero residual exposes an inconsistency in the stated static model, subject to rounding and the units used.',
'Repeat the moment check about a second convenient point to catch lever-arm and sign mistakes. Passing these balances verifies algebraic consistency with the diagram; it does not establish support stability, correct load assumptions, or sufficient member strength.'],
'I can check a supplied reaction solution and distinguish a balanced equation set from a physically adequate model.',
'This builds on equilibrium to check solutions without requiring one particular support arrangement.','equations',[('p-equilibrium','The audit evaluates the same independent force and moment balances used to solve the model.'),('m-add','Residuals are signed sums of the supplied force and moment terms.')])
add('support-stability','Detect unrestrained planar rigid-body motion from support geometry',[
'Inspect whether ideal support directions restrain both translations and rotation of a planar rigid body. Counting three reaction unknowns is insufficient when their lines of action cannot resist an independent motion.',
'For example, vertical roller reactions alone cannot restrain horizontal translation. Concurrent reaction lines cannot resist rotation about their intersection; this is a geometric restraint check, separate from material buckling, and unilateral contacts still require admissible reaction signs.'],
'I can identify an unrestrained motion in a simple support arrangement even when the number of reactions looks sufficient.',
'This checks the geometric meaning of support reactions before treating a numerical equilibrium solution as adequate.','stability',[('@support-model','Allowed reaction directions define the constraints being checked.'),('px-torque-sign','A reaction through a point supplies no resisting moment about that point.')])
add('static-indeterminacy','Recognize when support reactions require deformation compatibility',[
'For a stable single planar rigid body, compare independent reaction unknowns with the available independent equilibrium equations. More unknown reactions than those balances can determine signals that equilibrium alone cannot produce a unique reaction solution.',
'Explain what extra information is missing, such as deformation compatibility and member stiffness. Do not divide loads equally merely because supports appear similar, and check restraint geometry first: a poor arrangement can remain unstable despite having many reaction unknowns.'],
'I can explain why a stable overconstrained support model needs stiffness and compatibility information beyond equilibrium.',
'This follows support stability and separates an incomplete static model from a solvable determinate one.','stability',[('@support-stability','Geometric instability must be distinguished from redundant restraint.'),('p-equilibrium','The available independent balances set the limit of an equilibrium-only solution.')])
add('two-force-member','Recognize the conditions for an ideal two-force member',[
'An isolated member in static equilibrium with only two nonzero applied forces and no applied couple must have equal, opposite, collinear forces. Their common line passes through the two force application points.',
'Check the entire loading before using this shortcut: member weight, a transverse contact force, or an applied couple can invalidate it. A pin at each end alone does not establish two-force behavior, and an internally curved member need not have simple uniform axial stress.'],
'I can decide whether the two-force shortcut applies and draw the resulting end-force directions.',
'This narrows member idealization to a specific equilibrium consequence rather than assuming every link carries axial load.','members',[('px-fbd-isolate','All external loads on the isolated member must be identified.'),('p-equilibrium','Force and moment balance together require the end forces to be collinear.')])
add('joint-transfer','Transfer a known joint force between separate member diagrams',[
'When two members interact through an ideal joint, represent the force on one member as equal and opposite to the force on the other. Keep global axes and the identity of the receiving member explicit.',
'If one member diagram has a joint force of positive horizontal and negative vertical components, reverse both components on the neighboring member. These forces disappear from the combined-system diagram but remain essential when tracing loading through individual parts.'],
'I can carry a solved joint force into the next member diagram with the correct signs and no double counting.',
'This applies interaction-pair reasoning to sequential load transfer through an assembly.','transfer',[('px-thirdlaw-pairs','The joint forces are an action-reaction pair acting on different bodies.'),('px-fbd-isolate','Separate and combined system boundaries determine whether the joint force is external.')])
add('section-resultants','Calculate internal normal force, shear, and bending moment at one beam cut',[
'Cut a planar beam at a specified section away from a concentrated load or applied couple, and isolate either side. Replace the removed material by an internal normal force, transverse shear, and bending moment with an explicitly stated sign convention.',
'Use equilibrium of the retained segment to solve those three resultants from known external loads and reactions. They describe loading transmitted across that section, not a stress distribution; constructing full shear and moment diagrams is a separate existing skill.'],
'I can isolate one side of a beam cut and solve its internal force and moment resultants with a declared sign convention.',
'This provides a single-section calculation that supports the existing full beam-diagram skill.','internal',[('px-fbd-isolate','Cutting creates a new body boundary where internal interactions become external resultants.'),('p-equilibrium','The retained segment requires force and moment balance.'),('@couple-resultant','The cut moment must be represented separately from its force resultants.')],'s-beamforces')
edge('@section-resultants','s-beamforces','supports','Single-section equilibrium helps construct a full diagram without changing the old overview prerequisites.')
edge('@balance-audit','s-mesh','supports','Reaction balance is one check used when comparing a numerical structural model with hand calculations.')
edge('@joint-transfer','s-load','supports','Consistent member-level interactions make a proposed load path traceable through an assembly.')
b=dict(format='sss-content-authoring-batch',formatVersion=1,batchId='sss-mechanics-statics-batch-01',date='2026-09-14',status='First planar statics expansion; not a complete mechanics curriculum',nodes=nodes,edges=edges,sources=sources,integration={'notAnOpenMapFile':True,'requiredContentBatches':[],'compatibleWith':['sss-dc-batch-01','sss-physics-foundations-batch-01'],'preserveExistingNodes':True,'newProficiency':None},deferred=['Distributed-load resultants and centroids','Truss joint and section methods','Stress and strain decomposition','Material behavior and failure','Three-dimensional statics','Buckling and deformation compatibility calculations'])
(P/'mechanics-statics-batch-01.json').write_text(json.dumps(b,indent=2,ensure_ascii=False)+'\n')
print(len(nodes),'skills',len(edges),'relationships')
