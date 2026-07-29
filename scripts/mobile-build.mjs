// Builds the on-device static bundle for the Capacitor app.
//
// `output: 'export'` cannot include server-only code (route handlers,
// middleware, server instrumentation), so we temporarily move those aside,
// run the export build, then always restore them — even on failure.

import { execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const stashDir = join(root, '.mobile-stash');

// Server-only paths incompatible with a static export.
const SERVER_ONLY = [
  'app/api',
  'app/llms.txt',
  'app/security.txt',
  'proxy.ts',
  'instrumentation.ts',
];

function stash() {
  if (existsSync(stashDir)) rmSync(stashDir, { recursive: true, force: true });
  mkdirSync(stashDir, { recursive: true });
  for (const rel of SERVER_ONLY) {
    const src = join(root, rel);
    if (!existsSync(src)) continue;
    const dest = join(stashDir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    renameSync(src, dest);
    console.log(`[mobile-build] stashed ${rel}`);
  }
}

function restore() {
  for (const rel of SERVER_ONLY) {
    const src = join(stashDir, rel);
    if (!existsSync(src)) continue;
    const dest = join(root, rel);
    mkdirSync(dirname(dest), { recursive: true });
    rmSync(dest, { recursive: true, force: true });
    renameSync(src, dest);
    console.log(`[mobile-build] restored ${rel}`);
  }
  if (existsSync(stashDir)) rmSync(stashDir, { recursive: true, force: true });
}

stash();
try {
  execSync('node scripts/generate-commit-info.mjs', { stdio: 'inherit' });
  const nextBin = join(
    root,
    'node_modules',
    'next',
    'dist',
    'bin',
    'next',
  );
  execSync(`node "${nextBin}" build`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      MOBILE_EXPORT: '1',
      NEXT_PUBLIC_MOBILE_EXPORT: '1',
      NODE_ENV: 'production',
    },
  });
} finally {
  restore();
}

// Ship English only on-device to keep the app size down (~90 MB smaller).
const esDir = join(root, 'out', 'es');
if (existsSync(esDir)) {
  rmSync(esDir, { recursive: true, force: true });
  console.log('[mobile-build] removed out/es (English-only bundle)');
}

// The export puts locale pages under /en and /es (no root index). Write a root
// index.html that forwards to the default locale so Capacitor's entry resolves.
const rootIndex = join(root, 'out', 'index.html');
writeFileSync(
  rootIndex,
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>KanaDojo</title>
    <meta http-equiv="refresh" content="0; url=./en/" />
    <script>
      location.replace('./en/' + location.search + location.hash);
    </script>
  </head>
  <body style="margin:0;background:#0b0b0f"></body>
</html>
`,
);
console.log('[mobile-build] wrote out/index.html → ./en/');

console.log('[mobile-build] static export complete → ./out');
