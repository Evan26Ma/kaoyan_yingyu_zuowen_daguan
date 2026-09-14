import assert from 'node:assert/strict';
import test from 'node:test';
import { parse } from 'node-html-parser';
import { catalog, loadCatalog, normalizeSearch } from '../src/lib/catalog.mjs';

test('catalog has stable unique identifiers and routes', () => {
  assert.equal(catalog.length, 13);
  assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
  assert.equal(new Set(catalog.map((item) => item.slug)).size, catalog.length);
  assert.equal(catalog.filter((item) => item.category === 'extra').length, 1);
  assert.equal(catalog.filter((item) => item.category === 'reading').length, 1);
});

test('every source document is parsed into searchable learning content', async () => {
  const items = await loadCatalog();
  let unitCount = 0;
  for (const item of items) {
    assert.ok(item.plainText.length > 30, `${item.id} should have body text`);
    assert.ok(item.headings.length > 0, `${item.id} should have headings`);
    assert.match(item.html, /study-block|figure-block/, `${item.id} should have study blocks`);
    assert.match(item.html, /lang-(?:en|zh|mixed)/, `${item.id} should classify text language`);
    assert.doesNotMatch(item.html, /\.\.\/\.\.\/assets\/images/, `${item.id} should use public image paths`);
    assert.doesNotMatch(item.html, /Copyright|大道至简Loru|模版|答复信&gt;/i, `${item.id} should remove known OCR noise`);
    assert.ok(item.units.length > 0, `${item.id} should have semantic learning units`);
    assert.equal(new Set(item.units.map((unit) => unit.id)).size, item.units.length, `${item.id} unit ids should be unique`);
    for (const unit of item.units) {
      assert.ok(unit.title && unit.plainText && unit.html, `${item.id}/${unit.id} should be complete`);
      assert.equal(unit.printable, true, `${item.id}/${unit.id} should have a print route`);
      if (unit.sentenceCount) {
        assert.match(unit.html, /segment-full/, `${item.id}/${unit.id} should have full recall text`);
        assert.match(unit.html, /segment-initials/, `${item.id}/${unit.id} should have initials hints`);
      }
    }
    unitCount += item.units.length;
  }
  assert.ok(unitCount >= 85, 'all thirteen source sets should be split into enough focused units');
});

test('reading foundations are a non-masking reference list', async () => {
  const items = await loadCatalog();
  const reading = items.find((item) => item.id === 'reading-foundations');
  assert.equal(reading?.studyMode, 'reference');
  assert.ok(reading?.units.length >= 12);
  assert.match(reading?.html || '', /reference-entry/);
  assert.doesNotMatch(reading?.html || '', /memory-segment/);
  assert.ok(reading?.units.every((unit) => parse(unit.html).querySelectorAll('.reference-entry').length <= 24));
});

test('search normalization supports mixed Chinese and English input', () => {
  assert.equal(normalizeSearch('  Social   Phenomenon 社会现象  '), 'social phenomenon 社会现象');
  assert.equal(normalizeSearch('ＦＵＬＬＷＩＤＴＨ'), 'fullwidth');
});

test('exam directions stay visible in every recall mode', async () => {
  const items = await loadCatalog();
  let questionBlocks = 0;
  for (const item of items) {
    const document = parse(item.html);
    questionBlocks += document.querySelectorAll('.is-question').length;
    assert.equal(document.querySelectorAll('.is-question .memory-segment').length, 0, `${item.id} should never mask its question`);
  }
  assert.ok(questionBlocks >= 20, 'exam prompts should be identified across source sets');
});
