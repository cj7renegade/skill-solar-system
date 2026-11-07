// The context a lesson is written from, built from the map alone (no free text from the learner
// beyond the editable learner profile): the skill, its immediate prerequisites with the learner's own
// proficiency flags, and the names of what it unlocks. Pure, so it is tested without a browser.
import { tierOf } from './helix.js';
import { skillType } from './skill-card.js';

export const DEFAULT_LEARNER_PROFILE = 'Self-taught adult builder working toward a humanoid robot; professional welder/fabricator.';

// How the skill is practised: the map's own mode, else from the assessment mode, else written.
const PRACTICE_BY_ASSESSMENT = {
  'runnable code or trace': 'code', 'circuit analysis or supervised measurement': 'hands-on', 'supervised demonstration': 'hands-on',
  'drawing, calculation or supervised fabrication': 'design', 'documented scenario': 'written', 'written calculation': 'written', 'calculation and explanation': 'written'
};
export const practiceOf = node => node.helixPractice ?? PRACTICE_BY_ASSESSMENT[node.assessmentMode] ?? 'written';

// Topics where the lesson must carry a safety section: hands-on practice, or electrical, battery,
// machine and power-tool, welding, chemical and lifting content.
const SAFETY_COURSES = new Set(['ELX', 'PWR', 'ACT', 'MEC', 'EMB']);
const SAFETY_WORDS = /\b(electric\w*|voltage|current|battery|batteries|lithium|li-?ion|charg\w+|mains|high[- ]voltage|solder\w*|weld\w*|torch|grind\w*|lathe|mill(ing)?|drill\w*|saw|power tool|machin\w+|cnc|press|chemical|solvent|acid|epoxy|resin|fume\w*|lift\w*|hoist|motor driver|inverter|capacitor\w*|short circuit)\b/i;
export function safetyRequired(node, practice = practiceOf(node)) {
  return practice === 'hands-on' || SAFETY_COURSES.has(node.courseCode) || SAFETY_WORDS.test(`${node.name} ${node.description || ''}`);
}

export function buildLessonContext(graph, node, { index, learnerProfile = DEFAULT_LEARNER_PROFILE }) {
  const stages = graph.metadata?.humanoidHelixImport?.buildStages || {};
  const practice = practiceOf(node);
  const prerequisites = (index.parents.get(node.id) || []).map(id => index.byId.get(id))
    .map(p => ({ name: p.name, description: p.description || '', proficient: p.proficiency80 === true }));
  const unlocks = (index.children.get(node.id) || []).map(id => index.byId.get(id).name);
  return {
    skill: {
      name: node.name, description: node.description || '', course: node.courseCode ?? node.domain ?? null, courseName: node.course ?? null,
      subject: node.subdomain ?? null, helixLevel: node.helixLevel ?? null, buildStage: node.buildStage != null ? `${node.buildStage}${stages[node.buildStage] ? ` · ${stages[node.buildStage]}` : ''}` : null,
      level: tierOf(graph, node), type: skillType(node) ?? 'QUAL', practice, assessmentMode: node.assessmentMode ?? null
    },
    safetyRequired: safetyRequired(node, practice),
    prerequisites, unlocks,
    learner: String(learnerProfile || DEFAULT_LEARNER_PROFILE).slice(0, 1000)
  };
}
