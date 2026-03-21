const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/Code.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2019',
  // treeShaking disabled: GAS entry points are exposed via globalThis side-effects in index.ts
  treeShaking: false,
}).catch(() => process.exit(1));
