import json
from pathlib import Path
P=Path(__file__).parent;nodes=[];edges=[]
sources={
'OS-STRESS':{'title':'Stress, Strain, and Elastic Modulus','url':'https://openstax.org/books/university-physics-volume-1/pages/12-3-stress-strain-and-elastic-modulus'},
'OS-ELASTIC':{'title':'Elasticity and Plasticity','url':'https://openstax.org/books/university-physics-volume-1/pages/12-4-elasticity-and-plasticity'},
'MIT-CURVES':{'title':'David Roylance — Stress-Strain Curves','url':'https://web.mit.edu/course/3/3.11/www/modules/ss.pdf'},
'MIT-YIELD':{'title':'David Roylance — Yield and Plastic Flow','url':'https://web.mit.edu/course/3/3.11/www/modules/yield.pdf'},
'MIT-PROPERTIES':{'title':'MIT mechanics of materials — property comparison table','url':'https://web.mit.edu/course/3/3.11/www/modules/props.pdf'}}
for v in sources.values():v['accessed']='2026-09-14'
def ref(x):return 'sss-mat-'+x[1:] if x.startswith('@') else x
def edge(a,b,t,r):edges.append(dict(source=ref(a),target=ref(b),type=t,rationale=r,authorship='editorial'))
def add(k,name,paras,criterion,placement,source,deps,parent):
 nodes.append(dict(id=ref('@'+k),name=name,domain='Mechanics',subdomain='Material behavior and tensile testing',icon='layers',description=paras[0].split('. ')[0]+'.',details='\n\n'.join(paras),proficiency80=None,pinned=False,sourceRefs=[source],proficiencyReference=criterion,placementNote=placement,authoringOrigin='sss-material-behavior-batch-01',scopeNote='Introductory uniaxial material response with stated geometry and model assumptions.',contentAuthorship='Original editorial descriptions and dependency choices; source references support concepts.',layoutRequest={'position':'assign-after-merge','referenceLevel':'derive-after-merge','preserveExistingPositions':True}))
 for a,r in deps:edge(a,'@'+k,'prerequisite',r)
 if parent not in [a for a,r in deps]:edge(parent,'@'+k,'related','This narrower ability makes part of the existing overview independently markable without replacing that overview or copying its answer.')
add('engineering-stress','Calculate engineering tensile stress using the original specimen area',[
'Convert a tensile force measurement into engineering stress by dividing it by the original cross-sectional area. Keep force and area units consistent; one newton per square millimeter equals one megapascal.',
'Use the initial area throughout an engineering stress curve, even after the specimen narrows. This is a nominal measure and does not establish the maximum local stress near a notch or neck.'],
'I can calculate engineering stress and explain why the original area remains its denominator.',
'This separates the tensile engineering measure from the broader normal-and-shear stress topic.','OS-STRESS',[('m-ratio','Stress requires a force-to-area ratio.'),('p-convert','Force and area measurements must use compatible units.')],'s-stress')
add('engineering-strain','Calculate engineering strain from a stated gauge length',[
'Calculate engineering strain as the change in gauge length divided by its original length. Retain a consistent extension or shortening sign and distinguish strain from a displacement expressed in millimeters.',
'Express the same result as a decimal, percentage, or microstrain without changing its meaning. Use the stated specimen gauge length; overall machine travel can include deformation outside that measured region.'],
'I can convert gauge-length change into decimal strain, percent strain, and microstrain.',
'This isolates longitudinal strain measurement from the existing overview that also includes angular shear strain.','OS-STRESS',[('m-ratio','Relative length change is a ratio to the original gauge length.'),('p-convert','Equivalent unit representations must not change the dimensionless strain value.')],'s-strain')
add('modulus-slope','Extract Young’s modulus from a specified linear stress-strain interval',[
'Find Young’s modulus from the stress change divided by the strain change over a stated linear elastic interval. Convert a percentage strain axis to dimensionless strain before calculating the slope.',
'Use the supplied interval rather than a slope spanning yielding or necking. Two readings support a slope calculation only when their interval is known to represent linear elastic response; they do not establish that behavior by themselves.'],
'I can calculate modulus from two readings in a stated linear elastic region, including percent-labeled axes.',
'This follows engineering stress and strain so the two graph axes are understood before their slope is interpreted.','MIT-CURVES',[('@engineering-stress','The vertical axis represents stress rather than raw force.'),('@engineering-strain','The horizontal axis must use dimensionless strain.'),('m-slope','Modulus is calculated as a change in stress divided by a change in strain.')],'s-elastic')
add('axial-stiffness','Compare axial part stiffness after changing length, area, or modulus',[
'For a uniform straight bar under small, linear elastic axial deformation, use k=EA/L to compare force-per-extension stiffness. Doubling length halves stiffness; doubling area or modulus doubles it under the same assumptions.',
'Keep structural stiffness k separate from material modulus E. A larger part made from a lower-modulus material can be stiffer than a smaller part made from a higher-modulus material, depending on its geometry.'],
'I can predict stiffness ratios for uniform axial bars and distinguish k from E.',
'This narrows the axial-deformation overview to the separate effect of material and geometry on stiffness.','OS-ELASTIC',[('s-elastic','The comparison assumes linear elastic material response.'),('m-ratio','Geometry and modulus changes are compared through multiplicative ratios.')],'s-axial')
add('elastic-versus-linear','Distinguish recoverable deformation from linear stress-strain response',[
'Elastic response concerns recovery after unloading, while linear response concerns the shape of a stress-strain relationship. A curved loading trace alone does not prove that permanent deformation has occurred.',
'Use the stated unloading behavior to distinguish recovery from residual set. Treat an observed straight segment as evidence about proportionality over that interval, not a universal guarantee about every subsequent load or material.'],
'I can explain why nonlinear response and permanent deformation are different observations.',
'This separates two assumptions often bundled into the phrase linear elasticity.','OS-ELASTIC',[('s-strain','Recovery and permanent set are interpreted as changes in strain.'),('p-graphs','The response curve must be interpreted over the stated loading interval.')],'s-elastic')
add('proof-stress','Determine 0.2 percent offset proof stress from a tensile curve',[
'Draw a line with the measured elastic slope starting at strain 0.002, and read the stress where it intersects the tensile curve. This defines the stated 0.2 percent offset proof stress.',
'Distinguish that construction from reading the curve at total strain 0.002. Report the offset convention with the result; it is an operational measure, not a claim that every material begins yielding at precisely that stress.'],
'I can locate the offset-line intersection without confusing offset strain with total strain.',
'This follows elastic-slope extraction and makes a particular proof-stress convention independently assessable.','MIT-YIELD',[('@modulus-slope','The offset construction uses the elastic slope.'),('s-plastic','Proof stress is interpreted in relation to permanent deformation rather than fracture.')],'s-tensile')
add('permanent-set','Estimate residual strain using a stated linear elastic unloading model',[
'For a specified uniaxial state with total strain epsilon and tensile stress sigma, subtract the recoverable strain sigma/E to estimate residual strain. This assumes small strain and linear elastic unloading with the supplied modulus.',
'Keep the unloading assumption explicit and check that the result fits the stated loading history. The calculation is not a general rule for viscoelastic recovery, changing unloading stiffness, or large-strain material behavior.'],
'I can separate recoverable and residual strain under a supplied small-strain unloading model.',
'This turns the plastic-deformation overview into a specific unloading calculation.','MIT-YIELD',[('@modulus-slope','The unloading model requires an elastic modulus in compatible units.'),('s-plastic','Residual strain represents permanent deformation under the stated model.')],'s-plastic')
add('engineering-uts','Find ultimate tensile strength from peak load and original area',[
'Locate the maximum recorded tensile load and divide it by the original specimen area to obtain ultimate tensile strength. The corresponding engineering-curve peak is not necessarily the fracture point.',
'Distinguish peak-load strength from offset proof stress and from the load at final separation. A falling engineering curve can accompany localized narrowing, so it should not automatically be interpreted as uniform material softening.'],
'I can obtain UTS from peak load and keep it distinct from proof stress and fracture stress.',
'This applies the engineering stress definition to one specific tensile-test landmark.','MIT-CURVES',[('@engineering-stress','UTS uses the original-area stress measure.'),('p-graphs','The maximum recorded load or curve ordinate must be distinguished from its final point.')],'s-tensile')
add('current-area-stress','Compare nominal and current-area average stress using measured areas',[
'At a given tensile load, calculate nominal stress with the original area and current-area average stress with the measured current section. A smaller current area produces the larger value at the same load.',
'Identify which section was measured and avoid treating an average as a complete local stress field. This direct area comparison does not require assuming uniform deformation or using a pre-necking strain-conversion formula.'],
'I can compare the two area conventions at the same load without assuming the neck has a uniform uniaxial stress field.',
'This develops area-selection reasoning after the engineering stress measure is established.','MIT-CURVES',[('@engineering-stress','The nominal reference measure provides the original-area comparison.')],'s-tensile')
add('property-selection','Distinguish modulus, yield strength, and tensile strength in property data',[
'Choose the property column that answers the question being asked: modulus describes elastic stress-to-strain response, yield strength describes a stated yielding criterion, and tensile strength identifies a peak engineering tensile stress.',
'Compare values only with their units, material condition, and stated test context. A high strength value does not establish a high modulus, and a material-property table alone does not determine a finished component’s stiffness or capacity.'],
'I can select the relevant property without interpreting strongest and stiffest as interchangeable.',
'This connects individually interpreted properties to the existing material-selection overview.','MIT-PROPERTIES',[('s-elastic','Modulus must be recognized as an elastic-response property.'),('s-plastic','Yield strength concerns the stated criterion for plastic response.'),('@engineering-uts','Peak engineering tensile strength must be distinguished from other strength measures.')],'s-select')
edge('@axial-stiffness','s-fastener','supports','Axial stiffness comparisons help interpret load sharing between a bolt and clamped members.')
edge('@permanent-set','s-forming','supports','Separating elastic recovery from residual deformation supports reasoning about springback after forming.')
b=dict(format='sss-content-authoring-batch',formatVersion=1,batchId='sss-material-behavior-batch-01',date='2026-09-14',status='First material-response expansion; not a complete materials curriculum',nodes=nodes,edges=edges,sources=sources,integration={'notAnOpenMapFile':True,'requiredContentBatches':[],'compatibleWith':['sss-dc-batch-01','sss-physics-foundations-batch-01','sss-mechanics-statics-batch-01'],'preserveExistingNodes':True,'newProficiency':None},deferred=['Shear stress and shear strain decomposition','Poisson response and lateral constraints','Stress concentrations and multiaxial states','Fracture, fatigue, creep, and environmental degradation','Material processing and microstructure','Standard-specific tensile-test operation and uncertainty','Large-strain conversions and constitutive modeling'])
(P/'material-behavior-batch-01.json').write_text(json.dumps(b,indent=2,ensure_ascii=False)+'\n');print(len(nodes),'skills',len(edges),'relationships')
