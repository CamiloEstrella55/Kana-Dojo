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
//
// IMPORTANT: forward to the explicit file `./en/index.html`, NOT the directory
// `./en/`. Capacitor's Android WebView runs with `server.html5mode` enabled by
// default, which routes every *extension-less* request (including `/en/`) back
// to the root `index.html` — i.e. this very redirect stub. Redirecting to `/en/`
// therefore loops the stub onto itself forever and the app never loads (a blank
// screen behind the splash). A path that ends in `.html` is served as a real
// file, escaping that fallback. The app then rewrites the URL back to `/en/`
// before React hydrates (see the head script in app/layout.tsx) so routing and
// hydration match the web build.
const rootIndex = join(root, 'out', 'index.html');
writeFileSync(
  rootIndex,
  `<!doctype html>
<html lang="en" style="background:#0b0b0f">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>KanaDojo</title>
    <meta http-equiv="refresh" content="0; url=./en/index.html" />
    <script>
      location.replace('./en/index.html' + location.search + location.hash);
    </script>
  </head>
  <body style="margin:0;background:#0b0b0f;color:#0f0;font:13px/1.6 monospace">
    <!-- On-device fallback: if the redirect above succeeds, this whole document
         is discarded before the timer fires and nothing shows. If the WebView
         cannot load ./en/index.html (the entry did not resolve), the timer
         fires and paints the reason on screen — the only way to diagnose a
         blank entry when no remote debugger is attached. -->
    <div id="kd-boot" style="padding:16px;display:none;white-space:pre-wrap;word-break:break-word"></div>
    <script>
      (function () {
        var box = document.getElementById('kd-boot');
        window.addEventListener('error', function (e) {
          var t = e.target, u = t && (t.src || t.href);
          box.style.display = 'block';
          box.textContent += '\\n' + (u ? 'RESOURCE FAILED: ' + u : 'ERROR: ' + (e.message || e.error));
        }, true);
        setTimeout(function () {
          box.style.display = 'block';
          box.textContent =
            'KanaDojo: still on the entry redirect after 2.5s.\\n' +
            'The WebView could not load ./en/index.html.\\n' +
            'URL: ' + location.href + '\\nUA: ' + navigator.userAgent +
            box.textContent;
        }, 2500);
      })();
    </script>
  </body>
</html>
`,
);
console.log('[mobile-build] wrote out/index.html → ./en/index.html');

console.log('[mobile-build] static export complete → ./out');
