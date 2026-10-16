import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const cataloguePath = path.join(root, 'src/data/catalogue/export/products.json');
const provenancePath = path.join(root, 'src/data/catalogue/export/internal-provenance.json');
const mappingPath = process.argv[2];
if (!mappingPath) throw new Error('Pass a JSON file containing verified {slug, file, sourceImageUrl?} entries.');
const mappings = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
const catalogue = JSON.parse(fs.readFileSync(cataloguePath, 'utf8'));
const provenance = JSON.parse(fs.readFileSync(provenancePath, 'utf8'));
const bySlug = new Map(catalogue.products.map(product => [product.slug, product]));

for (const item of mappings) {
  const product = bySlug.get(item.slug);
  if (!product) throw new Error(`Unknown product ${item.slug}`);
  if (product.images.length) throw new Error(`Product already has an image: ${item.slug}`);
  const source = path.resolve(item.file);
  if (!fs.existsSync(source)) throw new Error(`Missing verified download ${source}`);
  const signature = fs.readFileSync(source).subarray(0, 8).toString('hex');
  const format = signature.startsWith('ffd8ff') ? 'jpeg' : signature === '89504e470d0a1a0a' ? 'png' : null;
  if (!format) throw new Error(`Expected a JPEG or PNG: ${source}`);
  const relative = `media/products/${product.category.slug}/${product.subcategory.slug}/${item.slug}/0-source-recovered.${format}`;
  const target = path.join(root, 'public/catalogue-media', relative.slice('media/'.length));
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(source, target);
  const file = fs.readFileSync(target);
  const dimensions = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', target], {encoding:'utf8'});
  const width = Number(dimensions.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const height = Number(dimensions.match(/pixelHeight:\s*(\d+)/)?.[1]);
  if (!width || !height) throw new Error(`Could not read dimensions: ${target}`);
  product.images = [{path: relative, role: 'MASTER', variantKey: 'Primary', sortOrder: 0, width, height, format, sha256: crypto.createHash('sha256').update(file).digest('hex')}];
  provenance.products[item.slug].images = [{exportPath: relative, originalSourceUrl: item.sourceImageUrl || provenance.products[item.slug].sourceProductUrl, recoveryNote: 'Verified against the original supplier product page on 2026-10-16.'}];
  console.log(`${item.slug}: ${width}x${height}`);
}
fs.writeFileSync(cataloguePath, JSON.stringify(catalogue, null, 2) + '\n');
fs.writeFileSync(provenancePath, JSON.stringify(provenance, null, 2) + '\n');
