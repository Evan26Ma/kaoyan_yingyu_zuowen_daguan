import fs from 'node:fs/promises';
import path from 'node:path';
import { catalog, loadCatalog } from '../src/lib/catalog.mjs';

const root = process.cwd();
const items = await loadCatalog(root);
const errors = [];
const ids = new Set();
const slugs = new Set();
let imageReferences = 0;
let learningUnits = 0;

for (const item of items) {
  if (ids.has(item.id)) errors.push(`duplicate id: ${item.id}`);
  if (slugs.has(item.slug)) errors.push(`duplicate slug: ${item.slug}`);
  ids.add(item.id);
  slugs.add(item.slug);
  if (!item.title || !item.description) errors.push(`${item.id}: missing title or description`);
  if (!item.plainText || item.plainText.length < 30) errors.push(`${item.id}: content is unexpectedly short`);
  if (!item.headings.length) errors.push(`${item.id}: no section headings`);
  if (!/lang-(?:en|zh|mixed)/.test(item.html)) errors.push(`${item.id}: text blocks have no language classification`);
  if (!item.units?.length) errors.push(`${item.id}: no semantic learning units`);
  const unitIds = new Set();
  for (const unit of item.units || []) {
    learningUnits += 1;
    if (unitIds.has(unit.id)) errors.push(`${item.id}: duplicate unit id ${unit.id}`);
    unitIds.add(unit.id);
    if (!unit.title || !unit.html || !unit.plainText) errors.push(`${item.id}/${unit.id}: incomplete learning unit`);
    if (unit.printable !== true) errors.push(`${item.id}/${unit.id}: unit is not printable`);
    if (unit.sentenceCount > 0 && !/memory-segment/.test(unit.html)) errors.push(`${item.id}/${unit.id}: missing progressive recall markup`);
  }
  if (/Copyright\s*©\s*2024\s*大道至简Loru/i.test(item.html)) errors.push(`${item.id}: page footer leaked into content`);
  for (const imagePath of item.imagePaths) {
    imageReferences += 1;
    const relative = imagePath.replace(/^\/images\//, 'assets/images/');
    try { await fs.access(path.join(root, relative)); }
    catch { errors.push(`${item.id}: missing image ${imagePath}`); }
  }
}

const sourceFiles = [];
async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) sourceFiles.push(path.relative(root, full));
  }
}
await walk(path.join(root, 'content'));
const declared = new Set(catalog.map((item) => item.source));
for (const source of sourceFiles) if (!declared.has(source)) errors.push(`unmapped source page: ${source}`);

if (sourceFiles.length !== catalog.length) errors.push(`expected ${catalog.length} source pages, found ${sourceFiles.length}`);
if (imageReferences !== 37) errors.push(`expected 37 image references, found ${imageReferences}`);

if (errors.length) {
  console.error(`Content audit failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`Content audit passed: ${items.length} entries, ${learningUnits} learning units, ${sourceFiles.length} source pages, ${imageReferences} image references.`);
