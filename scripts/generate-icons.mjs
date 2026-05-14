/**
 * Voyage PWA Icon Generator
 *
 * Requires: npm install --save-dev sharp
 * Run:      node scripts/generate-icons.mjs
 *
 * Source:   public/Icon/Voyage_Logo_only.png  (4.2 MB master file)
 * Output:   public/icons/                     (all PWA icon sizes)
 *
 * The "maskable" variants add 20% safe-zone padding so the logo is not
 * clipped by Android's adaptive icon mask shapes (circles, squircles, etc.).
 */

import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC  = join(ROOT, 'public', 'Icon', 'Voyage_Logo_only.png');
const DEST = join(ROOT, 'public', 'icons');

// Ensure output directory exists
if (!existsSync(DEST)) mkdirSync(DEST, { recursive: true });

const ICONS = [
  // Standard PWA icons
  { name: 'icon-192.png',          size: 192, padding: 0 },
  { name: 'icon-512.png',          size: 512, padding: 0 },

  // Maskable icons: 20% inset safe zone (Android adaptive icons)
  { name: 'icon-maskable-192.png', size: 192, padding: 0.2 },
  { name: 'icon-maskable-512.png', size: 512, padding: 0.2 },

  // Apple touch icon (iOS)
  { name: 'apple-touch-icon.png',  size: 180, padding: 0 },

  // Favicon sizes
  { name: 'favicon-32.png',        size: 32,  padding: 0 },
  { name: 'favicon-16.png',        size: 16,  padding: 0 },
];

async function generateIcon({ name, size, padding }) {
  const dest = join(DEST, name);
  const logoSize = Math.round(size * (1 - padding * 2));
  const offset   = Math.round(size * padding);

  await sharp(SRC)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 34, g: 56, b: 67, alpha: 1 }, // --color-primary #223843
    })
    .extend({
      top:    offset,
      bottom: offset,
      left:   offset,
      right:  offset,
      background: { r: 34, g: 56, b: 67, alpha: 1 },
    })
    .png({ quality: 90 })
    .toFile(dest);

  console.log(`✓ ${name}  (${size}×${size})`);
}

// Also generate a basic OG image (1200×630)
async function generateOgImage() {
  const dest = join(DEST, 'og-image.png');
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 34, g: 56, b: 67, alpha: 1 },
    },
  })
    .composite([{
      input: await sharp(SRC).resize(200, 200, { fit: 'contain', background: { r: 34, g: 56, b: 67, alpha: 1 } }).toBuffer(),
      gravity: 'centre',
    }])
    .png()
    .toFile(dest);
  console.log('✓ og-image.png  (1200×630)');
}

async function main() {
  console.log('\nGenerating Voyage PWA icons…\n');
  for (const icon of ICONS) {
    await generateIcon(icon);
  }
  await generateOgImage();
  console.log('\nDone! Add public/icons/ to .gitignore if icons are build artifacts.\n');
}

main().catch(err => {
  console.error('Icon generation failed:', err.message);
  process.exit(1);
});
