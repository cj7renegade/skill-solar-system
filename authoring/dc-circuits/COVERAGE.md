# DC circuits: batch 01 coverage and review

Status: first editorial pilot, not the complete DC curriculum or an independently expert-validated graph.

## Coverage delivered

| Branch | New skills |
| --- | ---: |
| DC interpretation | 4 |
| DC resistance | 2 |
| DC networks | 7 |
| DC dividers | 3 |
| DC power | 2 |
| DC measurement | 5 |
| DC diagnosis | 3 |

## Skill checklist

Each entry has two descriptive paragraphs, a self-reflection reference, and a short placement explanation. The IDs below are proposed stable IDs, not disposable row numbers.

| ID | Individually markable ability | Existing overlapping overview |
| --- | --- | --- |
| sss-dc-nodes | Identify electrically common points on a DC schematic | e-schematic |
| sss-dc-current-rate | Calculate average current from charge transferred over time | e-current |
| sss-dc-current-reference | Interpret a signed current relative to a reference arrow | e-current |
| sss-dc-voltage-difference | Calculate signed voltage between two labeled nodes | e-voltage |
| sss-dc-ohmic-model | Decide whether a constant-resistance model fits a stated DC case | e-resistance |
| sss-dc-ohm-calculation | Solve for voltage, current, or resistance in one ohmic element | e-resistance |
| sss-dc-series-topology | Recognize resistors that form an unbranched series path | e-series |
| sss-dc-series-equivalent | Calculate the equivalent resistance of a series group | e-series |
| sss-dc-parallel-topology | Recognize resistors connected across the same two nodes | e-parallel |
| sss-dc-parallel-equivalent | Calculate equivalent resistance using parallel conductances | e-parallel |
| sss-dc-series-operating | Determine current and individual drops in a one-source series circuit | e-series |
| sss-dc-parallel-operating | Determine branch and supply currents in a one-source parallel circuit | e-parallel |
| sss-dc-mixed-reduction | Reduce a resistor network by successive series and parallel replacements | e-series |
| sss-dc-divider-unloaded | Calculate the output of an unloaded two-resistor divider | e-divider |
| sss-dc-divider-ratio | Choose a resistor ratio for a specified unloaded divider output | e-divider |
| sss-dc-divider-loaded | Calculate divider output with a specified resistive load | e-divider |
| sss-dc-resistor-power | Calculate steady DC power dissipated in a resistor | e-power |
| sss-dc-power-rating | Compare resistor dissipation with a stated derated power limit | e-power |
| sss-dc-voltage-measurement | Measure DC voltage between specified points in a low-energy circuit | e-multimeter |
| sss-dc-current-measurement | Measure branch DC current by inserting a meter in series | e-multimeter |
| sss-dc-resistance-measurement | Measure an isolated resistor in a de-energized circuit | e-multimeter |
| sss-dc-voltmeter-loading | Estimate divider measurement error from finite voltmeter input resistance | e-multimeter |
| sss-dc-ammeter-burden | Estimate the current change caused by a meter’s series resistance | e-multimeter |
| sss-dc-open-fault | Predict the effect of one open resistor in a simple DC network | e-series |
| sss-dc-short-fault | Predict the effect of a bypass short in a simple DC network | e-parallel |
| sss-dc-test-point-choice | Choose a voltage test point that distinguishes two stated DC fault hypotheses | e-multimeter |

## Inventory decisions

- Retain all original skills and their answers. The 9 overlapping overview nodes listed in the JSON receive related links, not child-to-parent answer propagation.
- Reuse existing mathematics and physics foundations by stable ID. The 26 skills have no exact normalized-name duplicates in the inspected master; semantic overlap with broad nodes is deliberate and listed.
- Keep existing `e-kcl` and `e-kvl` as focused reference skills. They support independent checks without forcing the old entire prerequisite chains as additional mandatory preparation for simple circuit calculations.
- Do not split Ohm’s law into three near-identical nodes just for solving V, I, and R. Do split choosing a valid model from performing the calculation.
- Do split recognizing connectivity, computing an equivalent, and recovering operating-point values: a learner can succeed at one and not another.
- Treat measurement, measurement loading, and choosing diagnostic observations as distinct abilities.

## Known limitations and next batch

- The first identification node has no recorded prerequisites in this limited branch; that does not imply no prior literacy or mathematical background is needed. Entry assumptions are ordinary reading, numeral recognition, and access to the diagram’s symbol legend.
- Preserved overview dependencies can still be broader or deeper than desirable. This batch does not claim to have repaired those pre-existing edges.
- Existing descriptions warrant a later accuracy pass. For example, the old schematic card’s blanket treatment of ground symbols needs qualification by net and ground-domain conventions. The old divider card’s “ten times” loading heuristic should be quantified against an explicit error allowance rather than treated as universally small.
- Some prerequisite paths inherit earlier editorial choices through reused foundational IDs. DAG validation proves consistency, not educational necessity.
- Level/position assignment is deliberately deferred to the current local integrator because a content patch cannot know the latest saved placements.
- Final independent-ability counts remain unsettled while overview spheres also remain markable. A later organizing-topic design should address that transparently without discarding history.

Deferred coverage:
- General nodal/mesh decomposition
- Thevenin/Norton and superposition decomposition
- Resistor tolerances and preferred-value selection
- Source internal resistance/current limiting as separate skills
- Breadboard construction and continuity testing
- Current-divider design
- Formal organizing-topic UI

## Source use

The references below were accessed on September 14, 2026. They support scope and factual checks. Descriptions, skill boundaries, reflection references, and relationship rationales are original editorial authoring; these are not publisher-supplied dependency maps. No lesson images or extended quotations are reproduced.

- **OS-CURRENT** — [Electrical current](https://openstax.org/books/university-physics-volume-2/pages/9-1-electrical-current)
- **OS-RESISTANCE** — [Resistivity and resistance](https://openstax.org/books/university-physics-volume-2/pages/9-3-resistivity-and-resistance)
- **OS-OHM** — [Ohm’s law](https://openstax.org/books/university-physics-volume-2/pages/9-4-ohms-law)
- **OS-POWER** — [Electrical energy and power](https://openstax.org/books/university-physics-volume-2/pages/9-5-electrical-energy-and-power)
- **OS-NETWORKS** — [Resistors in series and parallel](https://openstax.org/books/university-physics-volume-2/pages/10-2-resistors-in-series-and-parallel)
- **OS-KIRCHHOFF** — [Kirchhoff’s rules](https://openstax.org/books/university-physics-volume-2/pages/10-3-kirchhoffs-rules)
- **OS-METERS** — [Electrical measuring instruments](https://openstax.org/books/university-physics-volume-2/pages/10-4-electrical-measuring-instruments)
- **AAC-TOPOLOGY** — [Series and parallel connectivity](https://www.allaboutcircuits.com/textbook/direct-current/chpt-5/what-are-series-and-parallel-circuits/)
- **AAC-SERIES** — [Series circuits](https://www.allaboutcircuits.com/textbook/direct-current/chpt-5/simple-series-circuits/)
- **AAC-PARALLEL** — [Parallel circuits](https://www.allaboutcircuits.com/textbook/direct-current/chpt-5/simple-parallel-circuits/)
- **AAC-DIVIDER** — [Voltage divider circuits](https://www.allaboutcircuits.com/textbook/direct-current/chpt-6/voltage-divider-circuits/)
- **AAC-VOLTMETER** — [Voltmeter impact](https://www.allaboutcircuits.com/textbook/direct-current/chpt-8/voltmeter-impact-measured-circuit/)
- **AAC-AMMETER** — [Ammeter impact](https://www.allaboutcircuits.com/textbook/direct-current/chpt-8/ammeter-impact-measured-circuit/)
- **AAC-WIRING** — [Circuit wiring](https://www.allaboutcircuits.com/textbook/direct-current/chpt-2/circuit-wiring/)
- **AAC-BUILD** — [Building resistor circuits](https://www.allaboutcircuits.com/textbook/direct-current/chpt-5/building-simple-resistor-circuits/)
- **AAC-RESISTORS** — [Resistors and ratings](https://www.allaboutcircuits.com/textbook/direct-current/chpt-2/resistors/)
- **AAC-METER-SAFETY** — [Meter usage](https://www.allaboutcircuits.com/textbook/direct-current/chpt-3/safe-meter-usage/)
- **AAC-OHMMETER** — [Ohmmeter design](https://www.allaboutcircuits.com/textbook/direct-current/chpt-8/ohmmeter-design/)
- **AAC-FAULTS** — [Component failure analysis](https://www.allaboutcircuits.com/textbook/direct-current/chpt-5/component-failure-analysis/)
