import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, 'icon.svg');
const outDir = join(__dirname, '..', 'public', 'icons');
const publicDir = join(__dirname, '..', 'public');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

mkdirSync(outDir, { recursive: true });

const svgSource = readFileSync(svgPath, 'utf-8');

function renderPng(size) {
  return new Resvg(svgSource, { fitTo: { mode: 'width', value: size } })
    .render()
    .asPng();
}

// PWA icons
for (const size of sizes) {
  const png = renderPng(size);
  const outPath = join(outDir, `icon-${size}x${size}.png`);
  writeFileSync(outPath, png);
  console.log(`✓ ${outPath}`);
}

// Apple touch icon (180px)
const applePng = renderPng(180);
writeFileSync(join(publicDir, 'apple-touch-icon.png'), applePng);
console.log('✓ public/apple-touch-icon.png');

// favicon.ico — ICO container with embedded PNGs at 16, 32 and 48px
// ICO format: ICONDIR header + one ICONDIRENTRY per image + raw PNG bytes
const faviconSizes = [16, 32, 48];
const faviconPngs = faviconSizes.map(renderPng);

function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const entrySize = 16;
  const dataOffset = headerSize + entrySize * count;

  // ICONDIR
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);     // reserved
  header.writeUInt16LE(1, 2);     // type: 1 = icon
  header.writeUInt16LE(count, 4); // number of images

  // ICONDIRENTRY for each image
  const entries = [];
  let offset = dataOffset;
  for (const png of pngBuffers) {
    const entry = Buffer.alloc(entrySize);
    // Width/height: 0 means 256; for smaller sizes write the actual value
    const dim = png.readUInt32BE(16); // PNG IHDR width (at byte 16)
    entry.writeUInt8(dim >= 256 ? 0 : dim, 0);   // width
    entry.writeUInt8(dim >= 256 ? 0 : dim, 1);   // height
    entry.writeUInt8(0, 2);                        // color count
    entry.writeUInt8(0, 3);                        // reserved
    entry.writeUInt16LE(1, 4);                     // color planes
    entry.writeUInt16LE(32, 6);                    // bits per pixel
    entry.writeUInt32LE(png.length, 8);            // size of image data
    entry.writeUInt32LE(offset, 12);               // offset of image data
    offset += png.length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

const ico = buildIco(faviconPngs);
writeFileSync(join(publicDir, 'favicon.ico'), ico);
console.log('✓ public/favicon.ico  (16 + 32 + 48px)');

console.log('\nAll icons generated.');
