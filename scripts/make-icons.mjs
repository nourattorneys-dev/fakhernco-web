#!/usr/bin/env node
/**
 * Generate the favicons from public/logo.png.
 *
 *   node scripts/make-icons.mjs
 *
 * Writes src/app/{icon.png,favicon.ico,apple-icon.png}. Run it after replacing
 * the logo, and commit the results — they are build inputs, not build output.
 *
 * SHAPE
 *
 * icon.png and favicon.ico are masked to a CIRCLE: white disc, transparent
 * corners. apple-icon.png is deliberately left SQUARE and full-bleed — iOS
 * applies its own squircle mask to the touch icon, and transparent corners
 * underneath it render black rather than rounded.
 *
 * The circle costs almost nothing here. The mark is a wide, short strip sitting
 * on the centre line, and the chord of a circle at that height is 96% of its
 * diameter — so masking it trims the corners, not the wordmark. It is scaled to
 * FIT_WIDTH below, well inside that limit.
 *
 * LEGIBILITY — READ THIS BEFORE REUSING IT
 *
 * The mark is a bilingual wordmark whose ink is a 1579x424 strip, 3.7:1, about
 * a fifth of the square canvas. Nothing fits a 3.7:1 strip into a square or a
 * circle: trimming the dead margin buys 27% and that is the ceiling. At 32px
 * the wordmark is unreadable and at 16px it is a grey smear. This is a stopgap
 * standing in for a monogram that does not exist yet. See CLAUDE.md.
 */

import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const SRC = 'public/logo.png';
const FIT_WIDTH = 0.86; // of the icon's width; the circle allows up to ~0.96

/** The wordmark with its flat border removed, so it fills as much as it can. */
const ink = await sharp(SRC).trim({ threshold: 10 }).toBuffer();

/**
 * The wordmark centred on a white square.
 *
 * channels: 4 because the circular mask below needs an alpha channel to write
 * into; a 3-channel base silently ignores the dest-in composite and you get a
 * square back with no error.
 */
async function square(size) {
  const strip = await sharp(ink)
    .resize({ width: Math.round(size * FIT_WIDTH), fit: 'inside' })
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: '#ffffffff' },
  })
    .composite([{ input: strip, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Same, clipped to a disc. */
async function circle(size) {
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );
  return sharp(await square(size))
    .composite([{ input: mask, blend: 'dest-in' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * ICO is a 22-byte container around a PNG.
 *
 * Vista onwards reads an embedded PNG, so there is no bitmap encoder here.
 * 48px because that is Google's favicon step for search results.
 */
function ico(png) {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0); // reserved
  head.writeUInt16LE(1, 2); // type: icon
  head.writeUInt16LE(1, 4); // one image
  head.writeUInt8(48, 6);
  head.writeUInt8(48, 7);
  head.writeUInt16LE(1, 10); // planes
  head.writeUInt16LE(32, 12); // bpp
  head.writeUInt32LE(png.length, 14);
  head.writeUInt32LE(22, 18); // offset
  return Buffer.concat([head, png]);
}

const icon = await circle(192); // <link rel="icon">, browser tabs, Google
const favicon = await circle(48); // the bare /favicon.ico fetch
const apple = await square(180); // square on purpose — see header

writeFileSync('src/app/icon.png', icon);
writeFileSync('src/app/favicon.ico', ico(favicon));
writeFileSync('src/app/apple-icon.png', apple);

for (const [name, buf] of [
  ['src/app/icon.png', icon],
  ['src/app/favicon.ico', favicon],
  ['src/app/apple-icon.png', apple],
]) {
  const m = await sharp(buf).metadata();
  console.log(`  ${name.padEnd(24)} ${m.width}x${m.height}  ${buf.length} bytes  alpha=${!!m.hasAlpha}`);
}
