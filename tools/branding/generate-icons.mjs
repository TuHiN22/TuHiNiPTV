// Regenerates all app icon assets from a single square master PNG.
//
// The master may have a solid (near-)white background — it is automatically
// removed (keyed to transparent, with edge feathering) so the app icon has
// transparent corners instead of a white border. This is safe for logos whose
// artwork contains no near-white pixels.
//
// Usage:
//   NODE_PATH=.tmp/icontools/node_modules \
//     node tools/branding/generate-icons.mjs <master.png> <outDir>
//
// Requires `sharp` (workspace) and `png2icons` (isolated tools dir).

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const png2icons = require('png2icons');

const master = process.argv[2] ?? 'applogo.png';
const outDir = process.argv[3] ?? 'apps/web/src/assets/icons';
const MASKABLE_BG = '#1b1c1c'; // matches manifest theme_color/background_color

// White-background feather bounds (per-pixel minimum channel):
//   <= LO -> fully opaque (logo)   >= HI -> fully transparent (white bg)
const WHITE_LO = 200;
const WHITE_HI = 236;

if (!fs.existsSync(master)) {
    console.error(`Master image not found: ${master}`);
    process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

// Produce a transparent-background PNG buffer from the master (white removed).
async function loadTransparentMaster() {
    const { data, info } = await sharp(master)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    const out = Buffer.from(data);
    for (let i = 0; i < width * height; i++) {
        const o = i * channels;
        const w = Math.min(data[o], data[o + 1], data[o + 2]);
        let alpha;
        if (w >= WHITE_HI) alpha = 0;
        else if (w <= WHITE_LO) alpha = 255;
        else alpha = Math.round(255 * (1 - (w - WHITE_LO) / (WHITE_HI - WHITE_LO)));
        out[o + 3] = Math.min(out[o + 3], alpha);
    }
    return sharp(out, { raw: { width, height, channels } }).png().toBuffer();
}

const masterBuf = await loadTransparentMaster();

// Transparent, logo-fills-frame PNG at an exact square size.
async function plain(size, file) {
    await sharp(masterBuf)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(outDir, file));
    console.log('  ', file, `${size}x${size}`);
}

// Maskable PNG: opaque background + ~80% logo inside the safe zone.
async function maskable(size, file) {
    const inner = Math.round(size * 0.8);
    const logo = await sharp(masterBuf)
        .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    await sharp({
        create: { width: size, height: size, channels: 4, background: MASKABLE_BG },
    })
        .composite([{ input: logo, gravity: 'centre' }])
        .png()
        .toFile(path.join(outDir, file));
    console.log('  ', file, `${size}x${size} (maskable)`);
}

const plainTargets = [
    [16, 'icon-16.png'],
    [32, 'icon-32.png'],
    [48, 'icon-48.png'],
    [64, 'icon-64.png'],
    [128, 'icon-128.png'],
    [256, 'icon-tv-256.png'],
    [512, 'icon.png'],
    [1024, 'icon-1024.png'],
    [48, 'favicon.png'],
    [256, 'favicon.256x256.png'],
    [512, 'favicon.512x512.png'],
    [180, 'apple-touch-icon.png'],
    [192, 'android-chrome-192x192.png'],
    [512, 'android-chrome-512x512.png'],
];

console.log('Generating PNG icons:');
for (const [size, file] of plainTargets) {
    await plain(size, file);
}
await maskable(192, 'android-chrome-maskable-192x192.png');
await maskable(512, 'android-chrome-maskable-512x512.png');

// Container formats derived from a clean transparent 1024 master buffer.
console.log('Generating container icons:');
const buf1024 = await sharp(masterBuf)
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

fs.writeFileSync(path.join(outDir, 'favicon.icns'), png2icons.createICNS(buf1024, png2icons.BILINEAR, 0));
console.log('   favicon.icns');
fs.writeFileSync(path.join(outDir, 'favicon.ico'), png2icons.createICO(buf1024, png2icons.BILINEAR, 0, false));
console.log('   favicon.ico');

console.log('Done.');
