"""Build original physics authoring data. Does not modify a personal map."""
import json
from pathlib import Path
P=Path(__file__).resolve().parent
N=[];E=[];M={}
def add(slug,name,branch,parent,refs,a,b,ready,place,deps):
 id='sss-phys-'+slug
 N.append(dict(id=id,name=name,domain='Physics',subdomain=branch,icon='motion',description=a.split('. ')[0]+'.',details=a+'\n\n'+b,proficiency80=None,pinned=False,sourceRefs=refs.split(),proficiencyReference=ready,placementNote=place,contentAuthorship='Original editorial material; sources support scope and facts, not official prerequisite links.',authoringOrigin='sss-physics-foundations-batch-01',scopeNote='Introductory Newtonian mechanics; stated inertial-frame and idealization assumptions apply.',layoutRequest={'mode':'existing-vortex-convention','referenceLevel':'derive-after-merge','position':'assign-after-merge','preserveExistingPositions':True}))
 M.setdefault(parent,[]).append(id)
 for src,why in deps:E.append(dict(source='sss-phys-'+src[1:] if src.startswith('@') else src,target=id,type='prerequisite',authorship='editorial',rationale=why))
add('coordinate-convention','Choose and consistently apply a one-dimensional coordinate convention','Motion interpretation','p-position','OS-POSITION',
'Define an origin, positive direction, and reference frame before assigning signed positions and displacements. Reversing the positive axis changes coordinate signs while leaving the physical journey unchanged.',
'For a diagram of motion along a line, label the convention explicitly and use it throughout the calculation. Changing the origin alone does not reverse the axis. Transformations between moving observers are a separate reference-frame topic.',
'I can describe the same journey using either axis direction without changing its physical meaning.',
'This makes the coordinate convention explicit before reasoning about signed acceleration and force components.',[('px-distance','The convention is applied to an understood distinction between path distance and displacement.'),('m-sign','Position and displacement use positive and negative numbers.')])
add('average-acceleration','Calculate average acceleration from two signed velocity readings','Motion interpretation','p-accel','OS-ACCEL',
'Calculate average acceleration as the final velocity minus the initial velocity, divided by elapsed time. Use signed velocities measured along the same axis and express the result in units such as metres per second squared.',
'A change from −6 to −2 metres per second over 2 seconds gives +2 metres per second squared. The object has slowed despite positive acceleration. Two readings determine an average; they do not establish a constant acceleration between them.',
'I can calculate a signed average acceleration and distinguish it from a claim about every instant.',
'This connects signed motion conventions and unit rates to acceleration graphs and speed-change reasoning.',[('@coordinate-convention','Both velocity readings must use the same positive direction.'),('px-velocity-secant','The learner already interprets a signed velocity as displacement per time.'),('m-ratio','Acceleration is a change per unit elapsed time.')])
add('speed-change-signs','Determine speeding up or slowing down from velocity and acceleration signs','Motion interpretation','p-accel','OS-ACCEL',
'In one dimension, a nonzero velocity and acceleration with the same sign increase speed; opposite signs decrease speed. Negative acceleration is therefore not a synonym for slowing down.',
'At an instant where velocity is zero, inspect the neighboring motion rather than applying a same-sign shortcut blindly. This ability interprets a state of motion without needing to calculate a complete trajectory or differentiate a function.',
'I can classify motion in all four nonzero sign combinations and handle the zero-velocity boundary carefully.',
'This follows signed acceleration and prepares interpretation of a free-fall turning point.',[('@average-acceleration','Acceleration describes a signed velocity change; the reasoning applies instant by instant as well.' )])
add('acceleration-graph-slope','Read acceleration from a straight segment of a velocity-time graph','Motion graphs','p-motiongraph','OS-ACCEL',
'For a straight segment on a velocity-time graph, use change in velocity divided by change in time to obtain its constant slope and acceleration. Read the axis units and scales before using the drawing.',
'A horizontal segment means zero acceleration even when its velocity is nonzero. A segment below the time axis can have a positive slope. This graphical skill is separate from differentiating a symbolic velocity function.',
'I can calculate a segment’s acceleration without confusing graph height with slope.',
'This combines slope reading with signed acceleration and supports checking a constant-acceleration interval.',[('@average-acceleration','Graph slope uses the same change-in-velocity ratio.'),('m-slope','A straight-line slope must be read using the plotted scales.')])
add('velocity-from-acceleration-area','Recover velocity change from piecewise-constant acceleration areas','Motion graphs','p-motiongraph','OS-AREA',
'For a piecewise-constant acceleration-time graph, multiply each acceleration by its interval duration and add the signed areas. Their sum gives the signed change in velocity over the complete interval, not the displacement.',
'An initial velocity is needed to obtain the final velocity itself. Equal positive and negative areas can restore the initial velocity even when the object has moved a substantial distance. This scope uses rectangles; general integration is a separate skill.',
'I can calculate velocity change from signed rectangular areas and include the initial velocity correctly.',
'This uses signed acceleration and arithmetic to reconstruct velocity without requiring calculus.',[('@average-acceleration','A constant interval gives velocity change equal to acceleration times duration.'),('m-multiply','Each rectangle is calculated as height times width.'),('m-add','Signed interval changes must be accumulated.')])
add('constant-model-check','Check whether a constant-acceleration model is justified over an interval','Motion models','p-constantacc','OS-CONSTANT',
'Before applying constant-acceleration equations, identify the interval over which the assumption is stated or supported. A straight velocity-time segment is consistent with constant acceleration, whereas a changing slope indicates a different model.',
'Sparse or noisy samples do not prove exact constancy. State that the model is an approximation when appropriate and split the motion when its behavior changes. Model selection is distinct from substituting numbers into an accepted equation.',
'I can identify the valid interval and explain what evidence supports the approximation.',
'This follows velocity-graph interpretation and precedes propagation of a constant-acceleration state.',[('@acceleration-graph-slope','A velocity-time slope describes acceleration on the interval.')])
add('constant-state-step','Calculate final position and velocity over a known constant-acceleration interval','Motion models','p-constantacc','OS-CONSTANT',
'Given initial position, initial velocity, constant acceleration, and elapsed time, calculate the final velocity and position using v = v0 + aΔt and x = x0 + v0Δt + aΔt²/2. Keep the chosen signs throughout.',
'The task advances a known initial state through a specified duration. It does not include solving a quadratic for an unknown arrival time or choosing between multiple roots. Those inverse problems should retain their own scope.',
'I can advance both position and velocity over a stated valid interval.',
'This follows checking the acceleration model and prepares connecting successive motion intervals.',[('@constant-model-check','The equations require an accepted constant-acceleration interval.'),('m-multiply','The update uses products of acceleration, velocity, and time.'),('m-power','The position update includes a squared duration.'),('m-add','The signed contributions are added to the initial state.')])
add('piecewise-handoff','Carry position and velocity between successive motion intervals','Motion models','p-motiongraph','OS-CONSTANT OS-AREA',
'Use the final position and velocity of one motion interval as the initial conditions of the next. Reset the local elapsed time for each interval while keeping one consistent coordinate convention.',
'For a model with finite forces and no impulsive event, position and velocity remain continuous at the boundary even if acceleration changes abruptly. A cruising interval does not reset velocity to zero; it sets acceleration to zero.',
'I can connect acceleration, cruising, and braking intervals without losing their initial conditions.',
'This extends a single constant-acceleration state update to a sequence of intervals.',[('@constant-state-step','Each interval is solved from its own initial state.')])
add('freefall-apex','Explain velocity and acceleration at the top of an ideal vertical throw','Free-fall interpretation','p-freefall','OS-FREEFALL',
'For a vertical throw under gravity alone near Earth, vertical velocity is momentarily zero at the highest point while acceleration remains downward. The object has not entered force equilibrium merely because it stops rising.',
'Choose an upward-positive or downward-positive convention and describe the motion on both sides of the turning point. The conclusion assumes negligible drag and no support or propulsion; it does not describe every object that pauses.',
'I can distinguish zero instantaneous velocity from zero acceleration at the turning point.',
'This combines acceleration-sign reasoning with the gravity-only free-fall model.',[('@speed-change-signs','The ascent and descent have different velocity signs relative to acceleration.'),('p-freefall','The gravity-only model fixes the downward acceleration.')])
add('mass-weight','Distinguish mass from gravitational weight and calculate weight using a stated g','Force interpretation','p-weight','OS-WEIGHT',
'Mass is measured in kilograms; gravitational weight is a force measured in newtons with magnitude mg in the stated local gravitational field. Changing g changes weight without changing the object’s mass in this model.',
'A scale’s support-force reading is not automatically identical to gravitational weight. This skill separates the quantities and calculates mg from a supplied value of g; analyzing an accelerating scale remains a distinct task.',
'I can keep mass, gravitational weight, and a scale’s support reading conceptually separate.',
'This supplies the weight term used in normal-force balances and contact checks.',[('p-units','Mass and force must be identified with different physical units.'),('m-multiply','Weight magnitude is the product of mass and the stated gravitational acceleration.')])
add('normal-direction','Identify the direction of a normal contact force','Force interpretation','p-weight','OS-FORCES',
'For an ordinary nonadhesive contact, the normal force acts perpendicular to the local surface and pushes the chosen body away from it. Its direction follows the contact geometry rather than a universal upward arrow.',
'On a tilted support, normal and gravitational forces point in different directions. This skill identifies the force direction only; its magnitude must come from the motion and other forces, and contact may fail if a pulling reaction would be required.',
'I can draw the normal direction for differently oriented surfaces without assuming its magnitude is mg.',
'This follows choosing the body boundary and prepares normal-force calculations.',[('px-fbd-isolate','The direction must be described for the chosen body and its contact.')])
add('tension-direction','Identify the force direction exerted by a taut flexible cable','Force interpretation','p-weight','OS-FORCES',
'A taut flexible cable pulls an attached body along the cable away from the attachment point. It does not push the body along the same line when slack or when a calculated force changes sign.',
'Identify the direction at the specific attachment, including when a pulley redirects the cable. This skill does not claim equal tension everywhere; that conclusion requires additional assumptions about cable mass, pulley behavior, and other interactions.',
'I can draw the local pulling direction and distinguish a taut cable from a slack one.',
'This follows body isolation and prepares checking ideal-cable tension assumptions.',[('px-fbd-isolate','The force must be drawn on the correct attached body.')])
add('uniform-tension-model','Check when equal tension may be assumed in an ideal cable model','Force models','p-coupled','OS-FORCES OS-SOLVING',
'Equal tension along a cable segment requires an appropriate idealization, such as negligible cable mass and no distributed tangential loading. Extending equality across a pulley also requires neglecting effects such as pulley rotational inertia and axle friction.',
'Do not equate forces merely because two segments look like the same rope in a picture. Record which assumptions justify the simplification. Calculating differing tensions in a massive accelerating pulley system is outside this model-selection skill.',
'I can state the assumptions behind equal tension and recognize when they are absent.',
'This follows identifying cable force directions and refines the assumptions used in coupled-body models.',[('@tension-direction','The candidate tensions belong to specific cable segments and attachments.')])
add('zero-net-motion','Infer constant velocity from zero net force in an inertial frame','Force interpretation','p-inertia','OS-FIRST',
'For a constant-mass body in an inertial frame, zero net external force implies zero acceleration and therefore constant velocity. The velocity can be nonzero; continued straight-line motion does not require a nonzero resultant force.',
'The inference concerns net force, not absence of all forces. It also cannot be reversed from a single observation of zero speed: an object can be instantaneously at rest while accelerating. State the interval and reference-frame assumptions.',
'I can distinguish balanced forces, no forces, constant velocity, and a momentary stop.',
'This links signed acceleration to the motion consequence of a balanced force system.',[('@average-acceleration','Zero acceleration means no velocity change, not necessarily zero velocity.'),('p-inertia','Newton’s first-law model supplies the inertial-frame and net-force interpretation.')])
add('force-diagram-audit','Audit a free-body diagram for missing and double-counted interactions','Force equations','p-fbd','OS-FBD',
'Check a proposed diagram against the isolated body and its actual interactions. Every included force needs an identifiable agent; forces exerted by the body on other objects belong on other diagrams.',
'Do not add ma as a separate force or retain both a force vector and its resolved components as independent contributions. This audit evaluates a supplied diagram; drawing one from scratch remains covered by the existing free-body-diagram skill.',
'I can explain why an extra arrow is invalid and identify an omitted external interaction.',
'This reuses free-body-diagram construction to check the force inventory before forming equations.',[('p-fbd','Auditing a diagram requires understanding the underlying construction rules.'),('px-thirdlaw-pairs','The audit distinguishes forces on different members of an interaction pair.')])
add('one-axis-force-equation','Translate a supplied collinear force diagram into a signed Newton equation','Force equations','p-newton','OS-SECOND',
'Choose a positive axis and translate a correct diagram of collinear forces into ΣF = ma for a constant-mass body in an inertial frame. Include the sign of each force and solve for one requested unknown.',
'The task is equation construction and interpretation, not two-dimensional vector projection. A negative acceleration indicates direction along the chosen axis. A negative proposed contact or cable magnitude additionally requires checking whether that interaction can act in the assumed way.',
'I can form and solve the signed equation without inserting an extra ma force.',
'This combines a checked force diagram with signed coordinates and one-variable algebra.',[('@force-diagram-audit','Only actual external forces should enter the sum.'),('@coordinate-convention','Force and acceleration signs must share one axis.'),('m-equation','The resulting one-unknown linear equation must be solved.')])
add('normal-balance','Determine a normal force from a supplied perpendicular force balance','Force equations','p-weight','OS-SOLVING',
'Given a correct force diagram with components already resolved perpendicular to a support, use Newton’s second law in that direction to determine the normal reaction. Include any supplied perpendicular acceleration and additional applied forces.',
'The result need not equal mg. This skill concerns a supplied component balance, so resolving an inclined force is supporting preparation rather than mandatory for every example. Check the assumed contact separately if the computed reaction would require adhesion.',
'I can find the reaction from the full perpendicular equation rather than automatically setting it equal to weight.',
'This combines normal direction, weight, and a signed Newton equation; force projection can support more complex examples.',[('@normal-direction','The reaction acts perpendicular to the contact surface.'),('@mass-weight','The weight contribution must not be confused with the reaction.'),('@one-axis-force-equation','The perpendicular equation is a signed Newton balance.')])
add('contact-consistency','Check whether a predicted normal reaction is compatible with nonadhesive contact','Force models','p-weight','OS-SOLVING',
'An ordinary nonadhesive support can push on a body but cannot pull it toward the surface. If maintaining the assumed contact requires a negative normal magnitude, that contact assumption is inconsistent.',
'At zero reaction, inspect the subsequent relative motion or limiting condition; zero alone does not specify the entire later trajectory. This skill checks the validity of a solved contact model, rather than merely treating an unphysical signed reaction as another numerical answer.',
'I can identify an invalid pulling reaction and explain why the contact model needs revision.',
'This follows calculating a normal reaction and checks the physical admissibility of that result.',[('@normal-balance','The consistency test examines the solved normal reaction.'),('m-inequality','The unilateral contact condition is a nonnegative reaction magnitude.')])
add('internal-force-cancellation','Identify which interaction forces cancel when two bodies form one system','Force equations','p-thirdlaw','OS-THIRD',
'When two interacting bodies are included in one system, their mutual Newton third-law forces are internal and cancel in the vector sum for that combined system. External forces from objects outside the boundary remain.',
'The same internal forces still matter when either body is analyzed separately. Changing the system boundary changes the force inventory, not the physical interactions. This skill identifies cancellation; solving all coupled accelerations and contact forces is a further task.',
'I can move between separate-body and combined-system force inventories without discarding external forces.',
'This combines system-boundary selection with identifying third-law interaction partners.',[('px-fbd-isolate','The boundary determines which interactions are internal.'),('px-thirdlaw-pairs','Only the mutual pair internal to the chosen system cancels in the sum.')])
for source,target,why in [
 ('px-force-components','sss-phys-normal-balance','Force projection prepares the perpendicular components when they are not supplied.'),
 ('px-randomerror','sss-phys-constant-model-check','Measurement scatter helps interpret departures from an ideal straight velocity-time line.'),
 ('sss-phys-contact-consistency','px-static-friction','A friction calculation relying on contact also needs a physically admissible normal reaction.'),
 ('sss-phys-piecewise-handoff','p-projectile','Carrying initial conditions is useful when projectile motion is described across distinct intervals.')]:E.append(dict(source=source,target=target,type='supports',authorship='editorial',rationale=why))
for parent,children in M.items():
 for c in children:E.append(dict(source=parent,target=c,type='related',authorship='editorial',rationale='The existing overview discusses this narrower ability; this scope-overlap link neither imposes a prerequisite nor transfers proficiency.'))
sections={'OS-POSITION':('Position and displacement','3-1-position-displacement-and-average-velocity'),'OS-ACCEL':('Acceleration','3-3-average-and-instantaneous-acceleration'),'OS-CONSTANT':('Constant acceleration','3-4-motion-with-constant-acceleration'),'OS-FREEFALL':('Free fall','3-5-free-fall'),'OS-AREA':('Recovering velocity from acceleration','3-6-finding-velocity-and-displacement-from-acceleration'),'OS-FIRST':('Newton first law','5-2-newtons-first-law'),'OS-SECOND':('Newton second law','5-3-newtons-second-law'),'OS-WEIGHT':('Mass and weight','5-4-mass-and-weight'),'OS-THIRD':('Newton third law','5-5-newtons-third-law'),'OS-FORCES':('Common forces','5-6-common-forces'),'OS-FBD':('Free-body diagrams','5-7-drawing-free-body-diagrams'),'OS-SOLVING':('Solving Newton-law problems','6-1-solving-problems-with-newtons-laws')}
B=dict(format='sss-content-authoring-batch',formatVersion=1,batchId='sss-physics-foundations-batch-01',date='2026-09-14',status='Editorial first batch; not a complete physics expansion',nodes=N,edges=E,overviewMappings=[dict(id=k,action='retain-unchanged',narrowerSkillIds=v) for k,v in M.items()],sources={k:dict(title=v[0],url='https://openstax.org/books/university-physics-volume-1/pages/'+v[1],checked='2026-09-14',use='Coverage and fact reference; authored boundaries and relationships are not official curriculum edges.') for k,v in sections.items()},integration=dict(notAnOpenMapFile=True,requiredContentBatches=[],compatibleWith=['sss-dc-batch-01'],doNotModifyExistingNodes=True,doNotCopyOverviewProficiency=True,defaultNewProficiency=None,layout='Assign only new positions and levels after reconciliation with the current local master.',icon='Validate motion against current icon allowlist and use the supported Physics icon if needed.'),deferred=['Measurement resolution and uncertainty refinements','General relative-frame transformations','Solving for unknown motion times and quadratic root selection','Projectile-motion refinements','Work, energy, and momentum decomposition','Rotational mechanics','Fluids, thermal physics, waves, electromagnetism, optics, and modern physics refinements','Overview-versus-skill UI and old dependency repairs'])
(P/'physics-foundations-batch-01.json').write_text(json.dumps(B,indent=2,ensure_ascii=False)+'\n')
print(len(N),'skills',len(E),'connections')
