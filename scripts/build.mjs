import { build } from 'esbuild';
import { mkdir, copyFile, cp } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await build({ entryPoints: ['src/app.js'], bundle: true, outfile: 'dist/app.js', format: 'iife', target: 'chrome120', legalComments: 'eof' });
await copyFile('src/index.html', 'dist/index.html');
await copyFile('src/style.css', 'dist/style.css');
// KaTeX's stylesheet and fonts, for math in lessons, served from dist so it works offline.
await mkdir('dist/katex', { recursive: true });
await copyFile('node_modules/katex/dist/katex.min.css', 'dist/katex/katex.min.css');
await cp('node_modules/katex/dist/fonts', 'dist/katex/fonts', { recursive: true });
console.log('Offline renderer built in dist. Launch with npm start.');
