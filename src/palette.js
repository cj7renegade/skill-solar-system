// Every colour that carries meaning on the map, in one place. Courses are grouped into five families
// with shades inside each family, so a band's family reads at a glance and its course on a closer
// look. Proficiency uses lightness and a warm gold rather than red against green, and the colours were
// checked under simulated deuteranopia and protanopia (scripts/check-palette.mjs,
// docs/ux-upgrade-plan.md).
export const FAMILIES = [
  { id: 'foundations', name: 'Foundations', courses: { MTH: '#4c8dff', PHY: '#9cc8ff', MAT: '#2c63c9' } },
  { id: 'body', name: 'Body', courses: { MEC: '#ea7a2a', ACT: '#ffd166', PWR: '#b8481a' } },
  { id: 'nervous', name: 'Nervous system', courses: { ELX: '#33c27f', EMB: '#7fe0c8', CST: '#b5e86e', KDC: '#178f86' } },
  { id: 'mind', name: 'Mind & behaviour', courses: { LOC: '#a76ef7', MAN: '#fcc5e0', PER: '#6434f4', AIL: '#cb8bf9', HRI: '#f434b4' } },
  { id: 'systems', name: 'Systems', courses: { SYS: '#e8edf3' } }
];
export const COURSE_COLORS = Object.assign({}, ...FAMILIES.map(f => f.courses));
export const familyOf = code => FAMILIES.find(f => code in f.courses) ?? null;

// Proficiency view. There is no "learning" state in the app; No and Not marked are both not
// proficient, told apart by lightness only (the darker slate is a recorded No).
export const PROFICIENCY = { yes: '#f2c14e', no: '#5b6575', unset: '#9aa4b2' };
// The frontier glow, drawn on top of the grey: warm and pale, so it never reads as gold.
export const FRONTIER_GLOW = '#ffe7a6';

// Course colours for a map's courses: the palette's colour where it has one, and a neutral grey for
// any course code it does not know (a future map's new course still draws, just without a family).
export function courseColors(courses) {
  return Object.fromEntries(courses.map(([code]) => [code, COURSE_COLORS[code] ?? '#b0b8c4']));
}
