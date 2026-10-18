import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const sourceDir = path.join(publicDir, 'brands');
const outputDir = path.join(sourceDir, 'normalized');
const supported = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);

function collect(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'normalized') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(fullPath, list);
    else if (supported.has(path.extname(entry.name).toLowerCase())) list.push(fullPath);
  }
  return list;
}

async function normalize(inputPath, outputPath) {
  let image = sharp(inputPath).ensureAlpha();
  const [metadata, stats] = await Promise.all([image.metadata(), image.stats()]);
  const hasTransparentMargin = Boolean(metadata.hasAlpha && stats.channels[3]?.min === 0);
  if (hasTransparentMargin) {
    image = image.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 0 });
  } else {
    image = image.trim({ background: { r: 255, g: 255, b: 255, alpha: 255 }, threshold: 18 });
  }
  await image
    .resize(480, 144, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toFile(outputPath);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const sources = collect(sourceDir);
  sources.push(path.join(publicDir, 'brand', 'Monkcraft-Black-Horizontal.png'));
  for (const inputPath of sources) {
    const relative = path.relative(publicDir, inputPath);
    const outputRelative = relative === path.join('brand', 'Monkcraft-Black-Horizontal.png')
      ? path.join('brands', 'normalized', 'monkcraft.png')
      : path.join('brands', 'normalized', path.relative(sourceDir, inputPath)).replace(/\.(jpg|jpeg|webp|svg)$/i, '.png');
    const outputPath = path.join(publicDir, outputRelative);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    try {
      await normalize(inputPath, outputPath);
    } catch (error) {
      process.stderr.write(`Skipped unreadable logo ${relative}: ${error.message.split("\\n")[0]}\n`);
    }
  }
  process.stdout.write(`Normalized ${sources.length} brand marks into ${path.relative(process.cwd(), outputDir)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
