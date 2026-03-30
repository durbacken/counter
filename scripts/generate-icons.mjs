import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, 'icon.svg');
const outDir = join(__dirname, '..', 'public', 'icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

mkdirSync(outDir, { recursive: true });

const svgSource = readFileSync(svgPath, 'utf-8');

for (const size of sizes) {
  const resvg = new Resvg(svgSource, {
    fitTo: { mode: 'width', value: size }
  });

  const png = resvg.render().asPng();
  const outPath = join(outDir, `icon-${size}x${size}.png`);
  writeFileSync(outPath, png);
  console.log(`✓ ${outPath}`);
}

// Also write to public root for apple-touch-icon (192px is the recommended size)
const resvg192 = new Resvg(svgSource, { fitTo: { mode: 'width', value: 180 } });
const apple = resvg192.render().asPng();
writeFileSync(join(__dirname, '..', 'public', 'apple-touch-icon.png'), apple);
console.log('✓ public/apple-touch-icon.png');

console.log('\nAll icons generated.');
