import { build } from 'esbuild';
import { mkdir, copyFile, cp, writeFile } from 'node:fs/promises';
import { tokensCss } from '../src/theme/tokens.js';
await mkdir('dist', { recursive: true });
await build({ entryPoints: ['src/app.js'], bundle: true, outfile: 'dist/app.js', format: 'iife', target: 'chrome120', legalComments: 'eof' });
await copyFile('src/index.html', 'dist/index.html');
await copyFile('src/style.css', 'dist/style.css');
// KaTeX's stylesheet and fonts, for math in lessons, served from dist so it works offline.
await mkdir('dist/katex', { recursive: true });
await copyFile('node_modules/katex/dist/katex.min.css', 'dist/katex/katex.min.css');
await cp('node_modules/katex/dist/fonts', 'dist/katex/fonts', { recursive: true });
// The Cyberpunk HUD theme: tokens generated from src/theme/tokens.js, its stylesheets, and the bundled
// open-licensed fonts (assets/fonts, with their licenses). The Classic theme does not use them.
await writeFile('dist/theme-tokens.css', tokensCss());
await copyFile('src/theme/base.css', 'dist/theme-base.css');
await copyFile('src/theme/components.css', 'dist/theme-components.css');
await cp('assets/fonts', 'dist/fonts', { recursive: true });
console.log('Offline renderer built in dist. Launch with npm start.');
