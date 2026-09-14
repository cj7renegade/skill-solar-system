"""Build the nonpersonal authoring pack; does not write a user's map."""
import json
from pathlib import Path
HERE=Path(__file__).resolve().parent
nodes=[]; edges=[]; broad={}
def add(slug,name,branch,parent,refs,p1,p2,ready,deps):
 id='sss-dc-'+slug
 nodes.append(dict(id=id,name=name,domain='Electronics',subdomain=branch,icon='sensor' if branch=='DC measurement' else 'circuit',description=p1.split('. ')[0]+'.',details=p1+'\n\n'+p2,proficiency80=None,pinned=False,sourceRefs=refs.split(),proficiencyReference=ready,contentAuthorship='Original editorial content; source-aligned scope, not an official prerequisite graph.',authoringOrigin='sss-dc-batch-01',scopeNote='Steady-state low-voltage, current-limited resistive DC examples; no mains work or high-energy battery work.'))
 broad.setdefault(parent,[]).append(id)
 for src,why in deps:
  edges.append(dict(source=('sss-dc-'+src[1:] if src.startswith('@') else src),target=id,type='prerequisite',authorship='editorial',rationale=why))
 return id
add('nodes','Identify electrically common points on a DC schematic','DC interpretation','e-schematic','AAC-WIRING AAC-BUILD',
'A circuit node consists of points joined by ideal conductors without a component between them. Trace the connections in a simple resistor-and-source schematic using junction dots and the drawing’s stated net-label conventions; physical proximity does not establish a connection.',
'The task is to assign the same node label to electrically common points even when wires bend or the drawing is rearranged. Distinct ground symbols or separate sheets require checking the schematic conventions rather than assuming every reference symbol is connected.',
'I can label the nodes of a rearranged simple schematic without confusing crossing wires with junctions.',[])
add('current-rate','Calculate average current from charge transferred over time','DC interpretation','e-current','OS-CURRENT',
'Average current describes net charge passing a cross-section during a stated interval: I = ΔQ/Δt. This skill uses coulombs and seconds consistently and distinguishes a rate of transfer from the total charge transferred.',
'For example, transferring 18 coulombs in 6 seconds gives an average current of 3 amperes. The result does not prove that the current was constant throughout the interval; determining an instantaneous current from a varying charge function is outside this skill.',
'I can calculate and explain average current without treating amperes as a stored amount of charge.',[('p-charge','The calculation refers to transferred electric charge, not energy.'),('m-ratio','Current is a quantity per unit time.')])
add('current-reference','Interpret a signed current relative to a reference arrow','DC interpretation','e-current','OS-CURRENT',
'A branch-current arrow defines the direction counted as positive. A negative calculated current means conventional current runs opposite to that arrow; it does not make the circuit solution invalid.',
'This ability separates reference direction from physical carrier motion. In a metal, electron drift is opposite to conventional current. You should be able to redraw the reference arrow and change the sign while describing the same physical current.',
'I can explain a negative branch current and distinguish conventional current from electron drift.',[('@current-rate','The sign is attached to an understood current quantity.')])
add('voltage-difference','Calculate signed voltage between two labeled nodes','DC interpretation','e-voltage','OS-KIRCHHOFF',
'Voltage between nodes A and B is V_AB = V_A − V_B when both node values use the same reference. Swapping the order reverses the sign. Neither terminal has to be the circuit’s reference node.',
'If A is at 8 volts and B is at 3 volts, V_AB is 5 volts and V_BA is −5 volts. The skill includes identifying the requested terminal order, rather than automatically subtracting the smaller value from the larger one.',
'I can state which terminal is positive and calculate the signed difference.',[('p-potentialelectric','Node subtraction represents a potential difference.'),('m-add','The calculation subtracts signed values.')])
add('ohmic-model','Decide whether a constant-resistance model fits a stated DC case','DC resistance','e-resistance','OS-OHM OS-RESISTANCE',
'A fixed resistor model assumes voltage is proportional to current over the operating conditions being considered. Recognize a proportional voltage-current relationship and distinguish it from a nonlinear device or a resistance that changes appreciably with temperature.',
'This is model selection, not fitting a complete device model. A quoted V/I ratio at one operating point alone does not establish a constant resistance over a wider range. State the range and conditions before extending a calculation to another operating point.',
'I can explain when V = IR with a fixed R is a reasonable model and when it is not.',[('m-ratio','Recognizing proportionality requires comparing ratios.'),('@current-rate','The model relates current to voltage.'),('p-potentialelectric','The model uses voltage across a component.')])
add('ohm-calculation','Solve for voltage, current, or resistance in one ohmic element','DC resistance','e-resistance','OS-OHM',
'Use V = IR to find one unknown from two known quantities for the same ohmic component. Keep unit prefixes consistent and distinguish a component’s voltage and current from quantities belonging to the whole network.',
'For a 2-kilohm resistor with 6 volts across it, the current is 3 milliamperes. Rearrangements for V, I, and R belong to this one ability; they do not become separate skills just because the unknown changes. Model selection remains a distinct prerequisite.',
'I can choose the relevant component quantities, rearrange the equation, and report a consistent unit.',[('@ohmic-model','The formula is applied only after accepting the constant-resistance model.'),('m-formula','The unknown must be isolated in V = IR.')])
add('series-topology','Recognize resistors that form an unbranched series path','DC networks','e-series','AAC-TOPOLOGY',
'Resistors form a simple series path when the intermediate connections have no other conducting branches. Identify this condition from connectivity rather than from whether the resistor symbols appear in a straight row.',
'The purpose is to decide whether the same branch current passes through each resistor. A wire leading from their junction into another conducting branch changes the analysis, even if the original resistor symbols still appear end to end.',
'I can identify a valid series group after the drawing is rearranged.',[('@nodes','Series recognition depends on which elements share each node.'),('@current-reference','A series path is understood in terms of a shared branch current.')])
add('series-equivalent','Calculate the equivalent resistance of a series group','DC networks','e-series','AAC-SERIES',
'Replace a valid series group by one resistance equal to the sum of its resistor values. The replacement preserves the group’s terminal voltage-current relationship, but does not retain its internal measurement points.',
'For positive resistances, the equivalent exceeds any individual member. Use this bound as a check and retain the original component labels for later analysis. Determining every internal voltage after the replacement is a separate operating-point task.',
'I can calculate the terminal equivalent and state what information the reduction hides.',[('@series-topology','Adding resistances is valid only for an actual series group.'),('@ohmic-model','The members are treated as fixed resistances.'),('m-add','The equivalent is formed by adding resistor values.')])
add('parallel-topology','Recognize resistors connected across the same two nodes','DC networks','e-parallel','AAC-TOPOLOGY',
'Resistors are in parallel when each terminal pair connects to the same two circuit nodes. Their shared terminal voltage follows from that connectivity, irrespective of where the symbols sit in the drawing.',
'Check both ends of every proposed parallel branch. Two resistors sharing only one node are not thereby parallel. This recognition task prepares network reduction without requiring the learner to have memorized the reciprocal-resistance formula.',
'I can identify parallel groups by node pairs rather than drawing appearance.',[('@nodes','Parallel branches are defined by two shared nodes.'),('@voltage-difference','The same ordered node pair has the same voltage difference.')])
add('parallel-equivalent','Calculate equivalent resistance using parallel conductances','DC networks','e-parallel','AAC-PARALLEL',
'For positive finite parallel resistors, add their reciprocal resistances and invert the result: 1/R_eq = Σ(1/R_i). This determines the equivalent seen at the shared terminals without requiring the individual branch currents first.',
'The equivalent must be less than the smallest branch resistance when at least two finite positive branches are present. Handle an open branch as contributing zero conductance; an ideal short is a separate limiting case, not a division by zero to enter in a calculator.',
'I can use the reciprocal formula and reject an impossible equivalent value.',[('@parallel-topology','The reciprocal rule requires a common pair of nodes.'),('@ohmic-model','Each branch is represented by a fixed resistor.'),('m-fracadd','Reciprocal resistances must be added correctly.'),('m-fracmul','The summed conductance must be inverted.')])
add('series-operating','Determine current and individual drops in a one-source series circuit','DC networks','e-series','AAC-SERIES',
'For a fixed DC voltage source driving a series resistor chain, first obtain total resistance, then the shared current, and finally each component’s voltage drop. Keep whole-circuit quantities separate from the quantities across one resistor.',
'An effective check is that the individual drops recover the applied source voltage. Knowing only the equivalent resistance is insufficient for describing internal voltages; this skill reconstructs the original circuit’s operating point from that reduced model.',
'I can recover each resistor voltage and check their sum against the supply.',[('@series-equivalent','The chain is first replaced by its terminal resistance.'),('@ohm-calculation','The equivalent current and individual drops use Ohm’s law.')])
add('parallel-operating','Determine branch and supply currents in a one-source parallel circuit','DC networks','e-parallel','AAC-PARALLEL',
'In a resistor network connected directly across an ideal fixed-voltage DC source, each branch sees the source voltage. Calculate branch currents separately and add them to obtain the source current.',
'An added resistive branch increases total source current in this model without reducing the voltage across the other branches. Real source resistance or current limiting can invalidate that conclusion. Distinguish this operating-point task from calculating terminal equivalent resistance.',
'I can calculate branch currents and explain the fixed-voltage assumption behind their sum.',[('@parallel-topology','Each branch must actually share the source terminals.'),('@ohm-calculation','The branch current follows from its own resistance and voltage.'),('m-add','The source supplies the sum of the branch currents.')])
add('mixed-reduction','Reduce a resistor network by successive series and parallel replacements','DC networks','e-series','OS-NETWORKS',
'Simplify a reducible resistor network one valid group at a time, redrawing its node connections after each replacement. A group that is not reducible initially may become reducible after an inner group is replaced.',
'Stop when a bridge or other connectivity prevents another valid series or parallel step. Recognizing that limitation is part of the skill; it prevents forcing a convenient formula onto the wrong topology. General nodal and mesh methods remain outside this task.',
'I can simplify a reducible network and identify when another analysis method is needed.',[('@series-equivalent','One allowed replacement is a series equivalent.'),('@parallel-equivalent','The other allowed replacement is a parallel equivalent.')])
add('divider-unloaded','Calculate the output of an unloaded two-resistor divider','DC dividers','e-divider','AAC-DIVIDER',
'For two positive resistors in series across a source, calculate the junction voltage relative to the lower terminal using V_out = V_in R_lower/(R_upper + R_lower). Identify the output reference before assigning the numerator.',
'The unloaded condition means no additional output current is drawn. Check that the result lies between the source terminal potentials. This skill covers a fixed pair of resistors; choosing values for a desired output is a separate design task.',
'I can select the correct divider leg and explain the unloaded assumption.',[('@series-operating','The divider expression describes the voltage split in a series chain.')])
add('divider-ratio','Choose a resistor ratio for a specified unloaded divider output','DC dividers','e-divider','AAC-DIVIDER',
'Work backward from a desired output fraction between zero and one to a resistor ratio. A specified voltage fraction sets the ratio, not a unique pair of resistor values.',
'For an output equal to one third of the input, the upper resistance is twice the lower resistance. Different pairs satisfy that ratio but draw different currents. This skill stops at nominal ratio selection; tolerance, power, loading, and preferred-value tradeoffs require additional checks.',
'I can determine the ratio and explain why it does not determine absolute resistor values.',[('@divider-unloaded','The design reverses the unloaded divider relationship.'),('m-formula','The ratio must be isolated from the target-output equation.')])
add('divider-loaded','Calculate divider output with a specified resistive load','DC dividers','e-divider','AAC-VOLTMETER',
'When a resistive load is connected from a divider output to its lower reference terminal, combine that load in parallel with the lower divider resistor. Use the reduced lower leg to recalculate output voltage.',
'This predicts a different operating point from the unloaded divider. Treating the original ratio as unchanged overlooks the additional current path. The scope is a known positive resistive load and an ideal fixed input; active or time-varying loads require another model.',
'I can draw the added load path and calculate the resulting output change.',[('@divider-unloaded','The unloaded divider provides the starting topology and expression.'),('@parallel-equivalent','Loading changes the lower leg through a parallel equivalent.')])
add('resistor-power','Calculate steady DC power dissipated in a resistor','DC power','e-power','OS-POWER',
'Calculate heat dissipation in a passive resistor using P = VI, I²R, or V²/R with quantities belonging to that resistor. Choose the expression supported by the known values and check unit conversions.',
'The answer is power in watts, not energy accumulated over time and not the resistor’s allowed rating. A correct calculation can still describe an overloaded part. Comparing dissipation with a specified component limit is a separate judgment.',
'I can calculate resistor dissipation without substituting a supply voltage that is not across that resistor.',[('@ohm-calculation','Equivalent power expressions use the same resistor’s voltage-current relationship.')])
add('power-rating','Compare resistor dissipation with a stated derated power limit','DC power','e-power','AAC-RESISTORS',
'Compare calculated resistor dissipation with the permitted power under the datasheet’s stated mounting and temperature conditions. A nominal wattage printed in a catalog is not automatically the permitted value in every environment.',
'This skill uses a provided derating limit and any required design margin; it does not invent a universal safety factor. Recognize a part that fails the comparison and identify the missing specification when the operating conditions are insufficiently described.',
'I can explain whether a stated resistor choice meets a provided power limit and margin.',[('@resistor-power','The comparison needs the resistor’s actual dissipation.')])
add('voltage-measurement','Measure DC voltage between specified points in a low-energy circuit','DC measurement','e-multimeter','OS-METERS AAC-METER-SAFETY',
'Select the meter’s DC-voltage function and appropriate terminals and range for a low-voltage, current-limited teaching circuit. Connect across the specified points; the signed reading follows the order of the probes.',
'The meter measures a difference, not an absolute voltage at a lone point. Check the meter manual and probe condition, and avoid bridging neighboring conductors. This ability concerns making a reading; calculating how the meter changes the circuit is addressed separately.',
'I can choose the voltage setup, identify both test points, and interpret the sign.',[('@voltage-difference','The measurement represents an ordered potential difference.'),('@nodes','The probes must touch the intended circuit nodes.')])
add('current-measurement','Measure branch DC current by inserting a meter in series','DC measurement','e-multimeter','AAC-METER-SAFETY',
'In a low-energy, current-limited teaching circuit, select a suitable fused current input and range, then insert the meter into the intended branch with power removed while changing connections. The branch current must pass through the meter.',
'An ammeter connected directly across a voltage source creates an unintended low-resistance path. Check current-input limits and restore the appropriate lead position afterward. This skill is distinct from voltage measurement because both the connection and the meter’s internal path differ.',
'I can identify the branch to interrupt and avoid placing the current input across a supply.',[('@series-topology','The meter must share the current path being measured.'),('@current-reference','The indicated sign depends on the chosen current direction.')])
add('resistance-measurement','Measure an isolated resistor in a de-energized circuit','DC measurement','e-multimeter','AAC-OHMMETER AAC-METER-SAFETY',
'A resistance meter applies its own test stimulus. Remove external power, ensure stored energy is discharged appropriately, and isolate the resistor from alternative paths before interpreting the reading as that resistor’s resistance.',
'Select the proper terminals and range according to the meter manual. A reading with the part still connected may represent multiple paths, while an overrange indication is not proof of infinite resistance. This task concerns obtaining a meaningful component measurement rather than diagnosing an entire board.',
'I can explain why power and parallel paths must be excluded before interpreting the reading.',[('@ohmic-model','The measured quantity describes a resistance under stated conditions.'),('@parallel-topology','Alternative connections can alter the resistance seen by the meter.')])
add('voltmeter-loading','Estimate divider measurement error from finite voltmeter input resistance','DC measurement','e-multimeter','AAC-VOLTMETER',
'Represent a DC voltmeter’s specified input resistance as an additional load across the measurement points. For a resistor divider, compute the loaded reading and compare it with the original unloaded output.',
'A high input resistance reduces loading but does not guarantee a negligible error for every circuit. The scope is the resistive DC input model; probe capacitance and frequency response belong elsewhere. Decide whether the resulting difference matters against a stated error allowance.',
'I can predict whether the voltmeter meaningfully disturbs a specified divider.',[('@divider-loaded','The meter is modeled as the divider’s resistive load.'),('@voltage-measurement','Its connection determines where the load is introduced.'),('m-add','The error comparison subtracts loaded and unloaded results.')])
add('ammeter-burden','Estimate the current change caused by a meter’s series resistance','DC measurement','e-multimeter','AAC-AMMETER',
'A real ammeter introduces resistance and therefore a voltage drop into the branch it measures. In a single-source series circuit, add the specified meter resistance and recompute current to estimate that disturbance.',
'The meter can report the altered current accurately while the original circuit would have carried a different current. Distinguish this loading effect from display accuracy. Use the resistance or burden information for the selected range, rather than assuming a universal meter value.',
'I can compare the circuit current before and after inserting the specified meter model.',[('@series-operating','The inserted resistance changes the series operating point.'),('@current-measurement','The meter is inserted into the measured current path.')])
add('open-fault','Predict the effect of one open resistor in a simple DC network','DC diagnosis','e-series','AAC-FAULTS',
'Model one failed resistor as an open circuit and determine which current paths remain. In a series chain the current ceases; in a parallel network supplied by an ideal fixed voltage, the other intact branches can continue operating.',
'The location of the break matters more than the drawing’s shape. A break can have voltage across it despite zero current through it. This prediction concerns the altered circuit, not automatically proving which physical component failed from one reading.',
'I can redraw one open fault and explain its effect on surviving current paths.',[('@series-operating','The original series response provides one comparison case.'),('@parallel-operating','The original parallel response provides the other comparison case.')])
add('short-fault','Predict the effect of a bypass short in a simple DC network','DC diagnosis','e-parallel','AAC-FAULTS',
'Model a specified bypass fault as a near-zero-resistance connection and determine which nodes become effectively joined. A resistor bypassed by that path has approximately zero terminal voltage, while currents elsewhere may change.',
'An ideal short directly across an ideal voltage source is not a finite-current calculation. Source impedance or current limiting must be included to predict a realizable value. Use diagrams or simulation for fault prediction rather than deliberately shorting a physical supply.',
'I can locate the bypassed element and recognize when the ideal model cannot predict fault current.',[('@series-operating','A bypass changes series-chain voltage and current distribution.'),('@parallel-operating','A short can create an additional parallel current path.')])
add('test-point-choice','Choose a voltage test point that distinguishes two stated DC fault hypotheses','DC diagnosis','e-multimeter','AAC-FAULTS AAC-WIRING',
'Given a simple resistive circuit and two proposed faults, predict a voltage reading for each and select a test point where the predictions differ. Specify both probe nodes and the expected polarity.',
'The task is to gather discriminating evidence rather than replace parts at random. A matching observation supports a hypothesis but does not exclude every other possible fault. Recheck connectivity and measurement loading when observations fail to match either prediction.',
'I can explain why a chosen reading helps distinguish two specified open or bypass faults.',[('@open-fault','One hypothesis may remove a conducting path.'),('@short-fault','Another hypothesis may join previously distinct nodes.'),('@voltage-measurement','A useful proposed observation must specify a valid voltage measurement.')])

# Existing focused abilities remain intact and contribute supporting cross-links.
for source,target,why in [
 ('e-kcl','sss-dc-parallel-operating','Current conservation supplies an independent check on the sum of branch currents.'),
 ('e-kvl','sss-dc-series-operating','Loop voltage conservation supplies an independent check on the reconstructed voltage drops.'),
 ('sss-dc-voltmeter-loading','sss-dc-test-point-choice','A predicted test voltage is more useful when instrument loading is understood.'),
 ('sss-dc-power-rating','e-led','A series LED resistor also needs a suitable dissipation rating; diode behavior is still required separately.'),
 ('sss-dc-divider-loaded','e-adc','A resistive input model illustrates one source of divider loading; real ADC sampling behavior requires further study.')]:
 edges.append(dict(source=source,target=target,type='supports',authorship='editorial',rationale=why))
for parent,children in broad.items():
 for child in children:
  edges.append(dict(source=parent,target=child,type='related',authorship='editorial',rationale='The existing overview includes this narrower ability; the link records scope overlap and does not transfer proficiency or impose a prerequisite.'))
sources={
 'OS-CURRENT':('Electrical current','https://openstax.org/books/university-physics-volume-2/pages/9-1-electrical-current'),
 'OS-RESISTANCE':('Resistivity and resistance','https://openstax.org/books/university-physics-volume-2/pages/9-3-resistivity-and-resistance'),
 'OS-OHM':('Ohm’s law','https://openstax.org/books/university-physics-volume-2/pages/9-4-ohms-law'),
 'OS-POWER':('Electrical energy and power','https://openstax.org/books/university-physics-volume-2/pages/9-5-electrical-energy-and-power'),
 'OS-NETWORKS':('Resistors in series and parallel','https://openstax.org/books/university-physics-volume-2/pages/10-2-resistors-in-series-and-parallel'),
 'OS-KIRCHHOFF':('Kirchhoff’s rules','https://openstax.org/books/university-physics-volume-2/pages/10-3-kirchhoffs-rules'),
 'OS-METERS':('Electrical measuring instruments','https://openstax.org/books/university-physics-volume-2/pages/10-4-electrical-measuring-instruments'),
 'AAC-TOPOLOGY':('Series and parallel connectivity','https://www.allaboutcircuits.com/textbook/direct-current/chpt-5/what-are-series-and-parallel-circuits/'),
 'AAC-SERIES':('Series circuits','https://www.allaboutcircuits.com/textbook/direct-current/chpt-5/simple-series-circuits/'),
 'AAC-PARALLEL':('Parallel circuits','https://www.allaboutcircuits.com/textbook/direct-current/chpt-5/simple-parallel-circuits/'),
 'AAC-DIVIDER':('Voltage divider circuits','https://www.allaboutcircuits.com/textbook/direct-current/chpt-6/voltage-divider-circuits/'),
 'AAC-VOLTMETER':('Voltmeter impact','https://www.allaboutcircuits.com/textbook/direct-current/chpt-8/voltmeter-impact-measured-circuit/'),
 'AAC-AMMETER':('Ammeter impact','https://www.allaboutcircuits.com/textbook/direct-current/chpt-8/ammeter-impact-measured-circuit/'),
 'AAC-WIRING':('Circuit wiring','https://www.allaboutcircuits.com/textbook/direct-current/chpt-2/circuit-wiring/'),
 'AAC-BUILD':('Building resistor circuits','https://www.allaboutcircuits.com/textbook/direct-current/chpt-5/building-simple-resistor-circuits/'),
 'AAC-RESISTORS':('Resistors and ratings','https://www.allaboutcircuits.com/textbook/direct-current/chpt-2/resistors/'),
 'AAC-METER-SAFETY':('Meter usage','https://www.allaboutcircuits.com/textbook/direct-current/chpt-3/safe-meter-usage/'),
 'AAC-OHMMETER':('Ohmmeter design','https://www.allaboutcircuits.com/textbook/direct-current/chpt-8/ohmmeter-design/'),
 'AAC-FAULTS':('Component failure analysis','https://www.allaboutcircuits.com/textbook/direct-current/chpt-5/component-failure-analysis/')}
placements={
'nodes':'This provides the connectivity foundation for recognizing series and parallel groups.',
'current-rate':'This connects electric charge and unit rates to signed branch currents and resistive models.',
'current-reference':'This follows average-current interpretation and supports reading current arrows in a series path.',
'voltage-difference':'This applies electric potential and subtraction to node voltages. It prepares parallel-path recognition and voltage measurement.',
'ohmic-model':'This combines current, voltage, and proportionality before using a constant-resistance calculation.',
'ohm-calculation':'This follows selecting an ohmic model and rearranging formulas. It feeds resistor-network calculations and dissipation estimates.',
'series-topology':'This follows node identification and current-direction interpretation, before series resistance is combined.',
'series-equivalent':'This follows recognizing a series path and prepares reconstruction of its current and voltage drops.',
'parallel-topology':'This follows node identification and signed voltage differences, before parallel resistances or branch currents are calculated.',
'parallel-equivalent':'This combines parallel connectivity with reciprocal arithmetic. It prepares mixed-network reduction and loaded-divider calculations.',
'series-operating':'This combines series equivalent resistance with Ohm’s law and prepares divider and fault analysis.',
'parallel-operating':'This combines parallel topology with individual resistor calculations. Kirchhoff current law supports checking the total supply current.',
'mixed-reduction':'This joins the series and parallel reduction branches into one network-simplification ability.',
'divider-unloaded':'This specializes the voltage split in a series circuit and precedes ratio selection and loading analysis.',
'divider-ratio':'This follows unloaded-divider analysis and formula rearrangement to work backward from an output target.',
'divider-loaded':'This combines unloaded-divider analysis with parallel resistance. It prepares calculations of voltmeter loading.',
'resistor-power':'This follows single-resistor Ohm’s-law calculations and prepares comparison with component power limits.',
'power-rating':'This follows dissipation calculation and supports checking an LED’s series resistor rating.',
'voltage-measurement':'This connects node identification and signed voltage differences to practical measurements.',
'current-measurement':'This follows series-path recognition and signed-current interpretation, before meter burden is estimated.',
'resistance-measurement':'This combines resistance-model understanding with recognizing alternative parallel paths.',
'voltmeter-loading':'This joins loaded-divider calculation with voltage measurement and supports selecting diagnostic test points.',
'ammeter-burden':'This joins series-circuit calculations with current measurement to account for the measuring instrument.',
'open-fault':'This follows series and parallel operating-point analysis and prepares diagnostic voltage-test selection.',
'short-fault':'This follows series and parallel operating-point analysis and prepares diagnostic voltage-test selection.',
'test-point-choice':'This combines open-fault and short-fault predictions with voltage measurement to choose an informative observation.'}
for n in nodes:
 n['placementNote']=placements[n['id'].removeprefix('sss-dc-')]
 n['layoutRequest']={'mode':'existing-vortex-convention','preserveExistingPositions':True,'referenceLevel':'derive-after-merge','position':'assign-after-merge'}
packet=dict(format='sss-content-authoring-batch',formatVersion=1,batchId='sss-dc-batch-01',date='2026-09-14',status='Editorial pilot; structurally validated against supplied master, pending local integration and visual review',scope='Resistive DC interpretation, simple networks, dividers, power, meter use and single-fault reasoning',nodes=nodes,edges=edges,overviewMappings=[{'id':p,'action':'retain-unchanged','narrowerSkillIds':cs,'note':'Intentional transitional overlap; do not copy overview answers to narrower skills or claim these counts are deduplicated competencies.'} for p,cs in broad.items()],sources={k:{'title':v[0],'url':v[1],'checked':'2026-09-14','use':'Coverage/fact reference; node descriptions and edges are original editorial material.'} for k,v in sources.items()},integration={'notAnOpenMapFile':True,'doNotModifyExistingNodes':True,'newProficiencyDefault':None,'honorExistingSharedRecordForSameStableId':True,'deduplicateEdgesBy':['source','target','type'],'relatedEdgesUndirectedForDeduplication':True,'deferred':['General nodal/mesh decomposition','Thevenin/Norton and superposition decomposition','Resistor tolerances and preferred-value selection','Source internal resistance/current limiting as separate skills','Breadboard construction and continuity testing','Current-divider design','Formal organizing-topic UI']})
(HERE/'dc-circuits-batch-01.json').write_text(json.dumps(packet,ensure_ascii=False,indent=2)+'\n')
print(len(nodes),'new skills;',len(edges),'new links')
