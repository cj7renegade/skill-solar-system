// Inline, offline SVG line icons. Only fixed paths are rendered, never user SVG.
export const ICONS = {
 calculator: ['Calculator', 'M6 3h12v18H6z M9 6h6 M9 10h1 M14 10h1 M9 14h1 M14 14h1 M9 18h1 M14 18h1'],
 function: ['Function', 'M5 18h14 M6 18V5 M8 15c3 0 2-10 5-10s1 10 5 10'],
 triangle: ['Geometry', 'M3 20L12 4l9 16z M7 20v-4h3'],
 matrix: ['Matrix', 'M7 3H4v18h3 M17 3h3v18h-3 M9 7h1 M14 7h1 M9 12h1 M14 12h1 M9 17h1 M14 17h1'],
 ruler: ['Measurement', 'M3 8h18v8H3z M7 8v4 M11 8v3 M15 8v4 M19 8v3'],
 motion: ['Motion', 'M3 18h18 M5 15l5-5 4 2 5-8 M15 4h4v4'],
 gear: ['Mechanism', 'M9 4h6l1 3 3 1 2 5-3 2-1 4h-5l-2-2-4-1-2-5 3-2z M15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0'],
 layers: ['Materials', 'M3 7l9-4 9 4-9 4z M3 12l9 4 9-4 M3 17l9 4 9-4'],
 circuit: ['Circuit', 'M3 12h4l1-4 2 8 2-8 2 8 2-8 1 4h4'],
 sensor: ['Sensor', 'M9 9h6v6H9z M6 5a10 10 0 0 0 0 14 M18 5a10 10 0 0 1 0 14 M3 2v2 M21 2v2'],
 code: ['Programming', 'M8 6l-5 6 5 6 M16 6l5 6-5 6 M14 3l-4 18'],
 chip: ['Processor', 'M6 6h12v12H6z M9 9h6v6H9z M9 2v4 M15 2v4 M9 18v4 M15 18v4 M2 9h4 M2 15h4 M18 9h4 M18 15h4'],
 feedback: ['Feedback', 'M5 7h12l3 3 M17 4v6h-6 M19 17H7l-3-3 M7 20v-6h6'],
 arm: ['Robot arm', 'M4 21h16 M7 21v-5l6-6-4-5 M7 3h4v4H7z M11 8h4v4h-4z M5 14h4v4H5z M11 5h6l3 3 M20 5v5'],
 eye: ['Perception', 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0'],
 robot: ['Robot', 'M5 7h14v13H5z M12 3v4 M10 3h4 M8 11h2 M14 11h2 M9 16h6 M2 10v7 M22 10v7'],
 terminal: ['Terminal', 'M3 5h18v14H3z M7 10l3 2-3 2 M12 15h5'],
 branch: ['Version control', 'M6 3v12 M18 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M18 9c0 5-12 1-12 6'],
 tree: ['Data structure', 'M10 3h4v4h-4z M3 17h4v4H3z M17 17h4v4h-4z M12 7v5 M5 17v-5h14v5'],
 memory: ['Memory', 'M3 7h18v10H3z M7 10v4 M11 10v4 M15 10v4 M6 17v3 M18 17v3'],
 network: ['Network', 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M5 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M19 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M11 7l-5 8 M13 7l5 8 M7 17h10'],
 clock: ['Timing', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2'],
 data: ['Data', 'M4 6c0-2.7 16-2.7 16 0v12c0 2.7-16 2.7-16 0z M4 6c0 2.7 16 2.7 16 0 M4 12c0 2.7 16 2.7 16 0'],
 model: ['Learning model', 'M5 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M5 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M19 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M7 7l10 4 M7 17l10-4 M5 9v6']
};
export const DOMAIN_ICON = { Mathematics:'function', Physics:'motion', Mechanics:'gear', Electronics:'circuit', Computing:'code', Robotics:'robot' };
export function iconElement(key) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.classList.add('skill-icon');
  const path = document.createElementNS(svg.namespaceURI,'path');
  path.setAttribute('d',(ICONS[key] || ICONS.robot)[1]);path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.6');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);
  return svg;
}
