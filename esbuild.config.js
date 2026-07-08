// Bundles the MCP server entry point into a single self-contained dist/index.js
// so `npm install` from the registry works without a build step at install time
// and server spawn doesn't pay node_modules resolution cost.
//
// Node builtins are bundled as ESM imports by esbuild, but CJS deps that call
// require() internally (e.g. dotenv, and this entry's own createRequire read of
// package.json for serverInfo.version) need a require() shim in ESM output —
// hence the banner injecting createRequire. The source's own shebang line
// (#!/usr/bin/env node) is preserved by esbuild automatically, so it must stay
// first; the banner is appended after it, not before.
import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/index.js',
  banner: {
    js: "import { createRequire as __createRequire } from 'module';\nconst require = __createRequire(import.meta.url);",
  },
});
