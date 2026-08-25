import esbuild from 'esbuild';
import { readFileSync } from 'fs';

const watch = process.argv.includes('--watch');

// Build plugin code
await esbuild.build({
  entryPoints: ['src/plugin.ts'],
  bundle: true,
  outfile: 'dist/plugin.js',
  target: 'es2017',
  watch: watch ? { onRebuild(err) { if (err) console.error('plugin rebuild failed:', err); else console.log('plugin rebuilt'); } } : false,
});

// Inline HTML + CSS + JS into a single ui.html file
const uiJs = readFileSync('src/ui.js', 'utf8');
const uiHtml = readFileSync('src/ui.html', 'utf8').replace(
  '</body>',
  `<script>${uiJs}</script></body>`,
);

import { writeFileSync, mkdirSync } from 'fs';
mkdirSync('dist', { recursive: true });
writeFileSync('dist/ui.html', uiHtml, 'utf8');

console.log('Build complete.');
