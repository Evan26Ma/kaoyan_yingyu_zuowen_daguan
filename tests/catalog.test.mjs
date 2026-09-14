import assert from 'node:assert/strict';
import test from 'node:test';
import { catalog, loadCatalog, normalizeSearch } from '../src/lib/catalog.mjs';

test('catalog has stable unique identifiers and routes', () => {
  assert.equal(catalog.length, 12);
  assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
  assert.equal(new Set(catalog.map((item) => item.slug)).size, catalog.length);
  assert.equal(catalog.filter((item) => item.category === 'extra').length, 1);
});

test('every source document is parsed into searchable learning content', async () => {
  const items = await loadCatalog();
  for (const item of items) {
    assert.ok(item.plainText.length > 30, `${item.id} should have body text`);
    assert.ok(item.headings.length > 0, `${item.id} should have headings`);
    assert.match(item.html, /study-block|figure-block/, `${item.id} should have study blocks`);
    assert.match(item.html, /lang-(?:en|zh|mixed)/, `${item.id} should classify text language`);
    assert.doesNotMatch(item.html, /\.\.\/\.\.\/assets\/images/, `${item.id} should use public image paths`);
    assert.doesNotMatch(item.html, /Copyright|大道至简Loru|模版|答复信&gt;/i, `${item.id} should remove known OCR noise`);
  }
});

test('search normalization supports mixed Chinese and English input', () => {
  assert.equal(normalizeSearch('  Social   Phenomenon 社会现象  '), 'social phenomenon 社会现象');
  assert.equal(normalizeSearch('ＦＵＬＬＷＩＤＴＨ'), 'fullwidth');
});
