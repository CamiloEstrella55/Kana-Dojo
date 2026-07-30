// Regenerates the native app icons (iOS + Android) from the KanaDojo brand
// artwork in `public/icons/icon-512.png`, replacing Capacitor's placeholder.
//
// Run after changing the brand icon:
//   node scripts/generate-app-icons.mjs && npx cap sync
//
// iOS wants a single opaque 1024x1024 (no alpha, or App Store validation
// fails). Android needs square + round launcher icons per density, plus an
// adaptive-icon foreground where the artwork sits inside the centre 66% "safe
// zone" — anything outside can be cropped to a circle/squircle by the launcher.

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const SOURCE = join(root, 'public', 'icons', 'icon-512.png');

if (!existsSync(SOURCE)) {
  console.error(`[icons] missing source artwork: ${SOURCE}`);
  process.exit(1);
}

// Matches the splash/native chrome colour so letterboxing is never visible.
const BACKGROUND = { r: 0x0b, g: 0x0b, b: 0x0f, alpha: 1 };

const ANDROID_RES = join(root, 'android', 'app', 'src', 'main', 'res');
const IOS_APPICON = join(
  root,
  'ios',
  'App',
  'App',
  'Assets.xcassets',
  'AppIcon.appiconset',
);

/** Square launcher icon: artwork fills the tile. */
const LAUNCHER_SIZES = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

/** Adaptive foreground: larger canvas, artwork inset into the safe zone. */
const FOREGROUND_SIZES = {
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};

// The brand artwork is a full-bleed illustrated scene rather than a glyph, so
// the foreground fills the whole canvas and the launcher's mask crops into it
// (the standard treatment for scene icons). Android guarantees only the central
// 66% is visible; the dojo sits well inside that, so nothing important is lost —
// insetting instead would leave a small square floating on the background.
const FOREGROUND_FILL = 1;

async function write(path, buffer) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buffer);
  console.log(`[icons] wrote ${path.replace(root + '\\', '').replace(root + '/', '')}`);
}

async function squareIcon(size) {
  return sharp(SOURCE)
    .resize(size, size, { fit: 'cover' })
    .flatten({ background: BACKGROUND })
    .png()
    .toBuffer();
}

async function foregroundIcon(size) {
  const artwork = Math.round(size * FOREGROUND_FILL);
  const inset = Math.round((size - artwork) / 2);
  const resized = await sharp(SOURCE)
    .resize(artwork, artwork, { fit: 'cover' })
    .png()
    .toBuffer();

  // Keep the 4-channel canvas: the layer must stay maskable, and any margin is
  // filled by the adaptive-icon background colour rather than baked in.
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, top: inset, left: inset }])
    .png()
    .toBuffer();
}

// ---------------------------------------------------------------- Android ---
for (const [density, size] of Object.entries(LAUNCHER_SIZES)) {
  const icon = await squareIcon(size);
  await write(join(ANDROID_RES, `mipmap-${density}`, 'ic_launcher.png'), icon);
  // Launchers mask this themselves; ship the same square artwork.
  await write(
    join(ANDROID_RES, `mipmap-${density}`, 'ic_launcher_round.png'),
    icon,
  );
}

for (const [density, size] of Object.entries(FOREGROUND_SIZES)) {
  await write(
    join(ANDROID_RES, `mipmap-${density}`, 'ic_launcher_foreground.png'),
    await foregroundIcon(size),
  );
}

// -------------------------------------------------------------------- iOS ---
// Single 1024x1024 opaque asset (matches the existing AppIcon.appiconset).
await write(
  join(IOS_APPICON, 'AppIcon-512@2x.png'),
  await sharp(SOURCE)
    .resize(1024, 1024, { fit: 'cover' })
    .flatten({ background: BACKGROUND })
    .removeAlpha()
    .png()
    .toBuffer(),
);

console.log('[icons] done — run `npx cap sync` to copy into the native projects');
